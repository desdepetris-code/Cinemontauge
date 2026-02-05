import React from 'react';
import { HomeIcon, SearchNavIcon, UserIcon, CalendarIcon, BadgeIcon, ArrowTrendingUpIcon, UserGroupIcon, ChartBarIcon, PushPinIcon, HourglassIcon, CurlyLoopIcon, TargetIcon, CabinetIcon, TagIcon, ScrollIcon, QuillIcon, WavesIcon, MagnifyingGlassIcon } from '../components/Icons';
import { NavSettings, ProfileTab } from '../types';

interface BottomTabNavigatorProps {
  activeTab: string;
  activeProfileTab?: ProfileTab;
  onTabPress: (tab: string) => void;
  profilePictureUrl: string | null;
  navSettings: NavSettings;
}

const iconMetadata: Record<string, { label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
  home: { label: 'Home', icon: HomeIcon },
  search: { label: 'Search', icon: SearchNavIcon },
  calendar: { label: 'Timeline', icon: CalendarIcon },
  profile: { label: 'Profile', icon: UserIcon },
  overview: { label: 'Overview', icon: PushPinIcon },
  progress: { label: 'Progress', icon: ArrowTrendingUpIcon },
  history: { label: 'History', icon: WavesIcon },
  library: { label: 'Library', icon: CabinetIcon },
  lists: { label: 'Lists', icon: TagIcon },
  activity: { label: 'Activity', icon: UserGroupIcon },
  stats: { label: 'Stats', icon: MagnifyingGlassIcon },
  seasonLog: { label: 'Log', icon: ScrollIcon },
  journal: { label: 'Journal', icon: QuillIcon },
  achievements: { label: 'Awards', icon: BadgeIcon },
  updates: { label: 'Updates', icon: CurlyLoopIcon },
  ongoing: { label: 'Catch Up', icon: HourglassIcon },
  weeklyPicks: { label: 'Picks', icon: TargetIcon },
};

const TabButton: React.FC<{
  id: string;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  onPress: () => void;
  isProfileTab?: boolean;
  profilePictureUrl?: string | null;
  isVertical?: boolean;
}> = ({ label, icon: Icon, isActive, onPress, isProfileTab, profilePictureUrl, isVertical }) => {
    const iconContent = () => {
        if (isProfileTab && profilePictureUrl) {
            return (
                <div className={`relative p-0.5 rounded-full border-2 transition-all duration-300 ${isActive ? 'border-white scale-110 shadow-[0_0_15px_white]' : 'border-white/20 hover:border-white/50'}`}>
                    <img src={profilePictureUrl} alt="Profile" className="w-6 h-6 rounded-full object-cover" />
                </div>
            );
        }
        return (
            <div className={`relative p-1.5 rounded-xl border transition-all duration-300 ${isActive ? 'bg-white/20 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)]' : 'border-white/5 hover:border-white/30'}`}>
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'text-white/80 group-hover:scale-105 group-hover:text-white'}`} />
            </div>
        );
    };
    
    return (
        <button
            onClick={onPress}
            className={`group flex transition-all duration-300 ${isVertical ? 'flex-row items-center w-full px-3 py-3 gap-3' : 'flex-col items-center justify-center w-full pt-2 pb-1'} ${
            isActive ? 'text-white' : 'text-white hover:opacity-80'
            }`}
            aria-label={label}
        >
            {iconContent()}
            <div className={`mt-1 transition-all ${isVertical ? 'w-auto' : 'w-auto'}`}>
                <span className={`text-[8px] uppercase font-black tracking-[0.2em] truncate transition-all text-white ${isVertical ? 'text-xs opacity-100' : (isActive ? 'opacity-100 drop-shadow-[0_0_5px_white]' : 'opacity-80')}`}>{label}</span>
            </div>
            {isVertical && isActive && <div className="w-1 h-5 bg-white rounded-full shadow-[0_0_12px_white]"></div>}
        </button>
    );
};

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ activeTab, activeProfileTab, onTabPress, profilePictureUrl, navSettings }) => {
  const isHorizontal = navSettings.position === 'bottom';
  const isVertical = !isHorizontal;

  const positionClasses = {
      bottom: "bottom-0 left-0 right-0 h-20 flex-row border-t border-white/5",
      left: "top-0 left-0 bottom-0 w-24 flex-col pt-20 border-r border-white/5",
      right: "top-0 right-0 bottom-0 w-24 flex-col pt-20 border-l border-white/5",
  }[navSettings.position];

  const hoverClasses = navSettings.hoverRevealNav ? "opacity-0 hover:opacity-100 transition-opacity duration-300" : "opacity-100";

  return (
    <nav className={`fixed z-40 overflow-hidden nav-spectral-bg animate-spectral-flow shadow-[0_-10px_30px_rgba(0,0,0,0.5)] flex ${positionClasses} ${hoverClasses}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl"></div>
      <div className={`container mx-auto flex h-full relative z-10 px-1 ${isVertical ? 'flex-col py-4' : 'flex-row justify-around items-center'}`}>
        {navSettings.tabs.map(tabId => {
          const meta = iconMetadata[tabId];
          if (!meta) return null;

          const isActive = tabId === 'profile' 
            ? (activeTab === 'profile' && !activeProfileTab)
            : (activeTab === tabId || activeProfileTab === tabId);

          return (
            <TabButton
              key={tabId}
              id={tabId}
              label={meta.label}
              icon={meta.icon}
              isActive={isActive}
              onPress={() => onTabPress(tabId)}
              isProfileTab={tabId === 'profile'}
              profilePictureUrl={profilePictureUrl}
              isVertical={isVertical}
            />
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabNavigator;