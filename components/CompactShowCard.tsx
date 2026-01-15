
import React, { useState, useEffect, useMemo } from 'react';
import { TrackedItem, TmdbMediaDetails } from '../types';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import BrandedImage from './BrandedImage';
import { getMediaDetails } from '../services/tmdbService';
import { getShowStatus } from '../utils/statusUtils';

interface CompactShowCardProps {
  item: TrackedItem;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const CompactShowCard: React.FC<CompactShowCardProps> = ({ item, onSelect }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

    useEffect(() => {
        let isMounted = true;
        getMediaDetails(item.id, item.media_type).then(data => {
            if (isMounted) setDetails(data);
        }).catch(console.error);
        return () => { isMounted = false; };
    }, [item.id, item.media_type]);
    
    const showStatusText = useMemo(() => {
      if (!details) return null;
      return getShowStatus(details)?.text ?? null;
    }, [details]);

    const ageRating = useMemo(() => {
        if (!details) return null;
        if (details.media_type === 'tv') {
          return details.content_ratings?.results?.find(r => r.iso_3166_1 === 'US')?.rating || null;
        } else {
          return details.release_dates?.results?.find(r => r.iso_3166_1 === 'US')?.release_dates?.find(d => d.certification)?.certification || null;
        }
    }, [details]);

    const getAgeRatingColor = (rating: string) => {
        const r = rating.toUpperCase();
        if (['G', 'TV-G', 'TV-Y'].includes(r)) return 'bg-green-600 shadow-[0_0_8px_rgba(22,163,74,0.5)]';
        if (['PG', 'TV-PG', 'TV-Y7'].includes(r)) return 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]';
        if (r === 'PG-13') return 'bg-amber-400 text-black font-black shadow-[0_0_8px_rgba(251,191,36,0.5)]';
        if (r === 'TV-14') return 'bg-violet-700 shadow-[0_0_8px_rgba(109,40,217,0.5)]';
        if (['R'].includes(r)) return 'bg-orange-600 shadow-[0_0_8px_rgba(234,88,12,0.5)]';
        if (['TV-MA', 'NC-17'].includes(r)) return 'bg-red-700 shadow-[0_0_8px_rgba(185,28,28,0.5)]';
        return 'bg-stone-500';
    };

    const posterSrcs = [item.poster_path ? `${TMDB_IMAGE_BASE_URL}w342${item.poster_path}` : null];
    const title = item.title;

    return (
        <div
            onClick={() => onSelect(item.id, item.media_type)}
            className="cursor-pointer group transform hover:-translate-y-1 transition-transform duration-300 h-full"
        >
            <div className="relative rounded-md overflow-hidden shadow-lg h-full">
                {ageRating && (
                    <div className={`absolute top-1 right-1 px-1 py-0.5 text-[8px] font-black rounded-sm backdrop-blur-md z-20 shadow-md text-white ${getAgeRatingColor(ageRating)}`}>
                        {ageRating}
                    </div>
                )}
                <BrandedImage title={title} status={item.media_type === 'tv' ? showStatusText : null}>
                    <FallbackImage
                        srcs={posterSrcs}
                        placeholder={PLACEHOLDER_POSTER}
                        noPlaceholder={true}
                        alt={title}
                        className="w-full aspect-[2/3] object-cover bg-bg-secondary"
                        loading="lazy"
                    />
                </BrandedImage>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-2 pl-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-white text-xs font-bold text-center w-full">{title}</h3>
                </div>
            </div>
        </div>
    );
};

export default CompactShowCard;
