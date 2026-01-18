import React from 'react';
import { WatchStatus } from '../types';
import { XMarkIcon, CheckCircleIcon } from './Icons';

interface WatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateList: (newListId: string | null) => void;
  currentList: WatchStatus | null;
  customLists: any[]; // Kept for prop compatibility but unused in UI
  mediaType: 'tv' | 'movie' | 'person';
}

const WatchlistModal: React.FC<WatchlistModalProps> = ({ isOpen, onClose, onUpdateList, currentList, mediaType }) => {
  if (!isOpen) return null;

  const lists: { id: WatchStatus, name: string }[] = [
    { id: 'watching', name: 'Watching' },
    { id: 'planToWatch', name: 'Plan to Watch' },
    ...(mediaType === 'tv' ? [{ id: 'allCaughtUp' as WatchStatus, name: 'All Caught Up' }] : []),
    { id: 'onHold', name: 'On Hold' },
    { id: 'completed', name: 'Completed' },
    { id: 'dropped', name: 'Dropped' },
  ];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[110] p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-sm p-8 animate-fade-in relative border border-white/10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-1">Add to Library</h2>
          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Update your tracking status</p>
        </div>

        <div className="space-y-2">
          {lists.map(list => {
            const isActive = currentList === list.id;
            return (
              <button
                key={list.id}
                onClick={() => { onUpdateList(list.id); onClose(); }}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                  isActive 
                    ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg font-black' 
                    : 'bg-bg-secondary/40 border-white/5 text-text-primary hover:bg-bg-secondary hover:border-white/10'
                }`}
              >
                <span className="uppercase tracking-widest text-xs">{list.name}</span>
                {isActive && <CheckCircleIcon className="w-5 h-5" />}
              </button>
            );
          })}
          
          {currentList && (
             <button
              onClick={() => { onUpdateList(null); onClose(); }}
              className="w-full text-center py-3 rounded-2xl transition-all text-red-500 hover:bg-red-500/10 mt-4 text-[10px] font-black uppercase tracking-[0.2em]"
            >
              Remove from Library
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistModal;