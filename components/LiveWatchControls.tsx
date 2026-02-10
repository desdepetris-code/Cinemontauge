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
    <div className="bg-card-gradient rounded-lg shadow-xl w-full p-6 relative h-full flex flex-col justify-between border border-white/5">
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
                    <StopIcon className="w-4 h-4" />
                </button>
            </div>
        )}

        {isDashboardWidget && (
            <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter">Live Session</h2>
                {onDiscard && (
                    <button 
                        onClick={onDiscard} 
                        className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        title="Discard Session"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        )}
        
        <div className="text-center mb-4">
            {!isDashboardWidget && <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60 mb-1">Now Streaming</p>}
            <h3 className="text-lg font-black text-text-primary uppercase tracking-tight truncate">{mediaInfo.title}</h3>
            {mediaInfo.media_type === 'tv' && (
                <p className="text-[10px] font-bold text-primary-accent uppercase tracking-[0.2em] mt-1">
                    S{mediaInfo.seasonNumber} E{mediaInfo.episodeNumber} &bull; {mediaInfo.episodeTitle}
                </p>
            )}
        </div>
        
        <div className="mb-6">
            <div className="flex justify-between text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">
                <span>{formatTime(elapsedSeconds)}</span>
                <span>{formatTime(runtimeInSeconds)}</span>
            </div>
             <div className="w-full bg-bg-secondary rounded-full h-2 relative border border-white/5 shadow-inner">
                <div className="bg-accent-gradient h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                {/* Repositioned to bottom right */}
                <div className="absolute right-0 -bottom-5 text-[9px] font-black text-primary-accent uppercase tracking-widest">{Math.round(progress)}%</div>
            </div>
        </div>

        <div className="flex justify-center items-center space-x-4">
            {onDiscard && (
                <button onClick={onDiscard} className="p-3 bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-all shadow-md border border-red-500/10" title="Discard Session">
                    <TrashIcon className="w-6 h-6" />
                </button>
            )}
            
            <button onClick={onStop} className="p-3 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500/20 transition-all shadow-md border border-amber-500/10" title="Stop & Save">
                <StopIcon className="w-6 h-6"/>
            </button>
            
            <button onClick={onTogglePause} className="p-5 bg-accent-gradient text-on-accent rounded-full transition-all active:scale-90 shadow-2xl hover:scale-105">
                {isPaused ? <PlayIcon className="w-8 h-8"/> : <PauseIcon className="w-8 h-8"/>}
            </button>
            
            {onMarkWatched && 
                <button onClick={onMarkWatched} className="p-3 bg-green-500/10 text-green-500 rounded-full hover:bg-green-500/20 transition-all shadow-md border border-green-500/10" title="Mark as Watched">
                    <CheckCircleIcon className="w-6 h-6"/>
                </button>
            }
            
            {onAddToList &&
                 <button onClick={onAddToList} className="p-3 bg-bg-secondary text-text-primary rounded-full hover:brightness-125 transition-all border border-white/5 shadow-md" title="Add to List">
                    <PlusIcon className="w-6 h-6"/>
                </button>
            }
        </div>
    </div>
  );
};

export default LiveWatchControls;