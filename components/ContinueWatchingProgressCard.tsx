import React, { useState, useEffect, useMemo } from 'react';
import { TrackedItem, WatchProgress, TmdbMediaDetails, TmdbSeasonDetails, Episode, EpisodeTag, EpisodeProgress, UserData } from '../types';
import { getMediaDetails, getSeasonDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { PlayIcon, CheckCircleIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL, TMDB_IMAGE_BASE_URL } from '../constants';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import { isNewRelease, formatTime, getAiredEpisodeCount } from '../utils/formatUtils';
import BrandedImage from './BrandedImage';
import { getShowStatus } from '../utils/statusUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';

interface ContinueWatchingProgressCardProps {
    item: TrackedItem & { isPaused?: boolean; elapsedSeconds?: number; seasonNumber?: number; episodeNumber?: number; episodeTitle?: string; runtime?: number };
    watchProgress: WatchProgress;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => void;
    globalPlaceholders?: UserData['globalPlaceholders'];
    onOpenDetail?: (id: number, seasonNumber: number, episodeNumber: number) => void;
}

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};


const ContinueWatchingProgressCard: React.FC<ContinueWatchingProgressCardProps> = ({ item, watchProgress, onSelectShow, onToggleEpisode, globalPlaceholders, onOpenDetail }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [seasonDetails, setSeasonDetails] = useState<TmdbSeasonDetails | null>(null);
    const [nextEpisodeInfo, setNextEpisodeInfo] = useState<Episode | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isPausedSession = item.isPaused && item.elapsedSeconds !== undefined && item.runtime !== undefined;

    const { 
        overallProgressPercent,
        totalEpisodes,
        watchedEpisodes,
        seasonProgressPercent,
        episodesLeftInSeason,
        currentSeasonNumber,
    } = useMemo(() => {
        if (!details) return { 
            overallProgressPercent: 0, totalEpisodes: 0, watchedEpisodes: 0, 
            seasonProgressPercent: 0, episodesLeftInSeason: 0, currentSeasonNumber: 0,
        };
        
        const isPaused = item.isPaused && item.seasonNumber !== undefined;
        const progressForShow = watchProgress[item.id] || {};
        
        const airedTotal = getAiredEpisodeCount(details);

        let watchedTotal = 0;
        Object.values(progressForShow).forEach(season => {
            Object.values(season).forEach(ep => {
                if ((ep as EpisodeProgress).status === 2) watchedTotal++;
            });
        });
        
        const overallPercent = airedTotal > 0 ? (watchedTotal / airedTotal) * 100 : 0;

        let currentSNum = 0;
        if (isPaused) {
            currentSNum = item.seasonNumber!;
        } else if (nextEpisodeInfo) {
            currentSNum = nextEpisodeInfo.season_number;
        }

        const seasonsForCalc = (details.seasons || []).filter(s => s.season_number > 0);
        const currentSeason = seasonsForCalc.find(s => s.season_number === currentSNum);
        
        if (!currentSeason) {
             return { 
                overallProgressPercent: overallPercent, totalEpisodes: airedTotal, watchedEpisodes: watchedTotal,
                seasonProgressPercent: 0, episodesLeftInSeason: 0, currentSeasonNumber: 0,
            };
        }

        const progressInSeason = progressForShow[currentSeason.season_number] || {};
        const watchedInSeason = Object.values(progressInSeason).filter(ep => (ep as EpisodeProgress).status === 2).length;
        
        let airedInSeason = currentSeason.episode_count;
        if (details.last_episode_to_air && details.last_episode_to_air.season_number === currentSeason.season_number) {
            airedInSeason = details.last_episode_to_air.episode_number;
        }

        const sProgress = airedInSeason > 0 ? (watchedInSeason / airedInSeason) * 100 : 0;
        const sLeft = Math.max(0, airedInSeason - watchedInSeason);

        return { 
            overallProgressPercent: overallPercent, 
            totalEpisodes: airedTotal, 
            watchedEpisodes: watchedTotal,
            seasonProgressPercent: sProgress,
            episodesLeftInSeason: sLeft,
            currentSeasonNumber: currentSNum,
        };
    }, [details, watchProgress, item, nextEpisodeInfo]);


    useEffect(() => {
        let isMounted = true;
        const fetchAllDetails = async () => {
            if (!item.id) return;
            setIsLoading(true);
            try {
                const mediaDetails = await getMediaDetails(item.id, 'tv');
                if (!isMounted) return;
                setDetails(mediaDetails);
                
                if (isPausedSession) {
                    setIsLoading(false);
                    return;
                }

                const progressForShow = watchProgress[item.id] || {};
                const sortedSeasons = [...(mediaDetails.seasons || [])]
                    .filter(s => s.season_number > 0)
                    .sort((a, b) => a.season_number - b.season_number);
                
                const today = new Date().toISOString().split('T')[0];
                let foundNextEpInfo: Episode | null = null;
                let foundSeasonDetails: TmdbSeasonDetails | null = null;

                for (const season of sortedSeasons) {
                    if (!isMounted) return;
                    const seasonData = await getSeasonDetails(item.id, season.season_number).catch(() => null);
                    if (!isMounted || !seasonData) continue;
                    
                    for (const ep of seasonData.episodes) {
                        const hasAired = ep.air_date && ep.air_date <= today;
                        const isWatched = progressForShow[ep.season_number]?.[ep.episode_number]?.status === 2;
                        if (hasAired && !isWatched) {
                            foundNextEpInfo = ep;
                            foundSeasonDetails = seasonData;
                            break;
                        }
                    }
                    if (foundNextEpInfo) break;
                }

                if (isMounted) {
                    setSeasonDetails(foundSeasonDetails);
                    setNextEpisodeInfo(foundNextEpInfo);
                }
            } catch (error) {
                console.error(`Failed to fetch details for ${item.title}`, error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchAllDetails();
        return () => {
            isMounted = false;
        };
    }, [item.id, item.title, watchProgress, isPausedSession]);

    const showStatusText = useMemo(() => {
        if (!details) return null;
        return getShowStatus(details)?.text ?? null;
    }, [details]);
    
    const mainPosterSrcs = useMemo(() => {
        const nextSeasonNumber = isPausedSession ? item.seasonNumber : nextEpisodeInfo?.season_number;
        const tmdbSeason = details?.seasons?.find(s => s.season_number === nextSeasonNumber);

        const paths = [
            tmdbSeason?.poster_path, 
            details?.poster_path,
            item.poster_path,
            nextEpisodeInfo?.still_path,
        ];

        return paths.map((p) => getFullImageUrl(p, 'w500'));
    }, [details, item.poster_path, nextEpisodeInfo, isPausedSession, item.seasonNumber]);
    
    const episodeStillSrcs = useMemo(() => {
        if (isPausedSession) {
             return [getImageUrl(item.poster_path, 'w300', 'poster')];
        }
        const paths = [
            nextEpisodeInfo?.still_path,
            seasonDetails?.poster_path,
            details?.poster_path,
        ];
        return [
            getFullImageUrl(paths[0], 'w300'),
            getFullImageUrl(paths[1], 'w342'),
            getFullImageUrl(paths[2], 'w342'),
        ];
    }, [nextEpisodeInfo, seasonDetails, details, isPausedSession, item.poster_path]);

    const ageRating = useMemo(() => {
        if (!details) return null;
        const usRating = details.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
        return usRating?.rating || null;
    }, [details]);

    const getAgeRatingColor = (rating: string) => {
        const r = rating.toUpperCase();
        if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
        if (r === 'TV-Y') return 'bg-[#008000] text-white';
        if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black shadow-md';
        if (r === 'PG-13') return 'bg-[#00008B] text-white';
        if (r === 'TV-14') return 'bg-[#800000] text-white shadow-md';
        if (r === 'R') return 'bg-[#FF00FF] text-black font-black shadow-md';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-xl';
        return 'bg-stone-500 text-white';
    };

    const episodeTag: EpisodeTag | null = useMemo(() => {
        if (!nextEpisodeInfo || !details) return null;
        const season = details.seasons?.find(s => s.season_number === nextEpisodeInfo.season_number);
        return getEpisodeTag(nextEpisodeInfo, season, details, seasonDetails);
    }, [nextEpisodeInfo, details, seasonDetails]);

    const isNew = isNewRelease(nextEpisodeInfo?.air_date);

    if (isLoading) {
        return (
            <div className="w-full aspect-[10/16] bg-card-gradient rounded-lg shadow-md animate-pulse">
                <div className="w-full h-full bg-bg-secondary rounded-lg"></div>
            </div>
        );
    }
    
    if (!details || (!nextEpisodeInfo && !isPausedSession)) return null;

    const handleMarkWatched = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (nextEpisodeInfo) {
            const tmdbSeason = details?.seasons?.find(s => s.season_number === nextEpisodeInfo.season_number);
            onToggleEpisode(item.id, nextEpisodeInfo.season_number, nextEpisodeInfo.episode_number, 0, item, nextEpisodeInfo.name, nextEpisodeInfo.still_path, tmdbSeason?.poster_path);
        }
    };

    const handleCardClick = () => {
        if (onOpenDetail && (isPausedSession || nextEpisodeInfo)) {
            const seasonNum = isPausedSession ? item.seasonNumber! : nextEpisodeInfo!.season_number;
            const episodeNum = isPausedSession ? item.episodeNumber! : nextEpisodeInfo!.episode_number;
            onOpenDetail(item.id, seasonNum, episodeNum);
        } else {
            onSelectShow(item.id, 'tv');
        }
    };
    
    const episodeProgressPercent = isPausedSession ? (item.elapsedSeconds! / (item.runtime! * 60)) * 100 : 0;
    const remainingSeconds = isPausedSession ? (item.runtime! * 60) - item.elapsedSeconds! : 0;

    return (
        <div 
            className="w-full bg-card-gradient rounded-2xl shadow-2xl flex flex-col relative overflow-hidden group cursor-pointer transition-transform duration-300 hover:-translate-y-2 border border-white/10"
            onClick={handleCardClick}
        >
            <BrandedImage title={item.title} status={showStatusText}>
                <div className="aspect-[10/16] relative">
                    <FallbackImage 
                        srcs={mainPosterSrcs}
                        placeholder={PLACEHOLDER_POSTER}
                        type="poster"
                        globalPlaceholders={globalPlaceholders}
                        alt={`${item.title} preview`} 
                        className="absolute inset-0 w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent"></div>
                    
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-20">
                        {ageRating && (
                            <div className={`px-2 py-0.5 text-[10px] font-black rounded-md backdrop-blur-md border border-white/20 shadow-2xl ${getAgeRatingColor(ageRating)}`}>
                                {ageRating}
                            </div>
                        )}
                        {isNew && <NewReleaseOverlay position="static" color="cyan" className="scale-110" />}
                        {episodeTag && (
                            <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-md backdrop-blur-md border border-white/20 shadow-2xl ${episodeTag.className}`}>
                                {episodeTag.text}
                            </div>
                        )}
                    </div>

                    {nextEpisodeInfo && !isPausedSession && (
                    <div className="absolute bottom-[32%] right-4 z-20">
                        <FallbackImage 
                            srcs={episodeStillSrcs} 
                            placeholder={PLACEHOLDER_STILL}
                            type="still"
                            globalPlaceholders={globalPlaceholders}
                            alt="Next episode thumbnail" 
                            className="w-32 aspect-video object-cover rounded-xl border-2 border-white/20 shadow-2xl transition-transform duration-300 group-hover:scale-110"
                        />
                    </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-5 pl-8 mt-auto">
                        <h3 className="font-black text-white text-xl uppercase tracking-tighter truncate leading-tight [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">{item.title}</h3>
                        {isPausedSession ? (
                            <div className="mt-1">
                                <p className="text-xs font-black text-primary-accent uppercase tracking-widest truncate">
                                    {`S${item.seasonNumber} E${item.episodeNumber} Resume`}
                                </p>
                                <p className="text-xs text-amber-300 font-black uppercase mt-0.5">{`${formatTime(remainingSeconds)} left`}</p>
                            </div>
                        ) : nextEpisodeInfo ? (
                            <p className="text-xs font-black text-text-primary truncate uppercase tracking-widest mt-1">
                                {`S${nextEpisodeInfo.season_number} E${nextEpisodeInfo.episode_number} Next`}
                            </p>
                        ) : (
                            <p className="text-xs text-emerald-400 font-black uppercase tracking-widest mt-1">Registry Fully Sequenced</p>
                        )}
                    </div>

                    {nextEpisodeInfo && !isPausedSession && (
                    <div
                        onClick={handleMarkWatched}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label="Mark next episode watched"
                    >
                        <div className="p-5 bg-white/20 backdrop-blur-md border border-white/40 rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
                            <PlayIcon className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 w-full h-2 bg-white/10">
                        <div className="h-full bg-accent-gradient transition-all duration-1000 shadow-[0_0_15px_white]" style={{ width: `${isPausedSession ? Math.min(100, episodeProgressPercent) : Math.min(100, overallProgressPercent)}%` }}></div>
                    </div>
                </div>
            </BrandedImage>
            
            <div className="p-4 bg-bg-secondary/40 text-sm border-t border-white/5 shadow-inner">
                <div className="space-y-4">
                    {currentSeasonNumber > 0 && (
                        <div>
                            <div className="flex justify-between items-end mb-1.5">
                                <span className="font-black text-text-primary uppercase tracking-widest text-[10px]">Season {currentSeasonNumber}</span>
                                <span className="text-[10px] font-black text-text-primary uppercase">{episodesLeftInSeason} Aired Left</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                                <div className="bg-accent-gradient h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, seasonProgressPercent)}%` }}></div>
                            </div>
                        </div>
                    )}
                    {totalEpisodes > 0 && (
                        <div>
                            <div className="flex justify-between items-end mb-1.5">
                                <span className="font-black text-text-primary uppercase tracking-widest text-[10px]">Total Episodes</span>
                                <span className="text-[10px] font-black text-text-primary uppercase">{watchedEpisodes} / {totalEpisodes}</span>
                            </div>
                            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                                <div className="bg-white/80 h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, overallProgressPercent)}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContinueWatchingProgressCard;