import React, { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, EnvelopeIcon, SparklesIcon, CheckCircleIcon } from './Icons';
import Logo from './Logo';

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: { username: string; email: string }) => Promise<string | null>;
  currentUser: { username: string; email: string } | null;
}

const UpdateProfileModal: React.FC<UpdateProfileModalProps> = ({ isOpen, onClose, onSave, currentUser }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            setUsername(currentUser.username);
            setEmail(currentUser.email);
            setError(null);
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const validateUsername = (val: string) => {
        const regex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':",.<>/?]+$/;
        return regex.test(val);
    };

    const handleSave = async () => {
        setError(null);
        if (!username.trim() || !email.trim()) {
            setError("Username and email cannot be empty.");
            return;
        }
        if (!validateUsername(username)) {
            setError("Username contains invalid characters.");
            return;
        }
        setLoading(true);
        const result = await onSave({ username, email });
        if (result) {
            setError(result);
            setLoading(false);
        } else {
            onClose();
        }
    };

    const inputClass = "w-full p-4 pl-12 bg-bg-secondary rounded-2xl text-text-primary placeholder-text-secondary/50 focus:outline-none border border-white/10 focus:border-primary-accent transition-all font-bold shadow-inner";

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-bg-primary rounded-[3rem] shadow-2xl w-full max-md p-10 border border-white/10 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-1 bg-accent-gradient"></div>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
                    <XMarkIcon className="w-5 h-5" />
                </button>
                
                <div className="text-center mb-8">
                    <Logo className="w-16 h-16 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.5)]" />
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none mb-2">Update Identity</h2>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-60">Manage your Registry details</p>
                </div>

                <div className="space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                            <p className="text-xs font-bold text-red-400">{error}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2 block">Username Handle</label>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={username} 
                                onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} 
                                className={inputClass} 
                                placeholder="new_handle"
                            />
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary ml-2 block">Email Address</label>
                        <div className="relative">
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                className={inputClass} 
                                placeholder="email@example.com"
                            />
                            <EnvelopeIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50" />
                        </div>
                    </div>

                    <div className="bg-primary-accent/5 rounded-2xl p-4 border border-primary-accent/10">
                        <p className="text-[10px] text-text-secondary leading-relaxed font-medium italic text-center">
                            Note: Changing your email will require confirmation on both the old and new addresses.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-4">
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full py-5 rounded-[1.5rem] bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs shadow-2xl transform transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full py-3 rounded-2xl text-text-secondary bg-bg-secondary font-black uppercase tracking-widest text-[9px] hover:text-text-primary transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                <p className="mt-8 text-[8px] font-black text-text-secondary/30 uppercase tracking-[0.3em] text-center">
                    Registry Verification System v3.2
                </p>
            </div>
        </div>
    );
};

export default UpdateProfileModal;