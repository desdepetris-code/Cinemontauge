
import React from 'react';
import { LiveWatchSession, LiveWatchMediaInfo } from '../types';
import { XMarkIcon, PlayIcon, ArrowPathIcon, ClockIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import { formatTime } from '../utils/formatUtils';

interface LiveWatchChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: LiveWatchSession[];
    mediaInfo: LiveWatchMediaInfo;
    onContinue: (session: LiveWatchSession) => void;
    onStartFresh: () => void;
}

const LiveWatchChoiceModal: React.FC<LiveWatchChoiceModalProps> = ({ 
    isOpen, onClose, sessions, mediaInfo, onContinue, onStartFresh 
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[500] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-white/10 flex flex-col relative overflow-hidden" 
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-text-secondary hover:text-white transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="p-10 text-center flex flex-col items-center">
                    <div className="relative mb-8 flex-shrink-0 group">
                        <img src={getImageUrl(mediaInfo.poster_path, 'w185')} alt="" className="w-32 h-48 rounded-2xl shadow-2xl border border-white/10 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-2xl"></div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none mb-2">Active Sessions Found</h2>
                    <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.2em] mb-8 opacity-60">You have existing watch registries for "{mediaInfo.title}"</p>

                    <div className="w-full space-y-3 mb-10 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                        {sessions.map(session => {
                            const progress = (session.elapsedSeconds / (session.mediaInfo.runtime * 60)) * 100;
                            return (
                                <button 
                                    key={session.sessionId}
                                    onClick={() => onContinue(session)}
                                    className="w-full group p-5 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left flex items-center justify-between shadow-inner"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black text-text-primary uppercase tracking-tight">Resume Session</span>
                                            <span className="text-[8px] font-black text-primary-accent uppercase tracking-widest bg-primary-accent/10 px-2 py-0.5 rounded border border-primary-accent/20">{Math.round(progress)}% Complete</span>
                                        </div>
                                        <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                                            <ClockIcon className="w-3 h-3" />
                                            Active: {new Date(session.pausedAt).toLocaleString()}
                                        </p>
                                    </div>
                                    <PlayIcon className="w-6 h-6 text-primary-accent opacity-20 group-hover:opacity-100 transition-opacity" />
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 gap-3 w-full">
                        <button 
                            onClick={onStartFresh}
                            className="w-full py-5 rounded-[1.5rem] bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            <ArrowPathIcon className="w-5 h-5" />
                            Start New Fresh Session
                        </button>
                        <button 
                            onClick={onClose}
                            className="w-full py-3 text-[10px] font-black text-text-secondary uppercase tracking-widest hover:text-text-primary transition-colors"
                        >
                            Nevermind
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveWatchChoiceModal;
