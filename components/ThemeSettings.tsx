import React, { useState } from 'react';
import { themes as builtInThemes } from '../themes';
import { ProfileTheme, Theme } from '../types';
import ProfilePersonalizationModal from './ProfilePersonalizationModal';
import { CheckCircleIcon, SparklesIcon } from './Icons';

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
}> = ({ theme, isSelected, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className={`group w-full flex flex-col text-left bg-bg-secondary/20 rounded-[2rem] border-2 transition-all duration-500 ease-out overflow-hidden transform active:scale-[0.97] outline-none focus:ring-2 focus:ring-primary-accent/50 ${
                isSelected 
                    ? 'border-primary-accent shadow-[0_20px_50px_-12px_rgba(var(--color-accent-primary-rgb),0.5)] scale-[1.03] z-10' 
                    : 'border-white/5 opacity-70 hover:opacity-100 hover:border-white/20 hover:scale-[1.01] hover:shadow-xl'
            }`}
        >
            {/* Visual Sample Section */}
            <div 
                style={{ background: theme.colors.bgGradient }}
                className="h-44 w-full p-4 relative overflow-hidden flex flex-col justify-center items-center gap-3"
            >
                {/* Visual Polish: Moving Gradients inside the sample */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                
                {/* Sample Text */}
                <div 
                    style={{ color: theme.colors.textColorPrimary }}
                    className="text-[10px] font-black uppercase tracking-[0.2em] opacity-90 drop-shadow-sm"
                >
                    System Registry
                </div>

                {/* Sample Button */}
                <div 
                    style={{ background: theme.colors.accentGradient, color: theme.colors.onAccent }}
                    className="px-6 py-2 rounded-full text-[8px] font-black uppercase tracking-[0.3em] shadow-2xl transition-transform group-hover:scale-110 active:scale-95"
                >
                    Capture Item
                </div>

                {/* Selection Overlay */}
                {isSelected && (
                    <div className="absolute top-4 right-4 bg-primary-accent text-on-accent p-2 rounded-full shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.5)] animate-bounce-in">
                        <CheckCircleIcon className="w-5 h-5" />
                    </div>
                )}
                
                {/* Accent Highlight Line */}
                <div 
                    style={{ background: theme.colors.accentPrimary }}
                    className={`w-20 h-1.5 rounded-full transition-all duration-700 ${isSelected ? 'opacity-100 shadow-[0_0_10px_currentColor]' : 'opacity-20 group-hover:opacity-40'}`}
                ></div>
            </div>

            {/* Content Section */}
            <div className={`p-6 w-full transition-colors duration-500 ${isSelected ? 'bg-primary-accent/5' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-xl font-black uppercase tracking-tighter leading-none transition-colors ${isSelected ? 'text-primary-accent' : 'text-text-primary'}`}>
                        {theme.name}
                    </h3>
                    {isSelected && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-accent text-on-accent text-[8px] font-black uppercase rounded-lg shadow-lg">
                            <SparklesIcon className="w-3 h-3" />
                            Active
                        </div>
                    )}
                </div>
                <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.15em] opacity-60 leading-relaxed">
                    {theme.description}
                </p>
                
                {isSelected ? (
                    <div className="mt-4 pt-4 border-t border-primary-accent/20 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary-accent animate-pulse"></div>
                        <span className="text-[9px] font-black text-primary-accent uppercase tracking-widest">Active Registry Policy</span>
                    </div>
                ) : (
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <span className="text-[9px] font-black text-text-secondary/40 uppercase tracking-widest group-hover:text-text-primary transition-colors">Apply Cinematic Profile →</span>
                    </div>
                )}
            </div>
        </button>
    );
};

interface ThemeSettingsProps {
    profileTheme: ProfileTheme | null;
    setProfileTheme: React.Dispatch<React.SetStateAction<ProfileTheme | null>>;
    setTheme: (themeId: string) => void;
    baseThemeId: string;
}

const ThemeSettings: React.FC<ThemeSettingsProps> = ({ profileTheme, setProfileTheme, setTheme, baseThemeId }) => {
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const activeThemeName = builtInThemes.find(t => t.id === baseThemeId)?.name || 'Noir Electric';

    return (
        <>
            <ProfilePersonalizationModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={setProfileTheme}
                currentTheme={profileTheme}
            />
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
                        
                        {/* Phase 4: Active Theme Label */}
                        <div className="px-5 py-2.5 bg-bg-secondary/40 rounded-2xl border border-primary-accent/20 flex items-center gap-3 animate-fade-in shadow-inner">
                            <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary opacity-60">Currently Active:</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent">{activeThemeName}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {builtInThemes.map(theme => (
                            <ThemePreviewCard 
                                key={theme.id}
                                theme={theme}
                                isSelected={baseThemeId === theme.id}
                                onClick={() => setTheme(theme.id)}
                            />
                        ))}
                    </div>
                </div>
            </SettingsCard>
        </>
    );
};

export default ThemeSettings;