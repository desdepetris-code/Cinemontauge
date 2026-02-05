import React, { useState, useEffect, useCallback } from 'react';
import { getMediaDetails } from '../services/tmdbService';
import { TmdbMediaDetails, TrackedItem, WatchProgress, EpisodeProgress, UserData } from '../types';
import { ArrowPathIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import Carousel from './Carousel';

interface NewSeasonInfo {
    showId: number;
    showTitle: string;
    showPoster: string | null;
    seasonNumber: number;
    seasonName: string;
    seasonPoster: string | null;
    airDate: string;
    isSeriesPremiere: boolean;
}

interface NewSeasonCardProps {
  item: NewSeasonInfo;
  onSelectShow: (id: number, media_type: 'tv') => void;
  globalPlaceholders?: UserData['globalPlaceholders'];
}

const NewSeasonCard: React.FC<NewSeasonCardProps> = ({ item, onSelectShow, globalPlaceholders }) => {
    const posterUrl = getImageUrl(item.seasonPoster || item.showPoster, 'w342');
    return (
        <div onClick={() => onSelectShow(item.showId, 'tv')} className="w-48 flex-shrink-0 cursor-pointer group transform hover:-translate-y-2 transition-transform duration-300">
            <div className="relative rounded-lg overflow-hidden shadow-lg">
                <img src={posterUrl} alt={item.showTitle} className="w-full aspect-[2/3] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full self-start mb-2 text-white backdrop-blur-md ${item.isSeriesPremiere ? 'bg-purple-600/80' : 'bg-red-600/80'}`}>
                        {item.isSeriesPremiere ? 'Series Premiere' : 'New Season'}
                    </span>
                    <h4 className="font-black text-white text-sm uppercase tracking-tight truncate leading-none">{item.showTitle}</h4>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest truncate mt-1">{item.seasonName}</p>
                </div>
            </div>
        </div>
    );
}

const isSeasonFullyWatched = (seasonProgress: Record<number, EpisodeProgress> | undefined, episodeCount: number): boolean => {
    if (!seasonProgress || episodeCount === 0) return false;
    const watchedEpisodes = Object.values(seasonProgress).filter(ep => ep.status === 2).length;
    return watchedEpisodes >= episodeCount;
};

interface NewSeasonsProps {
  title: string;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  trackedShows: TrackedItem[];
  watchProgress: WatchProgress;
  timezone: string;
  globalPlaceholders?: UserData['globalPlaceholders'];
}

const NewSeasons: React.FC<NewSeasonsProps> = ({ title, onSelectShow, trackedShows, watchProgress, timezone, globalPlaceholders }) => {
    const [newSeasons, setNewSeasons] = useState<NewSeasonInfo[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReleases = useCallback(async () => {
        // Rule: Don't fetch if user has no tracked shows
        if (!trackedShows || trackedShows.length === 0) {
            setNewSeasons([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Strictly only process user's tracked shows
            const detailPromises = trackedShows.map(s => getMediaDetails(s.id, 'tv').catch(() => null));
            const detailedShows = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => d !== null);

            const foundSeasons: NewSeasonInfo[] = [];

            for (const details of detailedShows) {
                if (!details.seasons) continue;

                // Sort seasons to find the latest ones
                const sortedSeasons = [...details.seasons].sort((a,b) => b.season_number - a.season_number);

                for (const season of sortedSeasons) {
                    if (season.season_number === 0) continue; 

                    if (season.air_date) {
                        const airDate = new Date(`${season.air_date}T00:00:00Z`);
                        // Rule: Must be within past month
                        if (airDate >= thirtyDaysAgo && airDate <= now) {
                            
                            const progressForSeason = watchProgress[details.id]?.[season.season_number];
                            // Skip if user already watched the new content
                            if (isSeasonFullyWatched(progressForSeason, season.episode_count)) {
                                continue;
                            }

                            foundSeasons.push({
                                showId: details.id,
                                showTitle: details.name || 'Untitled',
                                showPoster: details.poster_path,
                                seasonNumber: season.season_number,
                                seasonName: season.name,
                                seasonPoster: season.poster_path,
                                airDate: season.air_date,
                                isSeriesPremiere: season.season_number === 1,
                            });
                            break; // Move to next show
                        }
                    }
                }
            }
            
            foundSeasons.sort((a, b) => new Date(b.airDate).getTime() - new Date(a.airDate).getTime());
            setNewSeasons(foundSeasons);
        } catch (error) {
            console.error("Failed to fetch personalized new seasons", error);
        } finally {
            setLoading(false);
        }
    }, [trackedShows, watchProgress]);

    useEffect(() => {
        fetchReleases();
    }, [fetchReleases]);
    
    if (loading) {
        if (!trackedShows || trackedShows.length === 0) return null;
        return (
             <div className="my-10 px-6">
                <div className="h-10 w-48 bg-bg-secondary/40 rounded-lg mb-6 animate-pulse"></div>
                <div className="flex space-x-6">
                    {[...Array(4)].map((_, i) => (
                         <div key={i} className="w-48 aspect-[2/3] bg-bg-secondary/20 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            </div>
        )
    }

    // Rule: Return null if no matches in past month
    if (newSeasons.length === 0) return null;

    return (
        <div className="my-10 px-6 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">{title}</h2>
                <button
                    onClick={fetchReleases}
                    disabled={loading}
                    className="p-3 rounded-2xl text-text-secondary bg-bg-secondary/40 border border-white/5 hover:text-text-primary transition-all shadow-xl"
                >
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            <Carousel>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-6 hide-scrollbar items-start">
                    {newSeasons.map(item => (
                        <NewSeasonCard key={`${item.showId}-${item.seasonNumber}`} item={item} onSelectShow={onSelectShow as any} globalPlaceholders={globalPlaceholders} />
                    ))}
                    <div className="w-12 flex-shrink-0"></div>
                </div>
            </Carousel>
        </div>
    );
};

export default NewSeasons;