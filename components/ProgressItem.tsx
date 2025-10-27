import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMediaDetails, TrackedItem, WatchProgress, EpisodeTag } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';
import { getEpisodeTag } from '../utils/episodeTagUtils';

interface ProgressItemProps {
    item: TrackedItem;
    watchProgress: WatchProgress;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const ProgressItem: React.FC<ProgressItemProps> = ({ item, watchProgress, onSelect }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

    useEffect(() => {
        getMediaDetails(item.id, 'tv').then(setDetails).catch(console.error);
    }, [item]);

    const { progressPercent, totalEpisodes, watchedEpisodes, episodeTag } = useMemo(() => {
        if (!details || !details.seasons) return { progressPercent: 0, totalEpisodes: 0, watchedEpisodes: 0, episodeTag: null };
        
        const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);
        const total = seasonsForCalc.reduce((acc, s) => acc + s.episode_count, 0);
        
        let watched = 0;
        const progressForShow = watchProgress[item.id] || {};

        for (const season of seasonsForCalc) {
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status === 2) {
                    watched++;
                }
            }
        }

        let nextEp = null;
        let tag: EpisodeTag | null = null;
        const sortedSeasons = [...seasonsForCalc].sort((a,b) => a.season_number - b.season_number);
        for (const season of sortedSeasons) {
            for (let i = 1; i <= season.episode_count; i++) {
                if (progressForShow[season.season_number]?.[i]?.status !== 2) {
                    // Create a partial episode object just for tag calculation
                    const partialEpisode = { episode_number: i, season_number: season.season_number, name: '', id: 0, overview: '', still_path: null, air_date: '' };
                    tag = getEpisodeTag(partialEpisode, season, details, undefined);
                    nextEp = partialEpisode;
                    break;
                }
            }
            if (nextEp) break;
        }
        
        const percent = total > 0 ? (watched / total) * 100 : 0;
        return { progressPercent: percent, totalEpisodes: total, watchedEpisodes: watched, episodeTag: tag };
    }, [details, watchProgress, item.id]);
    
    if (!details) return null;
    
    const posterUrl = getImageUrl(item.poster_path, 'w342', 'poster');

    return (
        <div 
            onClick={() => onSelect(item.id, 'tv')} 
            className="flex-shrink-0 w-40 m-2 cursor-pointer group transform hover:-translate-y-2 transition-transform duration-300"
        >
            <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden relative">
                <img src={posterUrl} alt={item.title} className="w-full h-60 object-cover" loading="lazy"/>
                {episodeTag && (
                    <div className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${episodeTag.className}`}>
                        {episodeTag.text}
                    </div>
                )}
                <div className="p-2">
                    <h4 className="font-bold truncate text-sm text-text-primary">{item.title}</h4>
                     <div className="mt-1 w-full bg-bg-primary rounded-full h-1.5">
                        <div 
                            className="bg-accent-gradient h-1.5 rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                        <span className="text-xs text-text-secondary">{watchedEpisodes} / {totalEpisodes}</span>
                        <span className="text-xs text-text-secondary font-semibold">{Math.round(progressPercent)}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressItem;