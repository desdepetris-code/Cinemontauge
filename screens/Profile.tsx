import React, { useState, useEffect, useMemo } from 'react';
import { UserData, HistoryItem, TrackedItem, WatchStatus, FavoriteEpisodes, ProfileTab, NotificationSettings, CustomList, WatchProgress, EpisodeRatings, UserRatings, Follows, PrivacySettings, AppNotification, ProfileTheme, SeasonRatings, LiveWatchMediaInfo, ShortcutSettings, NavSettings, AppPreferences, DeletedHistoryItem, DeletedNote, PendingRecommendationCheck, WeeklyPick } from '../types';
import { XMarkIcon, CogIcon, CloudArrowUpIcon, BellIcon, ChevronDownIcon, PushPinIcon, WavesIcon, ArrowTrendingUpIcon, CurlyLoopIcon, HourglassIcon, TargetIcon, CabinetIcon, TagIcon, ScrollIcon, QuillIcon, UserGroupIcon, MagnifyingGlassIcon, PencilSquareIcon, ArrowPathIcon, PhotoIcon, BadgeIcon } from '../components/Icons';
import ImportsScreen from './ImportsScreen';
import AchievementsScreen from './AchievementsScreen';
import { Settings } from './Settings';
import SeasonLogScreen from '../components/SeasonLogScreen';
import MyListsScreen from './MyListsScreen';
import HistoryScreen from './HistoryScreen';
import JournalWidget from '../components/profile/JournalWidget';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
import OverviewStats from '../components/profile/OverviewStats';
import StatsNarrative from '../components/StatsNarrative';
import StatsScreen from './StatsScreen';
import FriendsActivity from '../components/profile/FriendsActivity';
import LibraryScreen from './LibraryScreen';
import NotificationsModal from '../components/NotificationsModal';
import RecentActivityWidget from '../components/profile/RecentActivityWidget';
import AchievementsWidget from '../components/profile/AchievementsWidget';
import ListsWidget from '../components/profile/ListsWidget';
import WeeklyPicksScreen from './WeeklyPicksScreen';
import ProgressScreen from './ProgressScreen';
import UpdatesScreen from './UpdatesScreen';
import OngoingShowsScreen from './OngoingShowsScreen';
import AirtimeManagement from './AirtimeManagement';
import { PLACEHOLDER_PROFILE } from '../constants';
import Carousel from '../components/Carousel';
import { supabase } from '../services/supabaseClient';
import { confirmationService } from '../services/confirmationService';

interface User {
  id: string;
  username: string;
  email: string;
}

const ProfilePictureModal: React.FC<{ isOpen: boolean; onClose: () => void; currentUrl: string | null; userId: string; onSave: (url: string | null) => Promise<void>; }> = ({ isOpen, onClose, currentUrl, userId, onSave }) => {
    const [url, setUrl] = useState(currentUrl || '');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => { if (isOpen) setUrl(currentUrl || ''); }, [isOpen, currentUrl]);
    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setIsUploading(true);
        try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (authError || !authData?.user) {
              throw new Error("User not authenticated");
            }

            const user = authData.user;
            const filePath = `${user.id}/avatar.png`;

            const { error: uploadError } = await supabase.storage
              .from("avatars")
              .upload(filePath, file, { upsert: true });

            if (uploadError) {
              throw uploadError;
            }
            
            const { data: publicUrlData } = supabase.storage
              .from("avatars")
              .getPublicUrl(filePath);
            
            const publicUrl = publicUrlData.publicUrl;

            const { error: profileUpdateError } = await supabase
              .from('profiles')
              .update({ avatar_url: publicUrl })
              .eq('id', user.id);

            if (profileUpdateError) {
              throw profileUpdateError;
            }
            
            await onSave(publicUrl);
            setUrl(publicUrl);
            confirmationService.show("Visual identity updated in registry.");
            onClose();
        } catch (error: any) { 
            console.error("Registry sync failed:", error);
            alert('Update failed: ' + error.message); 
        } finally { 
            setIsUploading(false); 
        }
    };

    const handleManualSave = async () => {
        setIsUploading(true);
        try {
            await onSave(url || null);
            confirmationService.show("Avatar URL updated.");
            onClose();
        } catch (e) {
            console.error(e);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-white/10 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-text-secondary hover:text-white"><XMarkIcon className="w-5 h-5" /></button>
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Update Avatar</h2>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-2 opacity-60">Visual Identity Registry</p>
                </div>
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <img src={url || PLACEHOLDER_PROFILE} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-bg-secondary shadow-2xl" />
                        {isUploading && <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center"><ArrowPathIcon className="w-8 h-8 text-white animate-spin" /></div>}
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-1 block">Direct Image URL</label>
                        <input type="text" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} className="w-full p-4 bg-bg-secondary rounded-2xl text-text-primary border border-white/10 focus:border-primary-accent outline-none" />
                    </div>
                    <label className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-bg-secondary border border-white/10 cursor-pointer hover:border-primary-accent transition-all shadow-inner ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <CloudArrowUpIcon className="w-5 h-5 text-primary-accent" /> 
                        <span className="text-xs font-black uppercase tracking-widest">{isUploading ? 'Syncing...' : 'Upload Photo'}</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} disabled={isUploading} />
                    </label>
                </div>
                <div className="mt-8 flex flex-col gap-2">
                    <button onClick={handleManualSave} className="w-full py-5 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform" disabled={isUploading}>Save Avatar</button>
                    <button onClick={onClose} className="w-full py-2 text-[9px] font-black text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors">Cancel</button>
                </div>
            </div>
        </div>
    );
};

interface ProfileProps {
  userData: UserData;
  genres: Record<number, string>;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  onImportCompleted: (historyItems: HistoryItem[], completedItems: TrackedItem[]) => void;
  onTraktImportCompleted: (data: any) => void;
  onTmdbImportCompleted: (data: any) => void;
  onJsonImportCompleted: (data: any) => void;
  onToggleEpisode: (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
  initialTab?: ProfileTab;
  initialLibraryStatus?: WatchStatus;
  notificationSettings: NotificationSettings;
  setNotificationSettings: React.Dispatch<React.SetStateAction<NotificationSettings>>;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  setWatchProgress: React.Dispatch<React.SetStateAction<WatchProgress>>;
  setEpisodeRatings: React.Dispatch<React.SetStateAction<EpisodeRatings>>;
  setFavoriteEpisodes: React.Dispatch<React.SetStateAction<FavoriteEpisodes>>;
  setTheme: (themeId: string) => void;
  baseThemeId: string;
  onLogout: () => void;
  onUpdatePassword: (passwords: { currentPassword: string; newPassword: string; }) => Promise<string | null>;
  onUpdateProfile: (details: { username: string; email: string; }) => Promise<string | null>;
  currentUser: User | null;
  onAuthClick: () => void;
  onForgotPasswordRequest: (email: string) => Promise<string | null>;
  onForgotPasswordReset: (data: { code: string; newPassword: string; }) => Promise<string | null>;
  profilePictureUrl: string | null;
  setProfilePictureUrl: (url: string | null) => void;
  setCompleted: React.Dispatch<React.SetStateAction<TrackedItem[]>>;
  follows: Follows;
  privacySettings: PrivacySettings;
  setPrivacySettings: React.Dispatch<React.SetStateAction<PrivacySettings>>;
  onSelectUser: (userId: string) => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
  onRemoveDuplicateHistory: () => void;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onMarkOneRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onAddNotifications: (notifs: AppNotification[]) => void;
  profileTheme: ProfileTheme | null;
  setProfileTheme: React.Dispatch<React.SetStateAction<ProfileTheme | null>>;
  textSize: number;
  setTextSize: React.Dispatch<React.SetStateAction<number>>;
  onFeedbackSubmit: () => void;
  levelInfo: any;
  timeFormat: '12h' | '24h';
  setTimeFormat: React.Dispatch<React.SetStateAction<'12h' | '24h'>>;
  pin: string | null;
  setPin: React.Dispatch<React.SetStateAction<string | null>>;
  showRatings: boolean;
  setShowRatings: React.Dispatch<React.SetStateAction<boolean>>;
  setSeasonRatings: React.Dispatch<React.SetStateAction<SeasonRatings>>;
  onToggleWeeklyFavorite: (item: WeeklyPick, replacementId?: number) => void;
  onOpenNominateModal: () => void;
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  shortcutSettings: ShortcutSettings;
  setShortcutSettings: React.Dispatch<React.SetStateAction<ShortcutSettings>>;
  navSettings: NavSettings;
  setNavSettings: React.Dispatch<React.SetStateAction<NavSettings>>;
  preferences: AppPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<AppPreferences>>;
  onPermanentDeleteHistoryItem: (logId: string) => void;
  onRestoreHistoryItem: (item: DeletedHistoryItem) => void;
  onClearAllDeletedHistory: () => void;
  onPermanentDeleteNote: (noteId: string) => void;
  onRestoreNote: (note: DeletedNote) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
}

const Profile: React.FC<ProfileProps> = (props) => {
  const { userData, genres, onSelectShow, initialTab = 'overview', currentUser, profilePictureUrl, setProfilePictureUrl } = props;
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);

  useEffect(() => { setActiveTab(initialTab); }, [initialTab]);

  const stats = useCalculatedStats(userData);
  const unreadCount = props.notifications.filter(n => !n.read).length;

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: PushPinIcon },
    { id: 'progress', label: 'Progress', icon: ArrowTrendingUpIcon },
    { id: 'history', label: 'History', icon: WavesIcon },
    { id: 'library', label: 'Library', icon: CabinetIcon },
    { id: 'lists', label: 'Lists', icon: TagIcon },
    { id: 'activity', label: 'Activity', icon: UserGroupIcon },
    { id: 'stats', label: 'Stats', icon: MagnifyingGlassIcon },
    { id: 'seasonLog', label: 'Season Log', icon: ScrollIcon },
    { id: 'journal', label: 'Journal', icon: QuillIcon },
    { id: 'achievements', label: 'Awards', icon: BadgeIcon },
    { id: 'updates', label: 'Updates', icon: CurlyLoopIcon },
    { id: 'ongoing', label: 'Catch Up', icon: HourglassIcon },
    { id: 'weeklyPicks', label: 'Weekly Picks', icon: TargetIcon },
    { id: 'imports', label: 'Imports', icon: CloudArrowUpIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
        case 'overview':
            return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
                    <div className="lg:col-span-2 space-y-8">
                        <StatsNarrative stats={stats} genres={genres} userData={userData} currentUser={currentUser} />
                        <RecentActivityWidget history={userData.history} onSelectShow={onSelectShow} />
                        <AchievementsWidget userData={userData} onNavigate={() => setActiveTab('achievements')} />
                    </div>
                    <div className="space-y-8">
                        <ListsWidget watching={userData.watching} planToWatch={userData.planToWatch} customLists={userData.customLists} onNavigate={() => setActiveTab('lists')} />
                        <FriendsActivity currentUser={currentUser} follows={props.follows} onSelectShow={onSelectShow} onSelectUser={props.onSelectUser} />
                    </div>
                </div>
            );
        case 'progress': return <ProgressScreen {...props} />;
        case 'history': return <HistoryScreen {...props} />;
        case 'library': return <LibraryScreen {...props} initialStatus={props.initialLibraryStatus} />;
        case 'lists': return <MyListsScreen {...props} />;
        case 'activity': return <FriendsActivity currentUser={currentUser} follows={props.follows} onSelectShow={onSelectShow} onSelectUser={props.onSelectUser} />;
        case 'stats': return <StatsScreen {...props} />;
        case 'seasonLog': return <SeasonLogScreen userData={userData} onSelectShow={onSelectShow} />;
        case 'journal': return <JournalWidget userData={userData} onSelectShow={onSelectShow} isFullScreen={true} />;
        case 'achievements': return <AchievementsScreen userData={userData} />;
        case 'imports': return <ImportsScreen {...props} />;
        case 'settings': return <Settings {...props} onTabNavigate={setActiveTab} />;
        case 'updates': return <UpdatesScreen {...props} />;
        case 'weeklyPicks': return <WeeklyPicksScreen {...props} onRemovePick={props.onToggleWeeklyFavorite} onNominate={props.onOpenNominateModal} />;
        case 'ongoing': return <OngoingShowsScreen userData={userData} onSelectShow={onSelectShow} />;
        case 'airtime_management': return <AirtimeManagement onBack={() => setActiveTab('settings')} userData={userData} setPendingRecommendationChecks={props.setPendingRecommendationChecks} setFailedRecommendationReports={props.setFailedRecommendationReports} />;
        default: return null;
    }
  };

  return (
    <div className="animate-fade-in pb-24 max-w-7xl mx-auto px-4" style={{ fontFamily: props.profileTheme?.fontFamily || 'inherit' }}>
        <ProfilePictureModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} currentUrl={profilePictureUrl} userId={currentUser?.id || 'guest'} onSave={async (url) => setProfilePictureUrl(url)} />
        <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)} notifications={props.notifications} onMarkAllRead={props.onMarkAllRead} onMarkOneRead={props.onMarkOneRead} onDeleteNotification={props.onDeleteNotification} onSelectShow={onSelectShow} onSelectUser={props.onSelectUser} />

        <div className="relative mb-12">
            <div className="h-64 md:h-80 w-full rounded-[3rem] overflow-hidden shadow-2xl relative border border-white/10 group/banner">
                {props.profileTheme?.backgroundImage ? (
                    <img src={props.profileTheme.backgroundImage} alt="" className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover/banner:grayscale-0 group-hover/banner:scale-105" />
                ) : (
                    <div className="w-full h-full nav-spectral-bg animate-spectral-flow opacity-20"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent"></div>
            </div>

            <div className="max-w-6xl mx-auto px-6 -mt-20 md:-mt-32 relative z-10">
                <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 group/avatar">
                        <div className="relative cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
                            <img src={profilePictureUrl || PLACEHOLDER_PROFILE} alt="Profile" className="w-32 h-32 md:w-48 md:h-48 rounded-full object-cover border-4 border-bg-primary shadow-2xl transition-all group-hover/avatar:scale-105 group-hover/avatar:border-primary-accent" />
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all">
                                <PhotoIcon className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl md:text-6xl font-black text-text-primary uppercase tracking-tighter leading-none mb-4 drop-shadow-xl">
                                {currentUser?.username || 'GUEST_USER'}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <div className="px-4 py-1.5 bg-primary-accent text-on-accent rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                                    <BadgeIcon className="w-4 h-4" />
                                    LVL {props.levelInfo.level}
                                </div>
                                <div className="px-4 py-1.5 bg-bg-secondary/80 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-text-primary border border-white/10 shadow-lg">
                                    {stats.totalEpisodesWatched + stats.moviesCompleted} Registry Entries
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-3 pb-2">
                        <button onClick={() => setIsNotificationsModalOpen(true)} className="relative p-4 bg-bg-secondary/60 backdrop-blur-xl rounded-2xl border border-white/10 text-text-primary hover:text-primary-accent transition-all shadow-xl group">
                            <BellIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                            {unreadCount > 0 && <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-bg-primary flex items-center justify-center text-[8px] font-black">{unreadCount}</span>}
                        </button>
                        <button onClick={() => setActiveTab('settings')} className="p-4 bg-bg-secondary/60 backdrop-blur-xl rounded-2xl border border-white/10 text-text-primary hover:text-primary-accent transition-all shadow-xl group">
                            <CogIcon className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div className="sticky top-16 bg-bg-primary/95 backdrop-blur-xl z-40 -mx-4 px-4 py-6 border-b border-white/5">
            <Carousel>
                <div className="flex space-x-3 overflow-x-auto hide-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border whitespace-nowrap ${
                                activeTab === tab.id 
                                    ? 'bg-accent-gradient text-on-accent border-transparent shadow-[0_10px_30px_-10px_var(--color-accent-primary)] scale-110' 
                                    : 'bg-bg-secondary/40 text-text-primary border-white/10 hover:bg-bg-secondary'
                            }`}
                        >
                            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-primary-accent opacity-60'}`} />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </Carousel>
        </div>

        <div className="pt-12 min-h-[60vh]">
            {renderContent()}
        </div>
    </div>
  );
};

export default Profile;