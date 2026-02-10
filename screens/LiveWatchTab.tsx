import React, { useMemo } from 'react';
import { LiveWatchMediaInfo } from '../types';
import { PlayCircleIcon, SparklesIcon } from '../components/Icons';
import LiveWatchControls from '../components/LiveWatchControls';
import { confirmationService } from '../services/confirmationService';

// FIX: Defined DisplaySession interface to provide proper typing for sessions.
interface DisplaySession {
    mediaInfo: LiveWatchMediaInfo;
    elapsedSeconds: number;
    isPaused: boolean;
    pausedAt: string;
}

interface LiveWatchTabProps {
    liveWatchMedia: LiveWatchMediaInfo | null;
    liveWatchElapsedSeconds: number;
    liveWatchIsPaused: boolean;
    onLiveWatchTogglePause: () => void;
    onLiveWatchStop: () => void;
    onMarkShowAsWatched: (mediaInfo: LiveWatchMediaInfo) => void;
    pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
    setPausedLiveSessions: React.Dispatch<React.SetStateAction<Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>>>;
    onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
}

const LiveWatchTab: React.FC<LiveWatchTabProps> = ({ 
    liveWatchMedia, liveWatchElapsedSeconds, liveWatchIsPaused, 
    onLiveWatchTogglePause, onLiveWatchStop, onMarkShowAsWatched, 
    pausedLiveSessions, setPausedLiveSessions, onStartLiveWatch 
}) => {
    
    // FIX: Added explicit return type DisplaySession[] to useMemo.
    const allSessions = useMemo((): DisplaySession[] => {
        const result: DisplaySession[] = [];
        
        // Active one first
        if (liveWatchMedia) {
            result.push({ 
                mediaInfo: liveWatchMedia, 
                elapsedSeconds: liveWatchElapsedSeconds, 
                isPaused: liveWatchIsPaused,
                pausedAt: new Date().toISOString()
            });
        }
        
        // Then paused ones
        // FIX: Explicitly cast Object.values(pausedLiveSessions) to resolve 'unknown' type errors for mediaInfo, elapsedSeconds, and pausedAt properties.
        (Object.values(pausedLiveSessions) as Array<{ mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>).forEach(session => {
            // Avoid duplication if the active one is technically in paused sessions state
            if (!liveWatchMedia || session.mediaInfo.id !== liveWatchMedia.id) {
                result.push({ 
                    mediaInfo: session.mediaInfo, 
                    elapsedSeconds: session.elapsedSeconds, 
                    isPaused: true,
                    pausedAt: session.pausedAt
                });
            }
        });
        
        // Sort by most recently active
        return result.sort((a, b) => new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime());
    }, [liveWatchMedia, liveWatchElapsedSeconds, liveWatchIsPaused, pausedLiveSessions]);

    const handleDiscardSession = (id: number) => {
        if (window.confirm("Permanently discard this live session? All current progress will be lost.")) {
            setPausedLiveSessions(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
            if (liveWatchMedia?.id === id) {
                onLiveWatchStop();
            }
            confirmationService.show("Live session purged from registry.");
        }
    };

    return (
        <div className="animate-fade-in space-y-12 pb-20">
            <header>
                <div className="flex items-center gap-4 mb-4">
                    <PlayCircleIcon className="w-10 h-10 text-primary-accent" />
                    <div>
                        <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter">Live Sessions</h1>
                        <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-1 opacity-60">Manage all active and paused watch streams</p>
                    </div>
                </div>
            </header>

            {allSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allSessions.map((session: DisplaySession) => (
                        // FIX: Replaced explicit type cast (session as any) with proper DisplaySession typing.
                        <div key={session.mediaInfo.id} className="relative animate-slide-in-up">
                            <LiveWatchControls 
                                mediaInfo={session.mediaInfo} 
                                elapsedSeconds={session.elapsedSeconds} 
                                isPaused={session.isPaused} 
                                onTogglePause={() => {
                                    if (liveWatchMedia && session.mediaInfo.id === liveWatchMedia.id) onLiveWatchTogglePause();
                                    else onStartLiveWatch(session.mediaInfo);
                                }} 
                                onStop={onLiveWatchStop} 
                                onDiscard={() => handleDiscardSession(session.mediaInfo.id)}
                                onMarkWatched={() => onMarkShowAsWatched(session.mediaInfo)}
                                isDashboardWidget={true} 
                            />
                            <div className="mt-3 px-2 flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-40">
                                <span>Registry ID: {session.mediaInfo.id}</span>
                                <span>Active: {new Date(session.pausedAt).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-40 text-center bg-bg-secondary/10 rounded-[3rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center">
                    <SparklesIcon className="w-20 h-20 text-text-secondary/20 mb-8" />
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest">No Active Streams</h2>
                    <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto uppercase tracking-widest font-bold italic opacity-60 leading-relaxed">
                        Your live sessions will appear here for management. Start a Live Watch from any title detail page.
                    </p>
                </div>
            )}
        </div>
    );
};

export default LiveWatchTab;