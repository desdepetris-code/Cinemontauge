import React from 'react';
import { ReminderType } from '../types';
import { InformationCircleIcon, SparklesIcon } from './Icons';

interface ReminderOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: ReminderType) => void;
}

const ReminderOptionsModal: React.FC<ReminderOptionsModalProps> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-3xl shadow-2xl p-8 space-y-4 w-full max-w-sm border border-white/10" onClick={e => e.stopPropagation()}>
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-primary-accent/10 rounded-2xl flex items-center justify-center text-primary-accent mx-auto mb-4">
                        <SparklesIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">Schedule Reminder</h3>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60 mt-1">Select your notification trigger</p>
                </div>
                
                <div className="space-y-2">
                    <button onClick={() => onSelect('release')} className="w-full text-left p-4 rounded-2xl bg-bg-secondary hover:bg-bg-secondary/70 border border-white/5 transition-all font-bold text-sm text-text-primary">
                        At time of release
                    </button>
                    <button onClick={() => onSelect('day_before')} className="w-full text-left p-4 rounded-2xl bg-bg-secondary hover:bg-bg-secondary/70 border border-white/5 transition-all font-bold text-sm text-text-primary">
                        1 day before
                    </button>
                    <button onClick={() => onSelect('week_before')} className="w-full text-left p-4 rounded-2xl bg-bg-secondary hover:bg-bg-secondary/70 border border-white/5 transition-all font-bold text-sm text-text-primary">
                        1 week before
                    </button>
                </div>

                <div className="mt-6 p-4 bg-primary-accent/5 rounded-2xl border border-primary-accent/10 flex items-start gap-3">
                    <InformationCircleIcon className="w-5 h-5 text-primary-accent flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                        <strong className="text-text-primary uppercase block mb-1">Precision Alerting</strong>
                        Reminders utilize <span className="text-primary-accent">Trakt precision airtimes</span>. Triggers like "one hour before" are calculated relative to the exact minute of broadcast in your local timezone.
                    </p>
                </div>

                <button onClick={onClose} className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary hover:text-text-primary transition-colors mt-2">
                    Cancel
                </button>
            </div>
        </div>
    );
}

export default ReminderOptionsModal;