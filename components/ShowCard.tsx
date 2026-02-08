
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrackedItem, TmdbMedia, TmdbMediaDetails, UserData } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';
import BrandedImage from './BrandedImage';
import { getShowStatus } from '../utils/statusUtils';
import { getRecentEpisodeCount, isNewRelease } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';

interface ShowCardProps {
  item: TrackedItem | TmdbMedia;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
  globalPlaceholders?: UserData['globalPlaceholders'];
}

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

const ShowCardSkeleton: React.FC = () => (
    <div className="w-full">
        <div className="w-full aspect-[2/3] bg-bg-secondary rounded-lg"></div>
        <div className="h-4 bg-bg-secondary rounded mt-2 w-3/4 mx-auto"></div>
    </div>
);

const useInView = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    if(ref.current) observer.unobserve(ref.current);
                }
            },
            { rootMargin: "200px" }
        );
        
        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }
        
        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, []);

    return [ref, inView] as const;
};


const ShowCard: React.FC<ShowCardProps> = ({ item, onSelect, globalPlaceholders }) => {
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [loading, setLoading] = useState(false);
    const [recentEpisodeCount, setRecentEpisodeCount] = useState(0);
    const [ref, inView] = useInView();

    const isNew = isNewRelease((item as TmdbMedia).release_date || (item as TmdbMedia).first_air_date);

    useEffect(() => {
        if (!inView) return;

        let isMounted = true;
        const fetchDetails = async () => {
            setLoading(true);
            setRecentEpisodeCount(0);
            try {
                const tmdbData = await getMediaDetails(item.id, item.media_type);
                if (!isMounted) return;

                setDetails(tmdbData);

                if (item.media_type === 'tv' && !isNew) {
                    const count = getRecentEpisodeCount(tmdbData);
                    if (isMounted) setRecentEpisodeCount(count);
                }
            } catch (error) {
                console.error(`Failed to fetch details for ${item.id}`, error);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [item.id, item.media_type, isNew, inView]);

    const showStatusText = useMemo(() => {
        if (!details) return null;
        return getShowStatus(details)?.text ?? null;
    }, [details]);

    const posterSrcs = useMemo(() => {
        const paths = [
            details?.poster_path,
            item.poster_path
        ];
        return paths.map(p => getFullImageUrl(p, 'w342'));
    }, [details, item.poster_path]);

    const title = details?.title || details?.name || (item as TmdbMedia).title || (item as TmdbMedia).name || 'Untitled';

    return (
        <div
            ref={ref}
            onClick={() => onSelect(item.id, item.media_type)}
            className="cursor-pointer group transform hover:-translate-y-2 transition-transform duration-300 h-full"
        >
            {(!inView || (loading && !details)) ? (
                <ShowCardSkeleton />
            ) : (
                <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-bg-secondary/20 h-full border border-white/5">
                    {isNew && <NewReleaseOverlay position="top-left" color="cyan" />}
                    {recentEpisodeCount > 0 && (
                        <NewReleaseOverlay
                            text={recentEpisodeCount > 1 ? "NEW EPISODES" : "NEW EPISODE"}
                            position="top-right"
                            color="rose"
                        />
                    )}
                    <BrandedImage title={title} status={item.media_type === 'tv' ? showStatusText : null}>
                        <FallbackImage
                            srcs={posterSrcs}
                            placeholder={PLACEHOLDER_POSTER}
                            type="poster"
                            globalPlaceholders={globalPlaceholders}
                            alt={title}
                            className="w-full aspect-[2/3] object-cover transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-4 pl-8">
                            <h3 className="text-white text-xs sm:text-sm font-black text-center w-full leading-tight uppercase tracking-tight [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">{title}</h3>
                        </div>
                    </BrandedImage>
                </div>
            )}
        </div>
    );
};

export default ShowCard;
