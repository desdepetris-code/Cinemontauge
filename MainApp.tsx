import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { UserData, WatchProgress, HistoryItem, TrackedItem, UserRatings, 
  EpisodeRatings, SeasonRatings, CustomList, AppNotification, FavoriteEpisodes, 
  LiveWatchMediaInfo, SearchHistoryItem, Comment, Note, ProfileTab, 
  WatchStatus, WeeklyPick, DeletedHistoryItem, CustomImagePaths, Reminder, 
  NotificationSettings, ShortcutSettings, NavSettings, AppPreferences, 
  PrivacySettings, ProfileTheme, TmdbMedia, Follows, CustomListItem, DeletedNote, EpisodeProgress, CommentVisibility,
  JournalEntry, PendingRecommendationCheck
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
import { confirmationService } from './services/confirmationService';
import { supabase, uploadCustomMedia, syncJournalEntry, syncRatingRpc, deleteCustomMedia } from './services/supabaseClient';
import AnimationContainer from './components/AnimationContainer';
import LiveWatchTracker from './components/LiveWatchTracker';
import NominatePicksModal from './components/NominatePicksModal';
import { calculateAutoStatus, calculateMovieAutoStatus } from './utils/libraryLogic';
import BackgroundParticleEffects from './components/BackgroundParticleEffects';
import { getAllUsers } from './utils/userUtils';
import AllMediaScreen from './screens/AllMediaScreen';
import { calculateLevelInfo, XP_CONFIG } from './utils/xpUtils';

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
  const [activeTheme, setTheme, baseThemeId, autoHolidayEnabled, setAutoHolidayEnabled] = useTheme();
  
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
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [follows, setFollows] = useLocalStorage<Follows>(`follows_${userId}`, {});

  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(!!localStorage.getItem('welcome_dismissed'));

  const [allMediaConfig, setAllMediaConfig] = useState<any>(null);

  const isSyncingRef = useRef(false);

  const levelInfo = useMemo(() => calculateLevelInfo(userXp), [userXp]);
  const allUsers = useMemo(() => getAllUsers(), []);

  useEffect(() => { getGenres().then(setGenres).catch(console.error); }, []);

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (allMediaConfig) { setAllMediaConfig(null); window.history.pushState({ app: 'sceneit' }, ''); return; }
    if (selectedShow || selectedPerson || selectedUserId) {
      setSelectedShow(null); setSelectedPerson(null); setSelectedUserId(null);
      window.history.pushState({ app: 'sceneit' }, ''); return;
    }
    if (activeScreen !== 'home') {
      setActiveScreen('home'); window.history.pushState({ app: 'sceneit' }, ''); return;
    }
    window.history.back();
  }, [selectedShow, selectedPerson, selectedUserId, activeScreen, allMediaConfig]);

  useEffect(() => {
    window.history.pushState({ app: 'sceneit' }, '');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [handlePopState]);

  const onUpdateSearchHistory = useCallback((queryOrItem: string | TrackedItem) => {
    setSearchHistory(prev => {
        const timestamp = new Date().toISOString();
        let newItem: SearchHistoryItem;
        if (typeof queryOrItem === 'string') newItem = { query: queryOrItem, timestamp };
        else newItem = { item: queryOrItem, timestamp };
        const filtered = prev.filter(h => {
            if (newItem.query) return h.query !== newItem.query;
            if (newItem.item) return h.item?.id !== newItem.item.id;
            return true;
        });
        return [newItem, ...filtered].slice(0, 20);
    });
  }, [setSearchHistory]);

  const updateLists = useCallback(async (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching, planToWatch: setPlanToWatch, completed: setCompleted,
            onHold: setOnHold, dropped: setDropped, allCaughtUp: setAllCaughtUp,
        };
        Object.keys(setters).forEach(key => setters[key](prev => prev.filter(i => i.id !== item.id)));
        
        if (newList && setters[newList]) {
            const stampedItem = { ...item, addedAt: item.addedAt || new Date().toISOString() };
            setters[newList](prev => [stampedItem, ...prev]);
            if (['planToWatch', 'onHold', 'dropped'].includes(newList)) {
                setManualPresets(prev => ({ ...prev, [item.id]: newList }));
            }
        }
        if (newList === null) setManualPresets(prev => { const next = { ...prev }; delete next[item.id]; return next; });

        const showName = item.title || (item as any).name || 'Untitled';
        confirmationService.show(newList ? `"${showName}" added to ${newList}` : `Removed ${showName}`);
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped, setAllCaughtUp, setManualPresets]);

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

          if (mediaType === 'movie') {
              const autoStatus = calculateMovieAutoStatus(mediaId, history, pausedLiveSessions, currentManualPreset);
              updateLists(trackedItem, null, autoStatus);
              return;
          }

          const autoStatus = calculateAutoStatus(details, currentProgress);
          let totalWatched = 0;
          Object.values(currentProgress).forEach(s => {
              Object.values(s).forEach(e => { if ((e as EpisodeProgress).status === 2) totalWatched++; });
          });

          updateLists(trackedItem, null, totalWatched === 0 ? (currentManualPreset || null) : (currentManualPreset || autoStatus));
      } catch (e) { console.error(e); }
  }, [watchProgress, history, manualPresets, updateLists, setManualPresets, pausedLiveSessions]);

  const handleLiveWatchStop = useCallback(() => {
    if (liveWatchMedia) {
        const runtimeSeconds = liveWatchMedia.runtime * 60;
        if (liveWatchElapsedSeconds < runtimeSeconds - 10) {
             setPausedLiveSessions(prev => ({
                ...prev,
                [liveWatchMedia.id]: {
                    mediaInfo: liveWatchMedia, elapsedSeconds: liveWatchElapsedSeconds,
                    pausedAt: new Date().toISOString(), startTime: liveWatchStartTime || undefined, pauseCount: liveWatchPauseCount
                }
            }));
            confirmationService.show("Progress archived to Continue Watching.");
        }
        setTimeout(() => syncLibraryItem(liveWatchMedia.id, liveWatchMedia.media_type), 50);
    }
    setLiveWatchMedia(null); setLiveWatchElapsedSeconds(0); setLiveWatchStartTime(null); setLiveWatchPauseCount(0); setIsLiveWatchMinimized(false);
  }, [liveWatchMedia, liveWatchElapsedSeconds, liveWatchStartTime, liveWatchPauseCount, setPausedLiveSessions, syncLibraryItem]);

  const handleStartLiveWatch = useCallback((mediaInfo: LiveWatchMediaInfo) => {
    const paused = pausedLiveSessions[mediaInfo.id];
    if (paused) {
        setLiveWatchElapsedSeconds(paused.elapsedSeconds);
        setLiveWatchStartTime(paused.startTime || new Date().toISOString());
        setLiveWatchPauseCount(paused.pauseCount || 0);
        setPausedLiveSessions(prev => { const next = { ...prev }; delete next[mediaInfo.id]; return next; });
    } else { setLiveWatchElapsedSeconds(0); setLiveWatchStartTime(new Date().toISOString()); setLiveWatchPauseCount(0); }
    setLiveWatchMedia(mediaInfo); setLiveWatchIsPaused(false); setIsLiveWatchMinimized(false);
    confirmationService.show(`Live session started: ${mediaInfo.title}`);
    setTimeout(() => syncLibraryItem(mediaInfo.id, mediaInfo.media_type), 50);
  }, [pausedLiveSessions, setPausedLiveSessions, syncLibraryItem]);

  const handleToggleEpisode = useCallback(async (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => {
    const newStatus = currentStatus === 2 ? 0 : 2;
    let nextProgress: WatchProgress;
    setWatchProgress(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][episode] = { ...next[showId][season][episode], status: newStatus as 0 | 1 | 2 };
        nextProgress = next; return next;
    });

    if (newStatus === 2) {
        const endTime = new Date().toISOString();
        const historyTitle = showInfo.title || (showInfo as any).name || 'Untitled';
        const logItem = {
            ...showInfo, 
            title: historyTitle,
            logId: `tv-${showId}-${season}-${episode}-${Date.now()}`, 
            timestamp: endTime,
            seasonNumber: season, episodeNumber: episode, episodeTitle: episodeName,
            episodeStillPath, seasonPosterPath, startTime: liveWatchStartTime || undefined,
            endTime: endTime, pauseCount: liveWatchPauseCount || undefined
        };
        setHistory(prev => [logItem, ...prev]);
        setUserXp(prev => prev + XP_CONFIG.episode);
    } else setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === season && h.episodeNumber === episode)));
    
    setTimeout(() => syncLibraryItem(showId, 'tv', nextProgress, true), 10);
  }, [setWatchProgress, setHistory, setUserXp, syncLibraryItem, liveWatchStartTime, liveWatchPauseCount]);

  const handleToggleFavoriteShow = useCallback(async (item: TrackedItem) => {
    setFavorites(prev => {
        const isFav = prev.some(f => f.id === item.id);
        if (isFav) {
            confirmationService.show(`Removed ${item.title} from favorites.`);
            return prev.filter(f => f.id !== item.id);
        } else {
            confirmationService.show(`Added ${item.title} to favorites!`);
            return [{ ...item, addedAt: new Date().toISOString() }, ...prev];
        }
    });
  }, [setFavorites]);

  const handleSelectShow = useCallback((id: number, media_type: 'tv' | 'movie' | 'person') => {
    if (media_type === 'person') setSelectedPerson(id);
    else setSelectedShow({ id, media_type });
    window.scrollTo(0, 0);
  }, []);

  const handleMarkMovieAsWatched = useCallback(async (item: any, date?: string) => {
      const timestamp = date || new Date().toISOString();
      const showInfo: TrackedItem = { 
        id: item.id, title: item.title || item.name || 'Untitled', 
        media_type: 'movie', poster_path: item.poster_path 
      };
      const logItem: HistoryItem = { 
        ...showInfo, logId: `movie-${item.id}-${Date.now()}`, 
        timestamp, addedAt: timestamp 
      };
      setHistory(prev => [logItem, ...prev]);
      setUserXp(prev => prev + XP_CONFIG.movie);
      setTimeout(() => syncLibraryItem(item.id, 'movie'), 10);
  }, [setHistory, setUserXp, syncLibraryItem]);

  const handleSaveJournal = useCallback(async (showId: number, season: number, episode: number, entry: JournalEntry | null) => {
    setWatchProgress(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][episode] = { ...next[showId][season][episode], journal: entry || undefined };
        return next;
    });
    if (currentUser) {
        await syncJournalEntry(currentUser.id, showId, season, episode, entry);
    }
  }, [currentUser, setWatchProgress]);

  const handleSetCustomImage = useCallback(async (mediaId: number, type: 'poster' | 'backdrop', path: string | File) => {
    let finalUrl: string | null = null;
    if (path instanceof File) {
        if (!currentUser) return alert("Log in to upload assets.");
        finalUrl = await uploadCustomMedia(currentUser.id, mediaId, type, path);
    } else {
        finalUrl = path;
    }

    if (finalUrl) {
        setCustomImagePaths(prev => ({
            ...prev,
            [mediaId]: { 
              ...prev[mediaId], 
              [type === 'poster' ? 'poster_path' : 'backdrop_path']: finalUrl!, 
              gallery: Array.from(new Set([...(prev[mediaId]?.gallery || []), finalUrl!])) 
            }
        }));
    }
  }, [currentUser, setCustomImagePaths]);

  const handleRemoveCustomImage = useCallback(async (mediaId: number, url: string) => {
    if (currentUser) {
        await deleteCustomMedia(currentUser.id, mediaId, url);
    }
    
    setCustomImagePaths(prev => {
        const current = prev[mediaId];
        if (!current) return prev;
        
        const newGallery = (current.gallery || []).filter(item => item !== url);
        const isCurrentPoster = current.poster_path === url;
        const isCurrentBackdrop = current.backdrop_path === url;
        
        return {
            ...prev,
            [mediaId]: {
                ...current,
                gallery: newGallery,
                poster_path: isCurrentPoster ? undefined : current.poster_path,
                backdrop_path: isCurrentBackdrop ? undefined : current.backdrop_path,
            }
        };
    });
    
    confirmationService.show("Asset removed from registry.");
  }, [currentUser, setCustomImagePaths]);

  const handleRateItem = useCallback(async (mediaId: number, rating: number) => {
    const item = [...watching, ...planToWatch, ...completed, ...onHold, ...dropped, ...allCaughtUp].find(i => i.id === mediaId);
    const mediaType = item?.media_type || 'movie';
    
    setRatings(prev => ({
        ...prev,
        [mediaId]: { rating, date: new Date().toISOString() }
    }));
    if (currentUser) {
        await syncRatingRpc(mediaId, mediaType, rating);
    }
  }, [currentUser, watching, planToWatch, completed, onHold, dropped, allCaughtUp, setRatings]);

  const handleAddToList = useCallback((listId: string, item: CustomListItem) => {
    setCustomLists(prev => prev.map(l => l.id === listId ? { ...l, items: [...l.items, item] } : l));
    confirmationService.show(`Added to list.`);
  }, [setCustomLists]);

  const handleCreateAndAddToList = useCallback((listName: string, item: CustomListItem) => {
    const newList: CustomList = {
        id: `cl-${Date.now()}`,
        name: listName,
        description: '',
        items: [item],
        createdAt: new Date().toISOString(),
        visibility: 'private',
        likes: []
    };
    setCustomLists(prev => [newList, ...prev]);
    confirmationService.show(`Created "${listName}" and added item.`);
  }, [setCustomLists]);

  const handleAddWatchHistory = useCallback((item: TrackedItem, season: number, ep: number, timestamp?: string, note?: string, epName?: string) => {
    const ts = timestamp || new Date().toISOString();
    const logItem: HistoryItem = {
      ...item,
      logId: `tv-${item.id}-${season}-${ep}-${Date.now()}`,
      timestamp: ts,
      seasonNumber: season,
      episodeNumber: ep,
      episodeTitle: epName,
      note
    };
    setHistory(prev => [logItem, ...prev]);
    
    let nextProgress: WatchProgress;
    setWatchProgress(prev => {
        const next = { ...prev };
        if (!next[item.id]) next[item.id] = {};
        if (!next[item.id][season]) next[item.id][season] = {};
        next[item.id][season][ep] = { ...next[item.id][season][ep], status: 2 };
        nextProgress = next; return next;
    });
    
    setTimeout(() => syncLibraryItem(item.id, 'tv', nextProgress, true), 10);
  }, [setHistory, setWatchProgress, syncLibraryItem]);

  const handleToggleFavoriteEpisode = useCallback((showId: number, season: number, ep: number) => {
    setFavoriteEpisodes(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][ep] = !next[showId][season][ep];
        return next;
    });
  }, [setFavoriteEpisodes]);

  const handleRateEpisode = useCallback((showId: number, season: number, ep: number, rating: number) => {
    setEpisodeRatings(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][ep] = rating;
        return next;
    });
  }, [setEpisodeRatings]);

  const handleToggleWeeklyFavorite = useCallback((pick: WeeklyPick, replacementId?: number) => {
    setWeeklyFavorites(prev => {
        let next = replacementId 
            ? prev.filter(p => p.id !== replacementId || p.category !== pick.category || p.dayIndex !== pick.dayIndex)
            : prev;

        const exists = next.find(p => 
            p.id === pick.id && 
            p.category === pick.category && 
            p.dayIndex === pick.dayIndex &&
            p.episodeNumber === pick.episodeNumber
        );

        if (exists && !replacementId) {
            confirmationService.show(`Nomination removed.`);
            return next.filter(p => p !== exists);
        }

        confirmationService.show(`Nomination saved for ${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][pick.dayIndex]}!`);
        return [...next, pick];
    });
  }, [setWeeklyFavorites]);

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

  const allUserDataFull: UserData = { ...allUserData };

  const profileTabs = ['overview', 'history', 'library', 'lists', 'activity', 'stats', 'seasonLog', 'journal', 'achievements', 'imports', 'settings', 'updates', 'weeklyPicks', 'ongoing'];

  return (
    <div className={`min-h-screen ${activeTheme.base} transition-colors duration-500 pb-20`}>
        <BackgroundParticleEffects effect={activeTheme.colors.particleEffect} enabled={true} />
        {/* Glass Sheet Layer for Holiday Themes */}
        {activeTheme.holidayDate && (
          <div className="fixed inset-0 z-[-10] backdrop-blur-[15px] bg-black/10 pointer-events-none" />
        )}
        <Header 
            currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} 
            onGoToProfile={() => setActiveScreen('profile')} onGoHome={() => setActiveScreen('home')} 
            onSelectShow={handleSelectShow} onMarkShowAsWatched={handleMarkMovieAsWatched} 
            query={headerSearchQuery} onQueryChange={setHeaderSearchQuery} isHoliday={false} holidayName={null} 
            isOnSearchScreen={activeScreen === 'search'}
        />
        <main className="container mx-auto mt-8 relative z-10">
            {activeScreen === 'home' && (
                <Dashboard 
                    userData={allUserDataFull} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow} 
                    watchProgress={watchProgress} onToggleEpisode={handleToggleEpisode} 
                    onShortcutNavigate={(tabId) => { 
                        if (tabId === 'allNewReleases') {
                            handleOpenFullList({ title: 'New Movie Releases', initialMediaType: 'movie', initialGenreId: null, initialSortBy: 'popularity.desc', voteCountGte: 10, showMediaTypeToggle: false });
                        } else if (tabId === 'allNewlyPopularEpisodes') {
                            handleOpenFullList({ title: 'Recently Aired Episodes', initialMediaType: 'tv', initialGenreId: null, initialSortBy: 'first_air_date.desc', voteCountGte: 5, showMediaTypeToggle: false });
                        } else if (tabId === 'allTrendingTV') {
                            handleOpenFullList({ title: 'Trending Series', initialMediaType: 'tv', initialGenreId: null, initialSortBy: 'popularity.desc', voteCountGte: 100, showMediaTypeToggle: false });
                        } else if (tabId === 'allTrendingMovies') {
                            handleOpenFullList({ title: 'Trending Films', initialMediaType: 'movie', initialGenreId: null, initialSortBy: 'popularity.desc', voteCountGte: 100, showMediaTypeToggle: false });
                        } else if (tabId === 'allTopRated') {
                            handleOpenFullList({ title: 'Top Action & Adventure', initialMediaType: 'movie', initialGenreId: '28|12', initialSortBy: 'vote_average.desc', voteCountGte: 300, showMediaTypeToggle: true });
                        } else if (tabId === 'allBingeWorthy') {
                            handleOpenFullList({ title: 'Binge-Worthy Dramas', initialMediaType: 'tv', initialGenreId: 18, initialSortBy: 'popularity.desc', voteCountGte: 100, showMediaTypeToggle: true });
                        } else if (tabId === 'allHiddenGems') {
                            handleOpenFullList({ title: 'Hidden Gems Archive', initialMediaType: 'movie', initialGenreId: null, initialSortBy: 'vote_average.desc', voteCountGte: 20, voteCountLte: 400, showMediaTypeToggle: true });
                        } else if (tabId === 'allWesterns') {
                            handleOpenFullList({ title: 'Western Registry', initialMediaType: 'movie', initialGenreId: 37, initialSortBy: 'popularity.desc', voteCountGte: 10, showMediaTypeToggle: true });
                        } else {
                            setActiveScreen('profile'); setProfileInitialTab(tabId as ProfileTab); 
                        }
                    }} 
                    onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} setCustomLists={setCustomLists} 
                    liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} 
                    onLiveWatchTogglePause={() => setLiveWatchIsPaused(!liveWatchIsPaused)} onLiveWatchStop={handleLiveWatchStop} 
                    onMarkShowAsWatched={handleMarkMovieAsWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} 
                    pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} timeFormat={timeFormat} reminders={reminders} 
                    onToggleReminder={(newRem, id) => setReminders(prev => newRem ? [...prev, newRem] : prev.filter(r => r.id !== id))} 
                    onUpdateLists={updateLists} shortcutSettings={shortcutSettings} preferences={preferences} 
                    onRemoveWeeklyPick={handleToggleWeeklyFavorite} 
                    onOpenNominateModal={() => setIsNominateModalOpen(true)}
                    showRatings={showRatings}
                    onStartLiveWatch={handleStartLiveWatch}
                    onToggleFavoriteEpisode={handleToggleFavoriteEpisode}
                    onRateEpisode={handleRateEpisode}
                    onSaveJournal={handleSaveJournal}
                    onAddWatchHistory={handleAddWatchHistory}
                    onToggleWeeklyFavorite={handleToggleWeeklyFavorite}
                />
            )}
            {activeScreen === 'search' && <SearchScreen {...allUserDataFull} onSelectShow={handleSelectShow} onSelectPerson={setSelectedPerson} onSelectUser={setSelectedUserId} searchHistory={searchHistory} onUpdateSearchHistory={onUpdateSearchHistory} onDeleteSearchHistoryItem={(t) => setSearchHistory(prev => prev.filter(h => h.timestamp !== t))} onClearSearchHistory={() => setSearchHistory([])} query={''} onQueryChange={() => {}} onMarkShowAsWatched={handleMarkMovieAsWatched} onOpenAddToListModal={(i) => setAddToListModalState({ isOpen: true, item: i })} onMarkPreviousEpisodesWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserDataFull} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings} preferences={preferences} />}
            {activeScreen === 'calendar' && <CalendarScreen userData={allUserDataFull} onSelectShow={handleSelectShow} timezone={timezone} timeFormat={timeFormat} reminders={reminders} onToggleReminder={(newRem, id) => setReminders(prev => newRem ? [...prev, newRem] : prev.filter(r => r.id !== id))} onToggleEpisode={handleToggleEpisode} watchProgress={watchProgress} />}
            {activeScreen === 'progress' && (
                <ProgressScreen 
                    userData={allUserDataFull}
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
                />
            )}
            {activeScreen === 'profile' && (
              <Profile 
                userData={allUserDataFull} 
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
                onDeleteHistoryItem={(i) => setHistory(prev => prev.filter(h => h.logId !== i.logId))} 
                onRestoreHistoryItem={() => {}} 
                onPermanentDeleteHistoryItem={() => {}} 
                onClearAllDeletedHistory={() => {}} 
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
                onPermanentDeleteNote={() => {}} 
                onRestoreNote={() => {}} 
                onUpdateLists={updateLists} 
                favoriteEpisodes={favoriteEpisodes} 
                setPendingRecommendationChecks={setPendingRecommendationChecks} 
                setFailedRecommendationReports={setFailedRecommendationReports}
                autoHolidayThemesEnabled={autoHolidayEnabled}
                setAutoHolidayThemesEnabled={setAutoHolidayEnabled}
              />
            )}
        </main>
        
        {allMediaConfig && (
            <div className="fixed inset-0 z-[100] bg-bg-primary overflow-y-auto">
                <AllMediaScreen 
                    {...allMediaConfig}
                    onBack={() => setAllMediaConfig(null)}
                    onSelectShow={handleSelectShow}
                    onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })}
                    onMarkShowAsWatched={handleMarkMovieAsWatched}
                    onToggleFavoriteShow={handleToggleFavoriteShow}
                    favorites={favorites}
                    completed={completed}
                    genres={genres}
                    showRatings={showRatings}
                    preferences={preferences}
                    userData={allUserDataFull}
                />
            </div>
        )}

        {selectedShow && (
            <div className="fixed inset-0 z-40 bg-bg-primary overflow-y-auto">
                <ShowDetail 
                    id={selectedShow.id} mediaType={selectedShow.media_type} onBack={() => setSelectedShow(null)} 
                    watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode} 
                    onSaveJournal={handleSaveJournal} trackedLists={{ watching, planToWatch, completed, onHold, dropped, allCaughtUp }} 
                    onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={handleSetCustomImage} 
                    onRemoveCustomImage={handleRemoveCustomImage}
                    favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow} weeklyFavorites={weeklyFavorites} 
                    onToggleWeeklyFavorite={handleToggleWeeklyFavorite} onSelectShow={handleSelectShow} 
                    onOpenCustomListModal={() => {}} ratings={ratings} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} 
                    onRateItem={handleRateItem} onMarkMediaAsWatched={handleMarkMovieAsWatched} onUnmarkMovieWatched={() => {}} 
                    onMarkSeasonWatched={() => {}} onUnmarkSeasonWatched={() => {}} onMarkPreviousEpisodesWatched={() => {}} 
                    favoriteEpisodes={favoriteEpisodes} onSelectPerson={setSelectedPerson} onSelectShowInModal={handleSelectShow} 
                    onStartLiveWatch={handleStartLiveWatch} onDeleteHistoryItem={() => {}} onAddWatchHistory={handleAddWatchHistory} 
                    onDeleteSearchHistoryItem={() => {}} onClearSearchHistory={() => {}} onAddWatchHistoryBulk={() => {}} 
                    onSaveComment={() => {}} comments={comments} genres={genres} onMarkAllWatched={() => {}} 
                    onUnmarkAllWatched={() => {}} onSaveEpisodeNote={() => {}} showRatings={showRatings} 
                    seasonRatings={seasonRatings} onRateSeason={() => {}} onRateEpisode={handleRateEpisode} 
                    customLists={customLists} currentUser={currentUser} allUsers={allUsers} mediaNotes={mediaNotes} 
                    onSaveMediaNote={() => {}} allUserData={allUserDataFull} episodeNotes={episodeNotes} 
                    onOpenAddToListModal={(i) => setAddToListModalState({ isOpen: true, item: i })} preferences={preferences} 
                    follows={follows} pausedLiveSessions={pausedLiveSessions} onAuthClick={onAuthClick} 
                    onDiscardRequest={() => {}} onSetCustomEpisodeImage={() => {}} onClearMediaHistory={() => {}} 
                    reminders={reminders} onToggleReminder={(newRem, id) => setReminders(prev => newRem ? [...prev, newRem] : prev.filter(r => r.id !== id))} 
                    episodeRatings={episodeRatings} 
                    pendingRecommendationChecks={pendingRecommendationChecks}
                    setPendingRecommendationChecks={setPendingRecommendationChecks}
                />
            </div>
        )}
        
        <PersonDetailModal isOpen={!!selectedPerson} onClose={() => setSelectedPerson(null)} personId={selectedPerson} userData={allUserDataFull} onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} onToggleWeeklyFavorite={handleToggleWeeklyFavorite} weeklyFavorites={weeklyFavorites} />
        <AddToListModal 
            isOpen={addToListModalState.isOpen} 
            onClose={() => setAddToListModalState({ isOpen: false, item: null })} 
            itemToAdd={addToListModalState.item} 
            customLists={customLists} 
            onAddToList={handleAddToList} 
            onCreateAndAddToList={handleCreateAndAddToList} 
            onGoToDetails={handleSelectShow} 
            onUpdateLists={updateLists}
            activeStandardStatus={activeStandardStatus}
        />
        <NominatePicksModal isOpen={isNominateModalOpen} onClose={() => setIsNominateModalOpen(false)} userData={allUserDataFull} currentPicks={weeklyFavorites} onNominate={handleToggleWeeklyFavorite} onRemovePick={handleToggleWeeklyFavorite} />
        <WelcomeModal isOpen={!isWelcomeDismissed} onClose={() => { setIsWelcomeDismissed(true); localStorage.setItem('welcome_dismissed', 'true'); }} timezone={timezone} setTimezone={setTimezone} timeFormat={timeFormat} setTimeFormat={setTimeFormat} />
        
        <LiveWatchTracker isOpen={!!liveWatchMedia} onClose={handleLiveWatchStop} onDiscard={() => setLiveWatchMedia(null)} mediaInfo={liveWatchMedia} elapsedSeconds={liveWatchElapsedSeconds} isPaused={liveWatchIsPaused} onTogglePause={() => setLiveWatchIsPaused(!liveWatchIsPaused)} isMinimized={isLiveWatchMinimized} onToggleMinimize={() => setIsLiveWatchMinimized(!isLiveWatchMinimized)} onMarkWatched={() => {}} onAddToList={() => {}} />
        <BottomTabNavigator 
            activeTab={activeScreen} 
            onTabPress={(tab) => { 
                if (tab !== 'progress' && profileTabs.includes(tab)) {
                    setActiveScreen('profile');
                    setProfileInitialTab(tab as ProfileTab);
                } else {
                    setActiveScreen(tab);
                    setProfileInitialTab(undefined);
                }
                setSelectedShow(null); 
                setSelectedPerson(null);
                setSelectedUserId(null);
                setAllMediaConfig(null);
            }} 
            profilePictureUrl={profilePictureUrl} 
            navSettings={navSettings} 
        />
        <ConfirmationContainer />
        <AnimationContainer />
    </div>
  );
};
