import React, { useState, useEffect } from 'react';
import { discoverMedia } from '../services/tmdbService';
import { TmdbMedia, TrackedItem, Reminder, WatchStatus } from '../types';
import Carousel from './Carousel';
import PremiereCard from './PremiereCard';
import { TvIcon } from './Icons';

interface UpcomingPremieresCarouselProps {
  title: string;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  completed: TrackedItem[];
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
}

const UpcomingPremieresCarousel: React.FC<UpcomingPremieresCarouselProps> = (props) => {
    const { title, onSelectShow, completed, reminders, onToggleReminder, onOpenAddToListModal } = props;
    const [media, setMedia] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetcher = async () => {
            const today = new Date().toISOString().split('T')[0];
            const sixtyDaysFromNow = new Date();
            sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
            const endDate = sixtyDaysFromNow.toISOString().split('T')[0];
            return discoverMedia('tv', {
                sortBy: 'popularity.desc',
                'first_air_date.gte': today,
                'first_air_date.lte': endDate,
            });
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                const results = await fetcher();
                const limitedResults = results.slice(0, 10);
                setMedia(limitedResults);
            } catch (error) {
                console.error(`Failed to fetch for carousel`, error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
             <div className="my-16 px-6">
                <div className="h-10 w-48 bg-bg-secondary/40 rounded-md mb-8 animate-pulse"></div>
                <div className="flex space-x-6 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-72 h-44 bg-bg-secondary/20 rounded-3xl animate-pulse flex-shrink-0"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (media.length === 0) return null;

    return (
        <div className="my-16">
            <div className="flex items-center gap-3 mb-8 px-6">
                <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-500 shadow-inner">
                    <TvIcon className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">{title}</h2>
            </div>
            <Carousel>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-6 hide-scrollbar">
                    {media.map(item => {
                        const isCompleted = completed.some(c => c.id === item.id);
                        return (
                            <PremiereCard 
                                key={`${item.id}-${item.media_type}`}
                                item={item}
                                onSelect={onSelectShow}
                                onAddToList={() => onOpenAddToListModal(item)}
                                isCompleted={isCompleted}
                                reminders={reminders}
                                onToggleReminder={onToggleReminder}
                            />
                        );
                    })}
                    <div className="w-8 flex-shrink-0"></div>
                </div>
            </Carousel>
        </div>
    );
};

export default UpcomingPremieresCarousel;