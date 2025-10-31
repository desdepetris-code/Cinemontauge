import React, { useState, useEffect } from 'react';
import { CalendarItem, TmdbMedia } from '../types';
import { getUpcomingCalendarItems } from '../services/tmdbService';
import CalendarCard from './CalendarCard';
import { ChevronRightIcon } from './Icons';

interface UpcomingCalendarProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
  onViewFullCalendar: () => void;
}

const CalendarCarousel: React.FC<{ items: CalendarItem[]; onSelect: (id: number, media_type: 'tv' | 'movie') => void; timezone: string }> = ({ items, onSelect, timezone }) => (
    <div className="flex overflow-x-auto space-x-4 pb-4 -mx-2 px-2 hide-scrollbar">
        {items.map(item => (
            <CalendarCard key={`${item.id}-${item.date}-${item.episodeInfo}`} item={item} onSelect={onSelect} timezone={timezone} />
        ))}
        <div className="w-4 flex-shrink-0"></div>
    </div>
);

const UpcomingCalendar: React.FC<UpcomingCalendarProps> = ({ onSelectShow, timezone, onViewFullCalendar }) => {
    const [upcomingMovies, setUpcomingMovies] = useState<CalendarItem[]>([]);
    const [upcomingTv, setUpcomingTv] = useState<CalendarItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUpcoming = async () => {
            setLoading(true);
            try {
                const [movieItems, tvItems] = await Promise.all([
                    getUpcomingCalendarItems('movie', timezone),
                    getUpcomingCalendarItems('tv', timezone),
                ]);
                setUpcomingMovies(movieItems);
                setUpcomingTv(tvItems);
            } catch (error) {
                console.error("Failed to fetch upcoming calendar items", error);
            }
            setLoading(false);
        };

        fetchUpcoming();
    }, [timezone]);

    return (
        <section className="px-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary halloween-lights-left">Upcoming Releases</h2>
                <button onClick={onViewFullCalendar} className="text-sm font-semibold text-primary-accent hover:underline flex items-center">
                    <span>Full Calendar</span> <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
            </div>

            {loading ? (
                 <div className="flex overflow-x-auto space-x-4 pb-4 -mx-2 px-2 hide-scrollbar animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-40 flex-shrink-0">
                            <div className="h-60 bg-bg-secondary rounded-lg"></div>
                            <div className="h-4 bg-bg-secondary rounded mt-2 w-3/4"></div>
                            <div className="h-3 bg-bg-secondary rounded mt-1 w-1/2"></div>
                        </div>
                    ))}
                </div>
            ) : (
                (upcomingTv.length > 0 || upcomingMovies.length > 0) ? (
                    <div className="space-y-6">
                        {upcomingTv.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">Upcoming Episodes</h3>
                                <CalendarCarousel items={upcomingTv} onSelect={onSelectShow} timezone={timezone} />
                            </div>
                        )}
                        {upcomingMovies.length > 0 && (
                            <div>
                                <h3 className="text-lg font-bold text-text-primary mb-2">Upcoming Movies</h3>
                                <CalendarCarousel items={upcomingMovies} onSelect={onSelectShow} timezone={timezone} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full text-center py-10 bg-bg-secondary/30 rounded-lg">
                        <p className="text-text-secondary">Could not find upcoming releases at this time.</p>
                    </div>
                )
            )}
        </section>
    );
};

export default UpcomingCalendar;