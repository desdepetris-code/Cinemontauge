import React, { useState } from 'react';
import { XMarkIcon, MegaphoneIcon, SparklesIcon, InformationCircleIcon } from './Icons';

interface BroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (title: string, message: string) => void;
    deviceCount: number;
}

const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose, onSend, deviceCount }) => {
    const [title, setTitle] = useState('🎬 SceneIt: System Update');
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(title, message);
        setMessage('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 flex flex-col relative" onClick={e => e.stopPropagation()}>
                <header className="p-8 bg-card-gradient border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-500/20 rounded-2xl text-yellow-500 shadow-inner">
                            <MegaphoneIcon className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter leading-none">Global Broadcast</h2>
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-2 opacity-60">Push to {deviceCount} registered devices</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </header>

                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-2">Notification Headline</label>
                        <input 
                            type="text" 
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Headline..."
                            className="w-full p-4 bg-bg-secondary rounded-2xl text-text-primary font-bold focus:outline-none border border-white/10 shadow-inner"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-2">Message Content</label>
                        <textarea 
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Type your global announcement here..."
                            className="w-full h-32 p-4 bg-bg-secondary rounded-2xl text-text-primary font-medium leading-relaxed focus:outline-none border border-white/10 shadow-inner resize-none"
                        />
                    </div>

                    <div className="p-4 bg-yellow-500/5 rounded-2xl border border-yellow-500/10 flex items-start gap-3">
                        <InformationCircleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-text-secondary leading-relaxed font-medium">
                            Broadcasting will trigger a system-level alert on all devices with active notification permissions.
                        </p>
                    </div>
                </div>

                <footer className="p-8 bg-bg-secondary/30 flex flex-col gap-3">
                    <button 
                        onClick={handleSend}
                        disabled={!message.trim()}
                        className="w-full py-5 rounded-[1.5rem] bg-yellow-500 text-black font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100"
                    >
                        Dispatch Global Notification
                    </button>
                    <button onClick={onClose} className="py-2 text-[9px] font-black uppercase tracking-[0.3em] text-text-secondary hover:text-text-primary transition-colors">
                        Cancel
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default BroadcastModal;