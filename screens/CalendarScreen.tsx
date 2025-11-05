import React, { useState, useEffect } from 'react';
import { CalendarItem, TmdbMedia, Reminder, ReminderType } from '../types';
import { getUpcomingTvPremieres } from '../services/tmdbService';
import CalendarListItem from '../components/CalendarListItem';

interface CalendarScreenProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ onSelectShow, timezone, reminders, onToggleReminder }) => {
    const [premieres, setPremieres] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPremieres = async () => {
            setLoading(true);
            try {
                // Fetch a few pages to get a decent list
                const [page1, page2] = await Promise.all([
                    getUpcomingTvPremieres(1),
                    getUpcomingTvPremieres(2),
                ]);
                const allResults = [...page1.results, ...page2.results];
                const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
                setPremieres(uniqueResults);
            } catch (error) {
                console.error("Failed to fetch premieres", error);
            }
            setLoading(false);
        };
        fetchPremieres();
    }, []);

    const calendarItems: CalendarItem[] = premieres.map(item => ({
        id: item.id,
        media_type: item.media_type,
        poster_path: item.poster_path,
        title: item.name || '',
        date: item.first_air_date || '',
        episodeInfo: 'Series Premiere'
    }));
    
    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
            <h1 className="text-3xl font-bold text-text-primary my-4">Upcoming TV Premieres</h1>
            {loading ? (
                <div className="text-center p-8">Loading premieres...</div>
            ) : (
                <div className="space-y-4">
                    {calendarItems.map(item => {
                        const reminderId = `rem-${item.media_type}-${item.id}-${item.date}`;
                        const isReminderSet = reminders.some(r => r.id === reminderId);
                        return (
                            <CalendarListItem 
                                key={item.id} 
                                item={item} 
                                onSelect={onSelectShow}
                                isPast={false}
                                isReminderSet={isReminderSet}
                                onToggleReminder={(type) => {
                                    const newReminder: Reminder | null = type ? {
                                        id: reminderId, mediaId: item.id, mediaType: item.media_type,
                                        releaseDate: item.date, title: item.title, poster_path: item.poster_path,
                                        episodeInfo: item.episodeInfo, reminderType: type,
                                    } : null;
                                    onToggleReminder(newReminder, reminderId);
                                }}
                                isWatched={false}
                                onToggleWatched={() => {}}
                                timezone={timezone} 
                            />
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default CalendarScreen;
