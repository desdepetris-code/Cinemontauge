
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import Dashboard from './screens/Dashboard';
import ShowDetail from './components/ShowDetail';
import { getGenres, clearMediaCache } from './services/tmdbService';
// FIX: Added NotificationSettings to imports from types to resolve 'Cannot find name' error.
import { TrackedItem, WatchProgress, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification, FavoriteEpisodes, ProfileTab, ScreenName, CustomList, UserRatings, LiveWatchMediaInfo, EpisodeRatings, SearchHistoryItem, Comment, Theme, SeasonRatings, Reminder, NotificationSettings } from './types';
import Profile from './screens/Profile';
import { useTheme } from './hooks/useTheme';
import BottomTabNavigator, { TabName } from './navigation/BottomTabNavigator';
import SearchScreen from './screens/SearchScreen';
import ProgressScreen from './screens/ProgressScreen';
import ActorDetail from './components/ActorDetail';
import AddToListModal from './components/AddToListModal';
import WelcomeModal from './components/WelcomeModal';
import UserProfileModal from './components/UserProfileModal';
import ConfirmationContainer from './components/ConfirmationContainer';
import { confirmationService } from './services/confirmationService';
import CalendarScreen from './screens/CalendarScreen';
import { calculateLevelInfo, XP_CONFIG } from './utils/xpUtils';
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

export const MainApp: React.FC<MainAppProps> = ({ userId, currentUser, onLogout, onUpdatePassword, onUpdateProfile, onAuthClick, onForgotPasswordRequest, onForgotPasswordReset }) => {
  const [customThemes, setCustomThemes] = useLocalStorage<Theme[]>(`customThemes_${userId}`, []);
  const [activeTheme, setTheme] = useTheme(customThemes);
  
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
  const [mediaNotes, setMediaNotes] = useLocalStorage<Record<number, string>>(`media_notes_${userId}`, {});
  const [episodeNotes, setEpisodeNotes] = useLocalStorage<Record<number, Record<number, Record<number, string>>>>(`episode_notes_${userId}`, {});
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>(`custom_image_paths_${userId}`, {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>(`notifications_${userId}`, []);
  const [favoriteEpisodes, setFavoriteEpisodes] = useLocalStorage<FavoriteEpisodes>(`favorite_episodes_${userId}`, {});
  const [episodeRatings, setEpisodeRatings] = useLocalStorage<EpisodeRatings>(`episode_ratings_${userId}`, {});
  const [seasonRatings, setSeasonRatings] = useLocalStorage<SeasonRatings>(`season_ratings_${userId}`, {});
  const [customLists, setCustomLists] = useLocalStorage<CustomList[]>(`custom_lists_${userId}`, []);
  const [ratings, setRatings] = useLocalStorage<UserRatings>(`user_ratings_${userId}`, {});
  const [profilePictureUrl, setProfilePictureUrl] = useLocalStorage<string | null>(`profilePictureUrl_${userId}`, null);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>(`reminders_${userId}`, []);
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>(`notification_settings_${userId}`, {
    masterEnabled: true, newEpisodes: true, movieReleases: true, sounds: true, newFollowers: true, listLikes: true, appUpdates: true, importSyncCompleted: true, showWatchedConfirmation: true,
  });
  const [timezone, setTimezone] = useLocalStorage<string>(`timezone_${userId}`, 'America/New_York');
  const [userXp, setUserXp] = useLocalStorage<number>(`userXp_${userId}`, 0);
  const [showRatings, setShowRatings] = useLocalStorage<boolean>(`showRatings_${userId}`, true);

  const [activeScreen, setActiveScreen] = useState<ScreenName>('home');
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<number | null>(null);
  const [addToListModalState, setAddToListModalState] = useState<{ isOpen: boolean; item: TmdbMedia | TrackedItem | null }>({ isOpen: false, item: null });
  const [searchQuery, setSearchQuery] = useState('');
  const [genres, setGenres] = useState<Record<number, string>>({});
  
  useEffect(() => { getGenres().then(setGenres); }, []);

  const allUserData: UserData = useMemo(() => ({
      watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, seasonRatings
  }), [watching, planToWatch, completed, onHold, dropped, favorites, watchProgress, history, customLists, ratings, episodeRatings, favoriteEpisodes, searchHistory, comments, mediaNotes, episodeNotes, seasonRatings]);
  
  const handleSelectShow = (id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    setSelectedPerson(null);
    window.scrollTo(0, 0);
  };

  const handleBack = () => setSelectedShow(null);
  const handleTabPress = (tab: TabName) => { setSelectedShow(null); setSelectedPerson(null); setActiveScreen(tab); window.scrollTo(0, 0); };

  const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
        const setters: Record<string, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
            watching: setWatching, planToWatch: setPlanToWatch, completed: setCompleted,
            onHold: setOnHold, dropped: setDropped,
        };
        Object.keys(setters).forEach(key => setters[key](prev => prev.filter(i => i.id !== item.id)));
        if (newList && setters[newList]) setters[newList](prev => [item, ...prev]);
    }, [setWatching, setPlanToWatch, setCompleted, setOnHold, setDropped]);

  return (
    <>
      <ConfirmationContainer />
      <AnimationContainer />
      <AddToListModal isOpen={addToListModalState.isOpen} onClose={() => setAddToListModalState({ isOpen: false, item: null })} itemToAdd={addToListModalState.item} customLists={customLists} onAddToList={() => {}} onCreateAndAddToList={() => {}} onGoToDetails={handleSelectShow} onUpdateLists={updateLists} />
      <Header currentUser={currentUser} profilePictureUrl={profilePictureUrl} onAuthClick={onAuthClick} onGoToProfile={() => setActiveScreen('profile')} onSelectShow={handleSelectShow} onGoHome={() => setActiveScreen('home')} onMarkShowAsWatched={() => {}} query={searchQuery} onQueryChange={setSearchQuery} isOnSearchScreen={activeScreen === 'search'} />
      <main className="pb-20">
        {selectedShow ? (
            <ShowDetail id={selectedShow.id} mediaType={selectedShow.media_type} onBack={handleBack} watchProgress={watchProgress} history={history} onToggleEpisode={() => {}} onSaveJournal={() => {}} trackedLists={{ watching, planToWatch, completed, onHold, dropped }} onUpdateLists={updateLists} customImagePaths={customImagePaths} onSetCustomImage={(id, type, path) => setCustomImagePaths(prev => ({...prev, [id]: {...prev[id], [type === 'poster' ? 'poster_path' : 'backdrop_path']: path}}))} favorites={favorites} onToggleFavoriteShow={() => {}} onSelectShow={handleSelectShow} onOpenCustomListModal={() => {}} ratings={ratings} onRateItem={() => {}} onMarkMediaAsWatched={() => {}} onUnmarkMovieWatched={() => {}} onMarkSeasonWatched={() => {}} onUnmarkSeasonWatched={() => {}} onMarkPreviousEpisodesWatched={() => {}} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} onSelectPerson={() => {}} onStartLiveWatch={() => {}} onDeleteHistoryItem={() => {}} onClearMediaHistory={() => {}} episodeRatings={episodeRatings} onRateEpisode={() => {}} onAddWatchHistory={() => {}} onSaveComment={() => {}} comments={comments} onMarkRemainingWatched={() => {}} genres={genres} onMarkAllWatched={() => {}} onUnmarkAllWatched={() => {}} onSaveNote={() => {}} mediaNotes={mediaNotes} episodeNotes={episodeNotes} onSaveEpisodeNote={() => {}} showRatings={showRatings} seasonRatings={seasonRatings} onRateSeason={() => {}} customLists={customLists} currentUser={currentUser} allUsers={[]} reminders={reminders} onToggleReminder={() => {}} />
        ) : (
            <>
                {activeScreen === 'home' && <Dashboard userData={allUserData} onSelectShow={handleSelectShow} onSelectShowInModal={handleSelectShow} watchProgress={watchProgress} onToggleEpisode={() => {}} onShortcutNavigate={() => {}} onOpenAddToListModal={() => {}} setCustomLists={setCustomLists} liveWatchMedia={null} liveWatchElapsedSeconds={0} liveWatchIsPaused={false} onLiveWatchTogglePause={() => {}} onLiveWatchStop={() => {}} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={() => {}} favorites={favorites} pausedLiveSessions={{}} timezone={timezone} genres={genres} timeFormat="12h" reminders={reminders} onToggleReminder={() => {}} onUpdateLists={updateLists} />}
                {activeScreen === 'search' && <SearchScreen onSelectShow={handleSelectShow} onSelectPerson={() => {}} onSelectUser={() => {}} searchHistory={searchHistory} onUpdateSearchHistory={() => {}} query={searchQuery} onQueryChange={setSearchQuery} onMarkShowAsWatched={() => {}} onOpenAddToListModal={() => {}} onToggleFavoriteShow={() => {}} favorites={favorites} genres={genres} userData={allUserData} currentUser={currentUser} onToggleLikeList={() => {}} timezone={timezone} showRatings={showRatings}/>}
                {activeScreen === 'calendar' && <CalendarScreen userData={allUserData} onSelectShow={handleSelectShow} timezone={timezone} reminders={reminders} onToggleReminder={() => {}} onToggleEpisode={() => {}} watchProgress={watchProgress} allTrackedItems={[]} />}
                {activeScreen === 'progress' && <ProgressScreen userData={allUserData} onToggleEpisode={() => {}} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} onSelectShow={handleSelectShow} currentUser={currentUser} onAuthClick={onAuthClick} pausedLiveSessions={{}} onStartLiveWatch={() => {}} />}
                {activeScreen === 'profile' && <Profile userData={allUserData} genres={genres} onSelectShow={handleSelectShow} onImportCompleted={() => {}} onTraktImportCompleted={() => {}} onTmdbImportCompleted={() => {}} onToggleEpisode={() => {}} onUpdateLists={updateLists} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={() => {}} setCustomLists={setCustomLists} notificationSettings={notificationSettings} setNotificationSettings={setNotificationSettings} onDeleteHistoryItem={() => {}} onDeleteSearchHistoryItem={() => {}} onClearSearchHistory={() => {}} setHistory={setHistory} setWatchProgress={setWatchProgress} setEpisodeRatings={setEpisodeRatings} setFavoriteEpisodes={setFavoriteEpisodes} setTheme={setTheme} customThemes={customThemes} setCustomThemes={setCustomThemes} onLogout={onLogout} onUpdatePassword={onUpdatePassword} onUpdateProfile={onUpdateProfile} currentUser={currentUser} onAuthClick={onAuthClick} onForgotPasswordRequest={onForgotPasswordRequest} onForgotPasswordReset={onForgotPasswordReset} profilePictureUrl={profilePictureUrl} setProfilePictureUrl={setProfilePictureUrl} setCompleted={setCompleted} follows={{}} privacySettings={{activityVisibility: 'public'}} onSelectUser={() => {}} timezone={timezone} setTimezone={setTimezone} onRemoveDuplicateHistory={() => {}} notifications={[]} onMarkAllRead={() => {}} onMarkOneRead={() => {}} autoHolidayThemesEnabled={false} setAutoHolidayThemesEnabled={() => {}} holidayAnimationsEnabled={false} setHolidayAnimationsEnabled={() => {}} profileTheme={null} setProfileTheme={() => {}} textSize={1} setTextSize={() => {}} onFeedbackSubmit={() => {}} levelInfo={calculateLevelInfo(userXp)} timeFormat="12h" setTimeFormat={() => {}} pin={null} setPin={() => {}} showRatings={showRatings} setShowRatings={setShowRatings} setSeasonRatings={setSeasonRatings} />}
            </>
        )}
      </main>
      <BottomTabNavigator activeTab={activeScreen} onTabPress={handleTabPress} profilePictureUrl={profilePictureUrl} />
    </>
  );
};
