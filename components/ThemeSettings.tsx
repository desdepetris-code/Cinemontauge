import React, { useState, useMemo } from 'react';
import { themes as builtInThemes } from '../themes';
import { ProfileTheme, Theme } from '../types';
import ProfilePersonalizationModal from './ProfilePersonalizationModal';
import { CheckCircleIcon, SparklesIcon, HeartIcon } from './Icons';
import ThemePreviewModal from './ThemePreviewModal';
import Carousel from './Carousel';
import { isHolidayActive } from '../hooks/useTheme';

const SettingsCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-card-gradient rounded-lg shadow-md overflow-hidden mb-8 border border-white/5">
      <div className="p-4 border-b border-bg-secondary/50 bg-black/10">
        <h2 className="text-xl font-bold bg-clip-text text-transparent bg-accent-gradient">{title}</h2>
      </div>
      <div className="animate-fade-in">
        {children}
      </div>
    </div>
);

const ThemePreviewCard: React.FC<{ 
    theme: Theme; 
    isSelected: boolean; 
    onClick: () => void;
    onPreview: () => void;
}> = ({ theme, isSelected, onClick, onPreview }) => {
    return (
        <div className={`group w-full flex flex-col bg-bg-secondary/20 rounded-[2rem] border-2 transition-all duration-500 ease-out overflow-hidden shadow-xl ${
            isSelected 
                ? 'border-primary-accent shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] scale-[1.03] z-10' 
                : 'border-white/5 hover:border-white/20'
        }`}>
            {/* Visual Sample Section - Simplified for a cleaner look */}
            <div 
                style={{ background: theme.colors.bgGradient, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'initial' }}
                className="h-44 w-full p-4 relative overflow-hidden flex flex-col justify-center items-center cursor-pointer"
                onClick={onClick}
            >
                {/* Visual Polish Overlay */}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                
                {/* Selection Overlay Indicator */}
                {isSelected && (
                    <div className="absolute top-4 right-4 bg-primary-accent text-on-accent p-2 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] animate-bounce-in">
                        <CheckCircleIcon className="w-5 h-5" />
                    </div>
                )}

                {/* Theme Name Branding (Subtle) */}
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-20 pointer-events-none text-center px-4" style={{ color: theme.colors.textColorPrimary }}>
                    {theme.name}
                </span>
            </div>

            {/* Content Section */}
            <div className={`p-6 w-full flex-grow flex flex-col transition-colors duration-500 ${isSelected ? 'bg-primary-accent/5' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-xl font-black uppercase tracking-tighter leading-none transition-colors ${isSelected ? 'text-primary-accent' : 'text-text-primary'}`}>
                        {theme.name}
                    </h3>
                </div>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.15em] opacity-60 leading-relaxed h-10 mb-4 line-clamp-2">
                    {theme.description}
                </p>
                
                <div className="mt-auto flex flex-col gap-2">
                    <button 
                        onClick={onClick}
                        className={`w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${
                            isSelected 
                                ? 'bg-primary-accent text-on-accent' 
                                : 'bg-bg-secondary text-text-primary hover:bg-bg-secondary/70 border border-white/10'
                        }`}
                    >
                        {isSelected ? 'System Active' : 'Activate Theme'}
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onPreview(); }}
                        className="w-full py-3.5 bg-bg-secondary/40 rounded-xl border border-white/10 text-text-secondary hover:text-primary-accent hover:border-primary-accent/50 transition-all text-center"
                        title="Preview Theme Design"
                    >
                        <span className="text-[9px] font-black uppercase tracking-widest">Preview Theme</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ThemeSettingsProps {
    profileTheme: ProfileTheme | null;
    setProfileTheme: React.Dispatch<React.SetStateAction<ProfileTheme | null>>;
    setTheme: (themeId: string) => void;
    baseThemeId: string;
}

type ThemeCategory = 'standard' | 'holiday';

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ profileTheme, setProfileTheme, setTheme, baseThemeId }) => {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
    const [activeCategory, setActiveCategory] = useState<ThemeCategory>('standard');

    const filteredThemes = useMemo(() => {
        return builtInThemes.filter(theme => {
            const isHolidayTheme = !!theme.holidayDate;
            const isInSeason = isHolidayTheme && isHolidayActive(theme.holidayDate!);
            
            if (activeCategory === 'holiday') {
                return isInSeason; // Only show currently active holidays
            } else {
                return !isHolidayTheme; // Show only non-holiday themes in Standard
            }
        });
    }, [activeCategory]);

    const activeThemeName = builtInThemes.find(t => t.id === baseThemeId)?.name || 'Midnight Blue';

    return (
        <>
            <ProfilePersonalizationModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={setProfileTheme}
                currentTheme={profileTheme}
            />
            {previewTheme && (
                <ThemePreviewModal 
                    isOpen={!!previewTheme} 
                    onClose={() => setPreviewTheme(null)} 
                    theme={previewTheme} 
                    onApply={() => setTheme(previewTheme.id)}
                />
            )}
            <SettingsCard title="Visual Identity Registry">
                <div className="p-6">
                    <button 
                        onClick={() => setIsProfileModalOpen(true)} 
                        className="w-full text-center p-5 text-xs font-black uppercase tracking-[0.2em] rounded-2xl transition-all bg-accent-gradient text-on-accent hover:opacity-90 shadow-2xl active:scale-[0.98] transform"
                    >
                        Personalize Profile Layout
                    </button>
                </div>
                <div className="p-6 border-t border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 px-2">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-accent-gradient rounded-full shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]"></div>
                            <div>
                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-accent">Cinematic Color Profiles</p>
                                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-[0.1em] opacity-40">System-wide UI Transformation</p>
                            </div>
                        </div>
                        
                        <div className="px-5 py-2.5 bg-bg-secondary/40 rounded-2xl border border-primary-accent/20 flex items-center gap-3 animate-fade-in shadow-inner">
                            <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-60">Currently Active:</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent">{activeThemeName}</span>
                        </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="px-2 mb-8">
                        <Carousel>
                            <div className="flex space-x-3 overflow-x-auto hide-scrollbar">
                                <button
                                    onClick={() => setActiveCategory('standard')}
                                    className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all border ${activeCategory === 'standard' ? 'bg-primary-accent text-on-accent border-transparent shadow-lg' : 'bg-bg-secondary/40 text-text-secondary border-white/5 hover:border-white/10'}`}
                                >
                                    Standard Themes
                                </button>
                                <button
                                    onClick={() => setActiveCategory('holiday')}
                                    className={`flex items-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full transition-all border ${activeCategory === 'holiday' ? 'bg-accent-gradient text-on-accent border-transparent shadow-lg' : 'bg-bg-secondary/40 text-text-secondary border-white/5 hover:border-white/10'}`}
                                >
                                    <HeartIcon className="w-3.5 h-3.5" />
                                    Holiday Themes
                                </button>
                            </div>
                        </Carousel>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {filteredThemes.length > 0 ? (
                            filteredThemes.map(theme => (
                                <ThemePreviewCard 
                                    key={theme.id}
                                    theme={theme}
                                    isSelected={baseThemeId === theme.id}
                                    onClick={() => setTheme(theme.id)}
                                    onPreview={() => setPreviewTheme(theme)}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-12 text-center bg-bg-secondary/10 rounded-3xl border-2 border-dashed border-white/5">
                                <SparklesIcon className="w-10 h-10 text-text-secondary/20 mx-auto mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest text-text-secondary/40">No holiday events active in this sector</p>
                            </div>
                        )}
                    </div>
                </div>
            </SettingsCard>
        </>
    );
};

export default ThemeSettings;
