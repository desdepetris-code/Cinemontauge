import React, { useEffect, useRef } from 'react';
import { Theme } from '../types';
import { XMarkIcon, SearchIcon, HomeIcon, UserIcon, CheckCircleIcon, TrophyIcon, FireIcon, ChevronDownIcon, FilmIcon, TvIcon, ClockIcon } from './Icons';
import Logo from './Logo';

interface ThemePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: Theme;
    onApply: () => void;
}

const ThemePreviewModal: React.FC<ThemePreviewModalProps> = ({ isOpen, onClose, theme, onApply }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the requested "Top 10" section when opened
    useEffect(() => {
        if (isOpen && scrollContainerRef.current) {
            // Delay slightly to allow for transition animations to finish
            const timer = setTimeout(() => {
                const target = scrollContainerRef.current?.querySelector('#top-10-anchor');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const styles = {
        bg: theme.colors.bgGradient,
        card: theme.colors.cardGradient,
        accent: theme.colors.accentGradient,
        textPrimary: theme.colors.textColorPrimary,
        textSecondary: theme.colors.textColorSecondary,
        bgPrimary: theme.colors.bgPrimary,
        onAccent: theme.colors.onAccent || '#FFFFFF',
        accentPrimary: theme.colors.accentPrimary
    };

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex items-center justify-center p-0 md:p-4 animate-fade-in" onClick={onClose}>
            <div 
                className="bg-bg-primary shadow-2xl w-full max-w-lg h-full md:h-[90vh] md:rounded-[3rem] flex flex-col border border-white/10 relative overflow-hidden" 
                onClick={e => e.stopPropagation()}
                style={{ background: styles.bg, backgroundSize: 'cover', backgroundAttachment: 'initial' }}
            >
                {/* Header (Matching Homepage) */}
                <div className="p-4 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-white/5 flex-shrink-0">
                    <Logo className="h-8 w-8" />
                    <div className="flex-grow max-w-[200px] mx-4">
                        <div className="h-8 rounded-lg bg-white/5 border border-white/10 flex items-center px-3 gap-2">
                            <SearchIcon className="w-3 h-3 opacity-40" style={{ color: styles.textPrimary }} />
                            <div className="text-[9px] font-bold opacity-30" style={{ color: styles.textPrimary }}>Search Archive...</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 bg-blue-600 rounded-md text-[8px] font-black text-white uppercase tracking-widest shadow-lg">Login</div>
                        <button onClick={onClose} className="p-1 rounded-full" style={{ color: `${styles.textPrimary}40` }}><XMarkIcon className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Main Scrollable Content */}
                <div ref={scrollContainerRef} className="flex-grow overflow-y-auto p-4 space-y-10 custom-scrollbar pb-32">
                    
                    {/* 1. Hero Image */}
                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[16/8]">
                        <img 
                            src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=1200&auto=format&fit=crop" 
                            className="absolute inset-0 w-full h-full object-cover" 
                            alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
                        <div className="absolute bottom-5 left-5 space-y-1 pl-4 border-l-2 border-white/50">
                             <div className="text-[7px] font-black uppercase text-white/80 tracking-widest">Featured Entry</div>
                             <h3 className="text-xl font-black text-white tracking-tight uppercase leading-none">The Great Beyond</h3>
                        </div>
                    </div>

                    {/* 2. Digital Clock */}
                    <div className="py-2 text-center space-y-1">
                        <div className="text-4xl font-black tracking-tight" style={{ color: styles.textPrimary }}>10:14:22 PM</div>
                        <div className="text-[10px] font-bold opacity-60 uppercase tracking-[0.2em]" style={{ color: styles.textSecondary }}>System Time Active</div>
                    </div>

                    {/* 3. Navigation Pills */}
                    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                        <div className="px-4 py-2 bg-blue-600 rounded-full text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-2 shadow-lg">
                            <HomeIcon className="w-3 h-3" /> HOME
                        </div>
                        <div className="px-4 py-2 bg-white/5 rounded-full text-[8px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2 border border-white/5" style={{ color: styles.textPrimary }}>
                            <ClockIcon className="w-3 h-3" /> HISTORY
                        </div>
                        <div className="px-4 py-2 bg-white/5 rounded-full text-[8px] font-black opacity-40 uppercase tracking-widest flex items-center gap-2 border border-white/5" style={{ color: styles.textPrimary }}>
                            <TrophyIcon className="w-3 h-3" /> PICKS
                        </div>
                    </div>

                    {/* 4. Stats Placeholder */}
                    <div className="p-5 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-between" style={{ background: styles.card }}>
                         <span className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: styles.textPrimary }}>Registry Stats</span>
                         <ChevronDownIcon className="w-4 h-4 opacity-40" style={{ color: styles.textPrimary }} />
                    </div>

                    {/* Anchor for Auto-scroll */}
                    <div id="top-10-anchor" className="h-2"></div>

                    {/* 5. TOP 10 MOVIES SECTION */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                             <div className="w-1.5 h-8 bg-accent-gradient rounded-full" style={{ background: styles.accent }}></div>
                             <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ color: styles.textPrimary }}>Top 10 Movies</h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-2 px-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-44 flex-shrink-0 space-y-3 relative group">
                                    <div className="absolute -top-3 -left-2 z-20">
                                        <span className="text-6xl font-black italic opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: styles.accentPrimary, WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>{i}</span>
                                    </div>
                                    <div className="aspect-[10/15] rounded-[1.5rem] bg-bg-secondary/60 relative overflow-hidden border border-white/5 shadow-xl transition-transform group-hover:scale-[1.02]" style={{ background: styles.card }}>
                                        <img 
                                            src={`https://images.unsplash.com/photo-${1500000000000 + i}?q=80&w=400&auto=format&fit=crop`} 
                                            className="absolute inset-0 w-full h-full object-cover opacity-80" 
                                            alt=""
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-3 left-3 right-3 text-center">
                                             <div className="text-[10px] font-black text-white uppercase truncate">Sample Film {i}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 6. TOP 10 TV SHOWS SECTION */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                             <div className="w-1.5 h-8 bg-accent-gradient rounded-full" style={{ background: styles.accent }}></div>
                             <h2 className="text-2xl font-black uppercase tracking-tighter" style={{ color: styles.textPrimary }}>Top 10 TV Shows</h2>
                        </div>
                        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-2 px-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-44 flex-shrink-0 space-y-3 relative group">
                                    <div className="absolute -top-3 -left-2 z-20">
                                        <span className="text-6xl font-black italic opacity-20 group-hover:opacity-100 transition-opacity" style={{ color: styles.accentPrimary, WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>{i}</span>
                                    </div>
                                    <div className="aspect-[10/15] rounded-[1.5rem] bg-bg-secondary/60 relative overflow-hidden border border-white/5 shadow-xl transition-transform group-hover:scale-[1.02]" style={{ background: styles.card }}>
                                        <img 
                                            src={`https://images.unsplash.com/photo-${1600000000000 + i}?q=80&w=400&auto=format&fit=crop`} 
                                            className="absolute inset-0 w-full h-full object-cover opacity-80" 
                                            alt=""
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-3 left-3 right-3 text-center">
                                             <div className="text-[10px] font-black text-white uppercase truncate">Sample Series {i}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Navigation (Fixed) */}
                <div className="p-4 flex justify-between items-center border-t border-white/5 backdrop-blur-md flex-shrink-0" style={{ backgroundColor: `${styles.textPrimary}05`, borderTopColor: `${styles.textPrimary}10` }}>
                    <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className="p-1.5 rounded-lg border border-white/10 shadow-lg bg-white/5" style={{ borderColor: `${styles.textPrimary}20` }}>
                            <HomeIcon className="w-4 h-4" style={{ color: styles.accentPrimary }} />
                        </div>
                        <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: styles.accentPrimary }}>Home</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1 opacity-40">
                        <SearchIcon className="w-4 h-4" style={{ color: styles.textPrimary }} />
                        <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: styles.textPrimary }}>Search</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1 opacity-40">
                        <ClockIcon className="w-4 h-4" style={{ color: styles.textPrimary }} />
                        <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: styles.textPrimary }}>Timeline</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-1 opacity-40">
                        <UserIcon className="w-4 h-4" style={{ color: styles.textPrimary }} />
                        <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: styles.textPrimary }}>Profile</span>
                    </div>
                </div>

                {/* Final Apply Action Overlay */}
                <div className="absolute bottom-24 right-4 z-50 animate-bounce-in">
                    <button 
                        onClick={() => { onApply(); onClose(); }}
                        className="px-10 py-5 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] hover:scale-110 active:scale-95 transition-all flex items-center gap-3 border border-white/20"
                        style={{ background: styles.accent, color: styles.onAccent }}
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        Initialize Theme
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ThemePreviewModal;
