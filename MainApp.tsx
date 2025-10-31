import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import { getGenres, getNewSeasons, clearMediaCache, getMediaDetails, getCollectionDetails, getSeasonDetails } from './services/tmdbService';
import { TrackedItem, WatchProgress, JournalEntry, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, FavoriteEpisodes, ProfileTab, ScreenName, UserAchievementStatus, NotificationSettings, CustomList, UserRatings, LiveWatchMediaInfo, CustomListItem, EpisodeRatings, SearchHistoryItem, Comment, Theme, ShowProgress, TraktToken, Follows, PrivacySettings, ProfileTheme } from './types';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import BottomTabNavigator, { TabName } from './navigation/BottomTabNavigator';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import { playNotificationSound } from './utils/soundUtils';
import ActorDetail from './components/ActorDetail';
import LiveWatchTracker from './components/LiveWatchTracker';
import AddToListModal from './components/AddToListModal';
import WelcomeModal from './components/WelcomeModal';
import * as traktService from './services/traktService';
import UserProfileModal from './components/UserProfileModal';
import { firebaseConfig } from './firebaseConfig';
import ConfirmationContainer from './components/ConfirmationContainer';
import { confirmationService } from './services/confirmationService';
import BackgroundParticleEffects from './components/BackgroundParticleEffects';
import ThemeTransitionAnimation from './components/ThemeTransitionAnimation';
import CalendarScreen from './screens/CalendarScreen';
import { useAchievements } from './hooks/useAchievements';
import ActivityScreen from './screens/ActivityScreen';
import { calculateLevelInfo, XP_CONFIG } from './utils/xpUtils';
import { animationService } from './services/animationService';
import AnimationContainer from './components/AnimationContainer';

interface User {
  id: string;
  username: string;
  email: string;
}

interface MainAppProps {
    userId: string;
    currentUser: User | null;
    onLogout: () => void;
    onUpdatePassword: (passwords: { currentPassword: string; newPassword: string; }) => Promise<string | null>;
    onUpdateProfile: (details: { username: string; email: string; }) => Promise<string | null>;
    onAuthClick: () => void;
    onForgotPasswordRequest: (email: string) => Promise<string | null>;
    onForgotPasswordReset: (data: { code: string; newPassword: string }) => Promise<string | null>;
    autoHolidayThemesEnabled: boolean;
    setAutoHolidayThemesEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

const TraktCallbackHandler: React.FC = () => {
    const [status, setStatus] = useState('Authenticating with Trakt, please wait...');
    const [error, setError] = useState<string | null>(null);
    const TRAKT_AUTH_FUNCTION_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/traktAuth`;


    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const errorParam = urlParams.get('error');

            if (errorParam) {
                setError(`Error from Trakt: ${urlParams.get('error_description') || 'Unknown error'}.`);
                setStatus('Redirecting back to app in 5 seconds...');
                setTimeout(() => window.location.href = '/', 5000);
                return;
            }

            if (!code) {
                setError('Invalid callback: No authorization code found.');
                setStatus('Redirecting back to app in 5 seconds...');
                setTimeout(() => window.location.href = '/', 5000);
                return;
            }

            try {
                const token = await traktService.exchangeCodeForToken(code, TRAKT_AUTH_FUNCTION_URL);
                if (token) {
                    setStatus('Authentication successful! You can now import your data.');
                    sessionStorage.setItem('trakt_auth_complete', 'true');
                    setTimeout(() => window.location.href = '/', 2000); // Redirect to root after a short delay
                } else {
                    throw new Error('Token exchange returned no data.');
                }
            } catch (err: any) {
                console.error(err);
                setError(`Failed to authenticate with Trakt: ${err.message || 'Please try again.'}`);
                setStatus('Redirecting back to app in 5 seconds...');
                setTimeout(() => window.location.href = '/', 5000);
            }
        };

        handleCallback();
    }, [TRAKT_AUTH_FUNCTION_URL]);

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-bg-primary text-text-primary text-center p-4">
            <h1 className="text-3xl font-bold mb-4">Connecting to Trakt...</h1>
            {error ? (
                 <div className="bg-red-500/20 text-red-300 p-4 rounded-lg">
                    <p className="font-bold">Authentication Failed</p>
                    <p className="text-sm mt-1">{error}</p>
                 </div>
            ) : (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-accent"></div>
            )}
            <p className="mt-4 text-text-secondary">{status}</p>
        </div>
    );
};


export const MainApp: React.FC<MainAppProps> = ({ userId, currentUser, onLogout, onUpdatePassword, onUpdateProfile, onAuthClick, onForgotPasswordRequest, onForgotPasswordReset, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled }) => {
  const [customThemes, setCustomThemes] = useLocalStorage<Theme[]>(`customThemes_${userId}`, []);
  const [holidayAnimationsEnabled, setHolidayAnimationsEnabled] = useLocalStorage<boolean>(`holidayAnimationsEnabled_${userId}`, true);
  const [activeTheme, setTheme, holidayInfo] = useTheme(customThemes, autoHolidayThemesEnabled);
  
  const [watching, setWatching] = useLocalStorage<TrackedItem[]>(`watching_list_${userId}`, []);
  const [planToWatch, setPlanToWatch] = useLocalStorage<TrackedItem[]>(`plan_to_watch_list_${userId}`, []);
  const [completed, setCompleted] = useLocalStorage<TrackedItem[]>(`completed_list_${userId}`, []);
  const [onHold, setOnHold] = useLocalStorage<TrackedItem[]>(`on_hold_list_${userId}`, []);
  const [dropped, setDropped] = useLocalStorage<TrackedItem[]>(`dropped_list_${userId}`, []);
  const [favorites, setFavorites] = useLocalStorage<TrackedItem[]>(`favorites_list_${userId}`, []);
  const [watchProgress, setWatchProgress] = useLocalStorage<WatchProgress>(`watch_progress_${userId}`, {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(`history_${userId}`, []);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>(`search_history_${userId}`, []);
  const [comments, setComments] = useLocalStorage<Comment[]>(`comments_${userId}`, []);
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>(`custom_image_paths_${userId}`, {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(`notifications_${userId}`, []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_episodes_${userId}`, {});
  const [episodeRatings, setEpisodeRatings] = useLocalStorage<EpisodeRatings>(`episode_ratings_${userId}`, {});
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>(`custom_lists_${userId}`, []);
  const [showStatusCache, setShowStatusCache] = useLocalStorage<Record<number, string>>(`show_status_cache_${userId}`, {});
  const [movieCollectionCache, setMovieCollectionCache] = useLocalStorage<Record<number, number>>(`movie_collection_cache_${userId}`, {});
  const [ratings, setRatings] = useLocalStorage<UserRatings>(`user_ratings_${userId}`, {});
  const [profilePictureUrl, setProfilePictureUrl] = useLocalStorage<string | null>(`profilePictureUrl_${userId}`, null);
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(`notification_settings_${userId}`, {
    masterEnabled: true,
    newEpisodes: true,
    movieReleases: true,
    sounds: true,
    newFollowers: true,
    listLikes: true,
    appUpdates: true,
    importSyncCompleted: true,
    showWatchedConfirmation: true,
  });
  const [follows, setFollows] = useLocalStorage<Follows>(`sceneit_follows`, {});
  const [privacySettings, setPrivacySettings] = useLocalStorage<PrivacySettings>(`privacy_settings_${userId}`, { activityVisibility: 'followers' });
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');
  const [profileTheme, setProfileTheme] = useLocalStorage<ProfileTheme | null>(`profileTheme_${userId}`, null);
  const [textSize, setTextSize] = useLocalStorage<number>(`textSize_${userId}`, 1);
  const [userXp, setUserXp] = useLocalStorage<number>(`userXp_${userId}`, 0);

  const levelInfo = useMemo(() => calculateLevelInfo(userXp), [userXp]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize * 100}%`;
  }, [textSize]);

  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [initialProfileTab, setInitialProfileTab] = useState<ProfileTab>('overview');
  const [modalShow, setModalShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [genres, setGenres] = useState<Record<number, string>>({});
  
  const [liveWatchMedia, setLiveWatchMedia] = useState<LiveWatchMediaInfo | null>(null);
  const [liveWatchElapsedSeconds, setLiveWatchElapsedSeconds] = useState(0);
  const [liveWatchIsPaused, setLiveWatchIsPaused] = useState(false);
  const [isLiveWatchOpen, setIsLiveWatchOpen] = useState(false);
  const [isLiveWatchMinimized, setIsLiveWatchMinimized] = useState(false);
  const [liveWatchHistoryLogId, setLiveWatchHistoryLogId] = useState<string | null>(null);
  const [pausedLiveSessions, setPausedLiveSessions] = useLocalStorage<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>>(`paused_live_sessions_${userId}`, {});

  const liveWatchIntervalRef = useRef<number | null>(null);
  const liveWatchPauseTimeRef = useRef<number | null>(null);

  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  
  const [transitionEffect, setTransitionEffect] = useState<Theme['colors']['particleEffect'] | null>(null);
  const prevThemeIdRef = useRef(activeTheme.id);

  useEffect(() => {
    if (prevThemeIdRef.current !== activeTheme.id) {
        if (holidayInfo.isHoliday) {
            setTransitionEffect(activeTheme.colors.particleEffect || null);
        }
        prevThemeIdRef.current = activeTheme.id;
    }
  }, [activeTheme.id, activeTheme.colors.particleEffect, holidayInfo.isHoliday]);

  const [autoBackupEnabled] = useLocalStorage('autoBackupEnabled', false);

  useEffect(() => {
    confirmationService.updateSetting(notificationSettings.showWatchedConfirmation);
  }, [notificationSettings.showWatchedConfirmation]);
  
  const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    if (!notificationSettings.masterEnabled) return;
    
    if (notification.type === 'new_season' && !notificationSettings.newEpisodes) return;
    if (notification.type === 'new_sequel' && !notificationSettings.movieReleases) return;
    if (notification.type === 'achievement_unlocked' && !notificationSettings.appUpdates) return;
    if (notification.type === 'new_follower' && !notificationSettings.newFollowers) return;
    if (notification.type === 'list_like' && !notificationSettings.listLikes) return;


    setNotifications(prev => {
        const twentyFourHoursAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
        const exists = prev.some(n => 
            n.mediaId === notification.mediaId && 
            n.type === notification.type &&
            new Date(n.timestamp).getTime() > twentyFourHoursAgo 
        );
        if (exists) {
            return prev;
        }
        const newNotification: AppNotification = {
            ...notification,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            read: false,
        };

        if(notificationSettings.sounds) {
            playNotificationSound();
        }

        return [newNotification, ...prev].slice(0, 50); 
    });
  }, [setNotifications, notificationSettings]);

  useEffect(() => {
    if (!autoBackupEnabled) return;

    const lastBackup = localStorage.getItem('auto_backup_last_timestamp');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (lastBackup && (now - parseInt(lastBackup, 10)) < oneDay) {
        return; 
    }
    
    try {
        const backupData: { [key: string]: string } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key !== 'sceneit_local_backup' && key !== 'auto_backup_last_timestamp') {
                const value = localStorage.getItem(key);
                if (value) {
                    backupData[key] = value;
                }
            }
        }
        localStorage.setItem('sceneit_local_backup', JSON.stringify(backupData));
        localStorage.setItem('auto_backup_last_timestamp', now.toString());
        console.log("Automatic local backup completed.");
    } catch (error) {
        console.error("Failed to perform automatic local backup:", error);
    }
  }, [autoBackupEnabled]);


  const allUserData: UserData = useMemo(() => ({
      watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, searchHistory, comments
  }), [watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, searchHistory, comments]);
  
  const { achievements, isLoading: achievementsLoading } = useAchievements(allUserData);
  const [prevAchievements, setPrevAchievements] = useLocalStorage<UserAchievementStatus[]>(`prev_achievements_${userId}`, []);

  useEffect(() => {
      if (achievementsLoading || achievements.length === 0) return;
      
      const isInitialLoadWithData = prevAchievements.length === 0 && achievements.some(a => a.unlocked);
      if (isInitialLoadWithData) {
          setPrevAchievements(achievements);
          return;
      }

      const newlyUnlocked = achievements.filter(currentAch => {
          if (!currentAch.unlocked) return false;
          const prevAch = prevAchievements.find(p => p.id === currentAch.id);
          return !prevAch || !prevAch.unlocked;
      });

      if (newlyUnlocked.length > 0) {
          newlyUnlocked.forEach(ach => {
               addNotification({
                  type: 'achievement_unlocked',
                  title: 'Achievement Unlocked!',
                  description: `You've earned the "${ach.name}" badge.`,
              });
          });
      }
      
      if (JSON.stringify(prevAchievements) !== JSON.stringify(achievements)) {
          setPrevAchievements(achievements);
      }
  }, [achievements, achievementsLoading, addNotification, prevAchievements, setPrevAchievements]);

  const handleSelectShow = (id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    setSelectedPerson(null);
    setSearchQuery('');
    window.scrollTo(0, 0);
  };
  
  const handleSelectShowInModal = (id: number, media_type: 'tv' | 'movie') => {
    setModalShow({ id, media_type });
  };

  const handleCloseModal = () => {
    setModalShow(null);
  };

  const handleSelectPerson = (personId: number) => {
    setSelectedPerson(personId);
    setSelectedShow(null);
    window.scrollTo(0, 0);
  };

  const handleSelectUser = (userId: string) => {
    setViewingUserId(userId);
  };
  
  const handleGoHome = () => {
    setSelectedShow(null);
    setSelectedPerson(null);
    setActiveScreen('home');
    setSearchQuery('');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelectedShow(null);
    setSelectedPerson(null);
  };
  
  const handleTabPress = (tab: TabName) => {
    setSelectedShow(null);
    setSelectedPerson(null);
    setActiveScreen(tab);
    if (tab !== 'search') {
      setSearchQuery('');
    }
    if (tab === 'profile') { 
        setInitialProfileTab('overview');
    }
    window.scrollTo(0, 0);
  };

  const handleShortcutNavigate = (screen: ScreenName, profileTab?: ProfileTab) => {
    setSelectedShow(null);
    setActiveScreen(screen);
    if (screen === 'profile' && profileTab) {
        setInitialProfileTab(profileTab);
    }
    window.scrollTo(0, 0);
  };

  const handleAdjustHistoryTimestamp = (logId: string, durationToAddMs: number) => {
    setHistory(prev => prev.map(item => {
        if (item.logId === logId) {
            const newTimestamp = new Date(new Date(item.timestamp).getTime() + durationToAddMs).toISOString();
            return { ...item, timestamp: newTimestamp };
        }
        return item;
    }));
  };

  const handleUpdateSearchHistory = useCallback((query: string) => {
      setSearchHistory(prev => {
          const newEntry = { query, timestamp: new Date().toISOString() };
          const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
          const updated = [newEntry, ...filtered];
          return updated.slice(0, 20); 
      });
  }, [setSearchHistory]);

  const handleDeleteSearchHistoryItem = useCallback((timestamp: string) => {
      setSearchHistory(prev => prev.filter(item => item.timestamp !== timestamp));
  }, [setSearchHistory]);

  const handleClearSearchHistory = useCallback(() => {
      if (window.confirm("Are you sure you want to clear your search history?")) {
          setSearchHistory([]);
      }
  }, [setSearchHistory]);

    const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching,
            planToWatch: setPlanToWatch,
            completed: setCompleted,
            onHold: setOnHold,
            dropped: setDropped,
        };

        Object.keys(setters).forEach(key => {
            setters[key](prev => prev.filter(i => i.id !== item.id));
        });

        if (newList && setters[newList]) {
            setters[newList](prev => [item, ...prev]);
        }

        if (newList) {
            animationService.show('flyToNav', { posterPath: item.poster_path });
        }
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped]);

  const handleCloseLiveWatch = useCallback(() => {
    if (liveWatchIntervalRef.current) clearInterval(liveWatchIntervalRef.current);
    liveWatchIntervalRef.current = null;
    liveWatchPauseTimeRef.current = null;
    
    if (liveWatchMedia) {
        setPausedLiveSessions(prevPaused => {
            const newPaused = { ...prevPaused };
            delete newPaused[liveWatchMedia.id];
            return newPaused;
        });
    }

    setLiveWatchMedia(null);
    setLiveWatchHistoryLogId(null);
    setIsLiveWatchOpen(false);
  }, [liveWatchMedia, setPausedLiveSessions]);

  const handleLiveWatchTogglePause = useCallback(() => {
    setLiveWatchIsPaused(prev => {
        const isNowPausing = !prev;
        if (isNowPausing) { 
            liveWatchPauseTimeRef.current = Date.now();
            if (liveWatchMedia) {
                setPausedLiveSessions(prevPaused => ({
                    ...prevPaused,
                    [liveWatchMedia.id]: {
                        mediaInfo: liveWatchMedia,
                        elapsedSeconds: liveWatchElapsedSeconds,
                        pausedAt: new Date().toISOString(),
                    }
                }));
            }
        } else { 
            if (liveWatchPauseTimeRef.current && liveWatchHistoryLogId) {
                const pausedDuration = Date.now() - liveWatchPauseTimeRef.current;
                handleAdjustHistoryTimestamp(liveWatchHistoryLogId, pausedDuration);
                liveWatchPauseTimeRef.current = null;
            }
        }
        return !prev;
    });
  }, [liveWatchHistoryLogId, liveWatchMedia, liveWatchElapsedSeconds, setPausedLiveSessions]);

  const handleStartLiveWatch = useCallback((mediaInfo: LiveWatchMediaInfo) => {
    if (liveWatchMedia && liveWatchMedia.id !== mediaInfo.id && !window.confirm("Starting a new live watch session will stop the current one. Continue?")) {
        return;
    }

    if (liveWatchIntervalRef.current) clearInterval(liveWatchIntervalRef.current);
    liveWatchIntervalRef.current = null;
    liveWatchPauseTimeRef.current = null;
    
    const isResuming = pausedLiveSessions[mediaInfo.id];
    const startTime = isResuming ? pausedLiveSessions[mediaInfo.id].elapsedSeconds : 0;
    
    setLiveWatchMedia(mediaInfo);
    setLiveWatchElapsedSeconds(startTime);
    setLiveWatchIsPaused(false);
    setIsLiveWatchOpen(true);
    setIsLiveWatchMinimized(false);

    const logId = `live-${mediaInfo.id}-${Date.now()}`;
    const newHistoryEntry: HistoryItem = {
      logId: logId, id: mediaInfo.id, media_type: mediaInfo.media_type, title: mediaInfo.title, poster_path: mediaInfo.poster_path,
      timestamp: new Date().toISOString(), seasonNumber: mediaInfo.seasonNumber, episodeNumber: mediaInfo.episodeNumber,
      note: `Live watch session started.`,
    };
    
    if(isResuming) {
        setPausedLiveSessions(prev => {
            const newPaused = {...prev};
            delete newPaused[mediaInfo.id];
            return newPaused;
        });
    }

    setHistory(prev => [newHistoryEntry, ...prev]);
    setLiveWatchHistoryLogId(logId);

  }, [liveWatchMedia, pausedLiveSessions, setHistory, setPausedLiveSessions]);

  const handleToggleMinimize = () => {
      setIsLiveWatchMinimized(prev => !prev);
  };

    const handleToggleEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => {
        const wasWatched = currentStatus === 2;
        const newStatus = wasWatched ? 0 : 2;

        const newProgress = JSON.parse(JSON.stringify(watchProgress));
        if (!newProgress[showId]) newProgress[showId] = {};
        if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
        const epProgress = newProgress[showId][seasonNumber][episodeNumber] || { status: 0 };
        newProgress[showId][seasonNumber][episodeNumber] = { ...epProgress, status: newStatus };
        setWatchProgress(newProgress);
        
        clearMediaCache(showId, 'tv');

        if (!wasWatched) {
            const historyEntry: HistoryItem = {
                logId: `tv-${showId}-${seasonNumber}-${episodeNumber}-${Date.now()}`,
                id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                timestamp: new Date().toISOString(), seasonNumber, episodeNumber
            };
            setHistory(prev => [historyEntry, ...prev].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

            const isWatching = watching.some(i => i.id === showId);
            const isCompleted = completed.some(i => i.id === showId);
            if (!isWatching && !isCompleted) {
                updateLists(showInfo, null, 'watching');
            }
            if (episodeName) {
                confirmationService.show(`✅ “${showInfo.title} – S${seasonNumber}, E${episodeNumber} (‘${episodeName}’) has been marked as watched.”`);
            }
            // Grant XP
            const oldLevel = calculateLevelInfo(userXp).level;
            const newXp = userXp + XP_CONFIG.episode;
            setUserXp(newXp);
            const newLevel = calculateLevelInfo(newXp).level;
            if (newLevel > oldLevel) {
                addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
            }
        } else { 
            setHistory(prev => prev.filter(item => 
                !(item.id === showId && item.seasonNumber === seasonNumber && item.episodeNumber === episodeNumber)
            ));
        }
    }, [watchProgress, setWatchProgress, setHistory, watching, completed, updateLists, userXp, setUserXp, addNotification]);

  useEffect(() => {
    const cleanup = () => {
      if (liveWatchIntervalRef.current) clearInterval(liveWatchIntervalRef.current);
      liveWatchIntervalRef.current = null;
    };

    if (liveWatchMedia && !liveWatchIsPaused) {
      const runtimeInSeconds = liveWatchMedia.runtime * 60;
      liveWatchIntervalRef.current = window.setInterval(() => {
        setLiveWatchElapsedSeconds(prev => {
          const next = prev + 1;
          if (next >= runtimeInSeconds) {
            if (liveWatchMedia.media_type === 'movie') {
                const trackedItem: TrackedItem = { ...liveWatchMedia, genre_ids: [] };
                updateLists(trackedItem, null, 'completed');
            } else if (liveWatchMedia.media_type === 'tv' && liveWatchMedia.seasonNumber && liveWatchMedia.episodeNumber) {
                const showInfo: TrackedItem = { id: liveWatchMedia.id, title: liveWatchMedia.title, media_type: 'tv', poster_path: liveWatchMedia.poster_path, genre_ids: [] };
                handleToggleEpisode(liveWatchMedia.id, liveWatchMedia.seasonNumber, liveWatchMedia.episodeNumber, 0, showInfo, liveWatchMedia.episodeTitle);
            }
            handleCloseLiveWatch();
          }
          return next;
        });
      }, 1000);
    } else {
      cleanup();
    }
    return cleanup;
  }, [liveWatchMedia, liveWatchIsPaused, handleCloseLiveWatch, handleToggleEpisode, updateLists]);

    const handleUpdateCustomList = useCallback((listId: string, item: TrackedItem, action: 'add' | 'remove') => {
    setCustomLists(prevLists => {
        return prevLists.map(list => {
            if (list.id === listId) {
                let newItems = [...list.items];
                if (action === 'add') {
                    if (!newItems.some(i => i.id === item.id)) {
                        const { id, media_type, title, poster_path } = item;
                        newItems = [{ id, media_type, title, poster_path }, ...newItems];
                    }
                } else {
                    newItems = newItems.filter(i => i.id !== item.id);
                }
                return { ...list, items: newItems };
            }
            return list;
        });
    });
  }, [setCustomLists]);

  useEffect(() => {
        const checkCompletion = async () => {
            const watchingTvShows = [...watching.filter(item => item.media_type === 'tv')];

            for (const show of watchingTvShows) {
                const progressForShow = watchProgress[show.id];
                if (!progressForShow) continue;

                try {
                    const details = await getMediaDetails(show.id, 'tv');
                    if (!details || !details.seasons || details.seasons.length === 0) continue;

                    const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);
                    const totalEpisodes = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);

                    if (totalEpisodes === 0) continue;

                    let watchedCount = 0;
                    for (const season of seasonsForCalc) {
                        for (let i = 1; i <= season.episode_count; i++) {
                            if (progressForShow[season.season_number]?.[i]?.status === 2) {
                                watchedCount++;
                            }
                        }
                    }
                    
                    if (totalEpisodes > 0 && watchedCount >= totalEpisodes) {
                        updateLists(show, 'watching', 'completed');
                    }
                } catch (error) {
                    console.error(`Error during completion check for show ID ${show.id}:`, error);
                }
            }
        };

        checkCompletion();
    }, [watchProgress, watching, updateLists]);
    
  
  const handleMarkAllNotificationsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, [setNotifications]);

    const handleMarkOneNotificationRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, [setNotifications]);

  useEffect(() => {
    const hasVisited = localStorage.getItem('sceneit_has_visited');
    if (!hasVisited) {
        setIsWelcomeModalOpen(true);
        localStorage.setItem('sceneit_has_visited', 'true');
    }
  }, []); 

  useEffect(() => {
    const isInitialized = localStorage.getItem(`sceneit_initialized_${userId}`);
    if (!isInitialized) {
        localStorage.setItem(`sceneit_initialized_${userId}`, 'true');
        localStorage.setItem(`sceneit_join_date_${userId}`, new Date().toISOString());
    }
  }, [userId]);

  useEffect(() => {
    if (sessionStorage.getItem('trakt_auth_complete') === 'true') {
        sessionStorage.removeItem('trakt_auth_complete');
        handleShortcutNavigate('profile', 'imports');
    }
  }, []); 

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);
  
    useEffect(() => {
        const runBackgroundChecks = async () => {
            const lastCheck = localStorage.getItem('last_status_check');
            const now = Date.now();
            const twoHours = 2 * 60 * 60 * 1000;

            if (lastCheck && now - parseInt(lastCheck, 10) < twoHours) {
                return;
            }

            const itemsToCheck = [...watching, ...planToWatch];
            
            const showsToCheck = itemsToCheck.filter(item => item.media_type === 'tv');
            const uniqueShowIds = Array.from(new Set(showsToCheck.map(s => s.id)));
            const newStatusCache = { ...showStatusCache };
            let statusCacheUpdated = false;

            for (const showId of uniqueShowIds) {
                try {
                    clearMediaCache(showId, 'tv'); 
                    const details = await getMediaDetails(showId, 'tv');
                    const showInfo = showsToCheck.find(s => s.id === showId);
                    if (!showInfo) continue;

                    const newStatus = details.status;
                    const oldStatus = showStatusCache[showId];
                    if (newStatus && oldStatus && newStatus !== oldStatus) {
                        if (newStatus === 'Cancelled') {
                            addNotification({ type: 'status_change', mediaId: showId, mediaType: 'tv', title: `Status Update: ${showInfo.title}`, description: `Unfortunately, ${showInfo.title} has been officially cancelled.`, poster_path: showInfo.poster_path });
                        } else if (newStatus === 'Returning Series' && oldStatus === 'Ended') {
                            addNotification({ type: 'new_season', mediaId: showId, mediaType: 'tv', title: `${showInfo.title} Renewed!`, description: `${showInfo.title} has been renewed for a new season!`, poster_path: showInfo.poster_path });
                        }
                    }
                    if (newStatus && newStatus !== oldStatus) {
                        newStatusCache[showId] = newStatus;
                        statusCacheUpdated = true;
                    } else if (!oldStatus && newStatus) {
                        newStatusCache[showId] = newStatus;
                        statusCacheUpdated = true;
                    }

                    const lastEp = details.last_episode_to_air;
                    if (lastEp && lastEp.air_date) {
                        const airDate = new Date(`${lastEp.air_date}T00:00:00Z`);
                        const fourteenDaysAgo = new Date(now - 14 * 24 * 60 * 60 * 1000);
                        if (airDate >= fourteenDaysAgo && airDate <= new Date(now)) {
                            const latestSeason = details.seasons?.find(s => s.season_number === lastEp.season_number);
                            if (latestSeason && lastEp.episode_number === 1) { 
                                addNotification({ type: 'new_season', mediaId: details.id, mediaType: 'tv', title: `Premiere: ${details.name}`, description: `${latestSeason.name} just premiered!`, poster_path: details.poster_path });
                            }
                        }
                    }

                } catch (error) { console.error(`Failed to check status for show ID ${showId}`, error); }
                await new Promise(resolve => setTimeout(resolve, 300)); 
            }
            if (statusCacheUpdated) setShowStatusCache(newStatusCache);


            const moviesToCheck = itemsToCheck.filter(item => item.media_type === 'movie');
            const uniqueMovieIds = Array.from(new Set(moviesToCheck.map(m => m.id)));
            const newCollectionCache = { ...movieCollectionCache };
            let collectionCacheUpdated = false;

            for (const movieId of uniqueMovieIds) {
                try {
                    const details = await getMediaDetails(movieId, 'movie');
                    if (details.belongs_to_collection) {
                        const collectionId = details.belongs_to_collection.id;
                        const collectionDetails = await getCollectionDetails(collectionId);
                        const newPartCount = collectionDetails.parts.length;
                        const oldPartCount = movieCollectionCache[collectionId];

                        if (oldPartCount !== undefined && newPartCount > oldPartCount) {
                            const newestMovie = collectionDetails.parts.sort((a, b) => new Date(b.release_date || 0).getTime() - new Date(a.release_date || 0).getTime())[0];
                            if (newestMovie) {
                                addNotification({ type: 'new_sequel', mediaId: newestMovie.id, mediaType: 'movie', title: `New in "${collectionDetails.name}"`, description: `${newestMovie.title || 'A new installment'} has been added to this collection.`, poster_path: newestMovie.poster_path });
                            }
                        }
                        if (newPartCount !== oldPartCount) {
                            newCollectionCache[collectionId] = newPartCount;
                            collectionCacheUpdated = true;
                        }
                    }
                } catch (error) { console.error(`Failed to check sequel status for movie ID ${movieId}`, error); }
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            if (collectionCacheUpdated) setMovieCollectionCache(newCollectionCache);

            localStorage.setItem('last_status_check', now.toString());
        };

        const timer = setTimeout(runBackgroundChecks, 10000); 
        return () => clearTimeout(timer);
    }, [watching, planToWatch, showStatusCache, setShowStatusCache, movieCollectionCache, setMovieCollectionCache, addNotification]);

  const handleAddItemToList = useCallback((itemToAdd: TmdbMedia, list: WatchStatus) => {
    const trackedItem: TrackedItem = {
        id: itemToAdd.id,
        title: itemToAdd.title || itemToAdd.name || 'Untitled',
        media_type: itemToAdd.media_type,
        poster_path: itemToAdd.poster_path,
        genre_ids: itemToAdd.genre_ids,
    };
    updateLists(trackedItem, null, list);
  }, [updateLists]);

  const handleAddWatchHistory = useCallback((item: TrackedItem, seasonNumber?: number, episodeNumber?: number, timestamp?: string, note?: string) => {
    const newTimestamp = timestamp || new Date().toISOString();
    const historyEntry: HistoryItem = {
        logId: `log-${item.id}-${new Date(newTimestamp).getTime()}-${Math.random().toString(36).substring(2, 9)}`,
        id: item.id,
        media_type: item.media_type,
        title: item.title,
        poster_path: item.poster_path,
        timestamp: newTimestamp,
        seasonNumber: seasonNumber,
        episodeNumber: episodeNumber,
        note: note,
    };
    
    setHistory(prev => [...prev, historyEntry].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    let currentStatus: WatchStatus | null = null;
    for (const listName of ['watching', 'planToWatch', 'completed', 'onHold', 'dropped'] as WatchStatus[]) {
        if (allUserData[listName]?.some((i: TrackedItem) => i.id === item.id)) {
            currentStatus = listName;
            break;
        }
    }

    if (item.media_type === 'tv' && seasonNumber !== undefined && episodeNumber !== undefined) {
        const wasPreviouslyUnwatched = !watchProgress[item.id] || Object.keys(watchProgress[item.id]).length === 0;

        setWatchProgress(prev => {
            const newProgress = JSON.parse(JSON.stringify(prev));
            if (!newProgress[item.id]) newProgress[item.id] = {};
            if (!newProgress[item.id][seasonNumber]) newProgress[item.id][seasonNumber] = {};
            const epProgress = newProgress[item.id][seasonNumber][episodeNumber] || { status: 0 };
            newProgress[item.id][seasonNumber][episodeNumber] = { ...epProgress, status: 2 };
            return newProgress;
        });

        if (wasPreviouslyUnwatched && currentStatus !== 'watching' && currentStatus !== 'completed') {
            updateLists(item, currentStatus, 'watching');
        }
    } else if (item.media_type === 'movie') {
        updateLists(item, currentStatus, 'completed');
    }
  }, [setHistory, setWatchProgress, updateLists, watchProgress, allUserData]);


  const handleMarkAllWatched = useCallback(async (showId: number, showInfo: TrackedItem) => {
    if (window.confirm(`Mark all AIRED episodes of "${showInfo.title}" as watched? This will add entries to your history.`)) {
      try {
        const details = await getMediaDetails(showId, 'tv');
        if (!details || !details.seasons) return;

        const newProgress = JSON.parse(JSON.stringify(watchProgress));
        if (!newProgress[showId]) newProgress[showId] = {};
        
        const newHistory: HistoryItem[] = [];
        const timestamp = new Date().toISOString();
        const today = new Date().toISOString().split('T')[0];

        const seasonDetailPromises = details.seasons
            .filter(s => s.season_number > 0)
            .map(s => getSeasonDetails(showId, s.season_number).catch(() => null));

        const allSeasonDetails = await Promise.all(seasonDetailPromises);

        for (const seasonDetails of allSeasonDetails) {
            if (!seasonDetails) continue;
            
            const seasonNumber = seasonDetails.season_number;
            if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
            
            for (const ep of seasonDetails.episodes) {
                if (ep.air_date && ep.air_date <= today) {
                    const epProgress = newProgress[showId][seasonNumber][ep.episode_number] || { status: 0 };
                    if (epProgress.status !== 2) {
                         newProgress[showId][seasonNumber][ep.episode_number] = { ...epProgress, status: 2 };
                         newHistory.push({
                            logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${Date.now()}`,
                            id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                            timestamp, seasonNumber, episodeNumber: ep.episode_number
                        });
                    }
                }
            }
        }

        if (newHistory.length > 0) {
            setWatchProgress(newProgress);
            setHistory(prev => [...prev, ...newHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            updateLists(showInfo, null, 'watching');
        } else {
            alert(`All aired episodes of "${showInfo.title}" are already marked as watched.`);
        }
        
      } catch (error) {
          console.error("Failed to mark all as watched:", error);
      }
    }
  }, [watchProgress, setWatchProgress, setHistory, updateLists]);


  const handleMarkShowAsWatched = useCallback((itemToMark: TmdbMedia | TrackedItem, date?: string) => {
      const trackedItem: TrackedItem = {
        id: itemToMark.id,
        title: itemToMark.title || (itemToMark as TmdbMedia).name || 'Untitled',
        media_type: itemToMark.media_type,
        poster_path: itemToMark.poster_path,
        genre_ids: itemToMark.genre_ids,
      };

      if (trackedItem.media_type === 'movie') {
          handleAddWatchHistory(trackedItem, undefined, undefined, date);
          const releaseYear = ('release_date' in itemToMark && itemToMark.release_date)?.substring(0, 4);
          confirmationService.show(`✅ “${trackedItem.title}${releaseYear ? ` (${releaseYear})` : ''} has been marked as watched.”`);

          // Grant XP for movie
          const oldLevel = calculateLevelInfo(userXp).level;
          const newXp = userXp + XP_CONFIG.movie;
          setUserXp(newXp);
          const newLevel = calculateLevelInfo(newXp).level;
          if (newLevel > oldLevel) {
              addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
          }
      } else {
          handleMarkAllWatched(trackedItem.id, trackedItem);
          confirmationService.show(`✅ “All aired episodes of ${trackedItem.title} have been marked as watched.”`);
      }
  }, [handleAddWatchHistory, handleMarkAllWatched, userXp, setUserXp, addNotification]);

    const handleUnmarkMovieWatched = useCallback((mediaId: number, mediaType: 'movie') => {
        const itemToUnmark = completed.find(i => i.id === mediaId);
        if (!itemToUnmark) {
            console.warn(`Attempted to unmark movie ID ${mediaId}, but it was not found in the completed list.`);
            return;
        }

        const movieHistory = history.filter(h => h.id === mediaId && h.media_type === mediaType);

        if (movieHistory.length > 0) {
            const sortedHistory = [...movieHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const lastHistoryItem = sortedHistory[0];
            setHistory(prev => prev.filter(h => h.logId !== lastHistoryItem.logId));
        }
        
        const remainingHistoryCount = movieHistory.length > 0 ? movieHistory.length - 1 : 0;

        if (remainingHistoryCount === 0) {
            updateLists(itemToUnmark, 'completed', 'planToWatch');
        } else {
            updateLists(itemToUnmark, 'completed', null);
        }
    }, [history, setHistory, updateLists, completed]);


  const handleMarkSeasonWatched = useCallback((showId: number, seasonNumber: number, showInfo: TrackedItem, seasonName: string) => {
    getSeasonDetails(showId, seasonNumber).then(seasonDetails => {
        const newProgress = JSON.parse(JSON.stringify(watchProgress));
        if (!newProgress[showId]) newProgress[showId] = {};
        if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
        
        const newHistory: HistoryItem[] = [];
        const timestamp = new Date().toISOString();
        const today = new Date().toISOString().split('T')[0];
        
        let episodesMarked = 0;
        seasonDetails.episodes.forEach(ep => {
            if (ep.air_date && ep.air_date <= today) {
                const epProgress = newProgress[showId][seasonNumber][ep.episode_number] || { status: 0 };
                if (epProgress.status !== 2) {
                     newProgress[showId][seasonNumber][ep.episode_number] = { ...epProgress, status: 2 };
                     newHistory.push({
                        logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${Date.now()}`,
                        id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                        timestamp, seasonNumber, episodeNumber: ep.episode_number
                     });
                     episodesMarked++;
                }
            }
        });
        
        if (newHistory.length > 0) {
            setWatchProgress(newProgress);
            setHistory(prev => [...prev, ...newHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            confirmationService.show(`✅ “${showInfo.title} – ${seasonName} has been marked as watched.”`);

            const oldLevel = calculateLevelInfo(userXp).level;
            const newXp = userXp + (episodesMarked * XP_CONFIG.episode);
            setUserXp(newXp);
            const newLevel = calculateLevelInfo(newXp).level;
            if (newLevel > oldLevel) {
                addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
            }
            
            const currentList = ['watching', 'completed', 'onHold'].find(listName =>
                (allUserData[listName as keyof UserData] as TrackedItem[]).some(item => item.id === showId)
            );

            if (!currentList) {
                updateLists(showInfo, null, 'watching');
            }
        } else {
            alert(`All aired episodes in this season are already marked as watched.`);
        }
    });
  }, [watchProgress, setWatchProgress, setHistory, updateLists, allUserData, userXp, setUserXp, addNotification]);
  
  const handleUnmarkSeasonWatched = useCallback((showId: number, seasonNumber: number) => {
    getSeasonDetails(showId, seasonNumber).then(seasonDetails => {
        const newProgress = JSON.parse(JSON.stringify(watchProgress));
        if (newProgress[showId]?.[seasonNumber]) {
            seasonDetails.episodes.forEach(ep => {
                if (newProgress[showId][seasonNumber][ep.episode_number]) {
                    newProgress[showId][seasonNumber][ep.episode_number].status = 0;
                }
            });
        }
        
        setWatchProgress(newProgress);
        setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === seasonNumber)));
        
        let hasWatchedEpisodes = false;
        if (newProgress[showId]) {
            for (const sNum in newProgress[showId]) {
                if (hasWatchedEpisodes) break;
                for (const eNum in newProgress[showId][sNum]) {
                    if (newProgress[showId][sNum][eNum]?.status === 2) {
                        hasWatchedEpisodes = true;
                        break;
                    }
                }
            }
        }
        
        if (!hasWatchedEpisodes) {
            const itemToRemove = watching.find(i => i.id === showId) || onHold.find(i => i.id === showId);
            if (itemToRemove) {
                 const currentList = watching.some(i => i.id === showId) ? 'watching' : 'onHold';
                 updateLists(itemToRemove, currentList, null);
            }
        }
    });
}, [watchProgress, setWatchProgress, setHistory, updateLists, watching, onHold]);
  
  const handleMarkRemainingWatched = useCallback((showId: number, seasonNumber: number, showInfo: TrackedItem) => {
      getSeasonDetails(showId, seasonNumber).then(seasonDetails => {
          const newProgress = JSON.parse(JSON.stringify(watchProgress));
          if (!newProgress[showId]) newProgress[showId] = {};
          if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
          
          const newHistory: HistoryItem[] = [];
          const timestamp = new Date().toISOString();

          seasonDetails.episodes.forEach(ep => {
              const epProgress = newProgress[showId][seasonNumber]?.[ep.episode_number] || { status: 0 };
              if (epProgress.status !== 2) {
                  newProgress[showId][seasonNumber][ep.episode_number] = { ...epProgress, status: 2 };
                  newHistory.push({
                      logId: `tv-${showId}-${seasonNumber}-${ep.episode_number}-${Date.now()}`,
                      id: showId, media_type: 'tv', title: showInfo.title, poster_path: showInfo.poster_path,
                      timestamp, seasonNumber, episodeNumber: ep.episode_number
                  });
              }
          });
          
          setWatchProgress(newProgress);
          setHistory(prev => [...prev, ...newHistory].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      });
  }, [watchProgress, setWatchProgress, setHistory]);

  const handleMarkPreviousEpisodesWatched = useCallback((showId: number, seasonNumber: number, lastEpisodeNumber: number) => {
      const newProgress = JSON.parse(JSON.stringify(watchProgress));
      if (!newProgress[showId]) newProgress[showId] = {};
      if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};

      for (let i = 1; i <= lastEpisodeNumber; i++) {
          const epProgress = newProgress[showId][seasonNumber][i] || { status: 0 };
          newProgress[showId][seasonNumber][i] = { ...epProgress, status: 2 };
      }
      setWatchProgress(newProgress);
  }, [watchProgress, setWatchProgress]);

  const handleSaveJournal = useCallback((showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry | null) => {
    const journalExisted = !!(watchProgress[showId]?.[seasonNumber]?.[episodeNumber]?.journal);
    
    setWatchProgress(prev => {
        const newProgress = JSON.parse(JSON.stringify(prev));
        if (!newProgress[showId]) newProgress[showId] = {};
        if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
        const epProgress = newProgress[showId][seasonNumber][episodeNumber] || { status: 0 };
        
        if (entry) {
            newProgress[showId][seasonNumber][episodeNumber] = { ...epProgress, journal: entry };
        } else {
            delete newProgress[showId][seasonNumber][episodeNumber].journal;
            if (Object.keys(newProgress[showId][seasonNumber][episodeNumber]).length === 0) {
                delete newProgress[showId][seasonNumber][episodeNumber];
            }
        }
        return newProgress;
    });

    if (entry && !journalExisted) { // Grant XP only for new entries
        const oldLevel = calculateLevelInfo(userXp).level;
        const newXp = userXp + XP_CONFIG.journal;
        setUserXp(newXp);
        const newLevel = calculateLevelInfo(newXp).level;
        if (newLevel > oldLevel) {
            addNotification({ type: 'achievement_unlocked', title: 'Level Up!', description: `Congratulations, you've reached Level ${newLevel}!` });
        }
    }
  }, [setWatchProgress, watchProgress, userXp, setUserXp, addNotification]);

  const handleSaveComment = useCallback((mediaKey: string, text: string) => {
      setComments(prev => {
          const existingIndex = prev.findIndex(c => c.mediaKey === mediaKey);
          if (text.trim() === '') {
              return prev.filter(c => c.mediaKey !== mediaKey);
          }
          if (existingIndex > -1) {
              const updatedComments = [...prev];
              updatedComments[existingIndex] = { ...updatedComments[existingIndex], text, timestamp: new Date().toISOString() };
              return updatedComments;
          } else {
              const newComment: Comment = {
                  id: `comment-${Date.now()}`,
                  mediaKey,
                  text,
                  timestamp: new Date().toISOString()
              };
              return [newComment, ...prev];
          }
      });
  }, [setComments]);

  const handleSetCustomImage = useCallback((mediaId: number, type: 'poster' | 'backdrop', path: string) => {
    setCustomImagePaths(prev => ({
        ...prev,
        [mediaId]: {
            ...prev[mediaId],
            [`${type}_path`]: path,
        }
    }));
  }, [setCustomImagePaths]);

  const handleToggleFavoriteShow = useCallback((item: TrackedItem) => {
    setFavorites(prev => {
        const isFav = prev.some(f => f.id === item.id);
        if (isFav) {
            return prev.filter(f => f.id !== item.id);
        } else {
            return [item, ...prev];
        }
    });
  }, [setFavorites]);
  
  const handleToggleFavoriteEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number) => {
    setFavoriteEpisodes(prev => {
        const newFavs = JSON.parse(JSON.stringify(prev));
        if (!newFavs[showId]) newFavs[showId] = {};
        if (!newFavs[showId][seasonNumber]) newFavs[showId][seasonNumber] = {};
        
        if (newFavs[showId][seasonNumber][episodeNumber]) {
            delete newFavs[showId][seasonNumber][episodeNumber];
        } else {
            newFavs[showId][seasonNumber][episodeNumber] = true;
        }
        return newFavs;
    });
  }, [setFavoriteEpisodes]);

  const handleRateItem = useCallback((mediaId: number, rating: number) => {
      setRatings(prev => {
          if (rating === 0) { 
              const newRatings = { ...prev };
              delete newRatings[mediaId];
              return newRatings;
          }
          return {
              ...prev,
              [mediaId]: { rating, date: new Date().toISOString() },
          }
      });
  }, [setRatings]);
  
   const handleRateEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number, rating: number) => {
      setEpisodeRatings(prev => {
          const newRatings = JSON.parse(JSON.stringify(prev));
          if (!newRatings[showId]) newRatings[showId] = {};
          if (!newRatings[showId][seasonNumber]) newRatings[showId][seasonNumber] = {};

          if (rating === 0) {
              delete newRatings[showId][seasonNumber][episodeNumber];
          } else {
              newRatings[showId][seasonNumber][episodeNumber] = rating;
          }
          return newRatings;
      });
  }, [setEpisodeRatings]);


  const handleOpenCustomListModal = (item: TmdbMedia | TrackedItem) => {
      setAddToListModalState({ isOpen: true, item: item });
  };
  
  const handleAddToList = (listId: string, item: CustomListItem) => {
      setCustomLists(prev => prev.map(list => {
          if (list.id === listId) {
              if (list.items.some(i => i.id === item.id)) return list; 
              return { ...list, items: [item, ...list.items] };
          }
          return list;
      }));
  };
  
  const handleCreateAndAddToList = (listName: string, item: CustomListItem) => {
      const newList: CustomList = {
          id: `cl-${Date.now()}`,
          name: listName,
          description: '',
          items: [item],
          createdAt: new Date().toISOString(),
          isPublic: false,
      };
      setCustomLists(prev => [newList, ...prev]);
  };
  
  const handleFollow = (userIdToFollow: string, username: string) => {
    if (!currentUser) return;
    setFollows(prev => {
        const following = prev[currentUser.id] || [];
        if (following.includes(userIdToFollow)) return prev;
        
        addNotification({
            type: 'new_follower',
            title: 'You followed a user!',
            description: `You are now following ${username}.`,
        });
        
        return { ...prev, [currentUser.id]: [...following, userIdToFollow] };
    });
  };

  const handleUnfollow = (userIdToUnfollow: string) => {
      if (!currentUser) return;
      setFollows(prev => {
          const following = prev[currentUser.id] || [];
          return { ...prev, [currentUser.id]: following.filter(id => id !== userIdToUnfollow) };
      });
  };

  const handleToggleLikeList = (ownerId: string, listId: string, listName: string) => {
      if (!currentUser) {
          onAuthClick();
          return;
      }
      
      const ownerListsKey = `custom_lists_${ownerId}`;
      const ownerListsJson = localStorage.getItem(ownerListsKey);
      if (!ownerListsJson) return;

      const ownerLists: CustomList[] = JSON.parse(ownerListsJson);
      const listIndex = ownerLists.findIndex(l => l.id === listId);
      if (listIndex === -1) return;

      const list = ownerLists[listIndex];
      const likes = list.likes || [];
      const userIndex = likes.indexOf(currentUser.id);
      
      if (userIndex > -1) {
          likes.splice(userIndex, 1);
      } else {
          likes.push(currentUser.id);
          addNotification({
              type: 'list_like',
              listId: listId,
              listName: listName,
              likerInfo: { userId: currentUser.id, username: currentUser.username },
              title: 'Your list was liked!',
              description: `${currentUser.username} liked your list: "${listName}"`
          });
      }

      ownerLists[listIndex] = { ...list, likes };
      localStorage.setItem(ownerListsKey, JSON.stringify(ownerLists));
      
      if (activeScreen === 'profile' || activeScreen === 'search') {
          setRefreshKey(prev => prev + 1);
      }
  };


  const handleDeleteHistoryItem = useCallback((logId: string) => {
      setHistory(prev => prev.filter(h => h.logId !== logId));
  }, [setHistory]);
  
  const handleClearMediaHistory = useCallback((mediaId: number, mediaType: 'tv' | 'movie') => {
    setHistory(prev => prev.filter(h => h.id !== mediaId));

    if (mediaType === 'tv') {
        setWatchProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[mediaId];
            return newProgress;
        });
    }
    
    setWatching(prev => prev.filter(i => i.id !== mediaId));
    setCompleted(prev => prev.filter(c => c.id !== mediaId));
    setOnHold(prev => prev.filter(i => i.id !== mediaId));
    setDropped(prev => prev.filter(i => i.id !== mediaId));
  }, [setHistory, setWatchProgress, setWatching, setCompleted, setOnHold, setDropped]);


  const handleImportCompleted = (historyItems: HistoryItem[], completedItems: TrackedItem[]) => {
      setHistory(prev => [...prev, ...historyItems].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setCompleted(prev => [...prev, ...completedItems]);
      if (notificationSettings.importSyncCompleted) {
          addNotification({
              type: 'recommendation', 
              title: 'Import Complete',
              description: `Successfully imported ${completedItems.length} items from your file.`,
          });
      }
  };
  
  const handleTraktImportCompleted = (data: {
    history: HistoryItem[];
    completed: TrackedItem[];
    planToWatch: TrackedItem[];
    watchProgress: WatchProgress;
    ratings: UserRatings;
  }) => {
    setHistory(prev => [...prev, ...data.history].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    const deDupe = (original: TrackedItem[], additions: TrackedItem[]) => {
        const existingIds = new Set(original.map(i => i.id));
        return [...original, ...additions.filter(i => !existingIds.has(i.id))];
    };
    setCompleted(prev => deDupe(prev, data.completed));
    setPlanToWatch(prev => deDupe(prev, data.planToWatch));
    
    setWatchProgress(prev => {
        const newProgress = JSON.parse(JSON.stringify(prev));
        for (const showId in data.watchProgress) {
            if (!newProgress[showId]) {
                newProgress[showId] = data.watchProgress[showId];
            } else {
                for (const seasonNum in data.watchProgress[showId]) {
                     if (!newProgress[showId][seasonNum]) {
                         newProgress[showId][seasonNum] = data.watchProgress[showId][seasonNum];
                     } else {
                         newProgress[showId][seasonNum] = {...data.watchProgress[showId][seasonNum], ...newProgress[showId][seasonNum]};
                     }
                }
            }
        }
        return newProgress;
    });

    setRatings(prev => ({...prev, ...data.ratings}));

    if (notificationSettings.importSyncCompleted) {
        addNotification({
            type: 'recommendation',
            title: 'Trakt Import Complete',
            description: 'Successfully imported your data from Trakt.tv.',
        });
    }
  };
  
  const handleRemoveDuplicateHistory = () => {
      setHistory(prev => {
          if (prev.length < 2) return prev;
          const uniqueHistory: HistoryItem[] = [];
          const seen = new Set<string>(); 
          const sorted = [...prev].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          sorted.forEach(item => {
              const key = `${item.id}-${item.seasonNumber}-${item.episodeNumber}`;
              if (!seen.has(key)) {
                  uniqueHistory.push(item);
                  seen.add(key);
              }
          });

          const final = uniqueHistory.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          const removedCount = prev.length - final.length;
          if (removedCount > 0) {
              alert(`Removed ${removedCount} duplicate history entries.`);
          } else {
              alert("No duplicate entries found.");
          }
          return final;
      });
  };

  const handleMarkLiveItemWatched = (mediaInfo: LiveWatchMediaInfo) => {
    const trackedItem: TrackedItem = { ...mediaInfo, genre_ids: [] };
    if (mediaInfo.media_type === 'movie') {
        updateLists(trackedItem, null, 'completed');
        confirmationService.show(`✅ “${trackedItem.title}” has been marked as watched.`);
    } else if (mediaInfo.media_type === 'tv' && mediaInfo.seasonNumber && mediaInfo.episodeNumber) {
        handleToggleEpisode(mediaInfo.id, mediaInfo.seasonNumber, mediaInfo.episodeNumber, 0, trackedItem, mediaInfo.episodeTitle);
    }
    handleCloseLiveWatch();
  };

  const handleAddLiveItemToList = (mediaInfo: LiveWatchMediaInfo) => {
      setAddToListModalState({ isOpen: true, item: mediaInfo });
  };

  if (window.location.pathname.startsWith('/auth/trakt/callback')) {
      return <TraktCallbackHandler />;
  }
  
  const renderScreen = () => {
    if (selectedPerson) return <ActorDetail personId={selectedPerson} onBack={handleBack} userData={allUserData} onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} />;
    if (selectedShow) return <ShowDetail id={selectedShow.id} mediaType={selectedShow.media_type} onBack={handleBack} watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode} onSaveJournal={handleSaveJournal} trackedLists={{watching, planToWatch, completed, onHold, dropped}} onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={handleSetCustomImage} favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow} onSelectShow={handleSelectShow} onOpenCustomListModal={handleOpenCustomListModal} ratings={ratings} onRateItem={handleRateItem} onMarkMediaAsWatched={handleMarkShowAsWatched} onUnmarkMovieWatched={handleUnmarkMovieWatched} onMarkSeasonWatched={(showId, seasonNumber, showInfo) => handleMarkSeasonWatched(showId, seasonNumber, showInfo, `Season ${seasonNumber}`)} onUnmarkSeasonWatched={handleUnmarkSeasonWatched} onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} onSelectPerson={handleSelectPerson} onStartLiveWatch={handleStartLiveWatch} onDeleteHistoryItem={handleDeleteHistoryItem} onClearMediaHistory={handleClearMediaHistory} episodeRatings={episodeRatings} onRateEpisode={handleRateEpisode} onAddWatchHistory={handleAddWatchHistory} onSaveComment={handleSaveComment} comments={comments} onMarkRemainingWatched={handleMarkRemainingWatched} genres={genres} />;

    switch (activeScreen) {
      case 'home': return <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShowInModal} watchProgress={watchProgress} onToggleEpisode={(...args) => handleToggleEpisode(args[0], args[1], args[2], args[3], watching.find(i => i.id === args[0])!, undefined)} onShortcutNavigate={handleShortcutNavigate} onOpenAddToListModal={handleOpenCustomListModal} setCustomLists={setCustomLists} liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} onLiveWatchTogglePause={handleLiveWatchTogglePause} onLiveWatchStop={handleCloseLiveWatch} onMarkShowAsWatched={handleMarkShowAsWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} />;
      case 'search': return <SearchScreen onSelectShow={handleSelectShow} onSelectPerson={handleSelectPerson} onSelectUser={handleSelectUser} searchHistory={searchHistory} onUpdateSearchHistory={handleUpdateSearchHistory} query={searchQuery} onQueryChange={setSearchQuery} onMarkShowAsWatched={handleMarkShowAsWatched} onOpenAddToListModal={handleOpenCustomListModal} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={handleToggleLikeList} timezone={timezone} />;
      case 'progress': return <ProgressScreen userData={allUserData} onToggleEpisode={(...args) => handleToggleEpisode(args[0], args[1], args[2], args[3], watching.find(i => i.id === args[0])!, undefined)} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} onSelectShow={handleSelectShow} currentUser={currentUser} onAuthClick={onAuthClick} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={handleStartLiveWatch} />;
      case 'profile': return <Profile userData={allUserData} genres={genres} onSelectShow={handleSelectShow} onImportCompleted={handleImportCompleted} onTraktImportCompleted={handleTraktImportCompleted} onToggleEpisode={(...args) => handleToggleEpisode(args[0], args[1], args[2], args[3], watching.find(i => i.id === args[0])!, undefined)} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} setCustomLists={setCustomLists} initialTab={initialProfileTab} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} onDeleteHistoryItem={handleDeleteHistoryItem} onDeleteSearchHistoryItem={handleDeleteSearchHistoryItem} onClearSearchHistory={handleClearSearchHistory} setHistory={setHistory} setWatchProgress={setWatchProgress} setEpisodeRatings={setEpisodeRatings} setFavoriteEpisodes={setFavoriteEpisodes} setTheme={setTheme} customThemes={customThemes} setCustomThemes={setCustomThemes} onLogout={onLogout} onUpdatePassword={onUpdatePassword} onUpdateProfile={onUpdateProfile} currentUser={currentUser} onAuthClick={onAuthClick} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl} setCompleted={setCompleted} follows={follows} privacySettings={privacySettings} setPrivacySettings={setPrivacySettings} onSelectUser={handleSelectUser} timezone={timezone} setTimezone={setTimezone} onRemoveDuplicateHistory={handleRemoveDuplicateHistory} notifications={notifications} onMarkAllRead={handleMarkAllNotificationsRead} onMarkOneRead={handleMarkOneNotificationRead} autoHolidayThemesEnabled={autoHolidayThemesEnabled} setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} holidayAnimationsEnabled={holidayAnimationsEnabled} setHolidayAnimationsEnabled={setHolidayAnimationsEnabled} profileTheme={profileTheme} setProfileTheme={setProfileTheme} textSize={textSize} setTextSize={setTextSize} levelInfo={levelInfo} />;
      case 'calendar': return <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} />;
      default: return <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShowInModal} watchProgress={watchProgress} onToggleEpisode={(...args) => handleToggleEpisode(args[0], args[1], args[2], args[3], watching.find(i => i.id === args[0])!, undefined)} onShortcutNavigate={handleShortcutNavigate} onOpenAddToListModal={handleOpenCustomListModal} setCustomLists={setCustomLists} liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} onLiveWatchTogglePause={handleLiveWatchTogglePause} onLiveWatchStop={handleCloseLiveWatch} onMarkShowAsWatched={handleMarkShowAsWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} />;
    }
  };

  const particleEffectToShow = (holidayInfo.isHoliday && !holidayAnimationsEnabled)
    ? undefined
    : activeTheme.colors.particleEffect;

  const effectForTransition = Array.isArray(transitionEffect) ? transitionEffect[0] : null;

  return (
    <div 
        className="relative min-h-screen font-sans"
        style={{ backgroundImage: activeTheme.colors.bgGradient, backgroundAttachment: 'fixed' }}
    >
      <BackgroundParticleEffects effect={particleEffectToShow} />
      {effectForTransition && holidayAnimationsEnabled && (
        <ThemeTransitionAnimation
            effect={effectForTransition}
            onAnimationEnd={() => setTransitionEffect(null)}
        />
      )}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <ConfirmationContainer />
        <AnimationContainer />
        <Header
          currentUser={currentUser}
          profilePictureUrl={profilePictureUrl}
          onAuthClick={onAuthClick}
          onGoToProfile={() => handleTabPress('profile')}
          onSelectShow={handleSelectShow}
          onGoHome={handleGoHome}
          onMarkShowAsWatched={handleMarkShowAsWatched}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          isOnSearchScreen={activeScreen === 'search'}
          isHoliday={holidayInfo.isHoliday}
          holidayName={holidayInfo.holidayName}
        />
        
        <main className={`flex-grow ${selectedShow || selectedPerson ? '' : 'pt-6'}`}>
          {renderScreen()}
        </main>

        {viewingUserId && <UserProfileModal userId={viewingUserId} currentUser={currentUser!} follows={follows[currentUser?.id || ''] || []} onFollow={handleFollow} onUnfollow={handleUnfollow} onClose={() => setViewingUserId(null)} onToggleLikeList={handleToggleLikeList} />}
        {modalShow && <ShowDetail isModal id={modalShow.id} mediaType={modalShow.media_type} onBack={handleCloseModal} watchProgress={watchProgress} history={history} onToggleEpisode={(...args) => handleToggleEpisode(args[0], args[1], args[2], args[3], allUserData.watching.find(i => i.id === args[0])!, undefined)} onSaveJournal={handleSaveJournal} trackedLists={{watching, planToWatch, completed, onHold, dropped}} onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={handleSetCustomImage} favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow} onSelectShow={handleSelectShowInModal} onOpenCustomListModal={handleOpenCustomListModal} ratings={ratings} onRateItem={handleRateItem} onMarkMediaAsWatched={handleMarkShowAsWatched} onUnmarkMovieWatched={handleUnmarkMovieWatched} onMarkSeasonWatched={(showId, seasonNumber, showInfo) => handleMarkSeasonWatched(showId, seasonNumber, showInfo, `Season ${seasonNumber}`)} onUnmarkSeasonWatched={handleUnmarkSeasonWatched} onMarkPreviousEpisodesWatched={handleMarkPreviousEpisodesWatched} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} onSelectPerson={handleSelectPerson} onStartLiveWatch={handleStartLiveWatch} onDeleteHistoryItem={handleDeleteHistoryItem} onClearMediaHistory={handleClearMediaHistory} episodeRatings={episodeRatings} onRateEpisode={handleRateEpisode} onAddWatchHistory={handleAddWatchHistory} onSaveComment={handleSaveComment} comments={comments} onMarkRemainingWatched={handleMarkRemainingWatched} genres={genres} />}
        <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={handleAddToList} onCreateAndAddToList={handleCreateAndAddToList} onGoToDetails={handleSelectShow} />
        <LiveWatchTracker 
          isOpen={isLiveWatchOpen}
          onClose={handleCloseLiveWatch}
          mediaInfo={liveWatchMedia}
          elapsedSeconds={liveWatchElapsedSeconds}
          isPaused={liveWatchIsPaused}
          onTogglePause={handleLiveWatchTogglePause}
          isMinimized={isLiveWatchMinimized}
          onToggleMinimize={handleToggleMinimize}
          onMarkWatched={handleMarkLiveItemWatched}
          onAddToList={handleAddLiveItemToList}
        />
        <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} timezone={timezone} setTimezone={setTimezone} />
        
        {!selectedShow && !selectedPerson && <BottomTabNavigator activeTab={activeScreen} onTabPress={handleTabPress} />}
      </div>
    </div>
  );
};