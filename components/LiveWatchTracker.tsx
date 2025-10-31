import React, { useState, useEffect, useRef } from 'react';
import { LiveWatchMediaInfo, TrackedItem, TmdbMedia } from '../types';
import LiveWatchControls from './LiveWatchControls';
import { PlayIcon, PauseIcon, XMarkIcon, PlusIcon, CheckCircleIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import { formatTime } from '../utils/formatUtils';

interface DraggableState {
  isDragging: boolean;
  offset: { x: number; y: number };
}

interface ResizableState {
    isResizing: boolean;
    initialPos: { x: number; y: number };
    initialSize: { width: number; height: number };
}

interface LiveWatchTrackerProps {
  isOpen: boolean;
  onClose: () => void;
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
  const { isOpen, onClose, mediaInfo, elapsedSeconds, isPaused, onTogglePause, isMinimized, onToggleMinimize, onMarkWatched, onAddToList } = props;

  const [position, setPosition] = useState({ x: window.innerWidth - 450 - 20, y: 100 });
  const [size, setSize] = useState({ width: 450, height: 320 });
  const [minimizedPosition, setMinimizedPosition] = useState({ x: window.innerWidth - 300 - 20, y: window.innerHeight - 100 - 20 });
  
  const draggableRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<DraggableState>({ isDragging: false, offset: { x: 0, y: 0 } });
  const resizeState = useRef<ResizableState | null>(null);


  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggableRef.current) return;
    const isMinimizedTarget = e.currentTarget.id === 'minimized-handle';
    const currentPos = isMinimizedTarget ? minimizedPosition : position;
    dragState.current = {
      isDragging: true,
      offset: {
        x: e.clientX - currentPos.x,
        y: e.clientY - currentPos.y,
      },
    };
    document.body.style.userSelect = 'none';
  };

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    resizeState.current = {
        isResizing: true,
        initialPos: { x: e.clientX, y: e.clientY },
        initialSize: { width: size.width, height: size.height },
    };
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (dragState.current.isDragging && draggableRef.current) {
      const isMinimizedTarget = draggableRef.current.id.includes('minimized');
      const newPos = {
        x: e.clientX - dragState.current.offset.x,
        y: e.clientY - dragState.current.offset.y,
      };
      
      const boundaryX = window.innerWidth - (isMinimizedTarget ? 288 : size.width);
      const boundaryY = window.innerHeight - (isMinimizedTarget ? 88 : size.height);

      newPos.x = Math.max(0, Math.min(newPos.x, boundaryX));
      newPos.y = Math.max(0, Math.min(newPos.y, boundaryY));

      if (isMinimizedTarget) {
        setMinimizedPosition(newPos);
      } else {
        setPosition(newPos);
      }
    } else if (resizeState.current?.isResizing) {
        const dx = e.clientX - resizeState.current.initialPos.x;
        const dy = e.clientY - resizeState.current.initialPos.y;
        setSize({
            width: Math.max(350, resizeState.current.initialSize.width + dx),
            height: Math.max(250, resizeState.current.initialSize.height + dy),
        });
    }
  };

  const handleMouseUp = () => {
    dragState.current.isDragging = false;
    if(resizeState.current) resizeState.current.isResizing = false;
    document.body.style.userSelect = '';
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOpen || !mediaInfo) return null;

  if (isMinimized) {
    return (
      <div
        ref={draggableRef}
        id="minimized-handle"
        className="fixed z-50 bg-card-gradient rounded-lg shadow-2xl w-72 p-2 transition-transform hover:scale-105 animate-slide-in-up group backdrop-blur-sm"
        style={{ left: minimizedPosition.x, top: minimizedPosition.y, cursor: 'grab' }}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center space-x-3" onClick={onToggleMinimize} style={{ cursor: 'pointer' }}>
          <img src={getImageUrl(mediaInfo.poster_path, 'w92')} alt={mediaInfo.title} className="w-10 h-15 object-cover rounded-md flex-shrink-0" />
          <div className="min-w-0 flex-grow">
            <p className="text-sm font-semibold text-text-primary truncate">{mediaInfo.title}</p>
            <p className="text-xs text-text-secondary">{formatTime(elapsedSeconds)} / {formatTime(mediaInfo.runtime * 60)}</p>
          </div>
          <div className="flex items-center">
            <button onClick={(e) => { e.stopPropagation(); onTogglePause(); }} className="p-2 rounded-full hover:bg-bg-secondary">
              {isPaused ? <PlayIcon className="w-5 h-5"/> : <PauseIcon className="w-5 h-5"/>}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 rounded-full hover:bg-bg-secondary">
              <XMarkIcon className="w-5 h-5"/>
            </button>
          </div>
        </div>
        <div className="absolute -bottom-2.5 left-0 right-0 px-2">
            <div className="flex justify-around items-center h-5 bg-black/30 rounded-full text-xs">
                <button onClick={(e) => {e.stopPropagation(); onMarkWatched(mediaInfo)}} className="p-1 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-green-400" title="Mark as Watched"><CheckCircleIcon className="w-4 h-4"/></button>
                <button onClick={(e) => {e.stopPropagation(); onAddToList(mediaInfo)}} className="p-1 rounded-full hover:bg-bg-secondary text-text-secondary hover:text-blue-400" title="Add to List"><PlusIcon className="w-4 h-4"/></button>
            </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
            <div className="h-full bg-accent-gradient" style={{ width: `${(elapsedSeconds / (mediaInfo.runtime * 60)) * 100}%` }}></div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={draggableRef}
      id="full-window"
      className="fixed z-50 flex flex-col"
      style={{ left: position.x, top: position.y, width: size.width, height: size.height }}
    >
      <div 
        onMouseDown={handleDragStart} 
        className="h-8 bg-bg-secondary rounded-t-lg cursor-grab"
      ></div>
      <div className="flex-grow">
          <LiveWatchControls
              mediaInfo={mediaInfo}
              elapsedSeconds={elapsedSeconds}
              isPaused={isPaused}
              onTogglePause={onTogglePause}
              onStop={onClose}
              isDashboardWidget={false}
              onMinimize={onToggleMinimize}
              onMarkWatched={() => onMarkWatched(mediaInfo)}
              onAddToList={() => onAddToList(mediaInfo)}
          />
      </div>
       <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{ zIndex: 1 }}
      >
        <div className="w-2 h-2 border-r-2 border-b-2 border-text-secondary/50 absolute bottom-1 right-1"></div>
      </div>
    </div>
  );
};

export default LiveWatchTracker;