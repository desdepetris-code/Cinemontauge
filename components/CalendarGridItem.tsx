import React from 'react';
import { CalendarItem } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PLACEHOLDER_POSTER } from '../constants';
import { TvIcon, FilmIcon } from './Icons';

interface CalendarGridItemProps {
    item: CalendarItem;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
}

const CalendarGridItem: React.FC<CalendarGridItemProps> = ({ item, onSelect }) => {
    const posterUrl = getImageUrl(item.poster_path, 'w92');
    const mediaTypeColor = item.media_type === 'tv' ? 'bg-red-500' : 'bg-blue-500';

    return (
        <div
            onClick={() => onSelect(item.id, item.media_type)}
            className="flex items-center space-x-2 p-1.5 rounded-md cursor-pointer hover:bg-bg-secondary/50 transition-colors group relative"
        >
            <div className={`absolute top-1 left-1 w-1.5 h-1.5 rounded-full ${mediaTypeColor}`}></div>
            <div className="flex-grow min-w-0 pl-3">
                <p className="text-xs font-semibold text-text-primary truncate group-hover:text-primary-accent">{item.title}</p>
                <p className="text-[10px] text-text-secondary truncate">{item.episodeInfo}</p>
            </div>
        </div>
    );
};

export default CalendarGridItem;