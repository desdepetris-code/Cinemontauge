import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, clearMediaCache, getCollectionDetails, getEpisodeDetails } from '../services/tmdbService';
import { getTvdbShowExtended } from '../services/tvdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, TvdbShow, WatchProviderResponse, TmdbCollection, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo, TmdbMedia, EpisodeRatings, Comment, PublicUser, ProfileTab, TmdbVideo } from '../types';
import { ChevronLeftIcon, BookOpenIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, HeartIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, ChevronRightIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, QuestionMarkCircleIcon, CalendarIcon, PencilSquareIcon, TrashIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP_LARGE, PLACEHOLDER_STILL } from '../constants';
import SeasonAccordion from './SeasonAccordion';
import JournalModal from './JournalModal';
import ImageSelectorModal from './ImageSelectorModal';
import CastAndCrew from './CastAndCrew';
import MoreInfo from './MoreInfo';
import RecommendedMedia from './RecommendedMedia';
import CustomizeTab from './CustomizeTab';
import WhereToWatch from './WhereToWatch';
import MovieCollection from './MovieCollection';
import PageChangeRequest from './PageChangeRequest';
import RatingModal from './RatingModal';
import EpisodeDetailModal from './EpisodeDetailModal';
import { formatRuntime, isNewRelease, formatDate } from '../utils/formatUtils';
import NextUpWidget from './NextUpWidget';
import HistoryModal from './HistoryModal';
import CommentModal from './CommentModal';
// FIX: Import animationService to resolve 'Cannot find name' error.
import { animationService } from '../services/animationService';
import FavoriteAnimation from './FavoriteAnimation';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import { getShowStatus, getRenewalStatus } from '../utils/statusUtils';
import NotesModal from './NotesModal';
import OverallProgress from './OverallProgress';
import { getRating } from '../utils/ratingUtils';
import CommentsTab from './CommentsTab';
import { getPublicUsersByIds } from '../utils/userUtils';

interface UserScoreDisplayProps {
  voteAverage: number | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  xs: { wrapper: 'h-6 w-6', text: 'text-[8px]' },
  sm: { wrapper: 'h-8 w-8', text: 'text-[9px]' },
  md: { wrapper: 'h-12 w-12', text: 'text-xs' },
  lg: { wrapper: 'h-16 w-16', text: 'text-xs' },
};

export const UserScoreDisplay: React.FC<UserScoreDisplayProps> = ({ voteAverage, size = 'md' }) => {
    const config = sizeConfig[size as keyof typeof sizeConfig] || sizeConfig.md;
    
    // A standard star path with sharp corners
    const starPathData = "M12 2 L15.09 8.26 L22 9.27 L17 14.14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14.14 L2 9.27 L8.91 8.26 Z";

    if (voteAverage === undefined || voteAverage < 0.1) {
      return (
          <div className={`relative ${config.wrapper}`} role="img" aria-label="User score not available">
              <svg className="h-full w-full" viewBox="0 0 24 24">
                  <path d={starPathData} fill="var(--color-bg-secondary)" stroke="var(--text-color-secondary)" strokeWidth="0.75" />
              </svg>
              <div className={`absolute inset-0 flex items-center justify-center text-text-secondary font-bold ${config.text}`}>
                  N/A
              </div>
          </div>
      );
    }

    const percentage = Math.round(voteAverage * 10);

    return (
      <div className={`relative ${config.wrapper}`} role="img" aria-label={`User score: ${percentage} percent`}>
          <svg className="h-full w-full" viewBox="0 0 24 24">
              {/* Outer black star shape to create the thick border */}
              <path d={starPathData} fill="black" />
              {/* Inner white star shape */}
              <path d={starPathData} fill="white" transform-origin="center" transform="scale(0.8)" />
          </svg>
          <div 
              className={`absolute inset-0 flex items-center justify-center text-black font-bold ${config.text}`}
              style={{ fontFamily: "'Playfair Display', serif" }}
          >
              {percentage > 0 ? `${percentage}%` : 'N/A'}
          </div>
      </div>
    );
};


interface User {
  id: string;
  username: string;
  email: string;
}

// --- PROPS INTERFACE ---
interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  isModal?: boolean;
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
  onOpenCustomListModal: (item: TmdbMedia | TrackedItem) => void;
  ratings: UserRatings;
  onRateItem: (mediaId: number, rating: number) => void;
  onMarkMediaAsWatched: (item: TmdbMedia | TrackedItem, date?: string) => void;
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
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  onSaveComment: (mediaKey: string, text: string, parentId?: string) => void;
  onToggleCommentLike: (commentId: string) => void;
  comments: Comment[];
  onMarkRemainingWatched: (showId: number, seasonNumber: number, showInfo: TrackedItem) => void;
  genres: Record<number, string>;
  onMarkAllWatched: (showId: number, showInfo: TrackedItem) => void;
  onUnmarkAllWatched: (showId: number) => void;
  onSaveNote: (mediaId: number, note: string) => void;
  mediaNotes?: Record<number, string>;
  episodeNotes?: Record<number, Record<number, Record<number, string>>>;
  onSaveEpisodeNote: (showId: number, seasonNumber: number, episodeNumber: number, note: string) => void;
  currentUser: User | null;
  timezone: string;
  onDeleteJournal: (mediaId: number, seasonNumber: number, episodeNumber: number) => void;
  onDeleteNote: (mediaId: number, seasonNumber?: number, episodeNumber?: number) => void;
}

type ShowDetailTab = 'episodes' | 'cast' | 'info' | 'recommendations' | 'customize' | 'watch' | 'comments' | 'journal';

interface ShowDetailState {
  details: TmdbMediaDetails | null;
  seasonDetails: Record<number, TmdbSeasonDetails>;
  tvdbDetails: TvdbShow | null;
  watchProviders: WatchProviderResponse | null;
  collectionDetails: TmdbCollection | null;
  loading: boolean;
  error: string | null;
  activeTab: ShowDetailTab;
}

const ShowDetail: React.FC<ShowDetailProps> = (props) => {
    const { id, mediaType, onBack, watchProgress, onToggleEpisode, onSaveJournal, trackedLists, onUpdateLists, customImagePaths, onSetCustomImage, favorites, onToggleFavoriteShow, onSelectShow, onOpenCustomListModal, ratings, onRateItem, onMarkMediaAsWatched, onUnmarkMovieWatched, onMarkSeasonWatched, onUnmarkSeasonWatched, onMarkPreviousEpisodesWatched, favoriteEpisodes, onToggleFavoriteEpisode, onSelectPerson, onStartLiveWatch, history, onDeleteHistoryItem, onClearMediaHistory, episodeRatings, onRateEpisode, onAddWatchHistory, onSaveComment, onToggleCommentLike, comments, onMarkRemainingWatched, genres, onMarkAllWatched, onUnmarkAllWatched, onSaveNote, mediaNotes, episodeNotes, onSaveEpisodeNote, currentUser, timezone, onDeleteJournal, onDeleteNote } = props;
  const [state, setState] = useState<ShowDetailState>({
    details: null,
    seasonDetails: {},
    tvdbDetails: null,
    watchProviders: null,
    collectionDetails: null,
    loading: true,
    error: null,
    activeTab: mediaType === 'tv' ? 'episodes' : 'info',
  });
  const { details, seasonDetails, tvdbDetails, watchProviders, collectionDetails, loading, error, activeTab } = state;
  const [expandedSeasons, setExpandedSeasons] = useState<Record<number, boolean>>({});
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [journalContext, setJournalContext] = useState<{ season: number; episode: Episode } | null>(null);
  const [isImageSelectorOpen, setIsImageSelectorOpen] = useState(false);
  const [imageSelectorTab, setImageSelectorTab] = useState<'posters' | 'backdrops'>('posters');
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isEpisodeRatingModalOpen, setIsEpisodeRatingModalOpen] = useState(false);
  const [episodeToRate, setEpisodeToRate] = useState<Episode | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isMarkAsWatchedModalOpen, setIsMarkAsWatchedModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [commentParentId, setCommentParentId] = useState<string | undefined>(undefined);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [allPublicComments, setAllPublicComments] = useState<Comment[]>([]);
  const [userMap, setUserMap] = useState<Map<string, PublicUser>>(new Map());
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState<string | null>(null);
  
  const handleImagePreviewClose = () => setIsImagePreviewOpen(null);

  const fetchShowDetails = useCallback(async (forceRefresh = false) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
        if(forceRefresh) {
            clearMediaCache(id, mediaType);
        }
      const data = await getMediaDetails(id, mediaType);
      setState(s => ({ ...s, details: data, loading: false }));

      if (mediaType === 'tv' && data.external_ids?.tvdb_id) {
          getTvdbShowExtended(data.external_ids.tvdb_id)
            .then(tvdbData => setState(s => ({ ...s, tvdbDetails: tvdbData })))
            .catch(e => console.error("Could not fetch TVDB details", e));
      }
      
      if (mediaType === 'movie' && data.belongs_to_collection) {
          getCollectionDetails(data.belongs_to_collection.id)
            .then(collectionData => setState(s => ({ ...s, collectionDetails: collectionData })))
            .catch(e => console.error("Could not fetch collection details", e));
      }
      
      getWatchProviders(id, mediaType)
        .then(providers => setState(s => ({...s, watchProviders: providers})))
        .catch(e => console.error("Could not fetch watch providers", e));

    } catch (err: any) {
      setState(s => ({ ...s, error: err.message, loading: false }));
    }
  }, [id, mediaType]);

  useEffect(() => {
    fetchShowDetails();
  }, [fetchShowDetails]);

  useEffect(() => {
    if (details) {
      const userIds = new Set<string>();
      comments.forEach(c => userIds.add(c.userId));
      const fetchedUsers = getPublicUsersByIds(Array.from(userIds));
      setUserMap(fetchedUsers);
      setAllPublicComments(comments);
    }
  }, [details, comments]);
  
  const handleToggleSeason = async (seasonNumber: number) => {
    setExpandedSeasons(prev => {
      const newState = { ...prev };
      newState[seasonNumber] = !newState[seasonNumber];
      return newState;
    });

    if (!seasonDetails[seasonNumber] && mediaType === 'tv') {
      try {
        const data = await getSeasonDetails(id, seasonNumber);
        setState(s => ({...s, seasonDetails: { ...s.seasonDetails, [seasonNumber]: data } }));
      } catch (err) {
        console.error(`Failed to load season ${seasonNumber}`, err);
      }
    }
  };

  const nextEpisodeToWatch = useMemo(() => {
    if (mediaType !== 'tv' || !details || !details.seasons) return null;
    const progressForShow = watchProgress[id] || {};
    const sortedSeasons = [...details.seasons].filter(s => s.season_number > 0).sort((a,b) => a.season_number - b.season_number);
    
    for (const season of sortedSeasons) {
        for (let i = 1; i <= season.episode_count; i++) {
            if (progressForShow[season.season_number]?.[i]?.status !== 2) {
                return { seasonNumber: season.season_number, episodeNumber: i };
            }
        }
    }
    return null;
  }, [mediaType, details, watchProgress, id]);

  const handleOpenJournal = (season: number, episode: Episode) => {
    setJournalContext({ season, episode });
    setIsJournalModalOpen(true);
  };
  
  const handleOpenEpisodeDetail = (episode: Episode) => {
    setSelectedEpisode(episode);
  };

  const handleEpisodeNav = (direction: 'next' | 'previous') => {
    if (!selectedEpisode || !details) return;
    const currentSeason = seasonDetails[selectedEpisode.season_number] as TmdbSeasonDetails;
    if (!currentSeason || !currentSeason.episodes) return;
    const currentIndex = currentSeason.episodes.findIndex(e => e.id === selectedEpisode.id);
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < currentSeason.episodes.length) {
        setSelectedEpisode(currentSeason.episodes[newIndex]);
    }
  };
  
  const currentList = useMemo(() => {
    for (const listName in trackedLists) {
      if (trackedLists[listName as WatchStatus].some(item => item.id === id)) {
        return listName as WatchStatus;
      }
    }
    return null;
  }, [trackedLists, id]);
  
  const trackedItem: TrackedItem | undefined = useMemo(() => {
    if(!details) return undefined;
    const { id, media_type, title, name, poster_path, genre_ids } = details;
    return { id, media_type, title: title || name || '', poster_path, genre_ids };
  }, [details]);
  
  const isFavorite = useMemo(() => favorites.some(fav => fav.id === id), [favorites, id]);
  
  const handleToggleFavorite = () => {
    if(trackedItem) {
        onToggleFavoriteShow(trackedItem);
        animationService.show('flyToNav', { posterPath: trackedItem.poster_path });
    }
  }

  const handleOpenImageSelector = (tab: 'posters' | 'backdrops') => {
      setImageSelectorTab(tab);
      setIsImageSelectorOpen(true);
  };

  const handleOpenEpisodeRatingModal = (episode: Episode) => {
    setEpisodeToRate(episode);
    setIsEpisodeRatingModalOpen(true);
  };
  
  const handleCommentAction = (parentId?: string) => {
      setCommentParentId(parentId);
      setIsCommentModalOpen(true);
  };

  const mediaKey = useMemo(() => `${mediaType}-${id}`, [mediaType, id]);

  const commentsForMedia = useMemo(() => {
    return allPublicComments.filter(c => c.mediaKey.startsWith(mediaKey));
  }, [allPublicComments, mediaKey]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!details) return <div>No details found.</div>;

  const posterUrl = getImageUrl(customImagePaths[id]?.poster_path || details.poster_path, 'w342');
  const backdropUrl = getImageUrl(customImagePaths[id]?.backdrop_path || details.backdrop_path, 'w1280');
  
  const allHistory = history.filter(h => h.id === id);
  const rating = ratings[id]?.rating || 0;
  
  const showStatus = getShowStatus(details);
  const renewalStatus = getRenewalStatus(details);
  const ratingInfo = getRating(details);
  const noteForMedia = mediaNotes?.[id] || '';
  const releaseDate = details.media_type === 'tv' ? details.first_air_date : details.release_date;
  const runtimeValue = useMemo(() => (details.media_type === 'tv' ? (details.episode_run_time?.[0] ? `~${formatRuntime(details.episode_run_time[0])}/ep` : '') : formatRuntime(details.runtime)), [details]);


  const tabs: { id: ShowDetailTab; label: string; visible: boolean }[] = [
    { id: 'episodes', label: 'Episodes', visible: mediaType === 'tv' },
    { id: 'journal', label: 'Journal & Notes', visible: true },
    { id: 'cast', label: 'Cast & Crew', visible: true },
    { id: 'info', label: 'More Info', visible: true },
    { id: 'watch', label: 'Where to Watch', visible: watchProviders?.results?.US != null },
    { id: 'recommendations', label: 'Recommendations', visible: (details.recommendations?.results?.length || 0) > 0 },
    { id: 'comments', label: 'Comments', visible: true },
    { id: 'customize', label: 'Customize', visible: (details.images?.posters?.length || 0) > 1 || (details.images?.backdrops?.length || 0) > 1 },
  ];

  const trailer = details.videos?.results.find(v => v.type === 'Trailer' && v.site === 'YouTube' && v.official);

  const selectedEpisodeInModal = selectedEpisode ? {
    ...selectedEpisode,
    isWatched: !!watchProgress[id]?.[selectedEpisode.season_number]?.[selectedEpisode.episode_number]?.status,
    isFavorited: !!favoriteEpisodes[id]?.[selectedEpisode.season_number]?.[selectedEpisode.episode_number],
    episodeRating: episodeRatings[id]?.[selectedEpisode.season_number]?.[selectedEpisode.episode_number] || 0,
  } : null;

    return (
        <div className="animate-fade-in pb-16">
            <div className="relative mb-8">
                <FallbackImage srcs={[backdropUrl]} placeholder={PLACEHOLDER_BACKDROP_LARGE} alt={`${details.name || details.title} backdrop`} className="w-full h-48 sm:h-64 md:h-80 object-cover object-top" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/80 to-transparent"></div>
                <button onClick={onBack} className="absolute top-4 left-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-40" aria-label="Go back">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                 <button onClick={() => fetchShowDetails(true)} className="absolute top-4 right-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-40" aria-label="Refresh data">
                    <ArrowPathIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="container mx-auto px-4 -mt-24 sm:-mt-32 md:-mt-40 relative z-10">
                <div className="flex flex-col sm:flex-row items-end">
                    <div className="w-32 h-48 sm:w-40 sm:h-60 flex-shrink-0 relative group">
                        <FallbackImage srcs={[posterUrl]} placeholder={PLACEHOLDER_POSTER} alt="Poster" className="w-full h-full object-cover rounded-lg shadow-xl border-4 border-bg-primary"/>
                        <div onClick={() => handleOpenImageSelector('posters')} className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <PencilSquareIcon className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <div className="sm:ml-6 mt-4 sm:mt-0 w-full">
                        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]">{details.name || details.title}</h1>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary mt-2">
                            {releaseDate && <span>{new Date(releaseDate + 'T00:00:00Z').getFullYear()}</span>}
                            {ratingInfo && <><span>&bull;</span> <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded border ${ratingInfo.colorClass} border-current`}>{ratingInfo.rating}</span></>}
                            {runtimeValue && <><span>&bull;</span><span>{runtimeValue}</span></>}
                            {showStatus && <><span>&bull;</span><span>{showStatus.text}</span></>}
                        </div>
                        {renewalStatus && <p className="text-xs font-semibold text-green-400 mt-1">{renewalStatus.text}</p>}
                    </div>
                </div>
                
                <div className="flex items-center space-x-4 mt-4">
                    <UserScoreDisplay voteAverage={details.vote_average} size="lg" />
                    <div className="flex-grow grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <ActionButton icon={<HeartIcon filled={isFavorite} className={`w-5 h-5 ${isFavorite ? 'text-primary-accent' : ''}`} />} label="Favorite" onClick={handleToggleFavorite} isActive={isFavorite}/>
                        <ActionButton icon={<StarIcon filled={rating > 0} className={`w-5 h-5 ${rating > 0 ? 'text-primary-accent' : ''}`} />} label="Rate" onClick={() => setIsRatingModalOpen(true)} isActive={rating > 0} />
                        <ActionButton icon={<ListBulletIcon className="w-5 h-5" />} label="Add to List" onClick={() => trackedItem && onOpenCustomListModal(trackedItem)} />
                        <ActionButton icon={<PencilSquareIcon className="w-5 h-5" />} label="Note" onClick={() => setIsNotesModalOpen(true)} isActive={!!noteForMedia} />
                        <ActionButton icon={<ClockIcon className="w-5 h-5" />} label="History" onClick={() => setIsHistoryModalOpen(true)} />
                        {mediaType === 'movie' && (
                            <ActionButton 
                                icon={<CheckCircleIcon className="w-5 h-5" />}
                                label={currentList === 'completed' ? "Unwatch" : "Watched"}
                                onClick={() => trackedItem && (currentList === 'completed' ? onUnmarkMovieWatched(id) : setIsMarkAsWatchedModalOpen(true))}
                            />
                        )}
                        <PageChangeRequest mediaTitle={details.name || details.title || ''} mediaId={id} />
                    </div>
                </div>

                <div className="mt-6 space-y-6">
                    {details.overview && <p className="text-text-secondary">{details.overview}</p>}
                    {trailer && (
                        <div>
                            <h3 className="text-xl font-bold text-text-primary mb-3">Trailer</h3>
                            <div className="aspect-video">
                                <iframe className="w-full h-full rounded-lg shadow-lg" src={`https://www.youtube.com/embed/${trailer.key}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                            </div>
                        </div>
                    )}
                    {mediaType === 'tv' && details.seasons && details.seasons.length > 0 && <OverallProgress details={details} watchProgress={watchProgress} />}
                    {mediaType === 'tv' && nextEpisodeToWatch && <NextUpWidget showId={id} details={details} tvdbDetails={tvdbDetails} nextEpisodeToWatch={nextEpisodeToWatch} {...props} />}
                    {mediaType === 'movie' && collectionDetails && <MovieCollection collectionId={collectionDetails.id} currentMovieId={id} onSelectMovie={(movieId) => onSelectShow(movieId, 'movie')} />}
                </div>

                <div className="mt-8">
                    <div className="border-b border-bg-secondary/50 mb-6">
                        <div className="flex space-x-2 overflow-x-auto pb-2 hide-scrollbar">
                            {tabs.filter(t => t.visible).map(tab => (
                                <button key={tab.id} onClick={() => setState(s => ({...s, activeTab: tab.id}))} className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors ${activeTab === tab.id ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-secondary hover:brightness-125'}`}>
                                {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="animate-fade-in">
                        {activeTab === 'episodes' && mediaType === 'tv' && (
                            <div className="space-y-4">
                                {details.seasons?.map(s => <SeasonAccordion key={s.id} season={s} showId={id} isExpanded={expandedSeasons[s.season_number]} onToggle={() => handleToggleSeason(s.season_number)} seasonDetails={seasonDetails[s.season_number]} showPosterPath={details.poster_path} showDetails={details} onOpenEpisodeDetail={handleOpenEpisodeDetail} onImageClick={setIsImagePreviewOpen} {...props} />)}
                            </div>
                        )}
                        {activeTab === 'journal' && <JournalTab details={details} watchProgress={watchProgress} mediaNotes={mediaNotes} episodeNotes={episodeNotes} onDeleteJournal={onDeleteJournal} onDeleteNote={onDeleteNote} />}
                        {activeTab === 'cast' && <CastAndCrew details={details} tvdbDetails={tvdbDetails} onSelectPerson={onSelectPerson} />}
                        {activeTab === 'info' && <MoreInfo details={details} tvdbDetails={tvdbDetails} onSelectShow={onSelectShow} />}
                        {activeTab === 'watch' && <WhereToWatch providers={watchProviders} />}
                        {activeTab === 'recommendations' && <RecommendedMedia recommendations={details.recommendations?.results || []} onSelectShow={onSelectShow} />}
                        {activeTab === 'comments' && <CommentsTab comments={commentsForMedia} userMap={userMap} currentUser={currentUser} onCommentAction={handleCommentAction} onToggleLike={onToggleCommentLike} details={details} />}
                        {activeTab === 'customize' && <CustomizeTab posterUrl={posterUrl} backdropUrl={backdropUrl} onOpenPosterSelector={() => handleOpenImageSelector('posters')} onOpenBackdropSelector={() => handleOpenImageSelector('backdrops')} />}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {isImagePreviewOpen && (
                <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center" onClick={handleImagePreviewClose}>
                    <img src={isImagePreviewOpen} alt="Preview" className="max-w-[95vw] max-h-[95vh] object-contain"/>
                    <button onClick={handleImagePreviewClose} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full"><XMarkIcon className="w-6 h-6"/></button>
                </div>
            )}
            <NotesModal isOpen={isNotesModalOpen} onClose={() => setIsNotesModalOpen(false)} mediaTitle={details.name || details.title || ''} initialNote={noteForMedia} onSave={(note) => onSaveNote(id, note)} />
            <MarkAsWatchedModal isOpen={isMarkAsWatchedModalOpen} onClose={() => setIsMarkAsWatchedModalOpen(false)} mediaTitle={details.name || details.title || ''} onSave={data => { if(trackedItem) onMarkMediaAsWatched(trackedItem, data.date); }} />
            <CommentModal isOpen={isCommentModalOpen} onClose={() => setIsCommentModalOpen(false)} mediaTitle={details.name || details.title || ''} onSave={(text) => onSaveComment(mediaKey, text, commentParentId)} initialText={currentUser ? comments.find(c=>c.userId===currentUser.id && c.mediaKey === mediaKey && !c.parentId)?.text : ''} />
            {selectedEpisode && seasonDetails[selectedEpisode.season_number] && (
                <EpisodeDetailModal 
                    isOpen={!!selectedEpisode} 
                    onClose={() => setSelectedEpisode(null)} 
                    episode={selectedEpisode}
                    showDetails={details}
                    seasonDetails={seasonDetails[selectedEpisode.season_number]}
                    isWatched={!!watchProgress[id]?.[selectedEpisode.season_number]?.[selectedEpisode.episode_number]?.status}
                    onToggleWatched={() => trackedItem && onToggleEpisode(id, selectedEpisode.season_number, selectedEpisode.episode_number, watchProgress[id]?.[selectedEpisode.season_number]?.[selectedEpisode.episode_number]?.status || 0, trackedItem, selectedEpisode.name)}
                    onOpenJournal={() => handleOpenJournal(selectedEpisode.season_number, selectedEpisode)}
                    isFavorited={!!favoriteEpisodes[id]?.[selectedEpisode.season_number]?.[selectedEpisode.episode_number]}
                    onToggleFavorite={() => onToggleFavoriteEpisode(id, selectedEpisode.season_number, selectedEpisode.episode_number)}
                    onStartLiveWatch={onStartLiveWatch}
                    onSaveJournal={onSaveJournal}
                    watchProgress={watchProgress}
                    onNext={() => handleEpisodeNav('next')}
                    onPrevious={() => handleEpisodeNav('previous')}
                    onAddWatchHistory={onAddWatchHistory}
                    onRate={() => handleOpenEpisodeRatingModal(selectedEpisode)}
                    episodeRating={episodeRatings[id]?.[selectedEpisode.season_number]?.[selectedEpisode.episode_number] || 0}
                    onSaveComment={onSaveComment}
                    comments={comments}
                    episodeNotes={episodeNotes}
                    currentUser={currentUser}
                    timezone={timezone}
                    onSelectPerson={onSelectPerson}
                    history={history}
                    onDeleteHistoryItem={onDeleteHistoryItem}
                />
            )}
            <RatingModal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} onSave={(rating) => onRateItem(id, rating)} currentRating={rating} mediaTitle={details.name || details.title || ''}/>
            <RatingModal isOpen={isEpisodeRatingModalOpen} onClose={() => setIsEpisodeRatingModalOpen(false)} onSave={(rating) => {if(episodeToRate) onRateEpisode(id, episodeToRate.season_number, episodeToRate.episode_number, rating)}} currentRating={episodeToRate ? (episodeRatings[id]?.[episodeToRate.season_number]?.[episodeToRate.episode_number] || 0) : 0} mediaTitle={episodeToRate ? `S${episodeToRate.season_number} E${episodeToRate.episode_number}: ${episodeToRate.name}` : ''}/>
            {isJournalModalOpen && (
                <JournalModal
                    isOpen={isJournalModalOpen}
                    onClose={() => setIsJournalModalOpen(false)}
                    onSave={onSaveJournal}
                    mediaDetails={details}
                    initialSeason={journalContext?.season}
                    initialEpisode={journalContext?.episode}
                    watchProgress={watchProgress}
                />
            )}
            <ImageSelectorModal isOpen={isImageSelectorOpen} onClose={() => setIsImageSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => onSetCustomImage(id, type, path)} initialTab={imageSelectorTab} />
            <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={allHistory} mediaTitle={details.name || details.title || ''} onDeleteHistoryItem={onDeleteHistoryItem} onClearMediaHistory={onClearMediaHistory} mediaDetails={details} />
        </div>
    );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick?: () => void; isActive?: boolean }> = ({ icon, label, onClick, isActive }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center space-y-1 w-full h-full p-2 rounded-lg border transition-all ${isActive ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg' : 'bg-bg-secondary border-bg-secondary/80 text-text-primary hover:border-primary-accent hover:bg-bg-secondary/70'}`}
    >
        {icon}
        <span className="text-xs font-semibold text-center">{label}</span>
    </button>
);

const JournalTab: React.FC<{
    details: TmdbMediaDetails;
    watchProgress: WatchProgress;
    mediaNotes?: Record<number, string>;
    episodeNotes?: Record<number, Record<number, Record<number, string>>>;
    onDeleteJournal: (mediaId: number, seasonNumber: number, episodeNumber: number) => void;
    onDeleteNote: (mediaId: number, seasonNumber?: number, episodeNumber?: number) => void;
}> = ({ details, watchProgress, mediaNotes, episodeNotes, onDeleteJournal, onDeleteNote }) => {
    
    const journalAndNotesItems = useMemo(() => {
        const items: {
            type: 'journal' | 'note';
            timestamp: string;
            content: string;
            mood?: string;
            mediaId: number;
            season?: number;
            episode?: number;
            episodeName?: string;
        }[] = [];

        // Aggregate journal entries
        const progress = watchProgress[details.id] || {};
        for (const seasonNum in progress) {
            for (const episodeNum in progress[seasonNum]) {
                const epProgress = progress[seasonNum][episodeNum];
                if (epProgress.journal) {
                    items.push({
                        type: 'journal',
                        timestamp: epProgress.journal.timestamp,
                        content: epProgress.journal.text,
                        mood: epProgress.journal.mood,
                        mediaId: details.id,
                        season: Number(seasonNum),
                        episode: Number(episodeNum),
                    });
                }
            }
        }
        
        // Aggregate notes
        if(mediaNotes && mediaNotes[details.id]) {
            items.push({ type: 'note', timestamp: new Date().toISOString(), content: mediaNotes[details.id], mediaId: details.id });
        }
        if(episodeNotes && episodeNotes[details.id]) {
            for (const seasonNum in episodeNotes[details.id]) {
                for (const episodeNum in episodeNotes[details.id][seasonNum]) {
                    items.push({
                        type: 'note',
                        timestamp: new Date().toISOString(), // Notes don't have timestamps, use current for sorting
                        content: episodeNotes[details.id][seasonNum][episodeNum],
                        mediaId: details.id,
                        season: Number(seasonNum),
                        episode: Number(episodeNum),
                    });
                }
            }
        }

        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [details.id, watchProgress, mediaNotes, episodeNotes]);
    
    if (journalAndNotesItems.length === 0) {
        return <p className="text-text-secondary text-center py-8">You haven't written any notes or journal entries for this item yet.</p>
    }

    return (
        <div className="space-y-6">
            {journalAndNotesItems.map((item, index) => {
                const title = item.mediaId === details.id && item.season === 0 && item.episode === 0 ? details.title :
                              item.season !== undefined && item.episode !== undefined ? `S${item.season} E${item.episode}` : details.title;
                const date = new Date(item.timestamp).toLocaleDateString();

                if (item.type === 'note') {
                    return (
                        <div key={`note-${index}`} className="relative bg-yellow-200 dark:bg-yellow-900/40 p-4 rounded-lg transform -rotate-2 shadow-lg">
                             <button onClick={() => onDeleteNote(item.mediaId, item.season, item.episode)} className="absolute top-2 right-2 p-1 text-yellow-900/50 dark:text-yellow-200/50 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                             <p className="text-xs font-semibold text-yellow-800 dark:text-yellow-300">{title}</p>
                             <p className="text-sm text-yellow-900 dark:text-yellow-100 mt-2 whitespace-pre-wrap">{item.content}</p>
                        </div>
                    );
                }
                // Journal Entry
                return (
                    <div key={`journal-${index}`} className="bg-bg-secondary p-4 rounded-lg relative">
                        <button onClick={() => onDeleteJournal(item.mediaId, item.season!, item.episode!)} className="absolute top-2 right-2 p-1 text-text-secondary/50 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                        <div className="flex justify-between items-baseline">
                           <p className="font-semibold text-text-primary">{title}</p>
                           <p className="text-xs text-text-secondary">{date}</p>
                        </div>
                        <div className="flex items-start space-x-3 mt-2">
                           {item.mood && <span className="text-3xl">{item.mood}</span>}
                           <p className="text-sm text-text-secondary whitespace-pre-wrap pt-1">{item.content}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ShowDetail;