import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserData, WatchStatus, TrackedItem, FavoriteEpisodes, TmdbMediaDetails, Episode, WatchProgress, HistoryItem } from '../types';
import { getMediaDetails, getSeasonDetails, clearMediaCache } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { StarIcon, ChevronDownIcon, ArrowPathIcon, ClockIcon, TvIcon, ChartBarIcon, PlayIcon } from '../components/Icons';
import { useLocalStorage } from '../hooks/useLocalStorage';

// --- TYPE DEFINITIONS ---
interface EnrichedShowData extends TrackedItem {
    details: TmdbMediaDetails;
    nextEpisodeInfo: Episode | null;
    watchedCount: number;
    totalEpisodes: number;
    lastWatchedTimestamp: number;
    popularity: number;
}

type SortOption = 'lastWatched' | 'oldestWatched' | 'mostEpisodesLeft' | 'leastEpisodesLeft' | 'popularity';

// --- HELPER COMPONENTS ---

const QuickStat: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="bg-bg-secondary/50 p-3 rounded-lg flex items-center space-x-3">
        <div className="text-primary-accent">{icon}</div>
        <div>
            <p className="text-xs text-text-secondary">{label}</p>
            <p className="text-xl font-bold text-text-primary">{value}</p>
        </div>
    </div>
);

const ProgressCard: React.FC<{
    item: EnrichedShowData;
    onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
    onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    isEpisodeFavorited: boolean;
}> = ({ item, onToggleEpisode, onToggleFavoriteEpisode, onSelectShow, isEpisodeFavorited }) => {
    
    if (!item.nextEpisodeInfo) return null;

    const { nextEpisodeInfo, watchedCount, totalEpisodes } = item;
    const progressPercent = totalEpisodes > 0 ? (watchedCount / totalEpisodes) * 100 : 0;
    
    const handleMarkWatched = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleEpisode(item.id, nextEpisodeInfo.season_number, nextEpisodeInfo.episode_number, 0);
    };
    
    const handleToggleFav = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleFavoriteEpisode(item.id, nextEpisodeInfo.season_number, nextEpisodeInfo.episode_number);
    };

    const showPosterUrl = getImageUrl(item.poster_path, 'w154');
    const episodeStillUrl = getImageUrl(item.nextEpisodeInfo.still_path, 'w500', 'still');

    return (
        <div className="bg-card-gradient rounded-lg shadow-md flex overflow-hidden h-48">
            {/* Left side: Small card (poster) */}
            <div className="w-32 flex-shrink-0 cursor-pointer" onClick={() => onSelectShow(item.id, 'tv')}>
                <img src={showPosterUrl} alt={item.title} className="w-full h-full object-cover" />
            </div>

            {/* Right side: Episode image and info */}
            <div className="flex-grow relative group cursor-pointer" onClick={() => onSelectShow(item.id, 'tv')}>
                <img src={episodeStillUrl} alt={item.nextEpisodeInfo.name} className="w-full h-full object-cover" />
                
                {/* Overlay for play button */}
                <div 
                    onClick={handleMarkWatched}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    <div className="p-3 bg-backdrop rounded-full">
                        <PlayIcon className="w-6 h-6 text-white"/>
                    </div>
                </div>
                
                {/* Favorite Button */}
                <button 
                    onClick={handleToggleFav}
                    className={`absolute top-2 right-2 p-1.5 rounded-full transition-colors ${isEpisodeFavorited ? 'text-yellow-400 bg-black/50' : 'text-white/80 bg-black/50 hover:text-yellow-400'}`}
                    aria-label="Toggle Favorite"
                >
                    <StarIcon filled={isEpisodeFavorited} className="w-5 h-5"/>
                </button>

                {/* Info overlay at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <h3 className="font-bold text-white truncate">{item.title}</h3>
                    <p className="text-sm text-white/80 truncate">
                        S{item.nextEpisodeInfo.season_number} E{item.nextEpisodeInfo.episode_number}: {item.nextEpisodeInfo.name}
                    </p>
                    {/* Progress Bar */}
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-white/80">
                            <span>Overall Progress</span>
                            <span>{item.watchedCount} / {item.totalEpisodes} ({Math.round(progressPercent)}%)</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                            <div className="bg-accent-gradient h-1 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- MAIN SCREEN COMPONENT ---

interface User {
  id: string;
  username: string;
  email: string;
}

interface ProgressScreenProps {
  userData: UserData;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  favoriteEpisodes: FavoriteEpisodes;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  currentUser: User | null;
  onAuthClick: () => void;
}

const ProgressScreen: React.FC<ProgressScreenProps> = (props) => {
    const { userData, favoriteEpisodes, currentUser, onAuthClick } = props;
    const { watching, watchProgress, history } = userData;
    
    const [sortOption, setSortOption] = useState<SortOption>('lastWatched');
    const [enrichedShows, setEnrichedShows] = useState<EnrichedShowData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useLocalStorage<number>('progress_last_refreshed', 0);
    const [refreshKey, setRefreshKey] = useState(0);

    const watchingShows = useMemo(() => watching.filter(item => item.media_type === 'tv'), [watching]);

    const handleRefresh = useCallback(() => {
        if (isRefreshing) return;
        setIsRefreshing(true);
        watchingShows.forEach(show => clearMediaCache(show.id, 'tv'));
        setLastRefreshed(Date.now());
        setRefreshKey(prev => prev + 1);
    }, [isRefreshing, watchingShows, setLastRefreshed]);

    useEffect(() => {
        const now = Date.now();
        const sixHours = 6 * 60 * 60 * 1000;
        if (now - lastRefreshed > sixHours) {
            handleRefresh();
        } else {
            setRefreshKey(prev => prev + 1);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const processShows = async () => {
            if (watchingShows.length === 0) {
                setEnrichedShows([]);
                setIsLoading(false);
                setIsRefreshing(false);
                return;
            }

            if (!isRefreshing) setIsLoading(true);

            // Step 1: Fetch details for all shows in parallel.
            const detailsPromises = watchingShows.map(item => getMediaDetails(item.id, 'tv').catch(() => null));
            const detailsResults = await Promise.all(detailsPromises);

            // Step 2: Enrich with progress and find the next episode for each show.
            const showsWithNextEp = detailsResults.map((details, index) => {
                if (!details || !details.seasons) return null;

                const item = watchingShows[index];
                const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);
                const totalEpisodes = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);

                let watchedCount = 0;
                const progressForShow = watchProgress[item.id] || {};
                for (const season of seasonsForCalc) {
                    for (let i = 1; i <= season.episode_count; i++) {
                        if (progressForShow[season.season_number]?.[i]?.status === 2) watchedCount++;
                    }
                }
                
                if (totalEpisodes > 0 && watchedCount >= totalEpisodes) {
                    props.onUpdateLists(item, 'watching', 'completed');
                    return null; // This show is completed, filter it out.
                }

                let nextEpisodeLocation: { season: number; episode: number } | null = null;
                for (const season of [...seasonsForCalc].sort((a,b) => a.season_number - b.season_number)) {
                    for (let i = 1; i <= season.episode_count; i++) {
                        if (progressForShow[season.season_number]?.[i]?.status !== 2) {
                            nextEpisodeLocation = { season: season.season_number, episode: i };
                            break;
                        }
                    }
                    if (nextEpisodeLocation) break;
                }
                
                const showHistory = history.filter(h => h.id === item.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                const lastWatchedTimestamp = showHistory.length > 0 ? new Date(showHistory[0].timestamp).getTime() : 0;
                
                return { item, details, watchedCount, totalEpisodes, lastWatchedTimestamp, nextEpisodeLocation };
            }).filter(Boolean);

            // Step 3: Fetch season details for only the next episodes in parallel.
            const seasonDetailsPromises = showsWithNextEp.map(data => 
                data.nextEpisodeLocation ? getSeasonDetails(data.item.id, data.nextEpisodeLocation.season).catch(() => null) : null
            );
            const seasonDetailsResults = await Promise.all(seasonDetailsPromises);
            
            // Step 4: Combine all data.
            const finalEnrichedData = showsWithNextEp.map((data, index) => {
                const seasonDetails = seasonDetailsResults[index];
                const nextEpisodeInfo = seasonDetails?.episodes.find(e => e.episode_number === data.nextEpisodeLocation?.episode) || null;
                return {
                    ...data.item,
                    details: data.details,
                    nextEpisodeInfo,
                    watchedCount: data.watchedCount,
                    totalEpisodes: data.totalEpisodes,
                    lastWatchedTimestamp: data.lastWatchedTimestamp,
                    popularity: data.details.popularity || 0,
                };
            });
            
            setEnrichedShows(finalEnrichedData);
            setIsLoading(false);
            setIsRefreshing(false);
        };

        if (refreshKey > 0) processShows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchProgress, history, refreshKey]);

    const sortedShows = useMemo(() => {
        const showsToSort = enrichedShows.filter(show => show.nextEpisodeInfo);
        switch (sortOption) {
            case 'leastEpisodesLeft': return showsToSort.sort((a, b) => (a.totalEpisodes - a.watchedCount) - (b.totalEpisodes - b.watchedCount));
            case 'mostEpisodesLeft': return showsToSort.sort((a, b) => (b.totalEpisodes - b.watchedCount) - (a.totalEpisodes - a.watchedCount));
            case 'lastWatched': return showsToSort.sort((a, b) => b.lastWatchedTimestamp - a.lastWatchedTimestamp);
            case 'oldestWatched': return showsToSort.sort((a, b) => a.lastWatchedTimestamp === 0 ? 1 : b.lastWatchedTimestamp === 0 ? -1 : a.lastWatchedTimestamp - b.lastWatchedTimestamp);
            case 'popularity': return showsToSort.sort((a, b) => b.popularity - a.popularity);
            default: return showsToSort;
        }
    }, [enrichedShows, sortOption]);
    
    const quickStats = useMemo(() => {
        let episodesLeft = 0;
        let hoursLeft = 0;
        enrichedShows.forEach(show => {
            const remaining = show.totalEpisodes - show.watchedCount;
            episodesLeft += remaining;
            hoursLeft += remaining * 45; // Approx 45 mins per episode
        });
        return {
            showsInProgress: enrichedShows.length,
            episodesToWatch: episodesLeft,
            hoursToWatch: Math.round(hoursLeft / 60),
        };
    }, [enrichedShows]);
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-text-primary">Progress</h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <QuickStat label="Shows in Progress" value={quickStats.showsInProgress} icon={<TvIcon className="w-6 h-6"/>} />
                <QuickStat label="Episodes to Watch" value={quickStats.episodesToWatch} icon={<ChartBarIcon className="w-6 h-6"/>} />
                <QuickStat label="Est. Hours Left" value={`~${quickStats.hoursToWatch}h`} icon={<ClockIcon className="w-6 h-6"/>} />
            </div>

            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient">Up Next</h2>
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 pl-3 pr-8 text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-accent"
                            >
                                <option value="lastWatched">Last Watched</option>
                                <option value="oldestWatched">Oldest Watched</option>
                                <option value="popularity">Popularity</option>
                                <option value="leastEpisodesLeft">Fewest Left</option>
                                <option value="mostEpisodesLeft">Most Left</option>
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
                        </div>
                        <button onClick={handleRefresh} disabled={isRefreshing || isLoading} className="p-2 bg-bg-secondary rounded-md text-text-primary hover:brightness-125 disabled:opacity-50" aria-label="Refresh Data">
                            <ArrowPathIcon className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => <div key={i} className="bg-card-gradient rounded-lg shadow-md p-4 animate-pulse h-48"></div>)}
                    </div>
                ) : sortedShows.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {sortedShows.map(item => {
                            const nextEp = item.nextEpisodeInfo;
                            const isFav = nextEp ? (favoriteEpisodes[item.id]?.[nextEp.season_number]?.[nextEp.episode_number] || false) : false;
                            return <ProgressCard key={item.id} item={item} {...props} isEpisodeFavorited={isFav} />;
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-bg-secondary/30 rounded-lg">
                        {currentUser ? (
                             <>
                                <h2 className="text-xl font-bold text-text-primary">All Caught Up!</h2>
                                <p className="mt-2 text-text-secondary max-w-sm mx-auto">Add a new show to your "Watching" list to track it here.</p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-bold text-text-primary">Welcome to Your Progress Page!</h2>
                                <p className="mt-2 text-text-secondary max-w-sm mx-auto">
                                    Your watched episodes will be tracked here. Your data is currently saved on this device.
                                </p>
                                <button
                                    onClick={onAuthClick}
                                    className="mt-4 px-4 py-2 text-sm font-semibold rounded-full bg-accent-gradient text-on-accent hover:opacity-90 transition-opacity"
                                >
                                    Log In or Sign Up to Sync
                                </button>
                            </>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ProgressScreen;