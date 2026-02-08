import React, { useState } from 'react';
import { XMarkIcon, UsersIcon, SparklesIcon, InformationCircleIcon, CheckCircleIcon, LinkIcon } from './Icons';

interface MissingInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (type: string, data: any) => void;
}

type InfoType = 'images' | 'member' | 'other' | null;

const MissingInfoModal: React.FC<MissingInfoModalProps> = ({ isOpen, onClose, onSend }) => {
    const [type, setType] = useState<InfoType>(null);
    const [name, setName] = useState('');
    const [imdbLink, setImdbLink] = useState('');
    const [description, setDescription] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        let reportType = "";
        let data = {};

        if (type === 'images') {
            reportType = "Missing Cast/Crew Images";
            data = { status: "Requires visual asset verification" };
        } else if (type === 'member') {
            reportType = "Missing Cast/Crew Member";
            data = { name, imdbLink: imdbLink || "Not provided" };
        } else {
            reportType = "Other Cast/Crew Information Gap";
            data = { description };
        }

        onSend(reportType, data);
        handleReset();
    };

    const handleReset = () => {
        setType(null);
        setName('');
        setImdbLink('');
        setDescription('');
    };

    const inputClass = "w-full p-4 bg-bg-secondary rounded-2xl text-text-primary font-bold focus:outline-none border border-white/10 focus:border-primary-accent transition-all shadow-inner";

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <header className="p-8 bg-card-gradient border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-accent/10 rounded-2xl text-primary-accent shadow-inner">
                            <UsersIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter leading-none">Missing Information</h2>
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-2 opacity-60">Registry Correction Log</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar max-h-[60vh]">
                    {!type ? (
                        <div className="space-y-3">
                            <button 
                                onClick={() => setType('images')}
                                className="w-full p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group flex items-center justify-between"
                            >
                                <span className="font-black text-sm uppercase tracking-widest text-text-primary group-hover:text-primary-accent">Missing Images</span>
                                <SparklesIcon className="w-5 h-5 opacity-20 group-hover:opacity-100 text-primary-accent" />
                            </button>
                            <button 
                                onClick={() => setType('member')}
                                className="w-full p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group flex items-center justify-between"
                            >
                                <span className="font-black text-sm uppercase tracking-widest text-text-primary group-hover:text-primary-accent">Missing Member</span>
                                <UsersIcon className="w-5 h-5 opacity-20 group-hover:opacity-100 text-primary-accent" />
                            </button>
                            <button 
                                onClick={() => setType('other')}
                                className="w-full p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group flex items-center justify-between"
                            >
                                <span className="font-black text-sm uppercase tracking-widest text-text-primary group-hover:text-primary-accent">Other Issue</span>
                                <InformationCircleIcon className="w-5 h-5 opacity-20 group-hover:opacity-100 text-primary-accent" />
                            </button>
                        </div>
                    ) : (
                        <div className="animate-fade-in space-y-6">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] font-black uppercase text-primary-accent tracking-widest">Entry Details</p>
                                <button onClick={() => setType(null)} className="text-[9px] font-black uppercase text-text-secondary hover:text-white transition-colors underline">Change Type</button>
                            </div>

                            {type === 'images' && (
                                <div className="p-6 bg-primary-accent/5 rounded-3xl border border-primary-accent/20 text-center">
                                    <p className="text-sm font-medium text-text-secondary leading-relaxed">
                                        This log will flag the current registry sector for missing cast or crew profile images.
                                    </p>
                                </div>
                            )}

                            {type === 'member' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-text-secondary ml-2">Talent Name</label>
                                        <input 
                                            type="text" 
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Full Name..."
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-text-secondary ml-2">IMDb URL (Optional)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                value={imdbLink}
                                                onChange={e => setImdbLink(e.target.value)}
                                                placeholder="https://imdb.com/name/nm..."
                                                className={inputClass}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary opacity-30">
                                                <LinkIcon className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {type === 'other' && (
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase text-text-secondary ml-2">Description</label>
                                    <textarea 
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Explain the missing data on the Cast & Crew tab..."
                                        className={`${inputClass} h-32 resize-none leading-relaxed`}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <footer className="p-8 bg-bg-secondary/30 flex flex-col gap-3">
                    <button 
                        onClick={handleSubmit}
                        disabled={!type || (type === 'member' && !name.trim()) || (type === 'other' && !description.trim())}
                        className="w-full py-5 rounded-[1.5rem] bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                    >
                        Send Registry Update
                    </button>
                    <button onClick={onClose} className="py-2 text-[9px] font-black uppercase tracking-[0.3em] text-text-secondary hover:text-text-primary transition-colors">
                        Cancel
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default MissingInfoModal;