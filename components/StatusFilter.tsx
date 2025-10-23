import React from 'react';
import { WatchStatus } from '../types';

interface StatusFilterProps {
  selectedStatus: WatchStatus | null;
  onSelectStatus: (status: WatchStatus | null) => void;
}

const StatusFilter: React.FC<StatusFilterProps> = ({ selectedStatus, onSelectStatus }) => {
  const statuses: { id: WatchStatus | null, name: string }[] = [
    { id: null, name: 'All' },
    { id: 'watching', name: 'Watching' },
    { id: 'planToWatch', name: 'Plan to Watch' },
    { id: 'completed', name: 'Completed' },
  ];

  return (
    <div className="mb-6 px-6">
      <h3 className="text-lg font-semibold text-text-secondary mb-3">Filter by Status</h3>
      <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2">
        {statuses.map(status => (
          <button
            key={status.name}
            onClick={() => onSelectStatus(status.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
              selectedStatus === status.id
                ? 'bg-accent-gradient text-white'
                : 'bg-bg-secondary text-text-secondary hover:brightness-125'
            }`}
          >
            {status.name}
          </button>
        ))}
        <div className="w-2 flex-shrink-0"></div>
      </div>
    </div>
  );
};

export default StatusFilter;