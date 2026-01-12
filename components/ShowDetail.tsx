
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, clearMediaCache } from '../services/tmdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, WatchProviderResponse, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo, EpisodeRatings, Comment, SeasonRatings, CastMember, CrewMember, PublicUser, Reminder, ReminderType } from '../types';
import { ChevronLeftIcon, BookOpenIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, PlayCircleIcon, HeartIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, CalendarIcon, PencilSquareIcon, BellIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP_LARGE } from '../constants';
import SeasonAccordion from './SeasonAccordion';
import { formatRuntime, isNewRelease } from '../utils/formatUtils';
import NextUpWidget from './NextUpWidget';
import HistoryModal from './HistoryModal';
import RatingModal from './RatingModal';
import EpisodeDetailModal from './EpisodeDetailModal';
import OverallProgress from './OverallProgress';
import ScoreStar from './ScoreStar';
import { getShowStatus } from '../utils/statusUtils';

interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  onBack: () => void;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  trackedLists: { watching: TrackedItem[], planToWatch: TrackedItem[], completed: TrackedItem[], onHold: TrackedItem[], dropped: TrackedItem[] };
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  customImagePaths: CustomImagePaths;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  favorites: TrackedItem[];
  onToggleFavoriteShow: (item: TrackedItem) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenCustomListModal: (item: any) => void;
  ratings: UserRatings;
  onRateItem: (mediaId: number, rating: number) => void;
  onMarkMediaAsWatched: (item: any, date?: string) => void;
  onUnmarkMovieWatched: (mediaId: number) => void;
  onMarkSeasonWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
  onUnmarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  onMarkPreviousEpisodesWatched: (showId: number, seasonNumber: number, lastEpisodeNumber: number) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onSelectPerson: (personId: number) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onClearMediaHistory: (mediaId: number, mediaType: 'tv' | 'movie') => void;
  episodeRatings: EpisodeRatings;
  onRateEpisode: (showId: number, seasonNumber: number, episodeNumber: number, rating: number) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string) => void;
  onSaveComment: (commentData: any) => void;
  comments: Comment[];
  genres: Record<number, string>;
  onMarkAllWatched: (showId: number, showInfo: TrackedItem) => void;
  onUnmarkAllWatched: (showId: number) => void;
  onSaveNote: (mediaId: number, note: string) => void;
  mediaNotes: Record<number, string>;
  episodeNotes: Record<number, Record<number, Record<number, string>>>;
  onSaveEpisodeNote: (showId: number, seasonNumber: number, episodeNumber: number, note: string) => void;
  showRatings: boolean;
  seasonRatings: SeasonRatings;
  onRateSeason: (showId: number, seasonNumber: number, rating: number) => void;
  customLists: CustomList[];
  currentUser: any;
  allUsers: PublicUser[];
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
}

const ShowDetail: React.FC<ShowDetailProps> = (props) => {
  const { id, mediaType, onBack, watchProgress, trackedLists, onUpdateLists, favorites, ratings, onRateItem, onSelectShow, showRatings, onToggleReminder, reminders } = props;
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'seasons' | 'info'>('seasons');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMediaDetails(id, mediaType);
      setDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, mediaType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const currentStatus = useMemo(() => {
    // FIX: Cast Object.entries to [WatchStatus, TrackedItem[]][] to resolve type inference issue where 'list' was treated as unknown.
    for (const [status, list] of Object.entries(trackedLists) as [WatchStatus, TrackedItem[]][]) {
      if (list.some(item => item.id === id)) return status as WatchStatus;
    }
    return null;
  }, [trackedLists, id]);

  const isFavorited = favorites.some(f => f.id === id);
  const userRating = ratings[id]?.rating || 0;

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

  if (loading) return <div className="p-20 text-center animate-pulse">Loading Cinema Details...</div>;
  if (!details) return <div className="p-20 text-center">Failed to load content.</div>;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto px-4">
      <header className="py-4 flex items-center space-x-4">
        <button onClick={onBack} className="p-2 bg-bg-secondary rounded-full"><ChevronLeftIcon className="w-6 h-6" /></button>
        <h1 className="text-2xl font-bold">{details.title || details.name}</h1>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-1">
          <img src={getImageUrl(details.poster_path, 'w500')} className="rounded-xl shadow-2xl w-full" alt="Poster" />
          <div className="mt-4 flex flex-col space-y-2">
            <div className="flex items-center justify-between">
                {showRatings && details.vote_average && <ScoreStar score={details.vote_average} />}
                <button onClick={() => onRateItem(id, userRating === 5 ? 0 : 5)} className={`p-3 rounded-xl bg-bg-secondary ${userRating > 0 ? 'text-yellow-400' : ''}`}><StarIcon className="w-6 h-6" /></button>
            </div>
            <button onClick={() => onUpdateLists(details as any, currentStatus, currentStatus === 'watching' ? null : 'watching')} className={`w-full py-3 rounded-xl font-bold ${currentStatus === 'watching' ? 'bg-primary-accent text-on-accent' : 'bg-bg-secondary'}`}>
                {currentStatus === 'watching' ? 'Currently Watching' : 'Add to Watching'}
            </button>
          </div>
        </div>
        
        <div className="col-span-2 space-y-6">
          <section>
            <h2 className="text-xl font-bold mb-2">Overview</h2>
            <p className="text-text-secondary leading-relaxed">{details.overview}</p>
          </section>
          
          {mediaType === 'tv' && details.seasons && (
            <section>
              <h2 className="text-xl font-bold mb-4">Seasons</h2>
              <div className="space-y-4">
                {details.seasons.filter(s => s.season_number > 0).map(season => (
                    <SeasonAccordion key={season.id} season={season} showId={id} isExpanded={false} onToggle={() => {}} seasonDetails={undefined} watchProgress={watchProgress} onToggleEpisode={props.onToggleEpisode} onMarkPreviousEpisodesWatched={props.onMarkPreviousEpisodesWatched} onOpenJournal={() => {}} onOpenEpisodeDetail={() => {}} showPosterPath={details.poster_path} onMarkSeasonWatched={props.onMarkSeasonWatched} onUnmarkSeasonWatched={props.onUnmarkSeasonWatched} showDetails={details} favoriteEpisodes={props.favoriteEpisodes} onToggleFavoriteEpisode={props.onToggleFavoriteEpisode} onStartLiveWatch={props.onStartLiveWatch} onSaveJournal={props.onSaveJournal} episodeRatings={props.episodeRatings} onOpenEpisodeRatingModal={() => {}} onAddWatchHistory={props.onAddWatchHistory} onDiscussEpisode={() => {}} comments={props.comments} onImageClick={() => {}} onSaveEpisodeNote={props.onSaveEpisodeNote} showRatings={showRatings} seasonRatings={props.seasonRatings} onRateSeason={props.onRateSeason} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;
