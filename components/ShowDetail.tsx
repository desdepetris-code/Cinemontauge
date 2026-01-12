
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMediaDetails, getSeasonDetails, getWatchProviders, getShowAggregateCredits } from '../services/tmdbService';
import { TmdbMediaDetails, WatchProgress, JournalEntry, TrackedItem, WatchStatus, CustomImagePaths, TmdbSeasonDetails, Episode, WatchProviderResponse, CustomList, HistoryItem, UserRatings, FavoriteEpisodes, LiveWatchMediaInfo, EpisodeRatings, Comment, SeasonRatings, CastMember, CrewMember, PublicUser, Reminder } from '../types';
// FIX: Added PlusIcon to imports which was causing a 'Cannot find name' error on line 252.
import { ChevronLeftIcon, BookOpenIcon, StarIcon, ArrowPathIcon, CheckCircleIcon, PlayCircleIcon, HeartIcon, ClockIcon, ListBulletIcon, ChevronDownIcon, XMarkIcon, ChatBubbleOvalLeftEllipsisIcon, CalendarIcon, PencilSquareIcon, BellIcon, PhotoIcon, BadgeIcon, VideoCameraIcon, PlusIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_BACKDROP_LARGE } from '../constants';
import SeasonAccordion from './SeasonAccordion';
import { formatRuntime } from '../utils/formatUtils';
import NextUpWidget from './NextUpWidget';
import HistoryModal from './HistoryModal';
import RatingModal from './RatingModal';
import EpisodeDetailModal from './EpisodeDetailModal';
import OverallProgress from './OverallProgress';
import ScoreStar from './ScoreStar';
import { getShowStatus } from '../utils/statusUtils';
import CastAndCrew from './CastAndCrew';
import MoreInfo from './MoreInfo';
import WhereToWatch from './WhereToWatch';
import RecommendedMedia from './RecommendedMedia';
import CustomizeTab from './CustomizeTab';
import ImageSelectorModal from './ImageSelectorModal';
import ShowAchievementsTab from './ShowAchievementsTab';
import CommentsTab from './CommentsTab';

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
  onSaveEpisodeNote: (showId: number, seasonNumber: number, episodeNumber: number, note: string) => void;
  showRatings: boolean;
  seasonRatings: SeasonRatings;
  onRateSeason: (showId: number, seasonNumber: number, rating: number) => void;
  customLists: CustomList[];
  currentUser: any;
  allUsers: PublicUser[];
}

type TabType = 'seasons' | 'info' | 'cast' | 'media' | 'customize' | 'achievements' | 'discussion';

const ShowDetail: React.FC<ShowDetailProps> = (props) => {
  const { id, mediaType, onBack, watchProgress, history, trackedLists, onUpdateLists, customImagePaths, favorites, onToggleFavoriteShow, onRateItem, ratings, showRatings, currentUser } = props;
  
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
  const [providers, setProviders] = useState<WatchProviderResponse | null>(null);
  const [aggregateCredits, setAggregateCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>(mediaType === 'tv' ? 'seasons' : 'info');
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);
  const [seasonDetailsMap, setSeasonDetailsMap] = useState<Record<number, TmdbSeasonDetails>>({});
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isPosterSelectorOpen, setIsPosterSelectorOpen] = useState(false);
  const [isBackdropSelectorOpen, setIsBackdropSelectorOpen] = useState(false);
  const [selectedEpisodeForDetail, setSelectedEpisodeForDetail] = useState<Episode | null>(null);
  const [activeCommentThread, setActiveCommentThread] = useState('general');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [mediaDetails, watchProviders] = await Promise.all([
        getMediaDetails(id, mediaType),
        getWatchProviders(id, mediaType)
      ]);
      setDetails(mediaDetails);
      setProviders(watchProviders);

      if (mediaType === 'tv' && mediaDetails.seasons) {
          const firstSeason = mediaDetails.seasons.find(s => s.season_number > 0);
          if (firstSeason) {
              setExpandedSeason(firstSeason.season_number);
              const sd = await getSeasonDetails(id, firstSeason.season_number);
              setSeasonDetailsMap(prev => ({ ...prev, [firstSeason.season_number]: sd }));
          }
          // Fetch aggregate credits for TV
          getShowAggregateCredits(id, mediaDetails.seasons).then(setAggregateCredits);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id, mediaType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleSeason = async (seasonNumber: number) => {
    if (expandedSeason === seasonNumber) {
      setExpandedSeason(null);
    } else {
      setExpandedSeason(seasonNumber);
      if (!seasonDetailsMap[seasonNumber]) {
        try {
          const sd = await getSeasonDetails(id, seasonNumber);
          setSeasonDetailsMap(prev => ({ ...prev, [seasonNumber]: sd }));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const currentStatus = useMemo(() => {
    for (const [status, list] of Object.entries(trackedLists) as [WatchStatus, TrackedItem[]][]) {
      if (list.some(item => item.id === id)) return status;
    }
    return null;
  }, [trackedLists, id]);

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

  const backdropUrl = customImagePaths[id]?.backdrop_path 
    ? getImageUrl(customImagePaths[id].backdrop_path, 'w1280', 'backdrop')
    : getImageUrl(details?.backdrop_path, 'w1280', 'backdrop');

  const posterUrl = customImagePaths[id]?.poster_path
    ? getImageUrl(customImagePaths[id].poster_path, 'w500', 'poster')
    : getImageUrl(details?.poster_path, 'w500', 'poster');

  const showStatus = useMemo(() => details ? getShowStatus(details) : null, [details]);

  if (loading) return <div className="p-20 text-center animate-pulse text-text-secondary">Loading Cinematic Experience...</div>;
  if (!details) return <div className="p-20 text-center text-red-500">Failed to load content.</div>;

  const userRating = ratings[id]?.rating || 0;
  const isFavorited = favorites.some(f => f.id === id);

  const tabs: { id: TabType, label: string, icon: any }[] = [
    ...(mediaType === 'tv' ? [{ id: 'seasons', label: 'Seasons', icon: ListBulletIcon }] as any : []),
    { id: 'info', label: 'Info', icon: BookOpenIcon },
    { id: 'cast', label: 'Cast', icon: PlayCircleIcon },
    { id: 'media', label: 'Media', icon: VideoCameraIcon },
    { id: 'customize', label: 'Customize', icon: PhotoIcon },
    { id: 'achievements', label: 'Badges', icon: BadgeIcon },
    { id: 'discussion', label: 'Discuss', icon: ChatBubbleOvalLeftEllipsisIcon },
  ];

  return (
    <div className="animate-fade-in relative">
      <RatingModal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} onSave={(r) => onRateItem(id, r)} currentRating={userRating} mediaTitle={details.title || details.name || ''} />
      <HistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} history={history.filter(h => h.id === id)} mediaTitle={details.title || details.name || ''} mediaDetails={details} onDeleteHistoryItem={props.onDeleteHistoryItem} onClearMediaHistory={props.onClearMediaHistory} />
      <ImageSelectorModal isOpen={isPosterSelectorOpen} onClose={() => setIsPosterSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => props.onSetCustomImage(id, type, path)} initialTab="posters" />
      <ImageSelectorModal isOpen={isBackdropSelectorOpen} onClose={() => setIsBackdropSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => props.onSetCustomImage(id, type, path)} initialTab="backdrops" />
      <EpisodeDetailModal 
        isOpen={!!selectedEpisodeForDetail} 
        onClose={() => setSelectedEpisodeForDetail(null)} 
        episode={selectedEpisodeForDetail} 
        showDetails={details} 
        seasonDetails={seasonDetailsMap[selectedEpisodeForDetail?.season_number || 0] || { episodes: [] }} 
        isWatched={watchProgress[id]?.[selectedEpisodeForDetail?.season_number || 0]?.[selectedEpisodeForDetail?.episode_number || 0]?.status === 2}
        onToggleWatched={() => selectedEpisodeForDetail && props.onToggleEpisode(id, selectedEpisodeForDetail.season_number, selectedEpisodeForDetail.episode_number, watchProgress[id]?.[selectedEpisodeForDetail.season_number]?.[selectedEpisodeForDetail.episode_number]?.status || 0, details as any, selectedEpisodeForDetail.name)}
        onOpenJournal={() => {}}
        isFavorited={!!props.favoriteEpisodes[id]?.[selectedEpisodeForDetail?.season_number || 0]?.[selectedEpisodeForDetail?.episode_number || 0]}
        onToggleFavorite={() => selectedEpisodeForDetail && props.onToggleFavoriteEpisode(id, selectedEpisodeForDetail.season_number, selectedEpisodeForDetail.episode_number)}
        onStartLiveWatch={props.onStartLiveWatch}
        onSaveJournal={props.onSaveJournal as any}
        watchProgress={watchProgress}
        onNext={() => {}}
        onPrevious={() => {}}
        onAddWatchHistory={props.onAddWatchHistory}
        onRate={() => {}}
        episodeRating={0}
        onDiscuss={() => { setActiveTab('discussion'); setActiveCommentThread(`tv-${id}-s${selectedEpisodeForDetail?.season_number}-e${selectedEpisodeForDetail?.episode_number}`); }}
        showRatings={showRatings}
      />

      {/* Hero Header */}
      <div className="relative h-[40vh] md:h-[60vh] overflow-hidden">
        <img src={backdropUrl} className="w-full h-full object-cover" alt="Backdrop" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/40 to-transparent"></div>
        <button onClick={onBack} className="absolute top-6 left-6 p-3 bg-backdrop/50 backdrop-blur-md rounded-full text-white hover:bg-bg-secondary transition-all z-20">
            <ChevronLeftIcon className="w-6 h-6" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column: Poster & Quick Actions */}
          <div className="w-full md:w-80 flex-shrink-0">
            <div className="relative group">
              <img src={posterUrl} className="rounded-2xl shadow-2xl w-full aspect-[2/3] object-cover border-4 border-bg-primary" alt="Poster" />
              {showRatings && details.vote_average && (
                <div className="absolute -top-4 -right-4">
                  <ScoreStar score={details.vote_average} size="md" />
                </div>
              )}
            </div>

            <div className="mt-6 space-y-3">
              <button 
                onClick={() => onUpdateLists(details as any, currentStatus, currentStatus === 'watching' ? null : 'watching')}
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 ${currentStatus === 'watching' ? 'bg-primary-accent text-on-accent' : 'bg-bg-secondary text-text-primary border border-white/10 hover:bg-white/5'}`}
              >
                {currentStatus === 'watching' ? 'Currently Watching' : 'Add to Watching'}
              </button>
              
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => onToggleFavoriteShow(details as any)} className={`p-3 rounded-xl flex items-center justify-center transition-all ${isFavorited ? 'bg-yellow-500/20 text-yellow-500' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'}`} title="Favorite">
                  <HeartIcon filled={isFavorited} className="w-6 h-6" />
                </button>
                <button onClick={() => setIsRatingModalOpen(true)} className={`p-3 rounded-xl flex items-center justify-center transition-all ${userRating > 0 ? 'bg-primary-accent/20 text-primary-accent' : 'bg-bg-secondary text-text-secondary hover:text-text-primary'}`} title="Rate">
                  <StarIcon filled={userRating > 0} className="w-6 h-6" />
                </button>
                <button onClick={() => setIsHistoryModalOpen(true)} className="p-3 bg-bg-secondary text-text-secondary hover:text-text-primary rounded-xl flex items-center justify-center transition-all" title="Watch History">
                  <ClockIcon className="w-6 h-6" />
                </button>
                <button onClick={() => props.onOpenCustomListModal(details)} className="p-3 bg-bg-secondary text-text-secondary hover:text-text-primary rounded-xl flex items-center justify-center transition-all" title="Add to Custom List">
                  <PlusIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Tabs */}
          <div className="flex-grow space-y-8">
            <header>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {showStatus && <span className="px-3 py-1 bg-primary-accent/20 text-primary-accent rounded-full text-xs font-black uppercase tracking-widest">{showStatus.text}</span>}
                <span className="text-text-secondary font-bold">{details.genres?.slice(0, 3).map(g => g.name).join(' • ')}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-text-primary tracking-tighter mb-4">{details.title || details.name}</h1>
              <p className="text-lg text-text-secondary leading-relaxed max-w-3xl italic">"{details.tagline || details.overview?.substring(0, 150) + '...'}"</p>
            </header>

            {/* Next Up Widget */}
            {nextEpisodeToWatch && (
              <section className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-xl font-black text-text-primary uppercase tracking-widest mb-4 flex items-center">
                  <PlayCircleIcon className="w-6 h-6 mr-2 text-primary-accent" />
                  Continue Journey
                </h2>
                <NextUpWidget {...props} details={details} showId={id} nextEpisodeToWatch={nextEpisodeToWatch} />
              </section>
            )}

            {/* Overall Progress for TV */}
            {mediaType === 'tv' && <OverallProgress details={details} watchProgress={watchProgress} />}

            {/* Tabs Navigation */}
            <div className="border-b border-white/5 sticky top-16 bg-bg-primary/80 backdrop-blur-md z-20 -mx-4 px-4 overflow-x-auto hide-scrollbar">
              <div className="flex space-x-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 text-sm font-black uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${activeTab === tab.id ? 'text-primary-accent' : 'text-text-secondary hover:text-text-primary'}`}
                  >
                    {tab.label}
                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-accent rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="pt-4 min-h-[400px]">
              {activeTab === 'seasons' && mediaType === 'tv' && (
                <div className="space-y-4">
                   {details.seasons?.filter(s => s.season_number > 0).map(season => (
                      <SeasonAccordion 
                        key={season.id} 
                        season={season} 
                        showId={id} 
                        isExpanded={expandedSeason === season.season_number} 
                        onToggle={() => handleToggleSeason(season.season_number)} 
                        seasonDetails={seasonDetailsMap[season.season_number]} 
                        watchProgress={watchProgress} 
                        onToggleEpisode={props.onToggleEpisode} 
                        onMarkPreviousEpisodesWatched={props.onMarkPreviousEpisodesWatched} 
                        onOpenJournal={props.onSaveJournal as any} 
                        onOpenEpisodeDetail={setSelectedEpisodeForDetail} 
                        showPosterPath={details.poster_path} 
                        onMarkSeasonWatched={props.onMarkSeasonWatched} 
                        onUnmarkSeasonWatched={props.onUnmarkSeasonWatched} 
                        showDetails={details} 
                        favoriteEpisodes={props.favoriteEpisodes} 
                        onToggleFavoriteEpisode={props.onToggleFavoriteEpisode} 
                        onStartLiveWatch={props.onStartLiveWatch} 
                        onSaveJournal={props.onSaveJournal} 
                        episodeRatings={props.episodeRatings} 
                        onOpenEpisodeRatingModal={() => {}} 
                        onAddWatchHistory={props.onAddWatchHistory} 
                        onDiscussEpisode={(s, e) => { setActiveTab('discussion'); setActiveCommentThread(`tv-${id}-s${s}-e${e}`); }} 
                        comments={props.comments} 
                        onImageClick={(src) => {}} 
                        onSaveEpisodeNote={props.onSaveEpisodeNote} 
                        showRatings={showRatings} 
                        seasonRatings={props.seasonRatings} 
                        onRateSeason={props.onRateSeason} 
                      />
                   ))}
                </div>
              )}

              {activeTab === 'info' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-8">
                      <section>
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest mb-4">Overview</h2>
                        <p className="text-text-secondary leading-relaxed">{details.overview}</p>
                      </section>
                      <WhereToWatch providers={providers} />
                   </div>
                   <MoreInfo details={details} onSelectShow={props.onSelectShow} />
                </div>
              )}

              {activeTab === 'cast' && (
                <CastAndCrew aggregateCredits={aggregateCredits} tmdbCredits={details.credits} onSelectPerson={props.onSelectPerson} />
              )}

              {activeTab === 'media' && (
                <div className="space-y-8">
                   {details.videos?.results && details.videos.results.length > 0 && (
                      <section>
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest mb-4">Trailers & Clips</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {details.videos.results.slice(0, 4).map(video => (
                              <div key={video.id} className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-white/5">
                                 <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${video.key}`} title={video.name} frameBorder="0" allowFullScreen></iframe>
                              </div>
                           ))}
                        </div>
                      </section>
                   )}
                   <section>
                      <h2 className="text-xl font-black text-text-primary uppercase tracking-widest mb-4">Gallery</h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                         {details.images?.backdrops?.slice(0, 12).map((img, i) => (
                            <img key={i} src={getImageUrl(img.file_path, 'w500')} className="rounded-lg shadow-md hover:scale-105 transition-transform cursor-zoom-in" alt="Scene" />
                         ))}
                      </div>
                   </section>
                </div>
              )}

              {activeTab === 'customize' && (
                <CustomizeTab posterUrl={posterUrl} backdropUrl={backdropUrl} onOpenPosterSelector={() => setIsPosterSelectorOpen(true)} onOpenBackdropSelector={() => setIsBackdropSelectorOpen(true)} />
              )}

              {activeTab === 'achievements' && (
                <ShowAchievementsTab details={details} userData={props as any} />
              )}

              {activeTab === 'discussion' && (
                <CommentsTab 
                  details={details} 
                  comments={props.comments} 
                  currentUser={currentUser} 
                  allUsers={props.allUsers} 
                  seasonDetailsMap={seasonDetailsMap} 
                  onFetchSeasonDetails={handleToggleSeason as any} 
                  onSaveComment={props.onSaveComment} 
                  onToggleLikeComment={() => {}} 
                  onDeleteComment={() => {}} 
                  activeThread={activeCommentThread} 
                  setActiveThread={setActiveCommentThread} 
                />
              )}
            </div>

            {/* Recommendations Section */}
            <section className="mt-20">
               <RecommendedMedia recommendations={details.recommendations?.results || []} onSelectShow={props.onSelectShow} />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShowDetail;
