
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
        if (['G', 'TV-G', 'TV-Y'].includes(r)) return 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.5)]';
        if (['PG', 'TV-PG', 'TV-Y7'].includes(r)) return 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]';
        if (r === 'PG-13') return 'bg-amber-400 text-black font-black shadow-[0_0_8px_rgba(251,191,36,0.5)]';
        if (r === 'TV-14') return 'bg-violet-700 shadow-[0_0_8px_rgba(109,40,217,0.5)]';
        if (r === 'R') return 'bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.5)]';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-red-700 shadow-[0_0_8px_rgba(185,28,28,0.5)]';
        return 'bg-stone-500';
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
                    <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black rounded-md backdrop-blur-md border border-white/10 z-20 shadow-lg text-white ${getAgeRatingColor(ageRating)}`}>
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
            <div className="mt-1.5 p-2 bg-bg-secondary/50 rounded-lg text-xs space-y-1">
                <p className="font-bold text-text-primary truncate">{showInfo.title}</p>
                <p className="text-text-secondary truncate">
                    S{episode.season_number} E{episode.episode_number}: {episode.name}
                </p>
                <p className="text-text-secondary/80 font-semibold">{formatDate(episode.air_date, 'UTC')}</p>
            </div>
        </div>
    );
};

export default EpisodeCard;
