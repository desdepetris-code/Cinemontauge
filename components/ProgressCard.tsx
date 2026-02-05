import React, { useMemo } from 'react';
import { TrackedItem, TmdbMediaDetails, Episode, LiveWatchMediaInfo, UserData } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PlayIcon, CheckCircleIcon, HeartIcon } from './Icons';
import BrandedImage from './BrandedImage';
import { getShowStatus } from '../utils/statusUtils';

export interface EnrichedShowData extends TrackedItem {
    details: TmdbMediaDetails;
    nextEpisodeInfo: Episode | null;
    watchedCount: number;
    totalEpisodes: number;
    lastWatchedTimestamp: number;
    popularity: number;
    status: 'watching' | 'onHold';
    completedSeasons: number;
    isPaused: boolean;
}

interface ProgressCardProps {
    item: EnrichedShowData;
    isEpisodeFavorited: boolean;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string, episodeStillPath?: string | null, seasonPosterPath?: string | null) => void;
    onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
    onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
    globalPlaceholders?: UserData['globalPlaceholders'];
}

const ProgressCard: React.FC<ProgressCardProps> = ({ item, isEpisodeFavorited, onSelectShow, onToggleEpisode, onStartLiveWatch, onToggleFavoriteEpisode, globalPlaceholders }) => {
    const { details, nextEpisodeInfo, watchedCount, totalEpisodes } = item;
    const progressPercent = totalEpisodes > 0 ? (watchedCount / totalEpisodes) * 100 : 0;
    const showStatus = useMemo(() => details ? getShowStatus(details) : null, [details]);
    
    const bannerImageUrl = useMemo(() => {
        const season = details.seasons?.find(s => s.season_number === nextEpisodeInfo?.season_number);
        return getImageUrl(season?.poster_path || item.poster_path, 'w154');
    }, [details.seasons, nextEpisodeInfo, item.poster_path]);

    return (
        <div className="bg-card-gradient rounded-3xl shadow-xl flex overflow-hidden h-48 border border-white/10 group/card">
            <div className="w-32 flex-shrink-0 cursor-pointer relative" onClick={() => onSelectShow(item.id, 'tv')}>
                <BrandedImage title={item.title} status={showStatus?.text}>
                    <img src={bannerImageUrl} alt={item.title} className="w-full h-full object-cover" />
                </BrandedImage>
            </div>

            <div className="flex-grow relative group cursor-pointer" onClick={() => onSelectShow(item.id, 'tv')}>
                <img src={getImageUrl(details.backdrop_path, 'w500', 'backdrop')} alt={item.title} className="w-full h-full object-cover grayscale-[0.2] transition-all duration-700 group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
                    <div className="bg-black px-3 py-1 rounded-lg border border-white/5 inline-block mb-1 shadow-lg">
                        <h3 className="font-black text-white uppercase tracking-tighter truncate leading-none text-sm">{item.title}</h3>
                    </div>
                    {nextEpisodeInfo ? (
                        <div className="bg-primary-accent px-2 py-0.5 rounded-md border border-black inline-block shadow-xl">
                            <p className="text-[10px] font-black text-black uppercase tracking-tighter">
                                NEXT: S{nextEpisodeInfo.season_number} E{nextEpisodeInfo.episode_number} &bull; {nextEpisodeInfo.name}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-green-500 px-2 py-0.5 rounded-md border border-black inline-block shadow-xl">
                            <p className="text-[10px] font-black text-black uppercase tracking-tighter">Registry Complete</p>
                        </div>
                    )}
                    
                    <div className="mt-3 w-full bg-white/10 rounded-full h-1.5 overflow-hidden border border-white/5">
                        <div className="bg-accent-gradient h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="p-4 bg-backdrop/60 backdrop-blur-md rounded-full shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                        <PlayIcon className="w-8 h-8 text-white"/>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressCard;