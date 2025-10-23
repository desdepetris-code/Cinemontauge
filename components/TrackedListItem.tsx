import React from 'react';
import { TrackedItem } from '../types';
import { getImageUrl } from '../utils/imageUtils';

interface TrackedListItemProps {
  item: TrackedItem;
  onSelect: (id: number, mediaType: 'tv' | 'movie') => void;
}

const TrackedListItem: React.FC<TrackedListItemProps> = ({ item, onSelect }) => {
  const imageUrl = getImageUrl(item.poster_path, 'w92');

  return (
    <div
      onClick={() => onSelect(item.id, item.media_type)}
      className="flex items-center p-3 bg-bg-secondary/50 rounded-lg cursor-pointer hover:bg-bg-secondary transition-colors"
    >
      <img src={imageUrl} alt={item.title} className="w-12 h-auto rounded-md flex-shrink-0" />
      <div className="ml-4 flex-grow min-w-0">
        <p className="font-semibold text-text-primary truncate">{item.title}</p>
        <p className="text-sm text-text-secondary capitalize">{item.media_type.replace('_', ' ')}</p>
      </div>
    </div>
  );
};

export default TrackedListItem;
