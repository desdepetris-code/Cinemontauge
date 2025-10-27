import React from 'react';
import { TmdbMedia } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PlusIcon } from './Icons';

interface SuggestionCardProps {
  item: TmdbMedia;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
  onAddClick: (item: TmdbMedia) => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ item, onSelect, onAddClick }) => {
    const posterSrc = getImageUrl(item.poster_path, 'w342');
    const title = item.title || item.name;

    const handleAdd = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click when clicking the button
        onAddClick(item);
    };

    return (
        <div
            onClick={() => onSelect(item.id, item.media_type)}
            className="cursor-pointer group relative transform hover:-translate-y-1 transition-transform duration-300"
        >
            <img
                src={posterSrc}
                alt={title}
                className="w-full aspect-[2/3] object-cover bg-bg-secondary rounded-lg shadow-lg group-hover:brightness-75 transition-all"
                loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <button 
                    onClick={handleAdd}
                    className="p-3 bg-backdrop rounded-full text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                    aria-label={`Add ${title} to a list`}
                >
                    <PlusIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default SuggestionCard;