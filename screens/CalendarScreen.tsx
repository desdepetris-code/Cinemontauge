import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { UserData, CalendarItem, Reminder } from '../types';
import { getMediaDetails, getCalendarMedia } from '../services/tmdbService';
import { ChevronLeftIcon, ChevronRightIcon, TvIcon, FilmIcon, ChevronDownIcon } from '../components/Icons';
import { formatDate } from '../utils/formatUtils';
import CalendarListItem from '../components/CalendarListItem';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface CalendarScreenProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
}

const MonthYearPicker: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
}> = ({ isOpen, onClose, currentDate, onDateChange }) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  if (!isOpen) return null;

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const handleMonthSelect = (monthIndex: number) => {
    onDateChange(new Date(selectedYear, monthIndex, 1));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-xs p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-center mb-4">
                <select 
                    value={selectedYear} 
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="bg-bg-secondary text-text-primary rounded-md p-2 font-bold focus:outline-none focus:ring-2 focus:ring-primary-accent"
                >
                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {months.map((month, index) => (
                    <button 
                        key={month}
                        onClick={() => handleMonthSelect(index)}
                        className={`p-3 text-sm rounded-md font-semibold transition-colors ${currentDate.getFullYear() === selectedYear && currentDate.getMonth() === index ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-primary hover:brightness-125'}`}
                    >
                        {month}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};


const CalendarScreen: React.FC<CalendarScreenProps> = ({ userData, onSelectShow, timezone }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState<Record<string, CalendarItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useLocalStorage<Reminder[]>('sceneit_reminders', []);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);
  
  const formatDateForApi = (date: Date) => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);

  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      setIsInitialScrollDone(false); // Reset scroll trigger on month change
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDayOfMonth = new Date(year, month, 1);
      const lastDayOfMonth = new Date(year, month + 1, 0);

      const startDate = formatDateForApi(firstDayOfMonth);
      const endDate = formatDateForApi(lastDayOfMonth);

      let upcomingItems: CalendarItem[] = [];

      try {
          const moviePromise = getCalendarMedia('movie', startDate, endDate);
          const tvPromise = getCalendarMedia('tv', startDate, endDate);

          const [movieRes, tvRes] = await Promise.all([moviePromise, tvPromise]);
          
          movieRes.forEach(item => {
            const releaseDate = item.release_date;
            if (releaseDate) {
              upcomingItems.push({
                id: item.id,
                media_type: 'movie' as const,
                poster_path: item.poster_path,
                title: item.title || item.name || '',
                date: releaseDate,
                episodeInfo: 'Movie Release',
              });
            }
          });
          tvRes.forEach(item => {
            const releaseDate = item.first_air_date;
            if (releaseDate) {
              upcomingItems.push({
                id: item.id,
                media_type: 'tv' as const,
                poster_path: item.poster_path,
                title: item.title || item.name || '',
                date: releaseDate,
                episodeInfo: 'Premiere',
              });
            }
          });
      } catch (e) {
        console.error("Failed to fetch calendar data", e);
      }
      
      const itemsByDate: Record<string, CalendarItem[]> = {};
      upcomingItems.forEach(item => {
        const dateKey = item.date;
        if (!itemsByDate[dateKey]) itemsByDate[dateKey] = [];
        itemsByDate[dateKey].push(item);
      });
      
      const todayStr = formatDateForApi(new Date());
      const newExpandedDays: Record<string, boolean> = {};
      Object.keys(itemsByDate).forEach(date => {
          if (date >= todayStr) {
              newExpandedDays[date] = true;
          }
      });
      setExpandedDays(newExpandedDays);

      setItems(itemsByDate);
      setLoading(false);
    };
    fetchCalendarData();
  }, [currentDate, timezone]);

  const sortedDays = Object.keys(items).sort();

  useEffect(() => {
    if (!loading && !isInitialScrollDone && sortedDays.length > 0) {
      const todayStr = formatDateForApi(new Date());
      const firstUpcomingDay = sortedDays.find(day => day >= todayStr);
      const targetDay = firstUpcomingDay || sortedDays[sortedDays.length - 1];

      if (targetDay) {
        setTimeout(() => {
          const element = document.getElementById(`day-${targetDay}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setIsInitialScrollDone(true);
        }, 100);
      }
    }
  }, [loading, isInitialScrollDone, sortedDays]);

  const changeMonth = (delta: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };
  
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const handleToggleReminder = (item: CalendarItem) => {
      const reminderId = `rem-${item.media_type}-${item.id}-${item.date}`;
      const isSet = reminders.some(r => r.id === reminderId);
      if (isSet) {
          setReminders(prev => prev.filter(r => r.id !== reminderId));
      } else {
          const newReminder: Reminder = {
              id: reminderId,
              mediaId: item.id,
              mediaType: item.media_type,
              releaseDate: item.date,
              title: item.title,
              poster_path: item.poster_path,
              episodeInfo: item.episodeInfo,
          };
          setReminders(prev => [...prev, newReminder]);
      }
  };

  const toggleDay = (date: string) => {
      setExpandedDays(prev => ({ ...prev, [date]: !prev[date] }));
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
      <MonthYearPicker isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} currentDate={currentDate} onDateChange={setCurrentDate} />
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-text-primary">Release Calendar</h1>
            <div className="flex items-center space-x-2">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-bg-secondary"><ChevronLeftIcon className="w-6 h-6"/></button>
                <button onClick={() => setIsPickerOpen(true)} className="font-semibold text-lg w-40 text-center flex items-center justify-center hover:bg-bg-secondary p-1 rounded-md">
                    <span>{monthName}</span>
                    <ChevronDownIcon className="w-4 h-4 ml-1"/>
                </button>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-bg-secondary"><ChevronRightIcon className="w-6 h-6"/></button>
            </div>
        </div>
      </header>
      
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[...Array(3)].map((_,i) => (
            <div key={i}>
              <div className="h-8 w-1/3 bg-bg-secondary rounded mb-2"></div>
              <div className="space-y-2">
                <div className="h-20 bg-bg-secondary/50 rounded-lg"></div>
                <div className="h-20 bg-bg-secondary/50 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedDays.length > 0 ? sortedDays.map(date => (
            <div key={date} id={`day-${date}`} className="bg-card-gradient rounded-lg scroll-mt-header">
              <button 
                onClick={() => toggleDay(date)}
                className="w-full flex justify-between items-center p-3 text-left"
              >
                <h2 className="font-bold text-lg text-text-primary">
                  {formatDate(date, timezone, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <ChevronDownIcon className={`h-6 w-6 text-text-secondary transition-transform ${expandedDays[date] ? 'rotate-180' : ''}`} />
              </button>
              {expandedDays[date] && (
                  <div className="space-y-1 px-3 pb-3">
                    {items[date].map(item => {
                      const reminderId = `rem-${item.media_type}-${item.id}-${item.date}`;
                      const isPast = new Date(`${item.date}T23:59:59`) < new Date();
                      return (
                          <CalendarListItem 
                              key={`${item.id}-${item.date}-${item.episodeInfo}`} 
                              item={item} 
                              onSelect={onSelectShow}
                              isPast={isPast}
                              isReminderSet={reminders.some(r => r.id === reminderId)}
                              onToggleReminder={() => handleToggleReminder(item)}
                          />
                      );
                    })}
                  </div>
              )}
            </div>
          )) : (
            <div className="text-center py-20 bg-bg-secondary/30 rounded-lg">
              <h2 className="text-xl font-bold">No Releases Found</h2>
              <p className="mt-2 text-text-secondary">There are no releases matching your filters for this month.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarScreen;