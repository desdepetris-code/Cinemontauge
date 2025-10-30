import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserData, TmdbMedia } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import { CalendarItem } from '../components/CalendarCard';
import CalendarGridItem from '../components/CalendarGridItem';
import { ChevronLeftIcon, ChevronRightIcon } from '../components/Icons';
import { TMDB_API_BASE_URL, TMDB_API_KEY } from '../constants';

interface CalendarScreenProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ userData, onSelectShow, timezone }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'tv' | 'movie'>('all');
  const [items, setItems] = useState<Record<string, CalendarItem[]>>({});
  const [loading, setLoading] = useState(true);
  
  const formatDateForApi = (date: Date) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

  const fetcher = async <T,>(endpoint: string): Promise<T> => {
    const url = `${TMDB_API_BASE_URL}/${endpoint}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch from TMDB');
    return response.json();
  };

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      const startDate = formatDateForApi(firstDayOfMonth);
      const endDate = formatDateForApi(lastDayOfMonth);

      let upcomingItems: CalendarItem[] = [];

      try {
        if (viewMode === 'my') {
          const itemsToCheck = [...userData.watching, ...userData.planToWatch];
          const detailPromises = itemsToCheck.map(item => getMediaDetails(item.id, item.media_type).catch(() => null));
          const allDetails = await Promise.all(detailPromises);

          allDetails.forEach(details => {
            if (!details) return;
            if (details.media_type === 'tv' && (mediaTypeFilter === 'all' || mediaTypeFilter === 'tv')) {
              if (details.next_episode_to_air?.air_date >= startDate && details.next_episode_to_air?.air_date <= endDate) {
                upcomingItems.push({
                  id: details.id, media_type: 'tv', poster_path: details.poster_path, title: details.name || '', date: details.next_episode_to_air.air_date,
                  episodeInfo: `S${details.next_episode_to_air.season_number} E${details.next_episode_to_air.episode_number}`,
                });
              }
            } else if (details.media_type === 'movie' && (mediaTypeFilter === 'all' || mediaTypeFilter === 'movie')) {
              if (details.release_date && details.release_date >= startDate && details.release_date <= endDate) {
                upcomingItems.push({
                  id: details.id, media_type: 'movie', poster_path: details.poster_path, title: details.title || '', date: details.release_date,
                  episodeInfo: 'Movie Release'
                });
              }
            }
          });
        } else { // 'all'
          const moviePromise = (mediaTypeFilter === 'all' || mediaTypeFilter === 'movie') ? 
            fetcher<{results: TmdbMedia[]}>(`discover/movie?api_key=${TMDB_API_KEY}&primary_release_date.gte=${startDate}&primary_release_date.lte=${endDate}&sort_by=popularity.desc`) : Promise.resolve({results: []});
          
          const tvPromise = (mediaTypeFilter === 'all' || mediaTypeFilter === 'tv') ? 
            fetcher<{results: TmdbMedia[]}>(`discover/tv?api_key=${TMDB_API_KEY}&air_date.gte=${startDate}&air_date.lte=${endDate}&sort_by=popularity.desc`) : Promise.resolve({results: []});

          const [movieRes, tvRes] = await Promise.all([moviePromise, tvPromise]);
          
          [...movieRes.results, ...tvRes.results].forEach(item => {
            const releaseDate = item.release_date || item.first_air_date;
            if(releaseDate) {
              upcomingItems.push({
                id: item.id, media_type: item.media_type, poster_path: item.poster_path, title: item.title || item.name || '', date: releaseDate,
                episodeInfo: item.media_type === 'movie' ? 'Movie Release' : 'Premiere'
              });
            }
          });
        }
      } catch (e) {
        console.error("Failed to fetch calendar data", e);
      }
      
      const itemsByDate: Record<string, CalendarItem[]> = {};
      upcomingItems.forEach(item => {
        const dateKey = item.date;
        if (!itemsByDate[dateKey]) itemsByDate[dateKey] = [];
        itemsByDate[dateKey].push(item);
      });

      setItems(itemsByDate);
      setLoading(false);
    };
    fetchCalendarData();
  }, [currentDate, viewMode, mediaTypeFilter, userData, timezone]);

  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid: ({ day: number; date: string } | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      grid.push({ day: i, date: formatDateForApi(new Date(year, month, i)) });
    }
    return grid;
  }, [currentDate]);
  
  const changeMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };
  
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-8">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-text-primary">Release Calendar</h1>
            <div className="flex items-center space-x-2">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-bg-secondary"><ChevronLeftIcon className="w-6 h-6"/></button>
                <span className="font-semibold text-lg w-40 text-center">{monthName}</span>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-bg-secondary"><ChevronRightIcon className="w-6 h-6"/></button>
            </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex p-1 bg-bg-secondary rounded-full">
                <button onClick={() => setViewMode('my')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex-1 ${viewMode === 'my' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>My Calendar</button>
                <button onClick={() => setViewMode('all')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex-1 ${viewMode === 'all' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>All Releases</button>
            </div>
             <div className="flex p-1 bg-bg-secondary rounded-full">
                <button onClick={() => setMediaTypeFilter('all')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex-1 ${mediaTypeFilter === 'all' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>All</button>
                <button onClick={() => setMediaTypeFilter('tv')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex-1 ${mediaTypeFilter === 'tv' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>TV</button>
                <button onClick={() => setMediaTypeFilter('movie')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all flex-1 ${mediaTypeFilter === 'movie' ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary'}`}>Movies</button>
            </div>
        </div>
      </header>

      <div className="bg-card-gradient rounded-lg shadow-md">
        <div className="grid grid-cols-7 text-center font-bold text-text-secondary border-b border-bg-secondary">
            {weekdays.map(day => <div key={day} className="py-2">{day}</div>)}
        </div>
        {loading ? (
            <div className="h-96 flex items-center justify-center text-text-secondary">Loading Calendar...</div>
        ) : (
            <div className="grid grid-cols-7 min-h-[70vh]">
                {calendarGrid.map((day, index) => (
                    <div key={index} className="border-r border-b border-bg-secondary p-1.5 min-h-[120px]">
                        {day && (
                            <>
                                <span className="text-sm font-semibold text-text-secondary">{day.day}</span>
                                <div className="mt-1 space-y-1">
                                    {(items[day.date] || []).map(item => (
                                        <CalendarGridItem key={`${item.id}-${item.date}`} item={item} onSelect={onSelectShow} />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default CalendarScreen;