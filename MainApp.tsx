import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import AuthModal from './components/AuthModal';
import CompleteProfileModal from './components/CompleteProfileModal';
import { confirmationService } from './services/confirmationService';
import { supabase, uploadCustomMedia, syncJournalEntry, syncRatingRpc, deleteCustomMedia, syncLibraryItemToDb } from './services/supabaseClient';
import { UserData, WatchProgress, HistoryItem, TrackedItem, UserRatings, 
  EpisodeRatings, SeasonRatings, CustomList, AppNotification, FavoriteEpisodes, 
  LiveWatchMediaInfo, SearchHistoryItem, Comment, Note, ProfileTab, 
  WatchStatus, WeeklyPick, DeletedHistoryItem, CustomImagePaths, Reminder, 
  NotificationSettings, ShortcutSettings, NavSettings, AppPreferences, 
  PrivacySettings, ProfileTheme, TmdbMedia, Follows, CustomListItem, DeletedNote, EpisodeProgress, CommentVisibility,
  JournalEntry as JournalEntryType, PendingRecommendationCheck, ReminderType
} from './types';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './screens/ShowDetail';
import { getGenres, clearMediaCache, getMediaDetails, getSeasonDetails } from './services/tmdbService';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import BottomTabNavigator from './navigation/BottomTabNavigator';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import CalendarScreen from './screens/CalendarScreen';
import PersonDetailModal from './components/PersonDetailModal';
import AddToListModal from './components/AddToListModal';
import WelcomeModal from './components/WelcomeModal';
import ConfirmationContainer from './components/ConfirmationContainer';
import AnimationContainer from './components/AnimationContainer';
import LiveWatchTracker from './components/LiveWatchTracker';
import NominatePicksModal from './components/NominatePicksModal';
import { calculateAutoStatus, calculateMovieAutoStatus } from './utils/libraryLogic';
import BackgroundParticleEffects from './components/BackgroundParticleEffects';
import { getAllUsers } from './utils/userUtils';
import AllMediaScreen from './screens/AllMediaScreen';
import { calculateLevelInfo, XP_CONFIG } from './utils/xpUtils';
import { triggerLocalNotification } from './services/pushNotificationService';
import { AIRTIME_OVERRIDES } from './data/airtimeOverrides';

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
}

export const MainApp: React.FC<MainAppProps> = ({ 
    userId, currentUser, onLogout, onUpdatePassword, onUpdateProfile, onAuthClick, 
    onForgotPasswordRequest, onForgotPasswordReset 
}) => {
  const [activeTheme, setTheme, baseThemeId] = useTheme();
  
  const [watching, setWatching] = useLocalStorage<TrackedItem[]>(`watching_list_${userId}`, []);
  const [planToWatch, setPlanToWatch] = useLocalStorage<TrackedItem[]>(`plan_to_watch_list_${userId}`, []);
  const [completed, setCompleted] = useLocalStorage<TrackedItem[]>(`completed_list_${userId}`, []);
  const [onHold, setOnHold] = useLocalStorage<TrackedItem[]>(`on_hold_list_${userId}`, []);
  const [dropped, setDropped] = useLocalStorage<TrackedItem[]>(`dropped_list_${userId}`, []);
  const [allCaughtUp, setAllCaughtUp] = useLocalStorage<TrackedItem[]>(`all_caught_up_list_${userId}`, []);
  const [favorites, setFavorites] = useLocalStorage<TrackedItem[]>(`favorites_list_${userId}`, []);
  const [watchProgress, setWatchProgress] = useLocalStorage<WatchProgress>(`watch_progress_${userId}`, {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>(`history_${userId}`, []);
  const [deletedHistory, setDeletedHistory] = useLocalStorage<DeletedHistoryItem[]>(`deleted_history_${userId}`, []);
  const [deletedNotes, setDeletedNotes] = useLocalStorage<DeletedNote[]>(`deleted_notes_${userId}`, []);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>(`search_history_${userId}`, []);
  const [comments, setComments] = useLocalStorage<Comment[]>(`comments_${userId}`, []);
  const [mediaNotes, setMediaNotes] = useLocalStorage<Record<number, Note[]>>(`media_notes_${userId}`, {});
  const [episodeNotes, setEpisodeNotes] = useLocalStorage<Record<number, Record<number, Record<number, Note[]>>>>(`episode_notes_${userId}`, {});
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>(`custom_image_paths_${userId}`, {});
  const [customEpisodeImages, setCustomEpisodeImages] = useLocalStorage<Record<number, Record<number, Record<number, string>>>>(`custom_episode_images_${userId}`, {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(`notifications_${userId}`, []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_episodes_${userId}`, {});
  const [episodeRatings, setEpisodeRatings] = useLocalStorage<EpisodeRatings>(`episode_ratings_${userId}`, {});
  const [seasonRatings, setSeasonRatings] = useLocalStorage<SeasonRatings>(`season_ratings_${userId}`, {});
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>(`custom_lists_${userId}`, []);
  const [ratings, setRatings] = useLocalStorage<UserRatings>(`user_ratings_${userId}`, {});
  const [profilePictureUrl, setProfilePictureUrl] = useLocalStorage<string | null>(`profilePictureUrl_${userId}`, null);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(`reminders_${userId}`, []);
  const [sentReminders, setSentReminders] = useLocalStorage<string[]>(`sent_reminders_${userId}`, []);
  const [globalPlaceholders, setGlobalPlaceholders] = useLocalStorage<UserData['globalPlaceholders']>(`globalPlaceholders_${userId}`, {});
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(`notification_settings_${userId}`, {
    masterEnabled: true, newEpisodes: true, movieReleases: true, sounds: true, newFollowers: true, listLikes: true, appUpdates: true, importSyncCompleted: true, showWatchedConfirmation: true, showPriorEpisodesPopup: true,
  });
  const [pendingRecommendationChecks, setPendingRecommendationChecks] = useLocalStorage<PendingRecommendationCheck[]>(`pending_rec_checks_${userId}`, []);
  const [failedRecommendationReports, setFailedRecommendationReports] = useLocalStorage<TrackedItem[]>(`failed_rec_reports_${userId}`, []);

  const [manualPresets, setManualPresets] = useLocalStorage<Record<number, WatchStatus>>(`manual_presets_${userId}`, {});

  const [shortcutSettings, setShortcutSettings] = useLocalStorage<ShortcutSettings>(`shortcut_settings_${userId}`, {
    show: true,
    tabs: ['progress', 'history', 'weeklyPicks', 'lists', 'achievements', 'imports', 'settings']
  });
  const [navSettings, setNavSettings] = useLocalStorage<NavSettings>(`nav_settings_${userId}`, {
    tabs: ['home', 'search', 'calendar', 'progress', 'profile'],
    position: 'bottom',
    hoverRevealNav: false,
    hoverRevealHeader: false
  });

  const [preferences, setPreferences] = useLocalStorage<AppPreferences>(`app_preferences_${userId}`, {
    searchAlwaysExpandFilters: false,
    searchShowFilters: true,
    searchShowSeriesInfo: 'expanded',
    searchShowRecentHistory: true,
    dashShowStats: true,
    dashShowLiveWatch: true,
    dashShowContinueWatching: true,
    dashShowUpcoming: true,
    dashShowRecommendations: true,
    dashShowTrending: true,
    dashShowWeeklyGems: true, 
    dashShowWeeklyPicks: true,
    dashShowNewSeasons: true,
    dashShowPlanToWatch: true,
    enableAnimations: true,
    enableSpoilerShield: false,
    showBadgesOnProfile: true,
    tabNavigationStyle: 'scroll',
  });

  const [privacySettings, setPrivacySettings] = useLocalStorage<PrivacySettings>(`privacy_settings_${userId}`, {
    activityVisibility: 'public'
  });
  const [profileTheme, setProfileTheme] = useLocalStorage<ProfileTheme | null>(`profileTheme_${userId}`, null);
  const [textSize, setTextSize] = useLocalStorage<number>(`textSize_${userId}`, 16);
  const [timeFormat, setTimeFormat] = useLocalStorage<'12h' | '24h'>(`timeFormat_${userId}`, '12h');
  const [pin, setPin] = useLocalStorage<string | null>(`pin_${userId}`, null);

  const [pausedLiveSessions, setPausedLiveSessions] = useLocalStorage<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string; startTime?: string; pauseCount?: number }>>(`paused_live_sessions_${userId}`, {});
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');
  const [userXp, setUserXp] = useLocalStorage<number>(`userXp_${userId}`, 0);
  const [showRatings, setShowRatings] = useLocalStorage<boolean>(`showRatings_${userId}`, true);

  const [weeklyFavorites, setWeeklyFavorites] = useLocalStorage<WeeklyPick[]>(`weekly_favorites_${userId}`, []);
  const [weeklyFavoritesWeekKey, setWeeklyFavoritesWeekKey] = useLocalStorage<string>(`weekly_favorites_week_${userId}`, '');
  const [weeklyFavoritesHistory, setWeeklyFavoritesHistory] = useLocalStorage<Record<string, WeeklyPick[]>>(`weekly_favorites_history_${userId}`, {});

  const [blockedUserIds, setBlockedUserIds] = useLocalStorage<string[]>(`blockedUserIds_${userId}`, []);

  const [activeScreen, setActiveScreen] = useState<string>('home');
  const [profileInitialTab, setProfileInitialTab] = useState<ProfileTab | undefined>(undefined);
  const [initialLibraryStatus, setInitialLibraryStatus] = useState<WatchStatus | undefined>(undefined);

  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [liveWatchMedia, setLiveWatchMedia] = useState<LiveWatchMediaInfo | null>(null);
  const [liveWatchElapsedSeconds, setLiveWatchElapsedSeconds] = useState(0);
  const [liveWatchIsPaused, setLiveWatchIsPaused] = useState(false);
  const [liveWatchStartTime, setLiveWatchStartTime] = useState<string | null>(null);
  const [liveWatchPauseCount, setLiveWatchPauseCount] = useState(0);
  const [isLiveWatchMinimized, setIsLiveWatchMinimized] = useState(false);
  const [isLiveWatchOpen, setIsLiveWatchOpen] = useState(false);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [follows, setFollows] = useLocalStorage<Follows>(`follows_${userId}`, {});

  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(!!localStorage.getItem('welcome_dismissed'));

  const [allMediaConfig, setAllMediaConfig] = useState<any>(null);

  const levelInfo = useMemo(() => calculateLevelInfo(userXp), [userXp]);
  const allUsers = useMemo(() => getAllUsers(), []);

  useEffect(() => { getGenres().then(setGenres).catch(console.error); }, []);

  // Ensure mandatory 'watchlist' exists in customLists
  useEffect(() => {
    setCustomLists(prev => {
      const hasWatchlist = prev.some(l => l.id === 'watchlist');
      if (hasWatchlist) return prev;
      
      const defaultWatchlist: CustomList = {
        id: 'watchlist',
        name: 'Watchlist',
        description: 'Your primary catch-all list for movies and shows.',
        items: [],
        createdAt: new Date().toISOString(),
        visibility: 'private',
        likes: []
      };
      return [defaultWatchlist, ...prev];
    });
  }, [userId, setCustomLists]);

  // --- REGISTRY SYNC HANDLER ---
  const updateLists = useCallback(async (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching, planToWatch: setPlanToWatch, completed: setCompleted,
            onHold: setOnHold, dropped: setDropped, allCaughtUp: setAllCaughtUp,
        };
        
        // Remove from all potential lists first
        Object.keys(setters).forEach(key => setters[key](prev => prev.filter(i => i.id !== item.id)));
        
        if (newList && setters[newList]) {
            const stampedItem = { ...item, addedAt: item.addedAt || new Date().toISOString() };
            setters[newList](prev => [stampedItem, ...prev]);
            
            // Cloud Sync to Supabase
            if (currentUser) {
                await syncLibraryItemToDb(currentUser.id, item.id, item.media_type, newList);
            }
            
            if (['planToWatch', 'onHold', 'dropped'].includes(newList)) {
                setManualPresets(prev => ({ ...prev, [item.id]: newList }));
            }
        } else if (newList === null && currentUser) {
            // Explicit Removal from cloud
            await syncLibraryItemToDb(currentUser.id, item.id, item.media_type, null);
        }
        
        if (newList === null) setManualPresets(prev => { const next = { ...prev }; delete next[item.id]; return next; });

        const showName = item.title || (item as any).name || 'Untitled';
        confirmationService.show(newList ? `"${showName}" archived to ${newList}` : `Removed ${showName} from registry`);
    }, [currentUser, setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped, setAllCaughtUp, setManualPresets]);

  const syncLibraryItem = useCallback(async (mediaId: number, mediaType: 'tv' | 'movie', updatedProgress?: WatchProgress, watchActionJustHappened: boolean = false) => {
      try {
          const details = await getMediaDetails(mediaId, mediaType);
          const currentProgress = (updatedProgress || watchProgress)[mediaId] || {};
          let currentManualPreset = manualPresets[mediaId];
          
          if (watchActionJustHappened && (currentManualPreset === 'dropped' || currentManualPreset === 'onHold')) {
              setManualPresets(prev => { const next = { ...prev }; delete next[mediaId]; return next; });
              currentManualPreset = undefined;
          }

          const trackedItem: TrackedItem = {
              id: details.id, title: details.title || details.name || 'Untitled', 
              media_type: mediaType, poster_path: details.poster_path, genre_ids: details.genres?.map(g => g.id),
              release_date: details.release_date || details.first_air_date
          };

          const autoStatus = mediaType === 'tv' 
              ? calculateAutoStatus(details, currentProgress)
              : calculateMovieAutoStatus(mediaId, history, pausedLiveSessions, currentManualPreset);

          let finalStatus: WatchStatus | null = autoStatus;

          if (mediaType === 'tv') {
              let totalWatched = 0;
              Object.values(currentProgress).forEach(s => {
                  Object.values(s).forEach(e => { if ((e as EpisodeProgress).status === 2) totalWatched++; });
              });

              if (totalWatched === 0) {
                  finalStatus = currentManualPreset || 'planToWatch';
              } else {
                  if (currentManualPreset === 'onHold' || currentManualPreset === 'dropped') {
                      finalStatus = currentManualPreset;
                  } else {
                      finalStatus = autoStatus;
                  }
              }
          }

          updateLists(trackedItem, null, finalStatus);
      } catch (e) { console.error("Library sync failure:", e); }
  }, [watchProgress, history, manualPresets, updateLists, setManualPresets, pausedLiveSessions]);

  const handleMarkMovieAsWatched = useCallback(async (item: any, date?: string, isLive: boolean = false) => {
      const timestamp = date || new Date().toISOString();
      const showInfo: TrackedItem = { 
        id: item.id, title: item.title || item.name || 'Untitled', 
        media_type: 'movie', poster_path: item.poster_path 
      };
      const prefix = isLive ? 'live-watch-movie-' : 'movie-';
      const logItem: HistoryItem = { 
        ...showInfo, logId: `${prefix}${item.id}-${Date.now()}`, 
        timestamp, addedAt: timestamp 
      };
      setHistory(prev => [logItem, ...prev]);
      setUserXp(prev => prev + XP_CONFIG.movie);
      // Fixed stale closure by using local copy if needed, but here we trigger a sync
      setTimeout(() => syncLibraryItem(item.id, 'movie'), 50);
  }, [setHistory, setUserXp, syncLibraryItem]);

  const handleToggleEpisode = useCallback(async (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null, isLive: boolean = false) => {
    const newStatus = currentStatus === 2 ? 0 : 2;
    let nextProgress: WatchProgress;
    
    setWatchProgress(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][episode] = { ...next[showId][season][episode], status: newStatus as 0 | 1 | 2 };
        nextProgress = next; 
        return next;
    });

    if (newStatus === 2) {
        const endTime = new Date().toISOString();
        const historyTitle = showInfo.title || (showInfo as any).name || 'Untitled';
        const prefix = isLive ? 'live-watch-tv-' : 'tv-';
        const logIdSuffix = Date.now();
        const logItem = {
            ...showInfo, 
            title: historyTitle,
            logId: `${prefix}${showId}-${season}-${episode}-${logIdSuffix}`, 
            timestamp: endTime,
            seasonNumber: season, episodeNumber: episode, episodeTitle: episodeName,
            episodeStillPath, seasonPosterPath, startTime: liveWatchStartTime || undefined,
            endTime: endTime, pauseCount: liveWatchPauseCount || undefined
        };
        setHistory(prev => [logItem, ...prev]);
        setUserXp(prev => prev + XP_CONFIG.episode);
    } else {
        setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === season && h.episodeNumber === episode)));
    }
    
    // Use timeout to allow setWatchProgress to propagate or use nextProgress copy
    setTimeout(() => syncLibraryItem(showId, 'tv', nextProgress, true), 50);
  }, [setWatchProgress, setHistory, setUserXp, syncLibraryItem, liveWatchStartTime, liveWatchPauseCount]);

  const handleLiveWatchComplete = useCallback((mediaInfo: LiveWatchMediaInfo) => {
    if (mediaInfo.media_type === 'movie') {
      handleMarkMovieAsWatched(mediaInfo, undefined, true);
    } else {
      handleToggleEpisode(
        mediaInfo.id, 
        mediaInfo.seasonNumber || 1, 
        mediaInfo.episodeNumber || 1, 
        0, 
        { id: mediaInfo.id, title: mediaInfo.title, media_type: 'tv', poster_path: mediaInfo.poster_path },
        mediaInfo.episodeTitle,
        undefined,
        undefined,
        true // isLive
      );
    }
    
    setLiveWatchMedia(null);
    setLiveWatchElapsedSeconds(0);
    setIsLiveWatchOpen(false);
    
    setPausedLiveSessions(prev => {
        const next = { ...prev };
        delete next[mediaInfo.id];
        return next;
    });

    confirmationService.show(`"${mediaInfo.title}" archived as Live Watch!`);
  }, [handleMarkMovieAsWatched, handleToggleEpisode, setPausedLiveSessions]);

  const handleStartLiveWatch = useCallback((mediaInfo: LiveWatchMediaInfo) => {
      const paused = pausedLiveSessions[mediaInfo.id];
      if (paused) {
          setLiveWatchMedia(paused.mediaInfo);
          setLiveWatchElapsedSeconds(paused.elapsedSeconds);
          setLiveWatchStartTime(paused.startTime || new Date().toISOString());
          setLiveWatchPauseCount(paused.pauseCount || 0);
          setPausedLiveSessions(prev => {
              const next = { ...prev };
              delete next[mediaInfo.id];
              return next;
          });
      } else {
          setLiveWatchMedia(mediaInfo);
          setLiveWatchElapsedSeconds(0);
          setLiveWatchStartTime(new Date().toISOString());
          setLiveWatchPauseCount(0);
      }
      setLiveWatchIsPaused(false);
      setIsLiveWatchOpen(true);
      setIsLiveWatchMinimized(false);
  }, [pausedLiveSessions, setPausedLiveSessions]);

  const handleLiveWatchTogglePause = useCallback(() => {
      setLiveWatchIsPaused(prev => {
          if (!prev) setLiveWatchPauseCount(c => c + 1);
          return !prev;
      });
  }, []);

  const handleLiveWatchDelete = useCallback(() => {
      if (liveWatchMedia && window.confirm("Discard this active live session?")) {
          setLiveWatchMedia(null);
          setIsLiveWatchOpen(false);
      }
  }, [liveWatchMedia]);

  /* // FIX: Implemented missing handler functions to resolve numerous "Cannot find name" errors. */
  const handleSelectShow = useCallback((id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
  }, []);

  const handleToggleFavoriteShow = useCallback((item: TrackedItem) => {
    setFavorites(prev => {
      const isFav = prev.some(f => f.id === item.id);
      if (isFav) {
        confirmationService.show(`"${item.title}" removed from Favorites`);
        return prev.filter(f => f.id !== item.id);
      } else {
        confirmationService.show(`"${item.title}" added to Favorites`);
        return [...prev, item];
      }
    });
  }, [setFavorites]);

  const handleToggleReminder = useCallback((newReminder: Reminder | null, reminderId: string) => {
    if (newReminder) {
      setReminders(prev => [...prev.filter(r => r.id !== reminderId), newReminder]);
      confirmationService.show("Registry Alert Armed.");
    } else {
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      confirmationService.show("Registry Alert Disarmed.");
    }
  }, [setReminders]);

  const handleToggleWeeklyFavorite = useCallback((pick: WeeklyPick, replacementId?: number) => {
    setWeeklyFavorites(prev => {
      if (replacementId) {
        return [...prev.filter(p => p.id !== replacementId), pick];
      }
      const exists = prev.find(p => p.id === pick.id && p.category === pick.category && p.dayIndex === pick.dayIndex && p.episodeNumber === pick.episodeNumber);
      if (exists) {
        return prev.filter(p => p !== exists);
      }
      return [...prev, pick];
    });
    confirmationService.show("Weekly nomination updated.");
  }, [setWeeklyFavorites]);

  const handleToggleFavoriteEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number) => {
    setFavoriteEpisodes(prev => {
      const next = { ...prev };
      if (!next[showId]) next[showId] = {};
      if (!next[showId][seasonNumber]) next[showId][seasonNumber] = {};
      next[showId][seasonNumber][episodeNumber] = !next[showId][seasonNumber][episodeNumber];
      return next;
    });
  }, [setFavoriteEpisodes]);

  const handleRateEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number, rating: number) => {
    setEpisodeRatings(prev => {
      const next = { ...prev };
      if (!next[showId]) next[showId] = {};
      if (!next[showId][seasonNumber]) next[showId][seasonNumber] = {};
      next[showId][seasonNumber][episodeNumber] = rating;
      return next;
    });
  }, [setEpisodeRatings]);

  const handleAddWatchHistory = useCallback((item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => {
    const logItem: HistoryItem = {
      ...item,
      logId: `log-${item.id}-${Date.now()}`,
      timestamp: timestamp || new Date().toISOString(),
      seasonNumber,
      episodeNumber,
      episodeTitle: episodeName,
      note
    };
    setHistory(prev => [logItem, ...prev]);
    confirmationService.show("Event logged to registry.");
  }, [setHistory]);

  const onUpdateSearchHistory = useCallback((queryOrItem: string | TrackedItem) => {
    setSearchHistory(prev => {
      const newItem: SearchHistoryItem = typeof queryOrItem === 'string' 
        ? { query: queryOrItem, timestamp: new Date().toISOString() }
        : { item: queryOrItem, timestamp: new Date().toISOString() };
      
      const filtered = prev.filter(h => {
        if (typeof queryOrItem === 'string') return h.query !== queryOrItem;
        return h.item?.id !== queryOrItem.id;
      });
      
      return [newItem, ...filtered].slice(0, 20);
    });
  }, [setSearchHistory]);

  const handleDeleteHistoryItem = useCallback((item: HistoryItem) => {
    setHistory(prev => prev.filter(h => h.logId !== item.logId));
    setDeletedHistory(prev => [{ ...item, deletedAt: new Date().toISOString() }, ...prev]);
    confirmationService.show("Log moved to trash.");
  }, [setHistory, setDeletedHistory]);

  const handleSetCustomImage = useCallback(async (mediaId: number, type: 'poster' | 'backdrop', path: string | File) => {
    let finalPath = '';
    if (path instanceof File) {
      if (!currentUser) {
        confirmationService.show("Login required for cloud uploads.");
        return;
      }
      try {
        finalPath = await uploadCustomMedia(currentUser.id, mediaId, type, path);
      } catch (e) {
        console.error(e);
        alert("Upload failed.");
        return;
      }
    } else {
      finalPath = path;
    }

    setCustomImagePaths(prev => {
      const next = { ...prev };
      if (!next[mediaId]) next[mediaId] = { gallery: [] };
      if (type === 'poster') next[mediaId].poster_path = finalPath;
      else next[mediaId].backdrop_path = finalPath;
      
      if (!next[mediaId].gallery.includes(finalPath)) {
        next[mediaId].gallery = [finalPath, ...next[mediaId].gallery];
      }
      return next;
    });
    confirmationService.show("Visual identity updated.");
  }, [currentUser, setCustomImagePaths]);

  const handleRemoveCustomImage = useCallback(async (mediaId: number, url: string) => {
    if (currentUser && url.includes('supabase')) {
      try {
        await deleteCustomMedia(currentUser.id, mediaId, url);
      } catch (e) {
        console.error("Failed to delete custom media from cloud", e);
      }
    }
    setCustomImagePaths(prev => {
      const next = { ...prev };
      if (next[mediaId]) {
        next[mediaId].gallery = next[mediaId].gallery.filter(u => u !== url);
        if (next[mediaId].poster_path === url) delete next[mediaId].poster_path;
        if (next[mediaId].backdrop_path === url) delete next[mediaId].backdrop_path;
      }
      return next;
    });
  }, [currentUser, setCustomImagePaths]);

  const handleResetCustomImage = useCallback((mediaId: number, type: 'poster' | 'backdrop') => {
    setCustomImagePaths(prev => {
      const next = { ...prev };
      if (next[mediaId]) {
        if (type === 'poster') delete next[mediaId].poster_path;
        else delete next[mediaId].backdrop_path;
      }
      return next;
    });
  }, [setCustomImagePaths]);

  const handleRateItem = useCallback((mediaId: number, rating: number) => {
    const timestamp = new Date().toISOString();
    setRatings(prev => ({
      ...prev,
      [mediaId]: { rating, date: timestamp }
    }));
    if (currentUser) {
      syncRatingRpc(mediaId, 'movie', rating); 
    }
    confirmationService.show(rating > 0 ? `Rated ${rating}/10` : "Rating removed");
  }, [currentUser, setRatings]);

  const handleUnmarkMovieWatched = useCallback((mediaId: number) => {
    setHistory(prev => prev.filter(h => h.id !== mediaId || h.logId.startsWith('live-')));
    setTimeout(() => syncLibraryItem(mediaId, 'movie'), 50);
  }, [setHistory, syncLibraryItem]);

  const handleAddToList = useCallback((listId: string, item: CustomListItem) => {
    setCustomLists(prev => prev.map(l => {
      if (l.id === listId) {
        const alreadyIn = l.items.some(i => i.id === item.id);
        if (alreadyIn) return l;
        return { ...l, items: [item, ...l.items] };
      }
      return l;
    }));
    confirmationService.show(`"${item.title}" added to list`);
  }, [setCustomLists]);

  const handleCreateAndAddToList = useCallback((listName: string, item: CustomListItem) => {
    const newList: CustomList = {
      id: `cl-${Date.now()}`,
      name: listName,
      description: '',
      items: [item],
      createdAt: new Date().toISOString(),
      visibility: 'public',
      likes: []
    };
    setCustomLists(prev => [newList, ...prev]);
    confirmationService.show(`List "${listName}" created with "${item.title}"`);
  }, [setCustomLists]);

  // --- Live Watch Timer & Auto-Completion ---
  useEffect(() => {
    let timer: number;
    if (liveWatchMedia && !liveWatchIsPaused) {
      timer = window.setInterval(() => {
        setLiveWatchElapsedSeconds(prev => {
          const next = prev + 1;
          const runtimeSeconds = liveWatchMedia.runtime * 60;
          
          if (next >= runtimeSeconds) {
            handleLiveWatchComplete(liveWatchMedia);
            return next;
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [liveWatchMedia, liveWatchIsPaused, handleLiveWatchComplete]);

  const allUserData: UserData = useMemo(() => ({
    watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites,
    watchProgress, history, deletedHistory, deletedNotes, customLists,
    ratings, episodeRatings, seasonRatings, favoriteEpisodes, searchHistory,
    comments, mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory,
    customEpisodeImages, customImagePaths, globalPlaceholders, timezone, timeFormat,
    blockedUserIds, pendingRecommendationChecks, failedRecommendationReports
  }), [
    watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites,
    watchProgress, history, deletedHistory, deletedNotes, customLists,
    ratings, episodeRatings, seasonRatings, favoriteEpisodes, searchHistory,
    comments, mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory,
    customEpisodeImages, customImagePaths, globalPlaceholders, timezone, timeFormat,
    blockedUserIds, pendingRecommendationChecks, failedRecommendationReports
  ]);

  const trackedLists = useMemo(() => ({
      watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites
  }), [watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites]);

  const activeStandardStatus = useMemo(() => {
    if (!addToListModalState.item) return null;
    const id = addToListModalState.item.id;
    if (watching.some(i => i.id === id)) return 'watching';
    if (planToWatch.some(i => i.id === id)) return 'planToWatch';
    if (completed.some(i => i.id === id)) return 'completed';
    if (onHold.some(i => i.id === id)) return 'onHold';
    if (dropped.some(i => i.id === id)) return 'dropped';
    if (allCaughtUp.some(i => i.id === id)) return 'allCaughtUp';
    return null;
  }, [addToListModalState.item, watching, planToWatch, completed, onHold, dropped, allCaughtUp]);

  const handleOpenFullList = (config: any) => {
      setAllMediaConfig(config);
      window.scrollTo(0, 0);
  };

  return (
    <div className={`min-h-screen ${activeTheme.base} transition-colors duration-500 pb-20`}>
        <BackgroundParticleEffects effect={activeTheme.colors.particleEffect} enabled={true} />
        
        <Header 
            currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} 
            onGoToProfile={() => setActiveScreen('profile')} onGoHome={() => setActiveScreen('home')} 
            onSelectShow={handleSelectShow} onMarkShowAsWatched={handleMarkMovieAsWatched} 
            query={headerSearchQuery} onQueryChange={setHeaderSearchQuery} isHoliday={false} holidayName={null} 
            isOnSearchScreen={activeScreen === 'search'}
        />

        <main className="container mx-auto pt-16 md:pt-20 relative z-10">
            {activeScreen === 'home' && (
                <Dashboard 
                    userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow} 
                    watchProgress={watchProgress} onToggleEpisode={handleToggleEpisode} 
                    onShortcutNavigate={(tabId) => { 
                        if (tabId === 'allNewReleases') handleOpenFullList({ title: 'New Movie Releases', initialMediaType: 'movie', initialGenreId: null, initialSortBy: 'popularity.desc', voteCountGte: 10, showMediaTypeToggle: false });
                        else if (tabId === 'allNewlyPopularEpisodes') handleOpenFullList({ title: 'Recently Aired Episodes', initialMediaType: 'tv', initialGenreId: null, initialSortBy: 'first_air_date.desc', voteCountGte: 5, showMediaTypeToggle: false });
                        else if (tabId === 'allTrendingTV') handleOpenFullList({ title: 'Trending Series', initialMediaType: 'tv', initialGenreId: null, initialSortBy: 'popularity.desc', voteCountGte: 100, showMediaTypeToggle: false });
                        else if (tabId === 'allTrendingMovies') handleOpenFullList({ title: 'Trending Films', initialMediaType: 'movie', initialGenreId: null, initialSortBy: 'popularity.desc', voteCountGte: 100, showMediaTypeToggle: false });
                        else if (tabId === 'allTopRated') handleOpenFullList({ title: 'Top Action & Adventure', initialMediaType: 'movie', initialGenreId: '28|12', initialSortBy: 'vote_average.desc', voteCountGte: 300, showMediaTypeToggle: true });
                        else if (tabId === 'allBingeWorthy') handleOpenFullList({ title: 'Binge-Worthy Dramas', initialMediaType: 'tv', initialGenreId: 18, initialSortBy: 'popularity.desc', voteCountGte: 100, showMediaTypeToggle: true });
                        else if (tabId === 'allHiddenGems') handleOpenFullList({ title: 'Hidden Gems Archive', initialMediaType: 'movie', initialGenreId: null, initialSortBy: 'vote_average.desc', voteCountGte: 20, voteCountLte: 400, showMediaTypeToggle: true });
                        else if (tabId === 'allWesterns') handleOpenFullList({ title: 'Western Registry', initialMediaType: 'movie', initialGenreId: 37, initialSortBy: 'popularity.desc', voteCountGte: 10, showMediaTypeToggle: true });
                        else { setActiveScreen('profile'); setProfileInitialTab(tabId as ProfileTab); }
                    }} 
                    onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} setCustomLists={setCustomLists} 
                    liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} 
                    onLiveWatchTogglePause={handleLiveWatchTogglePause} onLiveWatchStop={() => setIsLiveWatchOpen(false)} 
                    onMarkShowAsWatched={handleLiveWatchComplete} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} 
                    pausedLiveSessions={pausedLiveSessions} setPausedLiveSessions={setPausedLiveSessions} timezone={timezone} genres={genres} timeFormat={timeFormat} reminders={reminders} 
                    onToggleReminder={handleToggleReminder} 
                    onUpdateLists={updateLists} shortcutSettings={shortcutSettings} preferences={preferences} 
                    onRemoveWeeklyPick={handleToggleWeeklyFavorite} 
                    onOpenNominateModal={() => setIsNominateModalOpen(true)}
                    showRatings={showRatings}
                    onStartLiveWatch={handleStartLiveWatch}
                    onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
                    onRateEpisode={handleRateEpisode}
                    onToggleWeeklyFavorite={handleToggleWeeklyFavorite}
                    onSaveJournal={(id, s, e, entry) => {
                        setWatchProgress(prev => {
                            const next = { ...prev };
                            if (!next[id]) next[id] = {};
                            if (!next[id][s]) next[id][s] = {};
                            next[id][s][e] = { ...next[id][s][e], journal: entry || undefined };
                            return next;
                        });
                        if (currentUser) syncJournalEntry(currentUser.id, id, s, e, entry);
                    }}
                    onAddWatchHistory={handleAddWatchHistory}
                />
            )}
            {activeScreen === 'search' && <SearchScreen {...allUserData} onSelectShow={handleSelectShow} onSelectPerson={setSelectedPerson} onSelectUser={setSelectedUserId} searchHistory={searchHistory} onUpdateSearchHistory={onUpdateSearchHistory} onDeleteSearchHistoryItem={(t) => setSearchHistory(prev => prev.filter(h => h.timestamp !== t))} onClearSearchHistory={() => setSearchHistory([])} query={headerSearchQuery} onQueryChange={setHeaderSearchQuery} onMarkShowAsWatched={handleMarkMovieAsWatched} onOpenAddToListModal={(i) => setAddToListModalState({ isOpen: true, item: i })} onMarkPreviousEpisodesWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings} preferences={preferences} />}
            {activeScreen === 'calendar' && <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} timeFormat={timeFormat} reminders={reminders} onToggleReminder={handleToggleReminder} onToggleEpisode={handleToggleEpisode} watchProgress={watchProgress} />}
            {activeScreen === 'progress' && (
                <ProgressScreen 
                    userData={allUserData}
                    onToggleEpisode={handleToggleEpisode} 
                    onUpdateLists={updateLists} 
                    favoriteEpisodes={favoriteEpisodes} 
                    onToggleFavoriteEpisode={handleToggleFavoriteEpisode} 
                    onSelectShow={handleSelectShow} 
                    currentUser={currentUser} 
                    onAuthClick={onAuthClick} 
                    pausedLiveSessions={pausedLiveSessions} 
                    onStartLiveWatch={handleStartLiveWatch} 
                    preferences={preferences} 
                    onSaveJournal={(id, s, e, entry) => {
                        setWatchProgress(prev => {
                            const next = { ...prev };
                            if (!next[id]) next[id] = {};
                            if (!next[id][s]) next[id][s] = {};
                            next[id][s][e] = { ...next[id][s][e], journal: entry || undefined };
                            return next;
                        });
                        if (currentUser) syncJournalEntry(currentUser.id, id, s, e, entry);
                    }}
                    onAddWatchHistory={handleAddWatchHistory}
                />
            )}
            {activeScreen === 'profile' && (
              <Profile 
                userData={allUserData}
                genres={genres}
                onSelectShow={handleSelectShow}
                onImportCompleted={() => {}}
                onTraktImportCompleted={() => {}}
                onTmdbImportCompleted={() => {}}
                onJsonImportCompleted={() => {}}
                onToggleEpisode={handleToggleEpisode}
                onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
                setCustomLists={setCustomLists}
                initialTab={profileInitialTab}
                initialLibraryStatus={initialLibraryStatus}
                notificationSettings={notificationSettings}
                setNotificationSettings={setNotificationSettings}
                onDeleteHistoryItem={handleDeleteHistoryItem}
                onDeleteSearchHistoryItem={(t) => setSearchHistory(prev => prev.filter(h => h.timestamp !== t))}
                onClearSearchHistory={() => setSearchHistory([])}
                setHistory={setHistory}
                setWatchProgress={setWatchProgress}
                setEpisodeRatings={setEpisodeRatings}
                setFavoriteEpisodes={setFavoriteEpisodes}
                setTheme={setTheme}
                baseThemeId={baseThemeId}
                onLogout={onLogout}
                onUpdatePassword={onUpdatePassword}
                onUpdateProfile={onUpdateProfile}
                currentUser={currentUser}
                onAuthClick={onAuthClick}
                onForgotPasswordRequest={onForgotPasswordRequest}
                onForgotPasswordReset={onForgotPasswordReset}
                profilePictureUrl={profilePictureUrl}
                setProfilePictureUrl={setProfilePictureUrl}
                setCompleted={setCompleted}
                follows={follows}
                privacySettings={privacySettings}
                setPrivacySettings={setPrivacySettings}
                onSelectUser={setSelectedUserId}
                timezone={timezone}
                setTimezone={setTimezone}
                onRemoveDuplicateHistory={() => {}}
                notifications={notifications}
                onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                onMarkOneRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                onDeleteNotification={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
                onAddWatchHistory={handleAddWatchHistory}
                onAddNotifications={(notifs) => setNotifications(prev => [...notifs, ...prev].slice(0, 50))}
                profileTheme={profileTheme}
                setProfileTheme={setProfileTheme}
                textSize={textSize}
                setTextSize={setTextSize}
                onFeedbackSubmit={() => {}}
                levelInfo={levelInfo}
                timeFormat={timeFormat}
                setTimeFormat={setTimeFormat}
                pin={pin}
                setPin={setPin}
                showRatings={showRatings}
                setShowRatings={setShowRatings}
                setSeasonRatings={setSeasonRatings}
                onToggleWeeklyFavorite={handleToggleWeeklyFavorite}
                onOpenNominateModal={() => setIsNominateModalOpen(true)}
                pausedLiveSessions={pausedLiveSessions}
                onStartLiveWatch={handleStartLiveWatch}
                shortcutSettings={shortcutSettings}
                setShortcutSettings={setShortcutSettings}
                navSettings={navSettings}
                setNavSettings={setNavSettings}
                preferences={preferences}
                setPreferences={setPreferences}
                onPermanentDeleteHistoryItem={() => {}}
                onRestoreHistoryItem={() => {}}
                onClearAllDeletedHistory={() => {}}
                onPermanentDeleteNote={() => {}}
                onRestoreNote={() => {}}
                onUpdateLists={updateLists}
                favoriteEpisodes={favoriteEpisodes}
                setPendingRecommendationChecks={setPendingRecommendationChecks}
                setFailedRecommendationReports={setFailedRecommendationReports}
              />
            )}
        </main>
        
        {allMediaConfig && (
            <div className="fixed inset-0 z-[800] bg-bg-primary overflow-y-auto pt-16 md:pt-20">
                <AllMediaScreen {...allMediaConfig} onBack={() => setAllMediaConfig(null)} onSelectShow={handleSelectShow} onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} onMarkShowAsWatched={handleMarkMovieAsWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} completed={completed} genres={genres} showRatings={showRatings} preferences={preferences} userData={allUserData} />
            </div>
        )}

        {selectedShow && (
            <div className="fixed inset-0 z-[800] bg-bg-primary overflow-y-auto pt-16 md:pt-20">
                <ShowDetail id={selectedShow.id} mediaType={selectedShow.media_type} onBack={() => setSelectedShow(null)} watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode} onSaveJournal={(id, s, e, entry) => {
                    setWatchProgress(prev => {
                        const next = { ...prev };
                        if (!next[id]) next[id] = {};
                        if (!next[id][s]) next[id][s] = {};
                        next[id][s][e] = { ...next[id][s][e], journal: entry || undefined };
                        return next;
                    });
                    if (currentUser) syncJournalEntry(currentUser.id, id, s, e, entry);
                }} trackedLists={trackedLists} onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={handleSetCustomImage} onRemoveCustomImage={handleRemoveCustomImage} onResetCustomImage={handleResetCustomImage} favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow} weeklyFavorites={weeklyFavorites} onToggleWeeklyFavorite={handleToggleWeeklyFavorite} onSelectShow={handleSelectShow} onOpenCustomListModal={() => {}} ratings={ratings} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} onRateItem={handleRateItem} onMarkMediaAsWatched={handleMarkMovieAsWatched} onUnmarkMovieWatched={handleUnmarkMovieWatched} onMarkSeasonWatched={() => {}} onUnmarkSeasonWatched={() => {}} onMarkPreviousEpisodesWatched={() => {}} favoriteEpisodes={favoriteEpisodes} onSelectPerson={setSelectedPerson} onSelectShowInModal={handleSelectShow} onStartLiveWatch={handleStartLiveWatch} onDeleteHistoryItem={handleDeleteHistoryItem} onAddWatchHistory={handleAddWatchHistory} onDeleteSearchHistoryItem={() => {}} onClearSearchHistory={() => {}} onAddWatchHistoryBulk={() => {}} onSaveComment={() => {}} comments={comments} genres={genres} onMarkAllWatched={() => {}} onUnmarkAllWatched={() => {}} onSaveEpisodeNote={() => {}} showRatings={showRatings} seasonRatings={seasonRatings} onRateSeason={() => {}} onRateEpisode={handleRateEpisode} customLists={customLists} currentUser={currentUser} allUsers={allUsers} mediaNotes={mediaNotes} onSaveMediaNote={() => {}} allUserData={allUserData} episodeNotes={episodeNotes} onOpenAddToListModal={(i) => setAddToListModalState({ isOpen: true, item: i })} preferences={preferences} follows={follows} pausedLiveSessions={pausedLiveSessions} onAuthClick={onAuthClick} onNoteDeleted={() => {}} onSetCustomEpisodeImage={() => {}} onClearMediaHistory={() => {}} reminders={reminders} onToggleReminder={handleToggleReminder} episodeRatings={episodeRatings} pendingRecommendationChecks={pendingRecommendationChecks} setPendingRecommendationChecks={setPendingRecommendationChecks} />
            </div>
        )}
        
        <PersonDetailModal isOpen={!!selectedPerson} onClose={() => setSelectedPerson(null)} personId={selectedPerson} userData={allUserData} onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} onToggleWeeklyFavorite={handleToggleWeeklyFavorite} weeklyFavorites={weeklyFavorites} />
        <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={handleAddToList} onCreateAndAddToList={handleCreateAndAddToList} onGoToDetails={handleSelectShow} onUpdateLists={updateLists} activeStandardStatus={activeStandardStatus} />
        <NominatePicksModal isOpen={isNominateModalOpen} onClose={() => setIsNominateModalOpen(false)} userData={allUserData} currentPicks={weeklyFavorites} onNominate={handleToggleWeeklyFavorite} onRemovePick={handleToggleWeeklyFavorite} />
        <WelcomeModal isOpen={!isWelcomeDismissed} onClose={() => { setIsWelcomeDismissed(true); localStorage.setItem('welcome_dismissed', 'true'); }} timezone={timezone} setTimezone={setTimezone} timeFormat={timeFormat} setTimeFormat={setTimeFormat} />
        
        <LiveWatchTracker isOpen={isLiveWatchOpen} onClose={() => setIsLiveWatchOpen(false)} onDiscard={handleLiveWatchDelete} mediaInfo={liveWatchMedia} elapsedSeconds={liveWatchElapsedSeconds} isPaused={liveWatchIsPaused} onTogglePause={handleLiveWatchTogglePause} isMinimized={isLiveWatchMinimized} onToggleMinimize={() => setIsLiveWatchMinimized(!isLiveWatchMinimized)} onMarkWatched={() => { if (liveWatchMedia) handleLiveWatchComplete(liveWatchMedia); }} onAddToList={() => { if (liveWatchMedia) setAddToListModalState({ isOpen: true, item: liveWatchMedia as any }); }} />
        <BottomTabNavigator activeTab={activeScreen} onTabPress={(tab) => { if (tab !== 'progress' && [].includes(tab)) { setActiveScreen('profile'); setProfileInitialTab(tab as ProfileTab); } else { setActiveScreen(tab); setProfileInitialTab(undefined); } setSelectedShow(null); setSelectedPerson(null); setSelectedUserId(null); setAllMediaConfig(null); }} profilePictureUrl={profilePictureUrl} navSettings={navSettings} />
        <ConfirmationContainer />
        <AnimationContainer />
    </div>
  );
};
