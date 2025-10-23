
import React from 'react';
import { TmdbMedia } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PlusIcon } from './Icons';

interface MediaCardProps {
  item: TmdbMedia;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
  // FIX: Added optional `onAdd` prop to allow adding functionality to the card.
  onAdd?: (item: TmdbMedia) => void;
}

const MediaCard: React.FC<MediaCardProps> = ({ item, onSelect, onAdd }) => {
  const imageUrl = getImageUrl(item.poster_path);

  const title = item.title || item.name;
  const year = (item.release_date || item.first_air_date)?.substring(0, 4);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when adding.
    if (onAdd) {
      onAdd(item);
    }
  };

  return (
    <div 
      className="relative group cursor-pointer"
      onClick={() => onSelect(item.id, item.media_type)}
    >
      <div className="rounded-lg overflow-hidden shadow-lg">
        <img src={imageUrl} alt={title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-3">
          <h3 className="text-white text-sm font-bold">{title}</h3>
          {year && <p className="text-slate-300 text-xs">{year}</p>}
        </div>
        {/* FIX: Render an add button only if `onAdd` prop is provided. */}
        {onAdd && (
          <button
            onClick={handleAddClick}
            className="absolute top-2 right-2 p-1.5 bg-backdrop rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-primary-accent transition-all"
            aria-label={`Add ${title} to a list`}
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default MediaCard;
