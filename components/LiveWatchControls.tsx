import React from 'react';
import { LiveWatchMediaInfo } from '../types';
import { PlayIcon, PauseIcon, StopIcon, ChevronDownIcon, XMarkIcon, CheckCircleIcon, PlusIcon, TrashIcon } from './Icons';
import { formatTime } from '../utils/formatUtils';

interface LiveWatchControlsProps {
  mediaInfo: LiveWatchMediaInfo;
  elapsedSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
  onDiscard?: () => void;
  isDashboardWidget?: boolean; 
  onMinimize?: () => void;
  onMarkWatched?: () => void;
  onAddToList?: () => void;
}

const LiveWatchControls: React.FC<LiveWatchControlsProps> = (props) => {
  const { mediaInfo, elapsedSeconds, isPaused, onTogglePause, onStop, onDiscard, isDashboardWidget, onMinimize, onMarkWatched, onAddToList } = props;
  const runtimeInSeconds = mediaInfo.runtime * 60;
  const progress = runtimeInSeconds > 0 ? Math.min((elapsedSeconds / runtimeInSeconds) * 100, 100) : 0;

  return (
    <div className="bg-card-gradient rounded-lg shadow-xl w-full p-6 relative h-full flex flex-col justify-between">
        {!isDashboardWidget && (
            <div className="absolute top-3 right-3 flex space-x-2">
                {onMinimize && (
                    <button 
                        onClick={onMinimize}
                        className="p-2 bg-backdrop/50 rounded-full text-text-primary hover:bg-bg-secondary transition-colors"
                        aria-label="Minimize player"
                        title="Minimize"
                    >
                        <ChevronDownIcon className="w-5 h-5" />
                    </button>
                )}
                 <button 
                    onClick={onStop}
                    className="p-2 bg-backdrop/50 rounded-full text-text-primary hover:bg-bg-secondary transition-colors"
                    aria-label="Stop player and save progress"
                    title="Stop & Save"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>
        )}

        {isDashboardWidget && <h2 className="text-2xl font-bold text-text-primary mb-4">▶️ Live Watch</h2>}
        <div className="text-center">
            {!isDashboardWidget && <p className="text-sm text-text-secondary">Now Watching</p>}
            <h3 className="text-lg font-bold text-text-primary truncate">{mediaInfo.title}</h3>
            {mediaInfo.media_type === 'tv' && (
                <p className="text-sm text-text-secondary truncate">
                    S{mediaInfo.seasonNumber} E{mediaInfo.episodeNumber}: {mediaInfo.episodeTitle}
                </p>
            )}
        </div>
        
        <div className="my-4">
            <div className="flex justify-between text-sm text-text-secondary">
                <span>{formatTime(elapsedSeconds)}</span>
                <span>{formatTime(runtimeInSeconds)}</span>
            </div>
             <div className="w-full bg-bg-secondary rounded-full h-2 mt-1 relative">
                <div className="bg-accent-gradient h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                <div className="absolute -right-1 -top-4 text-xs font-bold text-text-primary bg-bg-secondary px-1.5 py-0.5 rounded-md">{Math.round(progress)}%</div>
            </div>
        </div>

        <div className="flex justify-center items-center space-x-4">
            {onDiscard && (
                <button onClick={onDiscard} className="p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-all" title="Discard Session">
                    <TrashIcon className="w-6 h-6" />
                </button>
            )}
            {onMarkWatched && 
                <button onClick={onMarkWatched} className="p-3 bg-bg-secondary text-text-primary rounded-full hover:brightness-125 transition-all" title="Mark as Watched">
                    <CheckCircleIcon className="w-6 h-6"/>
                </button>
            }
             <button onClick={onTogglePause} className="p-5 bg-accent-gradient text-white rounded-full transition-transform active:scale-95 shadow-lg">
                {isPaused ? <PlayIcon className="w-8 h-8"/> : <PauseIcon className="w-8 h-8"/>}
            </button>
            {onAddToList &&
                 <button onClick={onAddToList} className="p-3 bg-bg-secondary text-text-primary rounded-full hover:brightness-125 transition-all" title="Add to List">
                    <PlusIcon className="w-6 h-6"/>
                </button>
            }
        </div>
    </div>
  );
};

export default LiveWatchControls;