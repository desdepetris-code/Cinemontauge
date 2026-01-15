
import React, { useState } from 'react';
import { XMarkIcon, InformationCircleIcon } from './Icons';

interface PriorEpisodesModalProps {
    isOpen: boolean;
    onClose: () => void;
    showTitle: string;
    season: number;
    episode: number;
    hasFuture: boolean;
    onSelectAction: (action: number) => void;
    onDisablePopup: () => void;
}

const PriorEpisodesModal: React.FC<PriorEpisodesModalProps> = ({ isOpen, onClose, showTitle, season, episode, hasFuture, onSelectAction, onDisablePopup }) => {
    const [showInfo, setShowInfo] = useState(false);

    if (!isOpen) return null;

    const ActionButton: React.FC<{ action: number; label: string; description: string }> = ({ action, label, description }) => (
        <button 
            onClick={() => onSelectAction(action)}
            className="w-full text-left p-4 rounded-xl bg-bg-secondary hover:bg-bg-secondary/70 transition-all border border-primary-accent/10 hover:border-primary-accent/30 group"
        >
            <div className="flex items-center justify-between">
                <span className="font-bold text-text-primary group-hover:text-primary-accent transition-colors">{label}</span>
                <span className="text-xs text-text-secondary/50 font-black">OPTION {action}</span>
            </div>
            {showInfo && <p className="text-xs text-text-secondary mt-2 leading-relaxed animate-fade-in">{description}</p>}
        </button>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in border border-white/5" onClick={e => e.stopPropagation()}>
                <header className="p-6 bg-card-gradient border-b border-white/10 flex justify-between items-start">
                    <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Watch Logic</h2>
                            <button onClick={() => setShowInfo(!showInfo)} className={`p-1 rounded-full transition-colors ${showInfo ? 'bg-primary-accent text-on-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                                <InformationCircleIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-text-secondary">There are prior episodes not marked as watched for <strong className="text-text-primary">{showTitle}</strong>.</p>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-text-secondary"><XMarkIcon className="w-6 h-6" /></button>
                </header>

                <div className="p-6 space-y-3">
                    <ActionButton 
                        action={1} 
                        label="Mark all prior episodes as watched" 
                        description="This will automatically mark every episode before S{season} E{episode} as 'Watched' in your library, skipping any you've already marked."
                    />
                    <ActionButton 
                        action={2} 
                        label={`Unmark current episode (S${season} E${episode})`} 
                        description="Cancels the watch action for this episode. Nothing else will be changed."
                    />
                    <ActionButton 
                        action={3} 
                        label="Continue as is" 
                        description="Marks only this episode as watched. Prior episodes will remain unmarked."
                    />
                    {hasFuture && (
                        <ActionButton 
                            action={4} 
                            label="Unmark this episode and all future marked episodes" 
                            description="This will clear the 'Watched' status for this episode AND any episodes scheduled after it that you previously marked."
                        />
                    )}
                </div>

                <footer className="p-4 bg-bg-secondary/30 flex flex-col items-center">
                    <button 
                        onClick={() => { onDisablePopup(); onClose(); }}
                        className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] hover:text-primary-accent transition-colors"
                    >
                        Don't show this popup again
                    </button>
                    <p className="text-[9px] text-text-secondary/40 mt-1 uppercase tracking-widest text-center px-8 leading-tight">
                        You can re-enable this popup anytime in Settings under "Display Preferences".
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default PriorEpisodesModal;
