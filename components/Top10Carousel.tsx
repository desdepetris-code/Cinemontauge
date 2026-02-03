
import React, { useState, useEffect } from 'react';
import { getPopularMedia } from '../services/tmdbService';
import { TmdbMedia, TrackedItem, UserData, WatchStatus } from '../types';
import Carousel from './Carousel';
import ActionCard from './ActionCard';
import { ChevronRightIcon } from './Icons';

interface Top10CarouselProps {
    mediaType: 'tv' | 'movie';
    title: string;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
    onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
    onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
    onToggleFavoriteShow: (item: TrackedItem) => void;
    favorites: TrackedItem[];
    completed: TrackedItem[];
    onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
    userData: UserData;
    timeFormat: '12h' | '24h';
    showRatings: boolean;
}

const Top10Carousel: React.FC<Top10CarouselProps> = ({ 
    mediaType, title, onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, 
    onToggleFavoriteShow, favorites, completed, onUpdateLists, userData, 
    timeFormat, showRatings 
}) => {
    const [media, setMedia] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(false);
            try {
                const results = await getPopularMedia(mediaType);
                setMedia(results);
            } catch (error) {
                console.error(`Failed to fetch top 10 popular ${mediaType}`, error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [mediaType]);

    if (loading) {
        return (
            <div className="my-12 px-6">
                <div className="h-8 w-48 bg-bg-secondary rounded-md mb-6 animate-pulse"></div>
                <div className="flex space-x-6 overflow-hidden">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-56 h-80 bg-bg-secondary/40 rounded-3xl animate-pulse flex-shrink-0"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || media.length === 0) {
        return (
            <div className="my-12 px-6">
                <div className="p-10 bg-bg-secondary/20 rounded-3xl border border-dashed border-white/10 text-center">
                    <p className="text-text-secondary font-black uppercase tracking-widest text-xs opacity-50">
                        Top 10 {mediaType === 'movie' ? 'Movies' : 'TV Shows'} Registry Currently Offline
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="my-12">
            <div className="flex justify-between items-center mb-6 px-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-accent-gradient rounded-full"></div>
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">{title}</h2>
                </div>
            </div>
            <Carousel>
                <div className="flex overflow-x-auto py-4 -mx-2 px-6 space-x-12 hide-scrollbar items-start">
                    {media.map((item, index) => (
                        <div key={item.id} className="relative flex-shrink-0 group">
                            {/* Visual Rank Indicator */}
                            <div className="absolute -left-8 bottom-4 z-10 pointer-events-none select-none">
                                <span className="text-9xl font-black italic text-transparent stroke-text" style={{ 
                                    WebkitTextStroke: '2px rgba(255,255,255,0.4)',
                                    textShadow: '0 0 30px rgba(0,0,0,0.5)'
                                }}>
                                    {index + 1}
                                </span>
                            </div>
                            
                            <div className="w-56 transform transition-transform duration-500 group-hover:scale-105 group-hover:z-20">
                                <ActionCard 
                                    item={item} 
                                    onSelect={onSelectShow}
                                    onOpenAddToListModal={onOpenAddToListModal}
                                    onMarkShowAsWatched={onMarkShowAsWatched}
                                    onToggleFavoriteShow={onToggleFavoriteShow}
                                    isFavorite={favorites.some(f => f.id === item.id)}
                                    isCompleted={completed.some(c => c.id === item.id)}
                                    showRatings={showRatings}
                                    showSeriesInfo="toggle"
                                    userRating={userData.ratings[item.id]?.rating || 0}
                                    userData={userData}
                                    timeFormat={timeFormat}
                                />
                            </div>
                        </div>
                    ))}
                    <div className="w-12 flex-shrink-0"></div>
                </div>
            </Carousel>
            
            <style>{`
                .stroke-text {
                    color: transparent;
                    -webkit-text-stroke: 3px rgba(var(--color-accent-primary-rgb), 0.5);
                    paint-order: stroke fill;
                }
            `}</style>
        </div>
    );
};

export default Top10Carousel;
