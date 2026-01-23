import React, { useState, useEffect } from 'react';
import { ReminderType } from '../types';
import { XMarkIcon, SparklesIcon, CheckCircleIcon, InformationCircleIcon } from './Icons';

interface ReminderOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedTypes: ReminderType[], frequency: 'first' | 'all') => void;
    mediaType: 'tv' | 'movie';
    initialTypes?: ReminderType[];
    initialFrequency?: 'first' | 'all';
}

const showTimingOptions: { id: ReminderType; label: string }[] = [
    { id: 'release', label: 'At time of release' },
    { id: 'hour_before', label: '1 hour before' },
    { id: 'hour_after', label: '1 hour after' },
    { id: '5min_before', label: '5 minutes before' },
    { id: '5min_after', label: '5 minutes after' },
    { id: 'day_before', label: '1 day before' },
    { id: 'day_after', label: '1 day after' },
    { id: '2days_before', label: '2 days before' },
    { id: '2days_after', label: '2 days after' },
    { id: 'week_before', label: '1 week before' },
    { id: 'week_after', label: '1 week after' },
    { id: '2weeks_before', label: '2 weeks before' },
    { id: '2weeks_after', label: '2 weeks after' },
];

const movieTimingOptions: { id: ReminderType; label: string }[] = [
    { id: 'day_before', label: 'One day before' },
    { id: 'release', label: 'Day of release' },
    { id: 'day_after', label: 'One day after' },
    { id: 'week_before', label: 'One week before' },
    { id: 'week_after', label: 'One week after' },
    { id: '2days_before', label: '2 days before' },
    { id: '2days_after', label: '2 days after' },
    { id: '2weeks_before', label: '2 weeks before' },
    { id: '2weeks_after', label: '2 weeks after' },
    { id: 'daily_7_before', label: 'Every day for 7 days before' },
    { id: 'daily_7_after', label: 'Every day for 7 days after' },
];

const ReminderOptionsModal: React.FC<ReminderOptionsModalProps> = ({ isOpen, onClose, onSave, mediaType, initialTypes = [], initialFrequency = 'all' }) => {
    const [selectedTypes, setSelectedTypes] = useState<ReminderType[]>(initialTypes);
    const [frequency, setFrequency] = useState<'first' | 'all'>(initialFrequency);

    const timingOptions = mediaType === 'movie' ? movieTimingOptions : showTimingOptions;

    useEffect(() => {
        if (isOpen) {
            setSelectedTypes(initialTypes);
            setFrequency(initialFrequency);
        }
    }, [isOpen, initialTypes, initialFrequency]);

    if (!isOpen) return null;

    const toggleType = (type: ReminderType) => {
        setSelectedTypes(prev => 
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const handleSave = () => {
        if (selectedTypes.length === 0) return;
        onSave(selectedTypes, frequency);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-3xl shadow-2xl p-8 w-full max-w-lg border border-white/10 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-start mb-6 flex-shrink-0">
                    <div className="text-left">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-primary-accent/10 rounded-xl text-primary-accent">
                                <SparklesIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-black text-text-primary uppercase tracking-tighter">
                                {mediaType === 'movie' ? 'Cinema Alerts' : 'Tune In Alerts'}
                            </h3>
                        </div>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Customized precision reminders</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>
                
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 space-y-8">
                    {/* Frequency Selection - Only for TV Shows */}
                    {mediaType === 'tv' && (
                        <section>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent mb-4 px-2">Broadcast Frequency</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {(['all', 'first'] as const).map(freq => (
                                    <button
                                        key={freq}
                                        onClick={() => setFrequency(freq)}
                                        className={`p-4 rounded-2xl border transition-all text-center group ${
                                            frequency === freq 
                                                ? 'bg-primary-accent/20 border-primary-accent text-primary-accent' 
                                                : 'bg-bg-secondary/40 border-white/5 text-text-secondary hover:bg-bg-secondary'
                                        }`}
                                    >
                                        <span className="text-xs font-black uppercase tracking-widest">{freq === 'all' ? 'All Episodes' : 'Just the First'}</span>
                                        <p className="text-[8px] font-bold opacity-60 mt-1 uppercase tracking-tighter">
                                            {freq === 'all' ? 'Default behavior' : 'Series/Season Premiere'}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Timing Options */}
                    <section>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent mb-4 px-2">Trigger Times (Select Multiple)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {timingOptions.map(opt => {
                                const isActive = selectedTypes.includes(opt.id);
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => toggleType(opt.id)}
                                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left group ${
                                            isActive 
                                                ? 'bg-accent-gradient text-on-accent border-transparent shadow-md' 
                                                : 'bg-bg-secondary/20 border-white/5 text-text-primary hover:border-white/10'
                                        }`}
                                    >
                                        <span className="text-[11px] font-bold uppercase tracking-tight">{opt.label}</span>
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                                            isActive ? 'bg-white border-white' : 'border-white/10'
                                        }`}>
                                            {isActive && <CheckCircleIcon className="w-4 h-4 text-primary-accent" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <div className="p-4 bg-primary-accent/5 rounded-2xl border border-primary-accent/10 flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-primary-accent flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                            <strong className="text-text-primary uppercase block mb-1">
                                {mediaType === 'movie' ? 'Theatrical Truth Sync' : 'Trakt Truth Sync'}
                            </strong>
                            Alerts use exact {mediaType === 'movie' ? 'release day' : 'minute-by-minute broadcast'} records. Some international delays may apply based on your streaming provider.
                        </p>
                    </div>
                </div>

                <footer className="mt-8 flex flex-col gap-3 flex-shrink-0">
                    <button 
                        onClick={handleSave}
                        disabled={selectedTypes.length === 0}
                        className="w-full py-5 rounded-[1.5rem] bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                    >
                        Save Alert Configuration
                    </button>
                    <button onClick={onClose} className="w-full py-2 text-[9px] font-black uppercase tracking-[0.3em] text-text-secondary hover:text-text-primary transition-colors">
                        Discard Changes
                    </button>
                </footer>
            </div>
        </div>
    );
}

export default ReminderOptionsModal;