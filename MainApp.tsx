import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { UserData, WatchProgress, Theme, HistoryItem, TrackedItem, UserRatings, 
  EpisodeRatings, SeasonRatings, CustomList, AppNotification, FavoriteEpisodes, 
  LiveWatchMediaInfo, SearchHistoryItem, Comment, Note, ProfileTab, 
  WatchStatus, WeeklyPick, DeletedHistoryItem, CustomImagePaths, Reminder, 
  NotificationSettings, ShortcutSettings, NavSettings, AppPreferences, 
  PrivacySettings, ProfileTheme, TmdbMedia, Follows, CustomListItem, DeletedNote, EpisodeProgress, CommentVisibility,
  JournalEntry
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
import PersonDetailModal from './components/PersonDetailModal';
import AddToListModal from './components/AddToListModal';
import WelcomeModal from './components/WelcomeModal';
import ConfirmationContainer from './components/ConfirmationContainer';
import { confirmationService } from './services/confirmationService';
import CalendarScreen from './screens/CalendarScreen';
import { calculateLevelInfo, XP_CONFIG } from './utils/xpUtils';
import AnimationContainer from './components/AnimationContainer';
import LiveWatchTracker from './components/LiveWatchTracker';
import NominatePicksModal from './components/NominatePicksModal';
import { calculateAutoStatus, calculateMovieAutoStatus } from './utils/libraryLogic';
import AirtimeManagement from './screens/AirtimeManagement';
import BackgroundParticleEffects from './components/BackgroundParticleEffects';
import { getAllUsers, searchPublicLists } from './utils/userUtils';
import { supabase, uploadCustomMedia, deleteCustomMedia, syncJournalEntry, syncUserNote, syncWatchStatusRpc, toggleFavoriteRpc, syncRatingRpc, syncHistoryItemRpc } from './services/supabaseClient';

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

export const MainApp: React.FC<MainAppProps> = ({ 
    userId, currentUser, onLogout, onUpdatePassword, onUpdateProfile, onAuthClick, 
    onForgotPasswordRequest, onForgotPasswordReset, autoHolidayThemesEnabled, setAutoHolidayThemesEnabled 
}) => {
  const [customThemes, setCustomThemes] = useLocalStorage<Theme[]>(`customThemes_${userId}`, []);
  const [activeTheme, setTheme, baseThemeId, currentHolidayName] = useTheme(customThemes, autoHolidayThemesEnabled);
  
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
  });

  const [privacySettings, setPrivacySettings] = useLocalStorage<PrivacySettings>(`privacy_settings_${userId}`, {
    activityVisibility: 'public'
  });
  const [holidayAnimationsEnabled, setHolidayAnimationsEnabled] = useLocalStorage<boolean>(`holidayAnimationsEnabled_${userId}`, true);
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
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [follows, setFollows] = useLocalStorage<Follows>(`follows_${userId}`, {});

  const [isNominateModalOpen, setIsNominateModalOpen] = useState(false);
  const [isWelcomeDismissed, setIsWelcomeDismissed] = useState(!!localStorage.getItem('welcome_dismissed'));

  const isSyncingRef = useRef(false);

  // --- SUPABASE SYNC LOGIC ---

  useEffect(() => {
    if (!currentUser) return;

    const loadSupabaseData = async () => {
        isSyncingRef.current = true;
        
        try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            if (profile) {
                if (profile.timezone) setTimezone(profile.timezone);
                if (profile.user_xp) setUserXp(profile.user_xp);
                if (profile.avatar_url) setProfilePictureUrl(profile.avatar_url);
            }

            const { data: journals } = await supabase.from('journal_entries').select('*').eq('user_id', currentUser.id);
            if (journals) {
                setWatchProgress(prev => {
                    const next = { ...prev };
                    journals.forEach(j => {
                        if (!next[j.tmdb_id]) next[j.tmdb_id] = {};
                        if (!next[j.tmdb_id][j.season_number]) next[j.tmdb_id][j.season_number] = {};
                        next[j.tmdb_id][j.season_number][j.episode_number] = {
                            ...next[j.tmdb_id][j.season_number][j.episode_number],
                            journal: { text: j.content, mood: j.mood, timestamp: j.timestamp }
                        };
                    });
                    return next;
                });
            }

            const { data: libraryItems } = await supabase.from('library').select('*').eq('user_id', currentUser.id);
            if (libraryItems) {
                const map: Record<WatchStatus, TrackedItem[]> = { watching: [], planToWatch: [], completed: [], onHold: [], dropped: [], allCaughtUp: [], favorites: [] };
                for (const item of libraryItems) {
                    const details = await getMediaDetails(item.tmdb_id, item.media_type || 'tv').catch(() => null);
                    if (details) {
                        const tracked: TrackedItem = { 
                            id: details.id, title: details.title || details.name || 'Untitled', 
                            media_type: details.media_type, poster_path: details.poster_path, 
                            addedAt: item.added_at 
                        };
                        if (map[item.status as WatchStatus]) map[item.status as WatchStatus].push(tracked);
                    }
                }
                setWatching(map.watching); setPlanToWatch(map.planToWatch); setCompleted(map.completed); setOnHold(map.onHold); setDropped(map.dropped); setAllCaughtUp(map.allCaughtUp);
            }

            const { data: historyItems } = await supabase.from('history').select('*').eq('user_id', currentUser.id).order('timestamp', { ascending: false });
            if (historyItems) {
                const mappedHistory: HistoryItem[] = historyItems.map(h => ({
                    id: h.tmdb_id, title: h.metadata?.title || 'Unknown', media_type: h.media_type, 
                    poster_path: h.metadata?.poster_path, logId: h.log_id, timestamp: h.timestamp,
                    season_number: h.season_number, episode_number: h.episode_number, note: h.note,
                    episodeTitle: h.metadata?.episodeTitle, episodeStillPath: h.metadata?.episodeStillPath,
                    seasonPosterPath: h.metadata?.seasonPosterPath
                }));
                setHistory(mappedHistory);
            }
        } catch (e) { console.error("Supabase load failed:", e); } finally { isSyncingRef.current = false; }
    };
    loadSupabaseData();
  }, [currentUser]);

  const allUserData: UserData = useMemo(() => ({
    watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites,
    watchProgress, history, deletedHistory, deletedNotes, customLists, ratings,
    episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments,
    mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory,
    customEpisodeImages, customImagePaths, globalPlaceholders, timezone, timeFormat,
    blockedUserIds
  }), [
    watching, planToWatch, completed, onHold, dropped, allCaughtUp, favorites,
    watchProgress, history, deletedHistory, deletedNotes, customLists, ratings,
    episodeRatings, seasonRatings, favoriteEpisodes, searchHistory, comments,
    mediaNotes, episodeNotes, weeklyFavorites, weeklyFavoritesHistory,
    customEpisodeImages, customImagePaths, globalPlaceholders, timezone, timeFormat,
    blockedUserIds
  ]);

  const levelInfo = useMemo(() => calculateLevelInfo(userXp), [userXp]);
  const allUsers = useMemo(() => getAllUsers(), []);

  useEffect(() => { getGenres().then(setGenres).catch(console.error); }, []);

  const handlePopState = useCallback((event: PopStateEvent) => {
    if (selectedShow || selectedPerson || selectedUserId) {
      setSelectedShow(null); setSelectedPerson(null); setSelectedUserId(null);
      window.history.pushState({ app: 'sceneit' }, ''); return;
    }
    if (activeScreen !== 'home') {
      setActiveScreen('home'); window.history.pushState({ app: 'sceneit' }, ''); return;
    }
    window.history.back();
  }, [selectedShow, selectedPerson, selectedUserId, activeScreen]);

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

        if (currentUser) {
            try { await syncWatchStatusRpc(item.id, item.media_type, newList); } 
            catch (e) { console.error("Supabase Watch Sync Error", e); }
        }

        const showName = item.title || (item as any).name || 'Untitled';
        confirmationService.show(newList ? `"${showName}" added to ${newList}` : `Removed ${showName}`);
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
        if (currentUser) {
            try { await syncHistoryItemRpc(logItem); } catch (e) { console.error("History Sync Failed", e); }
        }
    } else setHistory(prev => prev.filter(h => !(h.id === showId && h.seasonNumber === season && h.episodeNumber === episode)));
    
    setTimeout(() => syncLibraryItem(showId, 'tv', nextProgress, true), 10);
  }, [currentUser, setWatchProgress, setHistory, setUserXp, syncLibraryItem, liveWatchStartTime, liveWatchPauseCount]);

  const handleToggleFavoriteEpisode = useCallback((showId: number, seasonNumber: number, episodeNumber: number) => {
      setFavoriteEpisodes(prev => {
          const next = { ...prev };
          if (!next[showId]) next[showId] = {};
          if (!next[showId][seasonNumber]) next[showId][seasonNumber] = {};
          
          const isFav = !!next[showId][seasonNumber][episodeNumber];
          next[showId][seasonNumber][episodeNumber] = !isFav;
          
          confirmationService.show(isFav ? "Episode removed from favorites." : "Episode added to favorites!");
          return next;
      });
  }, [setFavoriteEpisodes]);

  const handleRateItem = useCallback(async (mediaId: number, rating: number) => {
    setRatings(prev => {
        const next = { ...prev };
        if (rating === 0) delete next[mediaId];
        else next[mediaId] = { rating, date: new Date().toISOString() };
        return next;
    });
    setUserXp(prev => prev + XP_CONFIG.journal);
    if (currentUser) {
        try {
            const item = [...watching, ...completed, ...planToWatch].find(i => i.id === mediaId);
            await syncRatingRpc(mediaId, item?.media_type || 'tv', rating);
        } catch (e) { console.error("Rating Sync Failed", e); }
    }
    confirmationService.show(rating === 0 ? "Rating removed." : `Rated ${rating}/10!`);
  }, [currentUser, watching, completed, planToWatch, setRatings, setUserXp]);

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
    if (currentUser) {
        try { await toggleFavoriteRpc(item.id, item.media_type); } 
        catch (e) { console.error("Favorite Sync Failed", e); }
    }
  }, [currentUser, setFavorites]);

  const handleSelectShow = useCallback((id: number, media_type: 'tv' | 'movie' | 'person') => {
    if (media_type === 'person') setSelectedPerson(id);
    else setSelectedShow({ id, media_type });
    window.scrollTo(0, 0);
  }, []);

  const handleSaveJournal = useCallback(async (showId: number, season: number, episode: number, entry: JournalEntry | null) => {
    setWatchProgress(prev => {
        const next = { ...prev };
        if (!next[showId]) next[showId] = {};
        if (!next[showId][season]) next[showId][season] = {};
        next[showId][season][episode] = { ...next[showId][season][episode], journal: entry || undefined };
        return next;
    });
    if (currentUser) await syncJournalEntry(currentUser.id, showId, season, episode, entry);
    if (entry) setUserXp(prev => prev + XP_CONFIG.journal);
    confirmationService.show(entry ? "Journal entry synced." : "Journal entry removed.");
  }, [setWatchProgress, setUserXp, currentUser]);

  const handleSetCustomImage = useCallback(async (mediaId: number, type: 'poster' | 'backdrop', source: string | File) => {
    if (!currentUser) return;
    confirmationService.show(`Uploading custom ${type}...`);
    const publicUrl = await uploadCustomMedia(currentUser.id, mediaId, type, source);
    if (publicUrl) {
        setCustomImagePaths(prev => {
            const next = { ...prev };
            if (!next[mediaId]) next[mediaId] = { gallery: [] };
            if (type === 'poster') next[mediaId].poster_path = publicUrl;
            if (type === 'backdrop') next[mediaId].backdrop_path = publicUrl;
            if (!next[mediaId].gallery!.includes(publicUrl)) next[mediaId].gallery!.push(publicUrl);
            return next;
        });
        confirmationService.show(`${type.charAt(0).toUpperCase() + type.slice(1)} synced to cloud.`);
    }
  }, [currentUser, setCustomImagePaths]);

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
      if (currentUser) {
          try { await syncHistoryItemRpc(logItem); } catch (e) { console.error("History Sync Failed", e); }
      }
      setTimeout(() => syncLibraryItem(item.id, 'movie'), 10);
  }, [currentUser, setHistory, setUserXp, syncLibraryItem]);

  const profileTabs = ['overview', 'history', 'library', 'lists', 'activity', 'stats', 'seasonLog', 'journal', 'achievements', 'imports', 'settings', 'updates', 'weeklyPicks', 'ongoing'];

  return (
    <div className={`min-h-screen ${activeTheme.base} transition-colors duration-500 pb-20`}>
        <BackgroundParticleEffects effect={activeTheme.colors.particleEffect} enabled={holidayAnimationsEnabled} />
        <Header 
            currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} 
            onGoToProfile={() => setActiveScreen('profile')} onGoHome={() => setActiveScreen('home')} 
            onSelectShow={handleSelectShow} onMarkShowAsWatched={handleMarkMovieAsWatched} 
            query={searchQuery} onQueryChange={setSearchQuery} isHoliday={!!currentHolidayName} holidayName={currentHolidayName} 
        />
        <main className="container mx-auto mt-8">
            {activeScreen === 'home' && (
                <Dashboard 
                    userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow} 
                    watchProgress={watchProgress} onToggleEpisode={handleToggleEpisode} 
                    onShortcutNavigate={(tabId) => { setActiveScreen('profile'); setProfileInitialTab(tabId as ProfileTab); }} 
                    onOpenAddToListModal={(item) => setAddToListModalState({ isOpen: true, item })} setCustomLists={setCustomLists} 
                    liveWatchMedia={liveWatchMedia} liveWatchElapsedSeconds={liveWatchElapsedSeconds} liveWatchIsPaused={liveWatchIsPaused} 
                    onLiveWatchTogglePause={() => setLiveWatchIsPaused(!liveWatchIsPaused)} onLiveWatchStop={handleLiveWatchStop} 
                    onMarkShowAsWatched={handleMarkMovieAsWatched} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} 
                    pausedLiveSessions={pausedLiveSessions} timezone={timezone} genres={genres} timeFormat={timeFormat} reminders={reminders} 
                    onToggleReminder={(newRem, id) => setReminders(prev => newRem ? [...prev, newRem] : prev.filter(r => r.id !== id))} 
                    onUpdateLists={updateLists} shortcutSettings={shortcutSettings} preferences={preferences} 
                    onRemoveWeeklyPick={(p) => setWeeklyFavorites(prev => prev.filter(item => item.id !== p.id || item.category !== p.category || item.dayIndex !== p.dayIndex))} 
                    onOpenNominateModal={() => setIsNominateModalOpen(true)}
                />
            )}
            {activeScreen === 'search' && <SearchScreen {...allUserData} onSelectShow={handleSelectShow} onSelectPerson={setSelectedPerson} onSelectUser={setSelectedUserId} searchHistory={searchHistory} onUpdateSearchHistory={onUpdateSearchHistory} onDeleteSearchHistoryItem={(t) => setSearchHistory(prev => prev.filter(h => h.timestamp !== t))} onClearSearchHistory={() => setSearchHistory([])} query={searchQuery} onQueryChange={setSearchQuery} onMarkShowAsWatched={handleMarkMovieAsWatched} onOpenAddToListModal={(i) => setAddToListModalState({ isOpen: true, item: i })} onMarkPreviousEpisodesWatched={() => {}} onToggleFavoriteShow={handleToggleFavoriteShow} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings} preferences={preferences} />}
            {activeScreen === 'calendar' && <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} timeFormat={timeFormat} reminders={reminders} onToggleReminder={(newRem, id) => setReminders(prev => newRem ? [...prev, newRem] : prev.filter(r => r.id !== id))} onToggleEpisode={handleToggleEpisode} watchProgress={watchProgress} />}
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
                />
            )}
            {activeScreen === 'profile' && <Profile userData={allUserData} genres={genres} onSelectShow={handleSelectShow} onImportCompleted={() => {}} onTraktImportCompleted={() => {}} onTmdbImportCompleted={() => {}} onJsonImportCompleted={() => {}} onToggleEpisode={handleToggleEpisode} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} setCustomLists={setCustomLists} initialTab={profileInitialTab} initialLibraryStatus={initialLibraryStatus} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} onDeleteHistoryItem={(i) => setHistory(prev => prev.filter(h => h.logId !== i.logId))} onRestoreHistoryItem={() => {}} onPermanentDeleteHistoryItem={() => {}} onClearAllDeletedHistory={() => {}} onDeleteSearchHistoryItem={(t) => setSearchHistory(prev => prev.filter(h => h.timestamp !== t))} onClearSearchHistory={() => setSearchHistory([])} setHistory={setHistory} setWatchProgress={setWatchProgress} setEpisodeRatings={setEpisodeRatings} setFavoriteEpisodes={setFavoriteEpisodes} setTheme={setTheme} baseThemeId={baseThemeId} currentHolidayName={currentHolidayName} customThemes={customThemes} setCustomThemes={setCustomThemes} onLogout={onLogout} onUpdatePassword={onUpdatePassword} onUpdateProfile={onUpdateProfile} currentUser={currentUser} onAuthClick={onAuthClick} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl} setCompleted={setCompleted} follows={follows} privacySettings={privacySettings} setPrivacySettings={setPrivacySettings} onSelectUser={setSelectedUserId} timezone={timezone} setTimezone={setTimezone} onRemoveDuplicateHistory={() => {}} notifications={notifications} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))} onMarkOneRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} onAddNotifications={(notifs) => setNotifications(prev => [...notifs, ...prev].slice(0, 50))} autoHolidayThemesEnabled={autoHolidayThemesEnabled} setAutoHolidayThemesEnabled={setAutoHolidayThemesEnabled} holidayAnimationsEnabled={holidayAnimationsEnabled} setHolidayAnimationsEnabled={setHolidayAnimationsEnabled} profileTheme={profileTheme} setProfileTheme={setProfileTheme} textSize={textSize} setTextSize={setTextSize} onFeedbackSubmit={() => {}} levelInfo={levelInfo} timeFormat={timeFormat} setTimeFormat={setTimeFormat} pin={pin} setPin={setPin} showRatings={showRatings} setShowRatings={setShowRatings} setSeasonRatings={setSeasonRatings} onToggleWeeklyFavorite={handleToggleFavoriteShow} onOpenNominateModal={() => setIsNominateModalOpen(true)} pausedLiveSessions={pausedLiveSessions} onStartLiveWatch={handleStartLiveWatch} shortcutSettings={shortcutSettings} setShortcutSettings={setShortcutSettings} navSettings={navSettings} setNavSettings={setNavSettings} preferences={preferences} setPreferences={setPreferences} onPermanentDeleteNote={() => {}} onRestoreNote={() => {}} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} />}
        </main>
        
        {selectedShow && (
            <div className="fixed inset-0 z-40 bg-bg-primary overflow-y-auto">
                <ShowDetail 
                    id={selectedShow.id} mediaType={selectedShow.media_type} onBack={() => setSelectedShow(null)} 
                    watchProgress={watchProgress} history={history} onToggleEpisode={handleToggleEpisode} 
                    onSaveJournal={handleSaveJournal} trackedLists={{ watching, planToWatch, completed, onHold, dropped, allCaughtUp }} 
                    onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={handleSetCustomImage} 
                    favorites={favorites} onToggleFavoriteShow={handleToggleFavoriteShow} weeklyFavorites={weeklyFavorites} 
                    onToggleWeeklyFavorite={(p) => setWeeklyFavorites(prev => [...prev, p])} onSelectShow={handleSelectShow} 
                    onOpenCustomListModal={() => {}} ratings={ratings} onToggleFavoriteEpisode={handleToggleFavoriteEpisode} 
                    onRateItem={handleRateItem} onMarkMediaAsWatched={handleMarkMovieAsWatched} onUnmarkMovieWatched={() => {}} 
                    onMarkSeasonWatched={() => {}} onUnmarkSeasonWatched={() => {}} onMarkPreviousEpisodesWatched={() => {}} 
                    favoriteEpisodes={favoriteEpisodes} onSelectPerson={setSelectedPerson} onSelectShowInModal={handleSelectShow} 
                    onStartLiveWatch={handleStartLiveWatch} onDeleteHistoryItem={() => {}} onAddWatchHistory={() => {}} 
                    onDeleteSearchHistoryItem={() => {}} onClearSearchHistory={() => {}} onAddWatchHistoryBulk={() => {}} 
                    onSaveComment={() => {}} comments={comments} genres={genres} onMarkAllWatched={() => {}} 
                    onUnmarkAllWatched={() => {}} onSaveEpisodeNote={() => {}} showRatings={showRatings} 
                    seasonRatings={seasonRatings} onRateSeason={() => {}} onRateEpisode={() => {}} 
                    customLists={customLists} currentUser={currentUser} allUsers={allUsers} mediaNotes={mediaNotes} 
                    onSaveMediaNote={() => {}} allUserData={allUserData} episodeNotes={episodeNotes} 
                    onOpenAddToListModal={(i) => setAddToListModalState({ isOpen: true, item: i })} preferences={preferences} 
                    follows={follows} pausedLiveSessions={pausedLiveSessions} onAuthClick={onAuthClick} 
                    onDiscardRequest={() => {}} onSetCustomEpisodeImage={() => {}} onClearMediaHistory={() => {}} 
                    reminders={reminders} onToggleReminder={(newRem, id) => setReminders(prev => newRem ? [...prev, newRem] : prev.filter(r => r.id !== id))} 
                    episodeRatings={episodeRatings} 
                />
            </div>
        )}
        
        <PersonDetailModal isOpen={!!selectedPerson} onClose={() => setSelectedPerson(null)} personId={selectedPerson} userData={allUserData} onSelectShow={handleSelectShow} onToggleFavoriteShow={handleToggleFavoriteShow} onRateItem={handleRateItem} ratings={ratings} favorites={favorites} onToggleWeeklyFavorite={handleToggleFavoriteShow} weeklyFavorites={weeklyFavorites} />
        <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={() => {}} onCreateAndAddToList={() => {}} onGoToDetails={handleSelectShow} onUpdateLists={updateLists} />
        <NominatePicksModal isOpen={isNominateModalOpen} onClose={() => setIsNominateModalOpen(false)} userData={allUserData} currentPicks={weeklyFavorites} onNominate={(p) => setWeeklyFavorites(prev => [...prev, p])} onRemovePick={(p) => setWeeklyFavorites(prev => prev.filter(item => item.id !== p.id || item.category !== p.category || item.dayIndex !== p.dayIndex))} />
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
            }} 
            profilePictureUrl={profilePictureUrl} 
            navSettings={navSettings} 
        />
        <ConfirmationContainer />
        <AnimationContainer />
    </div>
  );
};