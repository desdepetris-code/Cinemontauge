import React, { useState, useEffect, useMemo } from 'react';
import { NewlyPopularEpisode, TmdbMediaDetails } from '../types';
import FallbackImage from './FallbackImage';
import { getImageUrl } from '../utils/imageUtils';
import { PLACEHOLDER_STILL } from '../constants';
import { formatDate, isNewRelease } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import { getMediaDetails } from '../services/tmdbService';

interface EpisodeCardProps {
    item: NewlyPopularEpisode;
    onSelectShow: (id: number, media_type: 'tv') => void;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({ item, onSelectShow }) => {
    const { showInfo, episode } = item;
    const [showDetails, setShowDetails] = useState<TmdbMediaDetails | null>(null);

    useEffect(() => {
        let isMounted = true;
        getMediaDetails(showInfo.id, 'tv').then(data => {
            if (isMounted) setShowDetails(data);
        }).catch(() => {});
        return () => { isMounted = false; };
    }, [showInfo.id]);

    const ageRating = useMemo(() => {
        if (!showDetails) return null;
        return showDetails.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')?.rating || null;
    }, [showDetails]);

    const getAgeRatingColor = (rating: string) => {
        const r = rating.toUpperCase();
        if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
        if (r === 'TV-Y') return 'bg-[#008000] text-white';
        if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black';
        if (r === 'PG-13') return 'bg-[#00008B] text-white';
        if (r === 'TV-14') return 'bg-[#800000] text-white';
        if (r === 'R') return 'bg-[#FF00FF] text-black font-black';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-md';
        return 'bg-stone-500 text-white';
    };

    const stillSrcs = [
        getImageUrl(episode.still_path, 'w500', 'still'),
        getImageUrl(showInfo.poster_path, 'w500', 'poster'),
    ];

    const isNew = isNewRelease(episode.air_date);

    return (
        <div 
            className="w-64 flex-shrink-0 cursor-pointer group h-full"
            onClick={() => onSelectShow(showInfo.id, 'tv')}
        >
            <div className="relative rounded-lg overflow-hidden shadow-lg">
                {isNew && <NewReleaseOverlay />}
                {ageRating && (
                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black rounded-md backdrop-blur-md border border-white/10 z-20 shadow-lg ${getAgeRatingColor(ageRating)}`}>
                        {ageRating}
                    </div>
                )}
                <div className="aspect-video">
                    <FallbackImage
                        srcs={stillSrcs}
                        placeholder={PLACEHOLDER_STILL}
                        alt={`Still from ${episode.name}`}
                        className="w-full h-full object-cover bg-bg-secondary transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            </div>
            <div className="mt-2 p-3 bg-bg-secondary/40 rounded-xl text-sm space-y-1.5 border border-white/5 shadow-md">
                <p className="font-black text-text-primary truncate uppercase tracking-tight">{showInfo.title}</p>
                <div className="flex flex-col gap-0.5">
                    <p className="text-xs font-bold text-primary-accent truncate uppercase tracking-widest">
                        S{episode.season_number} E{episode.episode_number}: {episode.name}
                    </p>
                    <p className="text-[10px] font-black text-text-primary uppercase tracking-widest">{formatDate(episode.air_date, 'UTC')}</p>
                </div>
            </div>
        </div>
    );
};

export default EpisodeCard;