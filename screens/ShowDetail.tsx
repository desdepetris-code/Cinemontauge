import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMediaDetails, getSeasonDetails, clearMediaCache, getWatchProviders } from '../services/tmdbService';
import { getTvdbShowExtended } from '../services/tvdbService';
import { TmdbMediaDetails, TmdbSeasonDetails, Episode, WatchProgress, JournalEntry, TrackedItem, CustomImagePaths, WatchStatus, TvdbShow, WatchProviderResponse } from '../types';
import { ChevronLeftIcon, StarIcon, ArrowPathIcon, ClockIcon } from '../components/Icons';
import JournalModal from '../components/JournalModal';
import WatchlistModal from '../components/WatchlistModal';
import ImageSelectorModal from '../components/ImageSelectorModal';
import { getImageUrl } from '../utils/imageUtils';
import SeasonAccordion from '../components/SeasonAccordion';
import FallbackImage from '../components/FallbackImage';
import { PLACEHOLDER_BACKDROP, PLACEHOLDER_POSTER } from '../constants';
import { TMDB_IMAGE_BASE_URL } from '../constants';


// Import new tab components
import CastAndCrew from '../components/CastAndCrew';
import MoreInfo from '../components/MoreInfo';
import RecommendedMedia from '../components/RecommendedMedia';
import CustomizeTab from '../components/CustomizeTab';
import WhereToWatch from '../components/WhereToWatch';


// Inlined component for the new "Movie & Info" tab
const MovieInfoTab: React.FC<{ details: TmdbMediaDetails | null }> = ({ details }) => {
    if (!details) return null;
    
    const trailer = details.videos?.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');

    return (
    <div className="animate-fade-in space-y-6">
        <div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Synopsis</h2>
        <p className="text-text-secondary whitespace-pre-wrap">{details.overview || 'No synopsis available.'}</p>
        </div>
        {trailer && (
        <div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Trailer</h2>
            <div className="aspect-video">
            <iframe
                className="w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${trailer.key}`}
                title={trailer.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            ></iframe>
            </div>
        </div>
        )}
    </div>
    );
};

interface ShowDetailProps {
  id: number;
  mediaType: 'tv' | 'movie';
  onBack: () => void;
  watchProgress: WatchProgress;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry) => void;
  trackedLists: { watching: TrackedItem[], planToWatch: TrackedItem[], completed: TrackedItem[] };
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  customImagePaths: CustomImagePaths;
  onSetCustomImage: (mediaId: number, type: 'poster' | 'backdrop', path: string) => void;
  favorites: TrackedItem[];
  onToggleFavoriteShow: (item: TrackedItem) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

type ShowDetailTab = 'Season & Info' | 'Movie & Info' | 'Cast & Crew' | 'More Info' | 'You May Also Like' | 'Customize' | 'Where to Watch';

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // for TVDB images
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};


const ShowDetail: React.FC<ShowDetailProps> = (props) => {
    const {
        id, mediaType, onBack, watchProgress, onToggleEpisode, onSaveJournal, trackedLists,
        onUpdateLists, customImagePaths, onSetCustomImage, favorites, onToggleFavoriteShow, onSelectShow
    } = props;

    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [tvdbDetails, setTvdbDetails] = useState<TvdbShow | null>(null);
    const [providers, setProviders] = useState<WatchProviderResponse | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<Record<number, TmdbSeasonDetails>>({});
    const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [isJournalModalOpen, setJournalModalOpen] = useState(false);
    const [isWatchlistModalOpen, setWatchlistModalOpen] = useState(false);
    const [isImageSelectorOpen, setImageSelectorOpen] = useState(false);
    const [selectedEpisodeForJournal, setSelectedEpisodeForJournal] = useState<{ season: number; episode: Episode } | null>(null);

    const [activeTab, setActiveTab] = useState<ShowDetailTab>(mediaType === 'tv' ? 'Season & Info' : 'Movie & Info');

    const currentList = useMemo(() => {
        if (trackedLists.watching.some(i => i.id === id)) return 'watching';
        if (trackedLists.planToWatch.some(i => i.id === id)) return 'planToWatch';
        if (trackedLists.completed.some(i => i.id === id)) return 'completed';
        return null;
    }, [id, trackedLists]);
    
    const isFavorited = useMemo(() => favorites.some(fav => fav.id === id), [favorites, id]);

    const fetchData = useCallback(async (isRefresh: boolean) => {
        if (!isRefresh) setLoading(true);
        setError(null);
        try {
            const data = await getMediaDetails(id, mediaType);
            setDetails(data);
            
            const promises = [];
            if (data.external_ids?.tvdb_id) {
                promises.push(getTvdbShowExtended(data.external_ids.tvdb_id)
                    .then(setTvdbDetails)
                    .catch(e => console.error("Failed to fetch TVDB details", e)));
            }
            promises.push(getWatchProviders(id, mediaType)
                .then(setProviders)
                .catch(e => console.error("Failed to fetch watch providers", e)));

            await Promise.all(promises);

        } catch (e: any) {
            setError(e.message || 'An error occurred while fetching details.');
            console.error(e);
        } finally {
            if (!isRefresh) setLoading(false);
            setIsRefreshing(false);
        }
    }, [id, mediaType]);

    useEffect(() => {
        fetchData(false);
    }, [fetchData]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        clearMediaCache(id, mediaType);
        fetchData(true);
    };

    const toggleSeason = async (seasonNumber: number) => {
        const newExpanded = new Set(expandedSeasons);
        if (newExpanded.has(seasonNumber)) {
            newExpanded.delete(seasonNumber);
        } else {
            newExpanded.add(seasonNumber);
            if (!seasonDetails[seasonNumber]) {
                try {
                    const data = await getSeasonDetails(id, seasonNumber);
                    setSeasonDetails(prev => ({ ...prev, [seasonNumber]: data }));
                } catch (e) {
                    console.error(`Failed to fetch season ${seasonNumber}`, e);
                }
            }
        }
        setExpandedSeasons(newExpanded);
    };

    const handleOpenJournal = (seasonNumber: number, episode: Episode) => {
        setSelectedEpisodeForJournal({ season: seasonNumber, episode });
        setJournalModalOpen(true);
    };
    
    const handleSaveJournalAndClose = (entry: JournalEntry) => {
        if (selectedEpisodeForJournal) {
            onSaveJournal(id, selectedEpisodeForJournal.season, selectedEpisodeForJournal.episode.episode_number, entry);
        }
        setJournalModalOpen(false);
        setSelectedEpisodeForJournal(null);
    };
    
    const handleUpdateList = (newList: WatchStatus | null) => {
        if (details) {
            const trackedItem: TrackedItem = {
                id: details.id,
                title: details.title || details.name || 'Untitled',
                media_type: details.media_type,
                poster_path: details.poster_path,
                genre_ids: details.genres?.map(g => g.id)
            };
            onUpdateLists(trackedItem, currentList, newList);
        }
        setWatchlistModalOpen(false);
    };

    const handleToggleFavorite = () => {
        if (details) {
            const trackedItem: TrackedItem = {
                id: details.id,
                title: details.title || details.name || 'Untitled',
                media_type: details.media_type,
                poster_path: details.poster_path,
                genre_ids: details.genres?.map(g => g.id)
            };
            onToggleFavoriteShow(trackedItem);
        }
    };
    
    const backdropSrcs = useMemo(() => {
        const tvdbFanart = tvdbDetails?.artworks?.find(art => art.type === 3)?.image;
        const paths = [
            customImagePaths[id]?.backdrop_path,
            details?.backdrop_path,
            tvdbFanart,
            details?.poster_path,
            tvdbDetails?.image,
        ];
        return paths.map(p => getFullImageUrl(p, 'w1280'));
    }, [details, tvdbDetails, customImagePaths, id]);

    const posterSrcs = useMemo(() => {
        const paths = [
            customImagePaths[id]?.poster_path,
            details?.poster_path,
            tvdbDetails?.image,
        ];
        return paths.map(p => getFullImageUrl(p, 'w342'));
    }, [details, tvdbDetails, customImagePaths, id]);

    const posterUrl = useMemo(() => posterSrcs.find(s => s) || getImageUrl(null, 'w342', 'poster'), [posterSrcs]);
    const backdropUrl = useMemo(() => backdropSrcs.find(s => s) || getImageUrl(null, 'w1280', 'backdrop'), [backdropSrcs]);

    if (loading) return <div className="text-center p-8">Loading details...</div>;
    if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
    if (!details) return <div className="text-center p-8">Could not load details for this item.</div>;

    const title = details.title || details.name;
    const releaseYear = (details.release_date || details.first_air_date)?.substring(0, 4);
    const runtime = mediaType === 'tv' ? details.episode_run_time?.[0] : details.runtime;

    const TABS: ShowDetailTab[] = mediaType === 'tv' 
        ? ['Season & Info', 'Cast & Crew', 'More Info', 'You May Also Like', 'Customize', 'Where to Watch']
        : ['Movie & Info', 'Cast & Crew', 'More Info', 'You May Also Like', 'Customize', 'Where to Watch'];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'Season & Info':
                return (
                    <div className="space-y-4">
                        {(details.seasons || []).filter(s => s.season_number > 0).map(season => (
                            <SeasonAccordion key={season.id} season={season} showId={id} isExpanded={expandedSeasons.has(season.season_number)} onToggle={() => toggleSeason(season.season_number)} seasonDetails={seasonDetails[season.season_number]} watchProgress={watchProgress} onToggleEpisode={onToggleEpisode} onOpenJournal={handleOpenJournal} showPosterPath={details.poster_path} tvdbShowPosterPath={tvdbDetails?.image || null} />
                        ))}
                    </div>
                );
            case 'Movie & Info':
                return <MovieInfoTab details={details} />;
            case 'Cast & Crew':
                return <CastAndCrew details={details} />;
            case 'More Info':
                return <MoreInfo details={details} />;
            case 'You May Also Like':
                return <RecommendedMedia recommendations={details.recommendations?.results || []} onSelectShow={onSelectShow} />;
            case 'Customize':
                return <CustomizeTab posterUrl={posterUrl} backdropUrl={backdropUrl} onOpenImageSelector={() => setImageSelectorOpen(true)} />;
            case 'Where to Watch':
                return <WhereToWatch providers={providers} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="animate-fade-in">
            {/* Header Section */}
            <div className="relative h-48 sm:h-64 md:h-80 -mx-4 -mt-6">
                <FallbackImage
                    srcs={backdropSrcs}
                    placeholder={PLACEHOLDER_BACKDROP}
                    alt={`${title} backdrop`}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/70 to-transparent"></div>
                <button onClick={onBack} className="absolute top-8 left-8 p-2 bg-backdrop rounded-full text-text-primary z-10 hover:bg-bg-secondary transition-colors">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="px-4 sm:px-6 md:px-8 -mt-24 sm:-mt-32 relative pb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                    <FallbackImage
                        srcs={posterSrcs}
                        placeholder={PLACEHOLDER_POSTER}
                        alt={`${title} poster`}
                        className="w-36 sm:w-48 aspect-[2/3] object-cover rounded-lg shadow-2xl flex-shrink-0"
                    />
                    <div className="flex-grow text-center sm:text-left">
                        <h1 className="text-3xl lg:text-4xl font-bold text-text-primary">{title}</h1>
                        <div className="flex items-center justify-center sm:justify-start space-x-4 text-text-secondary text-sm mt-2">
                            {releaseYear && <span>{releaseYear}</span>}
                            {releaseYear && runtime && <span>&bull;</span>}
                            {runtime && <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-1"/>{runtime} min</span>}
                            <span>&bull;</span>
                            <span className="flex items-center"><StarIcon className="w-4 h-4 mr-1 text-yellow-400" filled />{details.vote_average?.toFixed(1)}</span>
                        </div>
                        <p className="text-text-secondary text-sm mt-2 line-clamp-3 sm:line-clamp-2">{details.overview}</p>
                    </div>
                </div>

                <div className="my-6 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <button onClick={() => setWatchlistModalOpen(true)} className="px-6 py-2 bg-primary-accent text-white rounded-md font-semibold hover:opacity-90 transition-opacity">
                        {currentList ? `On: ${currentList.replace(/([A-Z])/g, ' $1').trim()}` : "Add to a list"}
                    </button>
                    <button onClick={handleToggleFavorite} className="flex items-center justify-center space-x-2 px-4 py-2 bg-bg-secondary rounded-md hover:brightness-125 transition-all">
                        <StarIcon filled={isFavorited} className={`w-5 h-5 ${isFavorited ? 'text-yellow-400' : 'text-text-secondary'}`} />
                        <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                    </button>
                    <button onClick={handleRefresh} disabled={isRefreshing} className="px-4 py-2 bg-bg-secondary rounded-md hover:brightness-125 transition-all disabled:opacity-50">
                        <ArrowPathIcon className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                
                 {/* Tabs */}
                <div className="border-b border-bg-secondary mb-6">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === tab 
                                    ? 'border-primary-accent text-primary-accent' 
                                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-secondary'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab Content */}
                <div>
                    {renderTabContent()}
                </div>

            </div>

            <JournalModal isOpen={isJournalModalOpen} onClose={() => setJournalModalOpen(false)} onSave={handleSaveJournalAndClose} existingEntry={selectedEpisodeForJournal ? watchProgress[id]?.[selectedEpisodeForJournal.season]?.[selectedEpisodeForJournal.episode.episode_number]?.journal || null : null} episodeName={selectedEpisodeForJournal ? `S${selectedEpisodeForJournal.season} E${selectedEpisodeForJournal.episode.episode_number}: ${selectedEpisodeForJournal.episode.name}` : ''} />
            <WatchlistModal isOpen={isWatchlistModalOpen} onClose={() => setWatchlistModalOpen(false)} onUpdateList={handleUpdateList} currentList={currentList} />
            <ImageSelectorModal isOpen={isImageSelectorOpen} onClose={() => setImageSelectorOpen(false)} posters={details.images?.posters || []} backdrops={details.images?.backdrops || []} onSelect={(type, path) => onSetCustomImage(id, type, path)} />
        </div>
    );
};

export default ShowDetail;