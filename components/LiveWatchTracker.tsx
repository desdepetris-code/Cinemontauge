import React, { useState, useEffect, useRef } from 'react';
import { LiveWatchMediaInfo, TrackedItem, TmdbMedia } from '../types';
import LiveWatchControls from './LiveWatchControls';
import { PlayIcon, PauseIcon, XMarkIcon, PlusIcon, CheckCircleIcon, TrashIcon, InformationCircleIcon, ChevronDownIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import { formatTime } from '../utils/formatUtils';

interface DraggableState {
  isDragging: boolean;
  offset: { x: number; y: number };
}

interface LiveWatchTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  mediaInfo: LiveWatchMediaInfo | null;
  elapsedSeconds: number;
  isPaused: boolean;
  onTogglePause: () => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onMarkWatched: (mediaInfo: LiveWatchMediaInfo) => void;
  onAddToList: (mediaInfo: LiveWatchMediaInfo | TrackedItem) => void;
}

const LiveWatchTracker: React.FC<LiveWatchTrackerProps> = (props) => {
  const { isOpen, onClose, onDiscard, mediaInfo, elapsedSeconds, isPaused, onTogglePause, isMinimized, onToggleMinimize, onMarkWatched, onAddToList } = props;

  // Initialize position more safely for mobile
  const [position, setPosition] = useState({ 
    x: window.innerWidth > 500 ? window.innerWidth - 420 : 16, 
    y: window.innerHeight - 340 
  });
  const [showInfo, setShowInfo] = useState(false);
  
  const draggableRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DraggableState>({ isDragging: false, offset: { x: 0, y: 0 } });

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return; // Disable drag on small mobile to avoid frustration
    dragState.current = {
      isDragging: true,
      offset: {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      },
    };
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragState.current.isDragging) {
      const newPos = {
        x: e.clientX - dragState.current.offset.x,
        y: e.clientY - dragState.current.offset.y,
      };
      setPosition(newPos);
    }
  };

  const handleMouseUp = () => {
    dragState.current.isDragging = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (!isOpen || !mediaInfo) return null;

  const runtimeInSeconds = mediaInfo.runtime * 60;
  const progress = runtimeInSeconds > 0 ? Math.min((elapsedSeconds / runtimeInSeconds) * 100, 100) : 0;

  return (
    <div
      ref={draggableRef}
      className={`fixed z-[400] transition-all duration-500 ease-out ${
          isMinimized 
            ? 'w-[calc(100vw-2rem)] sm:w-72 h-24 bg-card-gradient rounded-2xl shadow-2xl p-3 border border-white/10 backdrop-blur-xl' 
            : 'w-[calc(100vw-2rem)] sm:w-[400px] bg-bg-primary rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] border border-white/10 overflow-hidden max-h-[85vh]'
      }`}
      style={{ 
        left: window.innerWidth > 768 ? position.x : '1rem', 
        top: window.innerWidth > 768 ? position.y : 'auto',
        bottom: window.innerWidth > 768 ? 'auto' : '6rem',
        cursor: dragState.current.isDragging ? 'grabbing' : 'auto' 
      }}
    >
        {/* INFO MODAL OVERLAY */}
        {showInfo && !isMinimized && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md p-8 animate-fade-in flex flex-col justify-center text-center">
                <button onClick={() => setShowInfo(false)} className="absolute top-6 right-6 p-2 text-text-secondary hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-6">Live Watch Logic</h3>
                <div className="space-y-6 text-left">
                    <div className="flex gap-4">
                        <ChevronDownIcon className="w-5 h-5 text-primary-accent flex-shrink-0" />
                        <p className="text-xs text-text-secondary font-medium"><strong className="text-white uppercase block mb-1">Minimize</strong> Closes the view and moves the player to a floating hub. Session stays active.</p>
                    </div>
                    <div className="flex gap-4">
                        <XMarkIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <p className="text-xs text-text-secondary font-medium"><strong className="text-white uppercase block mb-1">Close (X)</strong> Removes the player from screen but DOES NOT terminate the session. Access it via the dashboard.</p>
                    </div>
                    <div className="flex gap-4">
                        <TrashIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-xs text-text-secondary font-medium"><strong className="text-white uppercase block mb-1">Delete</strong> Permanently purges this specific watch session and all data associated with it.</p>
                    </div>
                </div>
                <button onClick={() => setShowInfo(false)} className="mt-10 py-3 rounded-full bg-accent-gradient text-on-accent font-black uppercase text-[10px] tracking-widest">Return to Player</button>
            </div>
        )}

        {/* DRAG HANDLE */}
        <div 
            onMouseDown={handleDragStart}
            className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing border-b border-white/5 bg-white/5"
        >
            <div className="w-10 h-1 bg-white/20 rounded-full"></div>
        </div>

        {isMinimized ? (
            <div className="flex items-center gap-4 h-full" onClick={() => onToggleMinimize()}>
                <img src={getImageUrl(mediaInfo.poster_path, 'w92')} className="w-10 h-14 rounded-lg object-cover shadow-lg" alt="" />
                <div className="flex-grow min-w-0">
                    <p className="text-xs font-black text-text-primary uppercase tracking-tight truncate">{mediaInfo.title}</p>
                    <p className="text-[10px] font-bold text-primary-accent uppercase tracking-widest mt-1">{formatTime(elapsedSeconds)}</p>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-accent-gradient" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onTogglePause(); }} className="p-1.5 hover:bg-white/10 rounded-lg">
                        {isPaused ? <PlayIcon className="w-4 h-4 text-white" /> : <PauseIcon className="w-4 h-4 text-white" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMarkWatched(mediaInfo); }} className="p-1.5 hover:bg-white/10 rounded-lg text-green-400">
                        <CheckCircleIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        ) : (
            <div className="p-6 sm:p-8 flex flex-col h-full overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <button onClick={() => setShowInfo(true)} className="p-2 bg-bg-secondary/40 rounded-xl text-text-secondary hover:text-white transition-all border border-white/5 shadow-inner">
                        <InformationCircleIcon className="w-6 h-6" />
                    </button>
                    <div className="flex gap-2">
                        <button onClick={onToggleMinimize} className="p-2 bg-bg-secondary/40 rounded-xl text-text-secondary hover:text-primary-accent transition-all border border-white/5 shadow-inner">
                            <ChevronDownIcon className="w-6 h-6" />
                        </button>
                        <button onClick={onClose} className="p-2 bg-bg-secondary/40 rounded-xl text-text-secondary hover:text-amber-400 transition-all border border-white/5 shadow-inner">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center text-center mb-8">
                    <div className="relative group mb-6 flex-shrink-0">
                        <img src={getImageUrl(mediaInfo.poster_path, 'w185')} alt="" className="w-32 h-48 rounded-2xl shadow-2xl border border-white/10 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black text-text-primary uppercase tracking-tighter truncate w-full">{mediaInfo.title}</h4>
                    {mediaInfo.media_type === 'tv' && (
                        <p className="text-[10px] font-black text-primary-accent uppercase tracking-[0.3em] mt-1">S{mediaInfo.seasonNumber} E{mediaInfo.episodeNumber}</p>
                    )}
                </div>

                <div className="space-y-3 mb-10">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary/60">
                        <span>{formatTime(elapsedSeconds)}</span>
                        <span>{formatTime(runtimeInSeconds)}</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                        <div 
                            className="h-full bg-accent-gradient transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                        {/* Mobile bottom-right percentage */}
                        <div className="absolute right-0 -bottom-5 text-[8px] font-black text-primary-accent uppercase">{Math.round(progress)}%</div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4 mt-auto">
                    <button 
                        onClick={onDiscard}
                        className="p-4 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-600 hover:text-white transition-all border border-red-500/20 shadow-lg flex-shrink-0"
                        title="Delete Session"
                    >
                        <TrashIcon className="w-6 h-6" />
                    </button>

                    <button 
                        onClick={onTogglePause}
                        className={`flex-grow py-5 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${
                            isPaused ? 'bg-accent-gradient text-on-accent' : 'bg-white text-black'
                        }`}
                    >
                        {isPaused ? (
                            <><PlayIcon className="w-5 h-5 sm:w-6 sm:h-6" /> Resume</>
                        ) : (
                            <><PauseIcon className="w-5 h-5 sm:w-6 sm:h-6" /> Pause</>
                        )}
                    </button>

                    <button 
                        onClick={() => onMarkWatched(mediaInfo)}
                        className="p-4 rounded-2xl bg-green-500/10 text-green-500 hover:bg-green-600 hover:text-white transition-all border border-green-500/20 shadow-lg flex-shrink-0"
                        title="Finish Early & Log"
                    >
                        <CheckCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <p className="text-[8px] font-black text-text-secondary/20 uppercase tracking-[0.4em] text-center mt-8">Secure Live Relay Active</p>
            </div>
        )}
    </div>
  );
};

export default LiveWatchTracker;