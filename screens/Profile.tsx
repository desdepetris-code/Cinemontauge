import React, { useState, useEffect, useMemo } from 'react';
import { UserData, HistoryItem, TrackedItem, WatchStatus, FavoriteEpisodes, ProfileTab, NotificationSettings, CustomList, WatchProgress, EpisodeRatings, UserRatings, Follows, PrivacySettings, AppNotification, ProfileTheme, SeasonRatings, LiveWatchMediaInfo, ShortcutSettings, NavSettings, AppPreferences, DeletedHistoryItem, DeletedNote, PendingRecommendationCheck } from '../types';
import { XMarkIcon, CogIcon, CloudArrowUpIcon, BellIcon, ChevronDownIcon, PushPinIcon, WavesIcon, ArrowTrendingUpIcon, CurlyLoopIcon, HourglassIcon, TargetIcon, CabinetIcon, BadgeIcon, TagIcon, ScrollIcon, QuillIcon, UserGroupIcon, MagnifyingGlassIcon, PencilSquareIcon, ArrowPathIcon } from '../components/Icons';
import ImportsScreen from './ImportsScreen';
import AchievementsScreen from './AchievementsScreen';
import { Settings } from './Settings';
import SeasonLogScreen from '../components/SeasonLogScreen';
import MyListsScreen from './MyListsScreen';
import HistoryScreen from './HistoryScreen';
import JournalWidget from '../components/profile/JournalWidget';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
import { useAchievements } from '../hooks/useAchievements';
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

const ProfilePictureModal: React.FC<{ isOpen: boolean; onClose: () => void; currentUrl: string | null; userId: string; onSave: (url: string | null) => void; }> = ({ isOpen, onClose, currentUrl, userId, onSave }) => {
    const [url, setUrl] = useState(currentUrl || '');
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => { if (isOpen) setUrl(currentUrl || ''); }, [isOpen, currentUrl]);
    if (!isOpen) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setUrl(publicUrl);
            // Auto-save on successful upload
            onSave(publicUrl);
            confirmationService.show("Avatar uploaded to registry.");
            onClose();
        } catch (error: any) { 
            console.error("Upload failed:", error);
            alert('Upload failed: ' + error.message); 
        } finally { 
            setIsUploading(false); 
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 border border-white/10 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-text-secondary hover:text-text-primary"><XMarkIcon className="w-5 h-5" /></button>
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
                    <label className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-bg-secondary border border-white/10 cursor-pointer hover:border-primary-accent transition-all shadow-inner">
                        <CloudArrowUpIcon className="w-5 h-5 text-primary-accent" /> <span className="text-xs font-black uppercase tracking-widest">Upload Local File</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                </div>
                <div className="mt-8 flex flex-col gap-2">
                    <button onClick={() => { onSave(url || null); onClose(); }} className="w-full py-5 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform">Save Avatar</button>
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
  onRestoreHistoryItem: (item: DeletedHistoryItem) => void;
  onPermanentDeleteHistoryItem: (logId: string) => void;
  onClearAllDeletedHistory: () => void;
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
  onAddNotifications: (notifs: AppNotification[]) => void;
  onDeleteNotification: (id: string) => void;
  profileTheme: ProfileTheme | null;
  setProfileTheme: React.Dispatch<React.SetStateAction<ProfileTheme | null>>;
  textSize: number;
  setTextSize: React.Dispatch<React.SetStateAction<number>>;
  onFeedbackSubmit: () => void;
  levelInfo: { level: number; xp: number; xpForNextLevel: number; xpProgress: number; progressPercent: number; };
  timeFormat: '12h' | '24h';
  setTimeFormat: React.Dispatch<React.SetStateAction<'12h' | '24h'>>;
  pin: string | null;
  setPin: React.Dispatch<React.SetStateAction<string | null>>;
  showRatings: boolean;
  setShowRatings: React.Dispatch<React.SetStateAction<boolean>>;
  setSeasonRatings: React.Dispatch<React.SetStateAction<SeasonRatings>>;
  onToggleWeeklyFavorite: (item: TrackedItem) => void;
  onOpenNominateModal: () => void;
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  shortcutSettings: ShortcutSettings;
  setShortcutSettings: React.Dispatch<React.SetStateAction<ShortcutSettings>>;
  navSettings: NavSettings;
  setNavSettings: React.Dispatch<React.SetStateAction<NavSettings>>;
  preferences: AppPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<AppPreferences>>;
  onPermanentDeleteNote: (noteId: string) => void;
  onRestoreNote: (note: DeletedNote) => void;
  onTabNavigate?: (tabId: string) => void;
  viewerId?: string; 
  isFollowerOfProfile?: boolean;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  favoriteEpisodes: FavoriteEpisodes;
  setPendingRecommendationChecks: React.Dispatch<React.SetStateAction<PendingRecommendationCheck[]>>;
  setFailedRecommendationReports: React.Dispatch<React.SetStateAction<TrackedItem[]>>;
}

const Profile: React.FC<ProfileProps> = (props) => {
  const { userData, genres, onSelectShow, initialTab, initialLibraryStatus, currentUser, onLogout, profilePictureUrl, setProfilePictureUrl, follows, privacySettings, setPrivacySettings, levelInfo, viewerId, isFollowerOfProfile, notifications, preferences, onMarkAllRead, onMarkOneRead, onDeleteNotification, onSelectUser } = props;
  
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab || 'overview');
  const [isPicModalOpen, setIsPicModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  
  const stats = useCalculatedStats(userData);
  const { badges } = useAchievements(userData);

  useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);

  const handleTabNavigate = (tabId: string) => {
      setActiveTab(tabId as ProfileTab);
      window.scrollTo(0, 0);
  };

  const auraStyle = useMemo(() => {
    if (badges.length === 0) return '';
    const topTier = Math.max(...badges.map(b => b.tier));
    if (topTier === 3) return 'shadow-[0_0_40px_rgba(234,179,8,0.5)] border-yellow-500/50';
    if (topTier === 2) return 'shadow-[0_0_30px_rgba(148,163,184,0.4)] border-slate-400/50';
    return 'shadow-[0_0_20px_rgba(var(--color-accent-primary-rgb),0.3)] border-primary-accent/30';
  }, [badges]);

  const badgeOrbit = useMemo(() => {
      if (!preferences.showBadgesOnProfile || badges.length === 0) return null;
      const radius = 100; 
      const orbitItems = badges.slice(0, 12);
      return orbitItems.map((badge, index) => {
          const angle = (index / orbitItems.length) * 2 * Math.PI - Math.PI / 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          return (
              <div 
                  key={badge.id}
                  className="absolute z-30 transition-all duration-1000 group/badge pointer-events-auto"
                  style={{ transform: `translate(calc(50% + ${x}px - 14px), calc(50% + ${y}px - 14px))`, left: '0', top: '0' }}
                  title={`${badge.name}: ${badge.description}`}
              >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg bg-bg-secondary border-2 shadow-xl backdrop-blur-md transition-transform hover:scale-125 cursor-help ${
                      badge.tier === 3 ? 'border-yellow-500 shadow-yellow-500/30' :
                      badge.tier === 2 ? 'border-slate-400 shadow-slate-400/30' :
                      'border-primary-accent shadow-primary-accent/30'
                  }`}>
                      <span className="drop-shadow-md">{badge.icon}</span>
                  </div>
              </div>
          );
      });
  }, [badges, preferences.showBadgesOnProfile]);

  const tabs: { id: ProfileTab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: PushPinIcon },
    { id: 'history', label: 'Overall History', icon: WavesIcon }, 
    { id: 'progress', label: 'Progress', icon: ArrowTrendingUpIcon },
    { id: 'updates', label: 'Updates', icon: CurlyLoopIcon },
    { id: 'ongoing', label: 'Catch Up', icon: HourglassIcon },
    { id: 'weeklyPicks', label: 'Weekly Picks', icon: TargetIcon },
    { id: 'library', label: 'Library', icon: CabinetIcon },
    { id: 'achievements', label: 'Main Achievements', icon: BadgeIcon },
    { id: 'lists', label: 'Custom Lists', icon: TagIcon },
    { id: 'seasonLog', label: 'Season Logs', icon: ScrollIcon },
    { id: 'journal', label: 'Journal', icon: QuillIcon },
    { id: 'activity', label: 'Social Feed', icon: UserGroupIcon },
    { id: 'stats', label: 'Analytics', icon: MagnifyingGlassIcon },
    { id: 'imports', label: 'Import and Sync', icon: CloudArrowUpIcon },
    { id: 'settings', label: 'Settings', icon: CogIcon },
  ];

  const unreadNotifCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <StatsNarrative stats={stats} genres={genres} userData={userData} currentUser={currentUser} />
            <OverviewStats stats={stats} />
            <FriendsActivity currentUser={props.currentUser} follows={props.follows} onSelectShow={onSelectShow} onSelectUser={props.onSelectUser} />
          </div>
          <div className="lg:col-span-1 space-y-8">
            <RecentActivityWidget history={userData.history} onSelectShow={onSelectShow} />
            <AchievementsWidget userData={userData} onNavigate={() => setActiveTab('achievements')} />
            <ListsWidget watching={userData.watching} planToWatch={userData.planToWatch} customLists={userData.customLists} isOwnProfile={!viewerId || viewerId === currentUser?.id} isFollower={isFollowerOfProfile} onNavigate={() => setActiveTab('lists')} />
          </div>
        </div>
      );
      case 'ongoing': return <OngoingShowsScreen userData={userData} onSelectShow={onSelectShow as any} />;
      case 'updates': return <UpdatesScreen userData={userData} onSelectShow={onSelectShow} onAddNotifications={props.onAddNotifications} />;
      case 'progress': return <ProgressScreen {...props} pausedLiveSessions={props.pausedLiveSessions} onStartLiveWatch={props.onStartLiveWatch} />;
      case 'library': return <LibraryScreen userData={userData} genres={genres} onSelectShow={onSelectShow} preferences={props.preferences} initialStatus={initialLibraryStatus} onUpdateLists={props.onUpdateLists} />;
      case 'achievements': return <AchievementsScreen userData={userData} />;
      case 'lists': return <MyListsScreen userData={userData} onSelectShow={onSelectShow} setCustomLists={props.setCustomLists} genres={genres} preferences={props.preferences} />;
      case 'history': return <HistoryScreen userData={userData} onSelectShow={onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} onRestoreHistoryItem={props.onRestoreHistoryItem} onPermanentDeleteHistoryItem={props.onPermanentDeleteHistoryItem} onClearAllDeletedHistory={props.onClearAllDeletedHistory} onDeleteSearchHistoryItem={props.onDeleteSearchHistoryItem} onClearSearchHistory={props.onClearSearchHistory} genres={genres} timezone={props.timezone} onPermanentDeleteNote={props.onPermanentDeleteNote} onRestoreNote={props.onRestoreNote} />;
      case 'stats': return <StatsScreen userData={userData} genres={genres} />;
      case 'seasonLog': return <SeasonLogScreen userData={userData} onSelectShow={onSelectShow} />;
      case 'journal': return <JournalWidget userData={userData} onSelectShow={onSelectShow} isFullScreen />;
      case 'imports': return <ImportsScreen userData={userData} onImportCompleted={props.onImportCompleted} onTraktImportCompleted={props.onTraktImportCompleted} onTmdbImportCompleted={props.onTmdbImportCompleted} onJsonImportCompleted={props.onJsonImportCompleted} />;
      case 'settings': return <Settings {...props} userLevel={levelInfo.level} baseThemeId={props.baseThemeId} onTabNavigate={handleTabNavigate} />;
      case 'weeklyPicks': return <WeeklyPicksScreen userData={userData} onSelectShow={onSelectShow} onRemovePick={props.onToggleWeeklyFavorite} onNominate={props.onOpenNominateModal} />;
      case 'airtime_management': return <AirtimeManagement onBack={() => setActiveTab('settings')} userData={userData} setPendingRecommendationChecks={props.setPendingRecommendationChecks} setFailedRecommendationReports={props.setFailedRecommendationReports} />;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-32">
        <ProfilePictureModal isOpen={isPicModalOpen} onClose={() => setIsPicModalOpen(false)} currentUrl={profilePictureUrl} userId={currentUser?.id || 'guest'} onSave={setProfilePictureUrl} />
        
        <NotificationsModal 
            isOpen={isNotificationsModalOpen} 
            onClose={() => setIsNotificationsModalOpen(false)} 
            notifications={notifications} 
            onMarkAllRead={onMarkAllRead} 
            onMarkOneRead={onMarkOneRead} 
            onDeleteNotification={onDeleteNotification}
            onSelectShow={onSelectShow} 
            onSelectUser={onSelectUser} 
        />

        <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-20 relative pt-12">
            <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 pointer-events-none">
                    {badgeOrbit}
                </div>

                <div className={`relative z-10 w-44 h-44 rounded-full transition-all duration-1000 ${auraStyle}`} onClick={() => setIsPicModalOpen(true)}>
                    <img src={profilePictureUrl || PLACEHOLDER_PROFILE} alt="Profile" className="w-full h-full rounded-full object-cover bg-bg-secondary border-4 border-bg-primary cursor-pointer relative z-10" />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <PencilSquareIcon className="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>
            
            <div className="flex-grow text-center md:text-left space-y-2">
                <div className="flex items-center justify-center md:justify-start gap-4">
                    <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter">{currentUser?.username || 'Guest Identity'}</h1>
                    <div className="px-4 py-1.5 bg-bg-secondary/40 border border-white/10 rounded-2xl shadow-inner backdrop-blur-md">
                        <span className="text-xs font-black text-primary-accent uppercase tracking-widest">Level {levelInfo.level}</span>
                    </div>
                </div>
                <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.2em] opacity-60">{currentUser?.email || 'Archive access limited'}</p>
            </div>

            <div className="flex-shrink-0 flex items-center gap-3">
                <button 
                    onClick={() => setIsNotificationsModalOpen(true)} 
                    className="p-4 rounded-2xl bg-bg-secondary/40 border border-white/5 text-text-primary hover:border-primary-accent/50 hover:brightness-125 transition-all shadow-xl relative backdrop-blur-md group/bell"
                >
                    <BellIcon className={`w-6 h-6 ${unreadNotifCount > 0 ? 'text-primary-accent animate-pulse' : ''}`} />
                    {unreadNotifCount > 0 && (
                        <div className="absolute top-2.5 right-2.5 min-w-[18px] h-[18px] px-1 bg-primary-accent text-on-accent rounded-full border-2 border-bg-primary shadow-[0_0_10px_var(--color-accent-primary)] flex items-center justify-center text-[8px] font-black">
                            {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                        </div>
                    )}
                </button>
                <button onClick={() => setActiveTab('settings')} className="p-4 rounded-2xl bg-bg-secondary/40 border border-white/5 text-text-primary hover:border-primary-accent/50 hover:brightness-125 transition-all shadow-xl backdrop-blur-md">
                    <CogIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
        
        <div className="mb-10 sticky top-16 bg-bg-primary/95 backdrop-blur-xl z-40 -mx-4 px-4 py-4 border-b border-white/5">
            {preferences.tabNavigationStyle === 'scroll' ? (
                <Carousel>
                    <div className="flex space-x-3 overflow-x-auto pb-2 hide-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center space-x-3 px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap rounded-full transition-all border ${
                                    activeTab === tab.id 
                                        ? 'bg-primary-accent/20 text-primary-accent border-primary-accent shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)] scale-105' 
                                        : 'bg-bg-secondary/20 text-text-secondary border-white/5 hover:border-white/20 hover:text-text-primary'
                                }`}
                            >
                                <tab.icon className={`w-4 h-4 transition-colors ${activeTab === tab.id ? 'text-primary-accent' : 'text-text-secondary'}`} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </Carousel>
            ) : (
                <div className="max-w-md mx-auto relative group">
                    <select 
                        value={activeTab}
                        onChange={(e) => setActiveTab(e.target.value as ProfileTab)}
                        className="w-full appearance-none bg-bg-secondary/40 border border-primary-accent/30 rounded-2xl py-4 px-6 text-xs font-black uppercase tracking-[0.2em] text-text-primary focus:outline-none focus:border-primary-accent shadow-xl backdrop-blur-md transition-all pr-12"
                    >
                        {tabs.map(tab => (
                            <option key={tab.id} value={tab.id}>{tab.label}</option>
                        ))}
                    </select>
                    <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-accent pointer-events-none group-hover:scale-110 transition-transform" />
                </div>
            )}
        </div>

        <div className="animate-fade-in min-h-[40vh]">
            {renderContent()}
        </div>
    </div>
  );
};

export default Profile;