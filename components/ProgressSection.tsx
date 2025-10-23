import React from 'react';
// FIX: Removed ManualMediaDetails as it is not defined in types.ts and part of a removed feature.
import { TrackedItem, WatchProgress } from '../types';
import ProgressItem from './ProgressItem';

interface ProgressSectionProps {
  items: TrackedItem[];
  watchProgress: WatchProgress;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
  // FIX: Removed manualEntries as it relies on the non-existent ManualMediaDetails type.
  // manualEntries: Record<number, ManualMediaDetails>;
}

// FIX: Removed manualEntries from props, as it's part of a removed feature.
const ProgressSection: React.FC<ProgressSectionProps> = ({ items, watchProgress, onSelect }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-primary mb-2 px-6">Progress</h2>
      <div className="flex overflow-x-auto py-2 -mx-2 px-6">
        {items.map(item => (
          <ProgressItem
            key={item.id}
            item={item}
            watchProgress={watchProgress}
            onSelect={onSelect}
          />
        ))}
        <div className="flex-shrink-0 w-2"></div>
      </div>
    </div>
  );
};

export default ProgressSection;