import React from 'react';
import { CalendarItem, Reminder } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { TvIcon, FilmIcon, BellIcon } from './Icons';

interface CalendarListItemProps {
  item: CalendarItem;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
  isReminderSet: boolean;
  onToggleReminder: () => void;
  isPast: boolean;
}

const CalendarListItem: React.FC<CalendarListItemProps> = ({ item, onSelect, isReminderSet, onToggleReminder, isPast }) => {
  const posterUrl = getImageUrl(item.poster_path, 'w154');
  const mediaTypeColor = item.media_type === 'tv' ? 'bg-red-500' : 'bg-blue-500';

  return (
    <div className="flex items-center space-x-4 p-2 rounded-lg hover:bg-bg-secondary/50 transition-colors group">
      <img
        src={posterUrl}
        alt={item.title}
        className="w-12 h-18 object-cover rounded-md flex-shrink-0 cursor-pointer"
        onClick={() => onSelect(item.id, item.media_type)}
      />
      <div
        className="flex-grow min-w-0 cursor-pointer"
        onClick={() => onSelect(item.id, item.media_type)}
      >
        <p className="font-semibold text-text-primary truncate group-hover:text-primary-accent">{item.title}</p>
        <p className="text-sm text-text-secondary truncate">{item.episodeInfo}</p>
      </div>
      <div className="flex items-center space-x-2">
          {!isPast && (
              <button
                  onClick={onToggleReminder}
                  className={`p-2 rounded-full transition-colors ${isReminderSet ? 'text-primary-accent bg-primary-accent/10' : 'text-text-secondary hover:bg-bg-secondary'}`}
                  aria-label={isReminderSet ? "Remove reminder" : "Add reminder"}
              >
                  <BellIcon filled={isReminderSet} className="w-5 h-5"/>
              </button>
          )}
          <div className={`p-2 rounded-full ${mediaTypeColor}`}>
              {item.media_type === 'tv' ? <TvIcon className="w-5 h-5 text-white" /> : <FilmIcon className="w-5 h-5 text-white" />}
          </div>
      </div>
    </div>
  );
};

export default CalendarListItem;