import React, { useState, useEffect, useMemo } from 'react';
import { UserData, TmdbMedia } from '../types';
import { getMediaDetails, getUpcomingMovies, getNewReleases } from '../services/tmdbService';
import CalendarCard, { CalendarItem } from './CalendarCard';
import { ChevronRightIcon } from './Icons';

interface UpcomingCalendarProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
  onViewFullCalendar: () => void;
}

const UpcomingCalendar: React.FC<UpcomingCalendarProps> = ({ userData, onSelectShow, timezone, onViewFullCalendar }) => {
    const [activeTab, setActiveTab] = useState<'my' | 'all'>('my');
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCalendar = async () => {
            setLoading(true);
            const today = new Date();
            const tenDaysFromNow = new Date();
            tenDaysFromNow.setDate(today.getDate() + 10);
            
            const todayStr = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone }).format(today);
            const tenDaysStr = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: timezone }).format(tenDaysFromNow);

            let upcomingItems: CalendarItem[] = [];

            if (activeTab === 'my') {
                const watchingTv = userData.watching.filter(i => i.media_type === 'tv');
                const detailPromises = watchingTv.map(show => getMediaDetails(show.id, 'tv').catch(() => null));
                const allDetails = await Promise.all(detailPromises);
                
                allDetails.forEach(details => {
                    if (details?.next_episode_to_air) {
                        const airDate = details.next_episode_to_air.air_date;
                        if (airDate >= todayStr && airDate <= tenDaysStr) {
                            upcomingItems.push({
                                id: details.id,
                                media_type: 'tv',
                                poster_path: details.poster_path,
                                title: details.name || 'Untitled',
                                date: airDate,
                                episodeInfo: `S${details.next_episode_to_air.season_number} E${details.next_episode_to_air.episode_number}: ${details.next_episode_to_air.name}`,
                            });
                        }
                    }
                });
            } else { // 'all'
                const [upcomingMovies, onTheAirTv] = await Promise.all([
                    getUpcomingMovies().catch(() => []),
                    getNewReleases('tv').catch(() => [])
                ]);

                const allRaw = [...upcomingMovies, ...onTheAirTv];
                allRaw.forEach(item => {
                    const releaseDate = item.release_date || item.first_air_date;
                    if (releaseDate && releaseDate >= todayStr && releaseDate <= tenDaysStr) {
                        upcomingItems.push({
                            id: item.id,
                            media_type: item.media_type,
                            poster_path: item.poster_path,
                            title: item.title || item.name || 'Untitled',
                            date: releaseDate,
                            episodeInfo: item.media_type === 'movie' ? 'Movie Release' : 'Premiere',
                        });
                    }
                });
            }

            upcomingItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setItems(upcomingItems);
            setLoading(false);
        };
        fetchCalendar();
    }, [activeTab, userData.watching, timezone]);

    return (
        <section className="px-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-text-primary">Upcoming Releases</h2>
                <div className="flex p-1 bg-bg-secondary rounded-full">
                    <button onClick={() => setActiveTab('my')} className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${activeTab === 'my' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>My Calendar</button>
                    <button onClick={() => setActiveTab('all')} className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${activeTab === 'all' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>All Upcoming</button>
                </div>
            </div>

            <div className="flex overflow-x-auto space-x-4 pb-4 -mx-2 px-2 hide-scrollbar">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="w-40 flex-shrink-0 animate-pulse">
                            <div className="h-60 bg-bg-secondary rounded-lg"></div>
                            <div className="h-4 bg-bg-secondary rounded mt-2 w-3/4"></div>
                            <div className="h-3 bg-bg-secondary rounded mt-1 w-1/2"></div>
                        </div>
                    ))
                ) : items.length > 0 ? (
                    <>
                        {items.map(item => (
                            <CalendarCard key={`${item.id}-${item.date}`} item={item} onSelect={onSelectShow} timezone={timezone} />
                        ))}
                         <div className="flex items-center justify-center w-40 flex-shrink-0">
                            <button onClick={onViewFullCalendar} className="text-sm font-semibold text-primary-accent hover:underline flex items-center">
                                View Full Calendar <ChevronRightIcon className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full text-center py-10 bg-bg-secondary/30 rounded-lg">
                        <p className="text-text-secondary">
                            {activeTab === 'my' ? "No upcoming episodes in the next 10 days for shows you're watching." : "No major releases found in the next 10 days."}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default UpcomingCalendar;