import React, { useState, useEffect, useMemo } from 'react';
import { TmdbMedia, TrackedItem, TmdbMediaDetails, UserData } from '../types';
import { PlusIcon, CheckCircleIcon, CalendarIcon, HeartIcon, ChevronDownIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER } from '../constants';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import { getImageUrl } from '../utils/imageUtils';
import { isNewRelease, getRecentEpisodeCount } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import { getMediaDetails } from '../services/tmdbService';
import UserRatingStamp from './UserRatingStamp';
import BrandedImage from './BrandedImage';
import { getShowStatus } from '../utils/statusUtils';

interface ActionCardProps {
    item: TmdbMedia;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    isFavorite: boolean;
    isCompleted: boolean;
    showRatings: boolean;
    showSeriesInfo?: 'expanded' | 'toggle' | 'hidden';
    userRating?: number;
    userData: UserData;
    timeFormat?: '12h' | '24h';
    rank?: number;
}

const ActionCard: React.FC<ActionCardProps> = ({ 
    item, 
    onSelect, 
    onOpenAddToListModal, 
    onMarkShowAsWatched, 
    onToggleFavoriteShow, 
    isFavorite, 
    isCompleted, 
    showRatings,
    showSeriesInfo = 'expanded',
    userRating = 0,
    userData,
    timeFormat = '12h',
    rank
}) => {
    const [markAsWatchedModalState, setMarkAsWatchedModalState] = useState<{ isOpen: boolean; item: TmdbMedia | null }>({ isOpen: false, item: null });
    const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
    const [isInfoExpanded, setIsInfoExpanded] = useState(showSeriesInfo === 'expanded');
    
    const posterSrcs = useMemo(() => [getImageUrl(item.poster_path, 'w500')], [item.poster_path]);
    const title = item.title || item.name || 'Untitled';
    const releaseDate = item.release_date || item.first_air_date;
    const isNew = isNewRelease(releaseDate);
    
    useEffect(() => {
        let isMounted = true;
        getMediaDetails(item.id, item.media_type).then(data => {
            if (isMounted) setDetails(data);
        }).catch(e => console.error(`Failed to fetch details for ActionCard ${item.id}`, e));
        return () => { isMounted = false; };
    }, [item.id, item.media_type]);

    const showStatusText = useMemo(() => {
        if (!details) return null;
        return getShowStatus(details)?.text ?? null;
    }, [details]);

    const formattedYears = useMemo(() => {
        if (!details) return (item.release_date || item.first_air_date)?.substring(0, 4);
        const start = (details.release_date || details.first_air_date)?.substring(0, 4);
        if (!start) return null;
        if (item.media_type === 'movie') return start;
        const isOngoing = details.status !== 'Ended' && details.status !== 'Canceled';
        const end = isOngoing ? 'Ongoing' : (details.last_episode_to_air?.air_date?.substring(0, 4) || start);
        return `${start} — ${end}`;
    }, [details, item]);

    return (
        <>
            <MarkAsWatchedModal isOpen={markAsWatchedModalState.isOpen} onClose={() => setMarkAsWatchedModalState({ isOpen: false, item: null })} mediaTitle={title} onSave={(data) => onMarkShowAsWatched(item, data.date)} />
            <div className={`w-full flex flex-col transition-all duration-300 ${isInfoExpanded ? 'z-20' : 'z-0'} group/card`}>
                <div 
                    className="relative rounded-[1.5rem] overflow-hidden shadow-2xl bg-bg-secondary/20 border border-white/5 cursor-pointer"
                    onClick={() => onSelect(item.id, item.media_type)}
                >
                    {isNew && <NewReleaseOverlay position="top-left" color="cyan" className="scale-110 md:scale-125 z-30" />}
                    <UserRatingStamp rating={userRating} className="absolute -top-1 -left-1 scale-110 md:scale-125 z-40" />
                    
                    <BrandedImage title={title} status={item.media_type === 'tv' ? showStatusText : null}>
                        <div className="aspect-[2/3] overflow-hidden relative">
                            <FallbackImage
                                srcs={posterSrcs}
                                placeholder={PLACEHOLDER_POSTER}
                                type="poster"
                                globalPlaceholders={userData.globalPlaceholders}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex items-end p-4">
                                <div className="w-full group-hover/card:translate-y-[-4px] transition-transform duration-300 text-center">
                                    <h3 className="text-white text-[11px] sm:text-xs font-black uppercase tracking-tight leading-tight [text-shadow:0_2px_4px_rgba(0,0,0,0.8)]">
                                        {title}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </BrandedImage>
                </div>

                <div className="w-full mt-3 grid grid-cols-4 gap-2 px-1">
                    <button onClick={(e) => { e.stopPropagation(); onToggleFavoriteShow({id: item.id, title: title, media_type: item.media_type, poster_path: item.poster_path} as TrackedItem); }} className={`flex items-center justify-center py-2.5 rounded-xl transition-all shadow-md border ${isFavorite ? 'bg-primary-accent/30 border-primary-accent text-primary-accent' : 'bg-bg-secondary/40 border-white/10 text-white'}`} title="Favorite">
                        <HeartIcon filled={isFavorite} className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMarkShowAsWatched(item); }} disabled={isCompleted} className="flex items-center justify-center py-2.5 rounded-xl bg-bg-secondary/40 border border-white/10 text-white hover:text-primary-accent transition-all shadow-md disabled:opacity-30" title="Quick Log">
                        <CheckCircleIcon className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onOpenAddToListModal(item); }} className="flex items-center justify-center py-2.5 rounded-xl bg-bg-secondary/40 border border-white/10 text-white hover:text-primary-accent transition-all shadow-md" title="Add to List">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMarkAsWatchedModalState({isOpen: true, item}); }} disabled={isCompleted} className="flex items-center justify-center py-2.5 rounded-xl bg-bg-secondary/40 border border-white/10 text-white hover:text-primary-accent transition-all shadow-md disabled:opacity-30" title="Log with Date">
                        <CalendarIcon className="w-5 h-5" />
                    </button>
                </div>

                {showSeriesInfo !== 'hidden' && (
                    <div className="mt-2 flex bg-bg-secondary/40 rounded-xl shadow-xl border border-white/10 overflow-hidden">
                        {rank && (
                            <div className="w-14 flex-shrink-0 flex items-center justify-center border-r border-white/5 bg-black/20">
                                <span className="text-4xl font-black italic leading-none select-none text-primary-accent drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                    {rank}
                                </span>
                            </div>
                        )}
                        <div className="flex-grow p-3 text-center flex flex-col justify-center min-w-0">
                            <p className="font-black text-text-primary truncate text-xs sm:text-sm uppercase tracking-tight mb-1">{title}</p>
                            <p className="text-[10px] sm:text-xs font-black text-text-primary uppercase tracking-[0.1em] leading-none">
                                {item.media_type === 'tv' ? 'Series' : 'Film'} • {formattedYears}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ActionCard;