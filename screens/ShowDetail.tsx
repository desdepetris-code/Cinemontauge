
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, clearMediaCache } from '../services/tmdbService';
import { getSeasonEpisodesPrecision, getMoviePrecision } from '../services/traktService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, WatchProviderResponse, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo, EpisodeRatings, Comment, SeasonRatings, PublicUser, Note, EpisodeProgress, UserData, AppPreferences, Follows, CommentVisibility, WeeklyPick, DeletedHistoryItem, Reminder, ReminderType, AppNotification, PendingRecommendationCheck } from '../types';
import { ChevronLeftIcon, BookOpenIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, PlayCircleIcon, HeartIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, XMarkIcon, ChatBubbleLeftRightIcon, CalendarIcon, LogWatchIcon, PencilSquareIcon, PhotoIcon, BadgeIcon, SparklesIcon, QuestionMarkCircleIcon, TrophyIcon, InformationCircleIcon, UsersIcon, BellIcon, RectangleStackIcon, WritingBookIcon, Squares2X2Icon, ShareIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from '../components/FallbackImage';
import SeasonAccordion from '../components/SeasonAccordion';
import NextUpWidget from '../components/NextUpWidget';
import HistoryModal from '../components/HistoryModal';
import RatingModal from '../components/RatingModal';
import EpisodeDetailModal from '../components/EpisodeDetailModal';
import OverallProgress from '../components/OverallProgress';
import ScoreStar from '../components/ScoreStar';
import { getShowStatus } from '../utils/statusUtils';
import CastAndCrew from '../components/CastAndCrew';
import MoreInfo from '../components/MoreInfo';
import WhereToWatch from '../components/WhereToWatch';
import RecommendedMedia from '../components/RecommendedMedia';
import CustomizeTab from '../components/CustomizeTab';
import ShowAchievementsTab from '../components/ShowAchievementsTab';
import CommentsTab from '../components/CommentsTab';
import MarkAsWatchedModal, { LogWatchScope } from '../components/MarkAsWatchedModal';
import NotesModal from '../components/NotesModal';
import JournalModal from '../components/JournalModal';
import WatchlistModal from '../components/WatchlistModal';
import ReportIssueModal from '../components/ReportIssueModal';
import AirtimeRequestModal from '../components/AirtimeRequestModal';
import CommentModal from '../components/CommentModal';
import { confirmationService } from '../services/confirmationService';
import NominationModal from '../components/NominationModal';
import UserRatingStamp from '../components/UserRatingStamp';
import { getDominantColor } from '../utils/colorUtils';
import Carousel from '../components/Carousel';
import ReminderOptionsModal from '../components/ReminderOptionsModal';

interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  onBack: () => void;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  trackedLists: { watching: TrackedItem[], planToWatch: TrackedItem[], completed: TrackedItem[], onHold: TrackedItem[], dropped: TrackedItem[], allCaughtUp: TrackedItem[] };
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  customImagePaths: CustomImagePaths;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  onRemoveCustomImage: (mediaId: number, url: string) => void;
  onResetCustomImage: (mediaId: number, type: 'poster' | 'backdrop') => void;
  favorites: TrackedItem[];
  onToggleFavoriteShow: (item: TrackedItem) => void;
  weeklyFavorites: WeeklyPick[];
  weeklyFavoritesHistory?: Record<string, WeeklyPick[]>;
  onToggleWeeklyFavorite: (item: WeeklyPick, replacementId?: number) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie' | 'person') => void;
  onOpenCustomListModal: (item: any) => void;
  ratings: UserRatings;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onRateItem: (mediaId: number, rating: number) => void;
  onMarkMediaAsWatched: (item: any, date?: string) => void;
  onUnmarkMovieWatched: (mediaId: number, deleteLive?: boolean) => void;
  onMarkSeasonWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
  onMarkPreviousEpisodesWatched: (showId: number, seasonNumber: number, lastEpisodeNumber: number) => void;
  onUnmarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onSelectPerson: (personId: number) => void;
  onSelectShowInModal: (id: number, media_type: 'tv' | 'movie') => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  onAddWatchHistoryBulk: (item: TrackedItem, episodeIds: number[], timestamp: string, note: string) => void;
  onAddNotifications: (notifs: AppNotification[]) => void;
  onSaveComment: (commentData: any) => void;
  comments: Comment[];
  genres: Record<number, string>;
  onMarkAllWatched: (showId: number, showInfo: TrackedItem) => void;
  onUnmarkAllWatched: (showId: number) => void;
  onSaveEpisodeNote: (showId: number, seasonNumber: number, episodeNumber: number, note: string) => void;
  showRatings: boolean;
  seasonRatings: SeasonRatings;
  onRateSeason: (showId: number, seasonNumber: number, rating: number) => void;
  onRateEpisode: (showId: number, seasonNumber: number, episodeNumber: number, rating: number) => void;
  customLists: CustomList[];
  currentUser: any;
  allUsers: PublicUser[];
  mediaNotes?: Record<number, Note[]>;
  onSaveMediaNote: (mediaId: number, notes: Note[]) => void;
  allUserData: UserData;
  episodeNotes?: Record<number, Record<number, Record<number, Note[]>>>;
  onOpenAddToListModal: (item: any) => void;
  preferences: AppPreferences;
  follows: Follows;
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
  onAuthClick: () => void;
  onNoteDeleted: (note: Note, mediaTitle: string, context: string) => void;
  onSetCustomEpisodeImage: (showId: number, season: number, episode: number, imagePath: string) => void;
  onClearMediaHistory: (mediaId: number, mediaType: 'tv' | 'movie') => void;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  episodeRatings: EpisodeRatings;
  pendingRecommendationChecks: PendingRecommendationCheck[];
  setPendingRecommendationChecks: React.Dispatch<React.SetStateAction<PendingRecommendationCheck[]>>;
}

type TabType = 'seasons' | 'specials' | 'info' | 'cast' | 'discussion' | 'recs' | 'customize' | 'achievements';

const DetailedActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
  isActive?: boolean;
  disabled?: boolean;
}> = ({ icon, label, onClick, className = "", isActive, disabled }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all group relative h-20 ${className} ${
      isActive 
        ? 'bg-white/20 border-white active-glow shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
        : 'border-white/10 bg-bg-secondary/40 hover:bg-bg-secondary/60 hover:border-white/30'
    } ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
  >
    <div className={`transition-all ${isActive ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
        {icon}
    </div>
    <div className="mt-2 min-h-[14px] flex items-center justify-center">
        <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight text-white">{label}</span>
    </div>
  </button>
);

const ShowDetail: React.FC<ShowDetailProps> = (props) => {
  const { 
    id, mediaType, onBack, watchProgress, history, trackedLists, onUpdateLists, customImagePaths, 
    favorites, onToggleFavoriteShow, onRateItem, ratings, showRatings, currentUser, customLists, 
    episodeRatings, favoriteEpisodes, comments, seasonRatings, genres, mediaNotes = {}, onSaveMediaNote, 
    weeklyFavorites, onToggleWeeklyFavorite, allUserData, episodeNotes, preferences, follows,
    onMarkMediaAsWatched, onAddWatchHistory, onStartLiveWatch, onUnmarkAllWatched, onMarkAllWatched,
    onRateEpisode, onToggleFavoriteEpisode, onSaveComment, onMarkPreviousEpisodesWatched,
    onMarkSeasonWatched, onUnmarkSeasonWatched, onSaveEpisodeNote, onRateSeason, onOpenAddToListModal,
    onSelectShow, onSelectPerson, onDeleteHistoryItem, onClearMediaHistory, pausedLiveSessions, onAuthClick, onNoteDeleted,
    onSetCustomEpisodeImage, onSetCustomImage, onRemoveCustomImage, onResetCustomImage, reminders, onToggleReminder,
    pendingRecommendationChecks, setPendingRecommendationChecks,
    onToggleEpisode, allUsers
  } = props;
  
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
  const [providers, setProviders] = useState<WatchProviderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(mediaType === 'tv' ? 'seasons' : 'info');
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [seasonDetailsMap, setSeasonDetailsMap] = useState<Record<number, TmdbSeasonDetails>>({});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isPosterSelectorOpen, setIsPosterSelectorOpen] = useState(false);
  const [isBackdropSelectorOpen, setIsBackdropSelectorOpen] = useState(false);
  const [isLogWatchModalOpen, setIsLogWatchModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isWatchlistModalOpen, setIsWatchlistModalOpen] = useState(false);
  const [isReportIssueModalOpen, setIsReportIssueModalOpen] = useState(false);
  const [isAirtimeRequestModalOpen, setIsAirtimeRequestModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isReminderOptionsOpen, setIsReminderOptionsOpen] = useState(false);
  const [selectedEpisodeForDetail, setSelectedEpisodeForDetail] = useState<Episode | null>(null);
  const [activeCommentThread, setActiveCommentThread] = useState('general');
  const [isNominationModalOpen, setIsNominationModalOpen] = useState(false);

  const [selectedJournalEpisode, setSelectedJournalEpisode] = useState<{ season: number; ep: Episode } | null>(null);
  const [selectedRatingEpisode, setSelectedRatingEpisode] = useState<Episode | null>(null);
  const [selectedCommentEpisode, setSelectedCommentEpisode] = useState<Episode | null>(null);

  const isTV = mediaType === 'tv';

  const backdropUrl = useMemo(() => customImagePaths[id]?.backdrop_path 
    ? getImageUrl(customImagePaths[id].backdrop_path, 'w1280', 'backdrop')
    : getImageUrl(details?.backdrop_path, 'w1280', 'backdrop'), [customImagePaths, details, id]);
  
  const posterUrl = useMemo(() => customImagePaths[id]?.poster_path
    ? getImageUrl(customImagePaths[id].poster_path, 'w500', 'poster')
    : getImageUrl(details?.poster_path, 'w500', 'poster'), [customImagePaths, details, id]);

  useEffect(() => {
    if (!details) return;
    let isMounted = true;
    const root = document.documentElement;
    const originalStyles = {
        primary: root.style.getPropertyValue('--color-accent-primary'),
        secondary: root.style.getPropertyValue('--color-accent-secondary'),
        gradient: root.style.getPropertyValue('--accent-gradient'),
        onAccent: root.style.getPropertyValue('--on-accent'),
    };

    const applyChameleon = async () => {
        const colors = await getDominantColor(backdropUrl);
        if (!colors || !isMounted) return;
        const { primary, secondary, isLight } = colors;
        if (root.classList.contains('theme-original-dark')) return;

        root.style.setProperty('--color-accent-primary', primary);
        root.style.setProperty('--color-accent-secondary', secondary);
        root.style.setProperty('--accent-gradient', `linear-gradient(to right, ${primary}, ${secondary})`);
        root.style.setProperty('--on-accent', isLight ? '#000000' : '#FFFFFF');
    };

    applyChameleon();

    return () => {
        isMounted = false;
        root.style.setProperty('--color-accent-primary', originalStyles.primary);
        root.style.setProperty('--color-accent-secondary', originalStyles.secondary);
        root.style.setProperty('--accent-gradient', originalStyles.gradient);
        root.style.setProperty('--on-accent', originalStyles.onAccent);
    };
  }, [details, backdropUrl]);

  const tabs: { id: TabType, label: string, icon: any }[] = useMemo(() => {
    const baseTabs = [
        ...(mediaType === 'tv' ? [{ id: 'seasons', label: 'Seasons', icon: ListBulletIcon }] : []),
        { id: 'info', label: 'Info', icon: BookOpenIcon },
        { id: 'cast', label: 'Cast', icon: UsersIcon },
        { id: 'discussion', label: 'Comment', icon: ChatBubbleLeftRightIcon },
        { id: 'recs', label: 'Recommended', icon: SparklesIcon },
        { id: 'customize', label: 'Customize', icon: PhotoIcon },
        { id: 'achievements', label: 'Achievements', icon: BadgeIcon },
    ];

    if (mediaType === 'tv' && details?.seasons?.some(s => s.season_number === 0)) {
        baseTabs.splice(1, 0, { id: 'specials', label: 'Specials', icon: StarIcon });
    }

    return baseTabs as any;
  }, [mediaType, details]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mediaDetails, watchProviders] = await Promise.all([
        getMediaDetails(id, mediaType),
        getWatchProviders(id, mediaType)
      ]);

      if (mediaType === 'movie') {
          try {
              const traktMovie = await getMoviePrecision(id);
              if (traktMovie?.released) {
                  (mediaDetails as any).airtime = traktMovie.released;
              }
          } catch (e) { console.warn("Trakt movie enrichment failed", e); }
      }

      setDetails(mediaDetails);
      setProviders(watchProviders);

      if (mediaType === 'tv' && mediaDetails.seasons) {
          const firstSeason = mediaDetails.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
              setExpandedSeason(firstSeason.season_number);
              const sd = await getSeasonDetails(id, firstSeason.season_number);
              
              try {
                  const traktEps = await getSeasonEpisodesPrecision(id, firstSeason.season_number);
                  if (traktEps && Array.isArray(traktEps)) {
                      sd.episodes = sd.episodes.map(ep => {
                          const match = traktEps.find(t => t.number === ep.episode_number);
                          return match ? { ...ep, airtime: match.first_aired } : ep;
                      });
                  }
              } catch (e) { console.warn("Trakt season enrichment failed", e); }

              setSeasonDetailsMap(prev => ({ ...prev, [firstSeason.season_number]: sd }));
          }
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [id, mediaType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = async () => {
      clearMediaCache(id, mediaType);
      await fetchData();
  };

  const handleToggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) setExpandedSeason(null);
    else {
      setExpandedSeason(seasonNumber);
      if (!seasonDetailsMap[seasonNumber]) {
        try {
          const sd = await getSeasonDetails(id, seasonNumber);
          try {
              const traktEps = await getSeasonEpisodesPrecision(id, seasonNumber);
              if (traktEps && Array.isArray(traktEps)) {
                  sd.episodes = sd.episodes.map(ep => {
                      const match = traktEps.find(t => t.number === ep.episode_number);
                      return match ? { ...ep, airtime: match.first_aired } : ep;
                  });
              }
          } catch (e) { console.warn("Trakt expanded season enrichment failed", e); }
          setSeasonDetailsMap(prev => ({ ...prev, [seasonNumber]: sd }));
        } catch (e) { console.error(e); }
      }
    }
  };

  const currentStatus = useMemo(() => {
    for (const [status, list] of Object.entries(trackedLists) as [WatchStatus, TrackedItem[]][]) {
      if (list.some(item => item.id === id)) return status;
    }
    return null;
  }, [trackedLists, id]);

  const movieLibraryItem = useMemo(() => {
    if (mediaType !== 'movie') return null;
    return (allUserData as any).movieLibrary?.[id];
  }, [allUserData, id, mediaType]);

  const isAllWatched = useMemo(() => {
    if (mediaType !== 'tv' || !details) return false;
    const progress = watchProgress[id] || {};
    let watchedCount = 0;
    Object.values(progress).forEach(s => {
      Object.values(s).forEach(e => { if ((e as EpisodeProgress).status === 2) watchedCount++; });
    });
    return watchedCount > 0;
  }, [id, mediaType, details, watchProgress]);

  const nextEpisodeToWatch = useMemo(() => {
    if (mediaType !== 'tv' || !details?.seasons) return null;
    const progress = watchProgress[id] || {};
    const sortedSeasons = [...details.seasons].filter(s => s.season_number > 0).sort((a,b) => a.season_number - b.season_number);
    for (const season of sortedSeasons) {
      for (let i = 1; i <= season.episode_count; i++) {
        if (progress[season.season_number]?.[i]?.status !== 2) return { seasonNumber: season.season_number, episodeNumber: i };
      }
    }
    return null;
  }, [mediaType, details, watchProgress, id]);

  const showStatus = useMemo(() => details ? getShowStatus(details) : null, [details]);
  
  const hasUpcomingContent = useMemo(() => {
    if (!details) return false;
    const today = new Date().toISOString().split('T')[0];
    const statusText = showStatus?.text || '';
    
    if (mediaType === 'tv') {
        if (statusText === 'Upcoming' || statusText === 'In Season') return true;
        if (details.next_episode_to_air) return true;
        return !!details.seasons?.some(s => s.air_date && s.air_date > today);
    } else {
        return !!details.release_date && details.release_date > today;
    }
  }, [details, mediaType, showStatus]);

  const isUpcoming = showStatus?.text === 'Upcoming';
  
  const premiereMessage = useMemo(() => {
    if (!details) return null;
    const today = new Date().toISOString().split('T')[0];
    
    const formatDateFriendly = (dateStr: string) => {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    };

    if (mediaType === 'movie') {
        if (details.release_date && details.release_date > today) {
            return `${details.title} releases on ${formatDateFriendly(details.release_date)}`;
        }
        return null;
    }

    const nextEp = details.next_episode_to_air;
    const getOrdinalWord = (n: number) => {
       const words = ["zero", "first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth", "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth"];
       return words[n] || `${n}th`;
    };

    if (details.first_air_date && details.first_air_date > today && !details.last_episode_to_air) {
        return `${details.name} premieres on ${formatDateFriendly(details.first_air_date)}`;
    }

    if (nextEp && nextEp.episode_number === 1 && nextEp.air_date >= today) {
        return `${details.name}'s ${getOrdinalWord(nextEp.season_number)} season premieres on ${formatDateFriendly(nextEp.air_date)}`;
    }

    if (nextEp && nextEp.air_date >= today) {
        return `next episode premieres ${formatDateFriendly(nextEp.air_date)}`;
    }

    return null;
  }, [details, mediaType]);

  const handleJournalOpen = (seasonNum: number, ep: Episode) => {
      setSelectedJournalEpisode({ season: seasonNum, ep });
      setIsJournalModalOpen(true);
  };

  const handleRatingOpen = (ep: Episode) => {
      setSelectedRatingEpisode(ep);
      setIsRatingModalOpen(true);
  };

  const handleCommentOpen = (ep: Episode | null) => {
      setSelectedCommentEpisode(ep);
      setIsCommentModalOpen(true);
  };

  const handleRatingSave = (rating: number) => {
      if (selectedRatingEpisode) {
          onRateEpisode(id, selectedRatingEpisode.season_number, selectedRatingEpisode.episode_number, rating);
          setSelectedRatingEpisode(null);
      } else {
          onRateItem(id, rating);
      }
  };

  const handleJournalSave = (entry: JournalEntry | null, season: number, episode: number) => {
      props.onSaveJournal(id, season, episode, entry);
      setSelectedJournalEpisode(null);
  };

  const handleCommentSave = (text: string, visibility: CommentVisibility) => {
    const key = selectedCommentEpisode 
        ? `tv-${id}-s${selectedCommentEpisode.season_number}-e${selectedCommentEpisode.episode_number}`
        : `${details?.media_type}-${details?.id}`;
    onSaveComment({ mediaKey: key!, text, parentId: null, isSpoiler: false, visibility });
    setSelectedCommentEpisode(null);
    setActiveTab('discussion');
    setActiveCommentThread(selectedCommentEpisode ? key! : 'general');
  };

  const handleShare = async () => {
      const shareData = {
          title: details?.title || details?.name || 'CineMontauge',
          text: `Check out ${details?.title || details?.name} on CineMontauge!`,
          url: window.location.href,
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.error('Error sharing:', err);
          }
      } else {
          try {
              await navigator.clipboard.writeText(window.location.href);
              confirmationService.show("Link copied to clipboard!");
          } catch (err) {
              console.error('Clipboard failed:', err);
          }
      }
  };

  const handleThreadChange = (key: string) => {
    if (key.startsWith('s')) {
        const seasonNum = parseInt(key.replace('s', ''));
        if (!seasonDetailsMap[seasonNum]) {
            handleToggleSeason(seasonNum);
        }
    }
    setActiveCommentThread(key === `s${details?.last_episode_to_air?.season_number}` ? `tv-${details?.id}-s${details?.last_episode_to_air?.season_number}-e${details?.last_episode_to_air?.episode_number}` : key);
  }

  const handleReportIssue = (option: string) => {
    const subject = `CineMontauge Report: ${details?.title || details?.name} (${mediaType.toUpperCase()} ID: ${id})`;
    const body = `Identity: ${currentUser?.username || 'Guest'} (${currentUser?.email || 'N/A'})\n\nIssue Selected: ${option}\n\nTechnical details:\n[Please enter description here]`;
    window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setIsReportIssueModalOpen(false);
  };

  const reportOptions = useMemo(() => {
    const base = [
        "Wrong Details", 
        "Insufficient Info", 
        "Incorrect Poster", 
        "Missing Content", 
        "already released/ wrong release date",
        ...(mediaType === 'tv' ? ["Wrong Air Time"] : []),
        "Wrong Streaming / Where to Watch listed", 
        "Other Error"
    ];
    return base;
  }, [mediaType]);

  if (loading) return <div className="p-20 text-center animate-pulse text-white">Loading Cinematic Experience...</div>;
  if (!details) return <div className="p-20 text-center text-red-500">Failed to load content.</div>;

  const userRating = ratings[id]?.rating || 0;
  const isFavorited = favorites.some(f => f.id === id);

  const getLibraryButtonText = () => {
      if (mediaType === 'movie') {
          if (movieLibraryItem?.rewatch_in_progress) return 'Rewatch In Progress';
          if (currentStatus === 'completed') {
              const count = movieLibraryItem?.rewatch_count || 1;
              return count > 1 ? `Watched (${count}x)` : 'Watched';
          }
      }
      if (currentStatus === 'completed') return 'Completed';
      if (currentStatus === 'allCaughtUp') return 'All Caught Up';
      if (currentStatus === 'watching') return 'In Progress';
      if (currentStatus === 'planToWatch') return 'Plan to Watch';
      if (currentStatus === 'onHold') return 'On Hold';
      if (currentStatus === 'dropped') return 'Dropped';
      return 'Add to Library';
  };

  const getStatusBadgeStyle = (status: string) => {
    return 'bg-white/10 text-white border-white/20 shadow-[0_0_8px_rgba(255,255,255,0.2)]';
  };

  const handleReminderSave = (selectedTypes: ReminderType[], frequency: 'first' | 'all') => {
      const newReminder: Reminder = {
          id: reminderId,
          mediaId: id,
          mediaType: mediaType,
          releaseDate: releaseDateForReminder!,
          title: details.title || details.name || 'Untitled',
          poster_path: details.poster_path,
          episodeInfo: mediaType === 'tv' ? 'New Episodes Alert' : 'Movie Release',
          selectedTypes,
          frequency
      };
      onToggleReminder(newReminder, reminderId);
  };

  const releaseDateForReminder = details.first_air_date || details.release_date;
  const reminderId = releaseDateForReminder ? `rem-${mediaType}-${id}-${releaseDateForReminder}` : '';
  const isReminderSet = reminders.some(r => r.id === reminderId);

  // derived props for EpisodeDetailModal
  const isEpWatched = selectedEpisodeForDetail 
    ? watchProgress[id]?.[selectedEpisodeForDetail.season_number]?.[selectedEpisodeForDetail.episode_number]?.status === 2
    : false;
  
  const isEpFavorited = selectedEpisodeForDetail
    ? !!favoriteEpisodes[id]?.[selectedEpisodeForDetail.season_number]?.[selectedEpisodeForDetail.episode_number]
    : false;

  const currentEpRating = selectedEpisodeForDetail
    ? (episodeRatings[id]?.[selectedEpisodeForDetail.season_number]?.[selectedEpisodeForDetail.episode_number] || 0)
    : 0;

  return (
    <div className="animate-fade-in relative pb-20">
      <RatingModal isOpen={isRatingModalOpen} onClose={() => { setIsRatingModalOpen(false); setSelectedRatingEpisode(null); }} onSave={handleRatingSave} currentRating={selectedRatingEpisode ? (episodeRatings[id]?.[selectedRatingEpisode.season_number]?.[selectedRatingEpisode.episode_number] || 0) : userRating} mediaTitle={selectedRatingEpisode ? `S${selectedRatingEpisode.season_number} E${selectedRatingEpisode.episode_number}: ${selectedRatingEpisode.name}` : (details.title || details.name || '')} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={history.filter(h => h.id === id)} mediaTitle={details.title || details.name || ''} mediaDetails={details} onDeleteHistoryItem={props.onDeleteHistoryItem} onClearMediaHistory={onClearMediaHistory} />
      <MarkAsWatchedModal isOpen={isLogWatchModalOpen} onClose={() => setIsLogWatchModalOpen(false)} mediaTitle={details.title || details.name || ''} onSave={(data) => onMarkMediaAsWatched(details, data.date)} initialScope={mediaType === 'tv' ? 'show' : 'single'} mediaType={mediaType} showDetails={details} />
      <JournalModal isOpen={isJournalModalOpen} onClose={() => { setIsJournalModalOpen(false); setSelectedJournalEpisode(null); }} onSave={handleJournalSave} mediaDetails={details} initialSeason={selectedJournalEpisode?.season} initialEpisode={selectedJournalEpisode?.ep} watchProgress={watchProgress} />
      <NotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} onSave={() => {}} onNoteDeleted={props.onNoteDeleted} mediaTitle={details.title || details.name || ''} initialNotes={mediaNotes[id] || []} />
      <WatchlistModal isOpen={isWatchlistModalOpen} onClose={() => setIsWatchlistModalOpen(false)} onUpdateList={(newList) => { onUpdateLists(details as any, currentStatus, newList as WatchStatus); }} currentList={currentStatus} customLists={customLists} mediaType={mediaType} />
      <ReportIssueModal isOpen={isReportIssueModalOpen} onClose={() => setIsReportIssueModalOpen(false)} onSelect={handleReportIssue} options={reportOptions} />
      <AirtimeRequestModal isOpen={isAirtimeRequestModalOpen} onClose={() => setIsAirtimeRequestModalOpen(false)} onSend={() => {}} onDiscard={() => {}} showDetails={details} />
      <CommentModal isOpen={isCommentModalOpen} onClose={() => { setIsCommentModalOpen(false); setSelectedCommentEpisode(null); }} mediaTitle={selectedCommentEpisode ? `S${selectedCommentEpisode.season_number} E${selectedCommentEpisode.episode_number}: ${selectedCommentEpisode.name}` : (details.title || details.name || '')} onSave={handleCommentSave} />
      <ReminderOptionsModal 
          isOpen={isReminderOptionsOpen} 
          onClose={() => setIsReminderOptionsOpen(false)} 
          onSave={handleReminderSave} 
          mediaType={mediaType} 
          initialTypes={reminders.find(r => r.id === reminderId)?.selectedTypes}
          initialFrequency={reminders.find(r => r.id === reminderId)?.frequency}
      />

      {selectedEpisodeForDetail && (
          <EpisodeDetailModal 
              isOpen={!!selectedEpisodeForDetail}
              onClose={() => setSelectedEpisodeForDetail(null)}
              episode={selectedEpisodeForDetail}
              showDetails={details}
              seasonDetails={seasonDetailsMap[selectedEpisodeForDetail.season_number] || { episodes: [selectedEpisodeForDetail] } as any}
              isWatched={isEpWatched}
              onToggleWatched={() => onToggleEpisode(id, selectedEpisodeForDetail.season_number, selectedEpisodeForDetail.episode_number, isEpWatched ? 2 : 0, details as any, selectedEpisodeForDetail.name)}
              onOpenJournal={() => handleJournalOpen(selectedEpisodeForDetail.season_number, selectedEpisodeForDetail)}
              isFavorited={isEpFavorited}
              onToggleFavorite={() => onToggleFavoriteEpisode(id, selectedEpisodeForDetail.season_number, selectedEpisodeForDetail.episode_number)}
              onStartLiveWatch={onStartLiveWatch}
              onSaveJournal={props.onSaveJournal}
              watchProgress={watchProgress}
              history={history}
              onAddWatchHistory={props.onAddWatchHistory}
              onRate={() => handleRatingOpen(selectedEpisodeForDetail)}
              episodeRating={currentEpRating}
              onDiscuss={() => handleCommentOpen(selectedEpisodeForDetail)}
              showRatings={showRatings}
              preferences={preferences}
              timezone={allUserData.timezone}
              currentShowStatus={currentStatus}
              onUpdateShowStatus={(newStatus) => onUpdateLists(details as any, currentStatus, newStatus)}
              onViewFullShow={() => setSelectedEpisodeForDetail(null)}
              weeklyFavorites={weeklyFavorites}
              onToggleWeeklyFavorite={onToggleWeeklyFavorite}
          />
      )}
      
      <div className="relative w-full aspect-video md:aspect-[21/9] md:h-auto overflow-hidden">
        <img src={backdropUrl} className="w-full h-full object-cover" alt="Backdrop" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent"></div>
        <button onClick={onBack} className="absolute top-6 left-6 p-3 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-bg-secondary transition-all z-20 shadow-2xl border border-white/10">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="relative group">
              <img src={posterUrl} className="rounded-2xl shadow-2xl w-full aspect-[2/3] object-cover border-4 border-bg-primary" alt="Poster" />
              <UserRatingStamp rating={userRating} size="lg" className="absolute -top-4 -left-4" />
              {showRatings && details.vote_average && (
                <div className="absolute -top-4 -right-4">
                  <ScoreStar score={details.vote_average} size="md" />
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <button 
                onClick={() => setIsWatchlistModalOpen(true)}
                className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-black text-lg bg-bg-secondary/40 border border-white/5 hover:border-white/40 transition-all text-white shadow-lg group uppercase tracking-tighter"
              >
                <div className="px-4 py-1 flex items-center gap-2">
                    <span>{getLibraryButtonText()}</span>
                    <ChevronDownIcon className="w-5 h-5 text-white" />
                </div>
              </button>
              
              <div className="grid grid-cols-4 gap-2">
                <DetailedActionButton label={mediaType === 'tv' ? "Watch All" : "Watched"} isActive={mediaType === 'tv' ? isAllWatched : currentStatus === 'completed'} icon={<CheckCircleIcon className="w-6 h-6" />} onClick={() => mediaType === 'tv' ? onMarkAllWatched(id, details as any) : onMarkMediaAsWatched(details)} />
                <DetailedActionButton label={mediaType === 'tv' ? "Unmark All" : "Unmark"} icon={<XMarkIcon className="w-6 h-6" />} onClick={() => mediaType === 'tv' ? onUnmarkAllWatched(id) : props.onUnmarkMovieWatched(id, false)} />
                
                {hasUpcomingContent ? (
                    <>
                        <DetailedActionButton 
                            label="Reminder" 
                            icon={<BellIcon className="w-6 h-6" />} 
                            isActive={isReminderSet} 
                            onClick={() => setIsReminderOptionsOpen(true)} 
                        />
                        <DetailedActionButton label="Weekly Pick" icon={<TrophyIcon className="w-6 h-6" />} isActive={weeklyFavorites.some(p => p.id === id)} onClick={() => setIsNominationModalOpen(true)} />
                    </>
                ) : (
                    <>
                        <DetailedActionButton label="Weekly Pick" icon={<TrophyIcon className="w-6 h-6" />} isActive={weeklyFavorites.some(p => p.id === id)} onClick={() => setIsNominationModalOpen(true)} />
                        <DetailedActionButton label="Favorite" icon={<HeartIcon filled={isFavorited} className="w-6 h-6" />} isActive={isFavorited} onClick={() => onToggleFavoriteShow(details as any)} />
                    </>
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {hasUpcomingContent && (
                    <DetailedActionButton label="Favorite" icon={<HeartIcon filled={isFavorited} className="w-6 h-6" />} isActive={isFavorited} onClick={() => onToggleFavoriteShow(details as any)} />
                )}
                <DetailedActionButton label="Rate" icon={<StarIcon filled={userRating > 0} className="w-6 h-6" />} onClick={() => setIsRatingModalOpen(true)} />
                <DetailedActionButton label="History" icon={<ClockIcon className="w-6 h-6" />} onClick={() => setIsHistoryModalOpen(true)} />
                <DetailedActionButton label="Add to List" icon={<ListBulletIcon className="w-6 h-6" />} onClick={() => onOpenAddToListModal(details)} />
                {!hasUpcomingContent && <DetailedActionButton label="Comment" icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />} onClick={() => handleCommentOpen(null)} />}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {hasUpcomingContent && <DetailedActionButton label="Comment" icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />} onClick={() => handleCommentOpen(null)} />}
                <DetailedActionButton label="Journal" icon={<WritingBookIcon className="w-6 h-6" />} onClick={() => setIsJournalModalOpen(true)} />
                <DetailedActionButton label="Notes" icon={<PencilSquareIcon className="w-6 h-6" />} onClick={() => setIsNotesModalOpen(true)} />
                <DetailedActionButton label="Log Watch" icon={<LogWatchIcon className="w-6 h-6" />} onClick={() => setIsLogWatchModalOpen(true)} />
                
                {mediaType === 'movie' ? (
                  !hasUpcomingContent && (
                    <DetailedActionButton 
                      label="Live Watch" 
                      className="!bg-black !border-none" 
                      icon={<PlayCircleIcon className="w-6 h-6" />} 
                      onClick={() => onStartLiveWatch({ id: details.id, title: details.title || '', media_type: 'movie', poster_path: details.poster_path, runtime: details.runtime || 120 })} 
                    />
                  )
                ) : (
                  !hasUpcomingContent ? (
                    <DetailedActionButton 
                      label="Live Watch" 
                      className="!bg-black !border-none" 
                      icon={<PlayCircleIcon className="w-6 h-6" />} 
                      onClick={() => {
                          const next = nextEpisodeToWatch;
                          onStartLiveWatch({ 
                            id: details.id, 
                            title: details.name || '', 
                            media_type: 'tv', 
                            poster_path: details.poster_path, 
                            runtime: details.episode_run_time?.[0] || 45,
                            seasonNumber: next?.seasonNumber,
                            episodeNumber: next?.episodeNumber
                          })
                      }} 
                    />
                  ) : null
                )}
              </div>

              <div className="grid grid-cols-4 gap-2">
                <DetailedActionButton label="Share" icon={<ShareIcon className="w-6 h-6" />} onClick={handleShare} />
                <DetailedActionButton label="Refresh" icon={<ArrowPathIcon className="w-6 h-6" />} onClick={handleRefresh} />
                <DetailedActionButton label="Report Issue" icon={<QuestionMarkCircleIcon className="w-6 h-6" />} onClick={() => setIsReportIssueModalOpen(true)} />
                {mediaType === 'tv' && (
                    <DetailedActionButton label="Request Air" icon={<ClockIcon className="w-6 h-6" />} onClick={() => setIsAirtimeRequestModalOpen(true)} />
                )}
              </div>
            </div>
          </div>

          <div className="flex-grow min-w-0 space-y-8">
            <header>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {showStatus && <div className={`px-4 py-1 border rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl ${getStatusBadgeStyle(showStatus.text)}`}>{showStatus.text}</div>}
                <div className="px-4 py-1 flex items-center">
                    <span className="text-white font-black text-[10px] uppercase tracking-widest flex items-center">
                        <span className="metadata-caption">{details.genres?.slice(0, 3).map(g => g.name.toLowerCase()).join(', ')}</span>
                        <span className="mx-2 opacity-30">•</span>
                        <span className="metadata-caption">{(details.release_date || details.first_air_date)?.substring(0, 4)}</span>
                    </span>
                </div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-text-primary uppercase tracking-tighter leading-none mb-4">{details.title || details.name}</h1>

              {premiereMessage && (
                <div className="mb-4 animate-fade-in">
                    <p className="text-lg md:text-xl font-black text-white uppercase tracking-widest leading-none border-l-4 border-white pl-4">
                        {premiereMessage}
                    </p>
                </div>
              )}

              <div className="max-w-3xl">
                <p className="text-lg text-white font-medium italic opacity-90 leading-relaxed">"{details.tagline || details.overview}"</p>
              </div>
            </header>

            {nextEpisodeToWatch && (
              <section className="animate-slide-in-up">
                <div className="px-4 py-2 mb-4 inline-flex items-center gap-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center"><PlayCircleIcon className="w-8 h-8 mr-3 text-white" />Up Next</h2>
                </div>
                <NextUpWidget {...props} details={details} showId={id} nextEpisodeToWatch={nextEpisodeToWatch} onOpenJournal={handleJournalOpen} onOpenCommentModal={handleCommentOpen} onSelectShow={onSelectShow} timezone={props.allUserData.timezone} />
              </section>
            )}

            {mediaType === 'tv' && <OverallProgress details={details} watchProgress={watchProgress} />}

            <div className="border-b border-white/10 sticky top-16 bg-bg-primary/90 backdrop-blur-xl z-20 -mx-4 px-4 py-4 overflow-x-auto hide-scrollbar">
                <Carousel>
                    <div className="flex space-x-4">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] transition-all border ${activeTab === tab.id ? 'bg-white/20 text-white border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] scale-105 active-glow' : 'bg-bg-secondary/40 text-white/70 border-white/5 hover:text-white'}`}>
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-white/60'}`} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </Carousel>
            </div>

            <div className="pt-4 min-h-[400px]">
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-8">
                        <section>
                            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4">Archive Overview</h2>
                            <div className="bg-bg-secondary/10 p-8 rounded-[2.5rem] border border-white/5 shadow-inner">
                                <p className="text-white text-lg leading-relaxed font-medium">{details.overview}</p>
                            </div>
                        </section>
                        <WhereToWatch providers={providers} />
                    </div>
                   <MoreInfo details={details} onSelectShow={onSelectShow} timezone={props.allUserData.timezone} />
                </div>
              )}
              {activeTab === 'seasons' && mediaType === 'tv' && (
                <div className="space-y-4">
                   {details.seasons?.filter(s => s.season_number > 0).map(season => (
                      <SeasonAccordion key={season.id} season={season} showId={id} isExpanded={expandedSeason === season.season_number} onToggle={() => handleToggleSeason(season.season_number)} seasonDetails={seasonDetailsMap[season.season_number]} watchProgress={watchProgress} onToggleEpisode={onToggleEpisode} onMarkPreviousEpisodesWatched={onMarkPreviousEpisodesWatched} onOpenJournal={handleJournalOpen} onOpenEpisodeDetail={setSelectedEpisodeForDetail} showPosterPath={details.poster_path} onMarkSeasonWatched={onMarkSeasonWatched} onUnmarkSeasonWatched={onUnmarkSeasonWatched} showDetails={details} favoriteEpisodes={favoriteEpisodes} onToggleFavoriteEpisode={onToggleFavoriteEpisode} onStartLiveWatch={onStartLiveWatch} onSaveJournal={handleJournalSave} episodeRatings={episodeRatings} onOpenEpisodeRatingModal={handleRatingOpen} onAddWatchHistory={onAddWatchHistory} comments={comments} onImageClick={() => {}} onSaveEpisodeNote={onSaveEpisodeNote} showRatings={showRatings} seasonRatings={seasonRatings} onRateSeason={onRateSeason} episodeNotes={episodeNotes} timezone={allUserData.timezone} timeFormat={allUserData.timeFormat} />
                   ))}
                </div>
              )}
              {activeTab === 'cast' && <CastAndCrew tmdbCredits={details.credits} onSelectPerson={onSelectPerson} />}
              {activeTab === 'recs' && <RecommendedMedia recommendations={details.recommendations?.results || []} onSelectShow={onSelectShow} onRefresh={handleRefresh} />}
              {activeTab === 'discussion' && (
                  <CommentsTab details={details} comments={comments} currentUser={currentUser} allUsers={allUsers} seasonDetailsMap={seasonDetailsMap} onFetchSeasonDetails={handleToggleSeason as any} onSaveComment={onSaveComment} onToggleLikeComment={() => {}} onDeleteComment={() => {}} activeThread={activeCommentThread} setActiveThread={handleThreadChange} follows={follows} />
              )}
              {activeTab === 'customize' && <CustomizeTab posterUrl={posterUrl} backdropUrl={backdropUrl} onOpenPosterSelector={() => setIsPosterSelectorOpen(true)} onOpenBackdropSelector={() => setIsBackdropSelectorOpen(true)} showId={id} customImagePaths={customImagePaths} details={details} onSetCustomImage={onSetCustomImage} onRemoveCustomImage={onRemoveCustomImage} onResetCustomImage={onResetCustomImage} />}
              {activeTab === 'achievements' && <ShowAchievementsTab details={details} userData={allUserData} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;
