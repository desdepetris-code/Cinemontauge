
import React from 'react';
import { ProfileTab } from '../types';
import { HomeIcon, ArrowTrendingUpIcon, UserGroupIcon, PushPinIcon, HourglassIcon, CurlyLoopIcon, TargetIcon, CabinetIcon, TagIcon, ScrollIcon, QuillIcon, WavesIcon, MagnifyingGlassIcon, BadgeIcon, CloudArrowUpIcon, CogIcon, ClockIcon } from './Icons';
import Carousel from './Carousel';

interface ShortcutNavigationProps {
  onShortcutNavigate: (tabId: string) => void;
  selectedTabs: ProfileTab[];
}

const tabMetadata: Record<ProfileTab | 'home', { label: string; icon: React.ReactNode }> = {
    home: { label: 'Home', icon: <HomeIcon className="w-4 h-4" /> },
    overview: { label: 'Overview', icon: <PushPinIcon className="w-4 h-4" /> },
    progress: { label: 'Progress', icon: <ArrowTrendingUpIcon className="w-4 h-4" /> },
    history: { label: 'History', icon: <WavesIcon className="w-4 h-4" /> },
    library: { label: 'Library', icon: <CabinetIcon className="w-4 h-4" /> },
    lists: { label: 'Lists', icon: <TagIcon className="w-4 h-4" /> },
    activity: { label: 'Activity', icon: <UserGroupIcon className="w-4 h-4" /> },
    stats: { label: 'Stats', icon: <MagnifyingGlassIcon className="w-4 h-4" /> },
    seasonLog: { label: 'Log', icon: <ScrollIcon className="w-4 h-4" /> },
    journal: { label: 'Journal', icon: <QuillIcon className="w-4 h-4" /> },
    achievements: { label: 'Merits', icon: <BadgeIcon className="w-4 h-4" /> },
    imports: { label: 'Import & Sync', icon: <CloudArrowUpIcon className="w-4 h-4" /> },
    settings: { label: 'Settings', icon: <CogIcon className="w-4 h-4" /> },
    updates: { label: 'Updates', icon: <CurlyLoopIcon className="w-4 h-4" /> },
    weeklyPicks: { label: 'Weekly Picks', icon: <TargetIcon className="w-4 h-4" /> },
    ongoing: { label: 'Catch Up', icon: <HourglassIcon className="w-4 h-4" /> },
    // Add missing airtime_management metadata
    airtime_management: { label: 'Management', icon: <ClockIcon className="w-4 h-4" /> },
};

const ShortcutButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isActive?: boolean;
}> = ({ label, icon, onClick, isActive }) => {
    const baseClasses = "flex items-center space-x-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0 border";
    const activeClasses = "bg-primary-accent/20 border-primary-accent text-primary-accent shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)] scale-105";
    const inactiveClasses = "bg-bg-secondary/40 border-white/5 text-text-secondary hover:border-white/30 hover:text-text-primary";
    
    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
};

const ShortcutNavigation: React.FC<ShortcutNavigationProps> = ({ onShortcutNavigate, selectedTabs }) => {
  return (
    <div className="px-6 my-8">
        <Carousel>
            <div className="flex space-x-3 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
                <ShortcutButton 
                    label="Home"
                    icon={tabMetadata.home.icon}
                    isActive={true}
                    onClick={() => onShortcutNavigate('home')}
                />
                {selectedTabs.map(tabId => {
                    const meta = tabMetadata[tabId];
                    if (!meta) return null;
                    return (
                        <ShortcutButton 
                            key={tabId}
                            label={meta.label}
                            icon={meta.icon}
                            isActive={false}
                            onClick={() => onShortcutNavigate(tabId)}
                        />
                    );
                })}
                <div className="w-2 flex-shrink-0"></div>
            </div>
        </Carousel>
    </div>
  );
};

export default ShortcutNavigation;
