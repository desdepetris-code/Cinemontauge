import React, { useMemo, useState } from 'react';
import { TmdbMediaDetails, TmdbSeasonDetails, Episode, WatchProgress, LiveWatchMediaInfo, JournalEntry, FavoriteEpisodes, TrackedItem, EpisodeRatings, EpisodeProgress, Comment, SeasonRatings, Note } from '../types';
import { ChevronDownIcon, CheckCircleIcon, PlayCircleIcon, BookOpenIcon, StarIcon, LogWatchIcon, HeartIcon, ChatBubbleOvalLeftEllipsisIcon, XMarkIcon, PencilSquareIcon, ClockIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import { formatRuntime } from '../utils/formatUtils';
import MarkAsWatchedModal, { LogWatchScope } from './MarkAsWatchedModal';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL } from '../constants';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import ScoreStar from './ScoreStar';
import RatingModal from './RatingModal';
import NotesModal from './NotesModal';
import { getSeasonDetails } from '../services/tmdbService';
import { estimateStreamingTime } from '../utils/streamingTimeUtils';

interface SeasonAccordionProps {
  season: TmdbMediaDetails['seasons'][0];
  showId: number;
  isExpanded: boolean;
  onToggle: () => void;
  seasonDetails: TmdbSeasonDetails | undefined;
  watchProgress: WatchProgress;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onMarkPreviousEpisodesWatched: (showId: number, seasonNumber: number, lastEpisodeNumber: number) => void;
  onOpenJournal: (season: number, episode: Episode) => void;
  onOpenEpisodeDetail: (episode: Episode) => void;
  showPosterPath: string | null | undefined;
  onMarkSeasonWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
  onUnmarkSeasonWatched: (showId: number, seasonNumber: number) => void;
  showDetails: TmdbMediaDetails;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  episodeRatings: EpisodeRatings;
  onOpenEpisodeRatingModal: (episode: Episode) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  isCollapsible?: boolean;
  onDiscussEpisode: (seasonNumber: number, episodeNumber: number) => void;
  comments: Comment[];
  onImageClick: (src: string) => void;
  episodeNotes?: Record<number, Record<number, Record<number, Note[]>>>;
  onSaveEpisodeNote: (showId: number, seasonNumber: number, episodeNumber: number, notes: Note[]) => void;
  showRatings: boolean;
  seasonRatings: SeasonRatings;
  onRateSeason: (showId: number, seasonNumber: number, rating: number) => void;
  timezone: string;
  timeFormat: '12h' | '24h';
}

const EpisodeActionButton: React.FC<{
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  children: React.ReactNode;
  isActive?: boolean;
}> = ({ label, onClick, disabled, children, isActive }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center flex-1 min-w-[60px] ${disabled ? 'cursor-not-allowed opacity-20' : `bg-bg-secondary/40 border-white/5 text-white hover:bg-white/10 ${isActive ? 'bg-white/20 border-white active-glow' : ''}`}`}
  >
    {children}
    <span className="text-[10px] font-black uppercase mt-1 leading-none tracking-tighter">{label}</span>
  </button>
);

const SeasonAccordion: React.FC<SeasonAccordionProps> = ({
  season,
  showId,
  isExpanded,
  onToggle,
  seasonDetails,
  watchProgress,
  onToggleEpisode,
  onMarkPreviousEpisodesWatched,
  onOpenEpisodeDetail,
  onOpenJournal,
  showDetails,
  showPosterPath,
  favoriteEpisodes,
  onToggleFavoriteEpisode,
  onStartLiveWatch,
  onSaveJournal,
  onMarkSeasonWatched,
  onUnmarkSeasonWatched,
  episodeRatings,
  onOpenEpisodeRatingModal,
  onAddWatchHistory,
  isCollapsible = true,
  onDiscussEpisode,
  comments,
  onImageClick,
  episodeNotes = {},
  onSaveEpisodeNote,
  showRatings,
  seasonRatings,
  onRateSeason,
  timezone,
  timeFormat
}) => {
  const [logDateModalState, setLogDateModalState] = useState<{ isOpen: boolean; episode: Episode | null; scope: LogWatchScope }>({ isOpen: false, episode: null, scope: 'single' });
  const [seasonRatingModalOpen, setSeasonRatingModalOpen] = useState(false);
  const [notesModalState, setNotesModalState] = useState<{ isOpen: boolean; episode: Episode | null }>({ isOpen: false, episode: null });

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const { seasonProgressPercent, unwatchedCount, totalAiredEpisodesInSeason } = useMemo(() => {
    const progressForSeason = watchProgress[showId]?.[season.season_number] || {};
    if (!seasonDetails?.episodes) {
      const watchedCount = Object.values(progressForSeason).filter(ep => (ep as EpisodeProgress).status === 2).length;
      const percent = season.episode_count > 0 ? (watchedCount / season.episode_count) * 100 : 0;
      return { seasonProgressPercent: percent, unwatchedCount: Math.max(0, season.episode_count - watchedCount), totalAiredEpisodesInSeason: 0 };
    }
    const airedEpisodes = seasonDetails.episodes.filter(ep => ep.air_date && ep.air_date <= today);
    const totalAired = airedEpisodes.length;
    const watchedCount = airedEpisodes.filter(ep => progressForSeason[ep.episode_number]?.status === 2).length;
    const percent = totalAired > 0 ? (watchedCount / totalAired) * 100 : 0;
    return { seasonProgressPercent: percent, unwatchedCount: totalAired - watchedCount, totalAiredEpisodesInSeason: totalAired };
  }, [season.episode_count, seasonDetails, watchProgress, showId, season.season_number, today]);

  const handleMarkUnmarkSeason = (e: React.MouseEvent) => {
    e.stopPropagation();
    const trackedItem: TrackedItem = { id: showDetails.id, title: showDetails.name || 'Untitled', media_type: 'tv', poster_path: showDetails.poster_path };
    if (isSeasonWatched) onUnmarkSeasonWatched(showId, season.season_number);
    else onMarkSeasonWatched(showId, season.season_number, trackedItem);
  };

  const isSeasonWatched = unwatchedCount === 0 && totalAiredEpisodesInSeason > 0;
  const isUpcoming = season.air_date && season.air_date > today;
  const userSeasonRating = seasonRatings[showId]?.[season.season_number] || 0;

  return (
    <>
      <RatingModal isOpen={seasonRatingModalOpen} onClose={() => setSeasonRatingModalOpen(false)} onSave={(rating) => onRateSeason(showId, season.season_number, rating)} currentRating={userSeasonRating} mediaTitle={season.name} />
      <MarkAsWatchedModal isOpen={logDateModalState.isOpen} onClose={() => setLogDateModalState({ isOpen: false, episode: null, scope: 'single' })} mediaTitle={logDateModalState.episode ? `S${logDateModalState.episode.season_number} E${logDateModalState.episode.episode_number}: ${logDateModalState.episode.name}` : season.name} onSave={() => {}} initialScope={logDateModalState.scope} mediaType="tv" showDetails={showDetails} seasonDetails={seasonDetails} />
      <NotesModal isOpen={notesModalState.isOpen} onClose={() => setNotesModalState({ isOpen: false, episode: null })} onSave={(notes) => { if(notesModalState.episode) onSaveEpisodeNote(showId, notesModalState.episode.season_number, notesModalState.episode.episode_number, notes); }} mediaTitle={notesModalState.episode ? `Note for E${notesModalState.episode.episode_number}` : ''} />
      
      <div id={`season-${season.season_number}`} className="mb-6">
        {isCollapsible && (
             <div className="bg-white/5 p-4 rounded-3xl border border-white/10 shadow-lg">
                <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
                    <div className="flex items-center flex-grow min-w-0">
                        <FallbackImage srcs={[season.poster_path, showPosterPath].filter(Boolean).map(p => getImageUrl(p, 'w92'))} placeholder={PLACEHOLDER_POSTER} alt={season.name} className="w-14 h-20 object-cover rounded-2xl flex-shrink-0 shadow-2xl border border-white/10" />
                        <div className="ml-5 flex-grow min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-black text-xl text-white uppercase tracking-tight truncate">{season.name}</h3>
                                {showRatings && season.vote_average && season.vote_average > 0 && <ScoreStar score={season.vote_average} size="xs" />}
                            </div>
                            <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">{season.episode_count} Episodes</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            {!isUpcoming && (
                                <button onClick={(e) => { e.stopPropagation(); setLogDateModalState({ isOpen: true, episode: null, scope: 'season' }); }} className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg border border-white/5">
                                    <LogWatchIcon className="w-4 h-4" />
                                </button>
                            )}
                            <button onClick={handleMarkUnmarkSeason} className={`p-3 rounded-2xl transition-all border ${isSeasonWatched ? 'bg-white border-transparent text-primary-accent active-glow shadow-xl' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                                {isSeasonWatched ? <XMarkIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
                            </button>
                        </div>
                        <ChevronDownIcon className={`h-6 w-6 transition-transform text-text-secondary ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                </div>
                {!isUpcoming && (
                    <div className="mt-5 w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <div className="bg-white h-full transition-all duration-1000 shadow-[0_0_15px_white]" style={{ width: `${seasonProgressPercent}%` }}></div>
                    </div>
                )}
            </div>
        )}

        {isExpanded && (
          <div className="pt-6 px-2">
            {!seasonDetails ? (
              <div className="py-20 text-center text-white/20 font-black uppercase tracking-[0.5em] animate-pulse">Synchronizing Data...</div>
            ) : (
              <ul className="space-y-12">
                    {seasonDetails.episodes.map(ep => {
                    const epProgress = watchProgress[showId]?.[season.season_number]?.[ep.episode_number];
                    const isWatched = epProgress?.status === 2;
                    const isFuture = ep.air_date && ep.air_date > today;
                    const tag = getEpisodeTag(ep, season, showDetails, seasonDetails);
                    const epRating = episodeRatings[showId]?.[season.season_number]?.[ep.episode_number] || 0;

                    const epKey = `S${ep.season_number}E${ep.episode_number}`;
                    const airtimeTruth = estimateStreamingTime(null, timezone, timeFormat, showId, epKey);

                    return (
                        <li key={ep.id} className={`flex flex-col gap-5 animate-fade-in ${isWatched ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                            <div className="flex items-start gap-6">
                                <div 
                                    className={`w-36 aspect-video flex-shrink-0 relative overflow-hidden rounded-2xl shadow-2xl border border-white/10 cursor-pointer group/thumb ${isFuture ? 'grayscale' : ''}`}
                                    onClick={() => onOpenEpisodeDetail(ep)}
                                >
                                    <img src={getImageUrl(ep.still_path, 'w500', 'still')} alt={ep.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover/thumb:scale-110" />
                                    <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-transparent transition-all"></div>
                                </div>
                                <div className="flex-grow min-w-0 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 
                                            className="font-black text-white text-lg uppercase tracking-tight truncate leading-none cursor-pointer hover:text-white/80 transition-colors"
                                            onClick={() => onOpenEpisodeDetail(ep)}
                                        >
                                            {ep.episode_number}. {ep.name}
                                        </h4>
                                        {tag && <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest text-white border border-white/20 ${tag.className}`}>{tag.text}</span>}
                                    </div>
                                    <div className="flex items-center flex-wrap gap-4">
                                        <span className="text-xs text-white font-black uppercase tracking-widest">{ep.air_date ? new Date(ep.air_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA'}</span>
                                        {ep.runtime && <span className="text-xs text-white font-black uppercase">{formatRuntime(ep.runtime)}</span>}
                                        
                                        {airtimeTruth && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black text-white rounded-md border border-white/10 shadow-lg">
                                                <ClockIcon className="w-3 h-3 text-white" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{airtimeTruth.time}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2" onClick={e => e.stopPropagation()}>
                                <EpisodeActionButton label={isWatched ? 'Clear' : 'Watch'} onClick={() => onToggleEpisode(showId, season.season_number, ep.episode_number, isWatched ? 2 : 0, showDetails as TrackedItem, ep.name)} disabled={isFuture} isActive={isWatched}>
                                    <CheckCircleIcon className="w-5 h-5" />
                                </EpisodeActionButton>
                                <EpisodeActionButton label="Live" onClick={() => onStartLiveWatch({ id: showId, media_type: 'tv', title: showDetails.name || '', poster_path: showDetails.poster_path, runtime: ep.runtime || 45, seasonNumber: season.season_number, episodeNumber: ep.episode_number, episodeTitle: ep.name })} disabled={isFuture}>
                                    <PlayCircleIcon className="w-5 h-5" />
                                </EpisodeActionButton>
                                <EpisodeActionButton label="Journal" onClick={() => onOpenJournal(season.season_number, ep)} isActive={!!epProgress?.journal?.text}>
                                    <BookOpenIcon className="w-5 h-5" />
                                </EpisodeActionButton>
                                <EpisodeActionButton label="Note" onClick={() => setNotesModalState({ isOpen: true, episode: ep })} isActive={!!episodeNotes[showId]?.[season.season_number]?.[ep.episode_number]}>
                                    <PencilSquareIcon className="w-5 h-5" />
                                </EpisodeActionButton>
                                <EpisodeActionButton label="Fav" onClick={() => onToggleFavoriteEpisode(showId, season.season_number, ep.episode_number)} isActive={!!favoriteEpisodes[showId]?.[season.season_number]?.[ep.episode_number]}>
                                    <HeartIcon filled={!!favoriteEpisodes[showId]?.[season.season_number]?.[ep.episode_number]} className="w-5 h-5" />
                                </EpisodeActionButton>
                                <EpisodeActionButton label="Rate" onClick={() => onOpenEpisodeRatingModal(ep)} isActive={epRating > 0}>
                                    <StarIcon filled={epRating > 0} className="w-5 h-5" />
                                </EpisodeActionButton>
                                <EpisodeActionButton label="Comment" onClick={() => onOpenEpisodeDetail(ep)}>
                                    <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                                </EpisodeActionButton>
                                <EpisodeActionButton label="Log" onClick={() => setLogDateModalState({ isOpen: true, episode: ep, scope: 'single' })} disabled={isFuture}>
                                    <LogWatchIcon className="w-5 h-5" />
                                </EpisodeActionButton>
                            </div>
                        </li>
                    );
                    })}
                </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SeasonAccordion;