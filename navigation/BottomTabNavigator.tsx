
import React from 'react';
import { HomeIcon, SearchNavIcon, BookOpenIcon, UserIcon, CalendarIcon } from '../components/Icons';
import { ScreenName } from '../types';

export type TabName = 'home' | 'search' | 'calendar' | 'progress' | 'profile';

interface BottomTabNavigatorProps {
  activeTab: ScreenName;
  onTabPress: (tab: TabName) => void;
  profilePictureUrl: string | null;
}

const tabs: { name: TabName; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { name: 'home', label: 'Home', icon: HomeIcon },
  { name: 'search', label: 'Search', icon: SearchNavIcon },
  { name: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { name: 'progress', label: 'Progress', icon: BookOpenIcon },
  { name: 'profile', label: 'Profile', icon: UserIcon },
];

const TabButton: React.FC<{
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isActive: boolean;
  onPress: () => void;
  isProfileTab?: boolean;
  profilePictureUrl?: string | null;
}> = ({ label, icon: Icon, isActive, onPress, isProfileTab, profilePictureUrl }) => {
    const iconContent = () => {
        if (isProfileTab && profilePictureUrl) {
            return <img src={profilePictureUrl} alt="Profile" className={`w-6 h-6 rounded-full object-cover border-2 ${isActive ? 'border-white' : 'border-transparent'}`} />
        }
        return <Icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />;
    };
    
    return (
        <button
            onClick={onPress}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-all duration-300 ${
            isActive ? 'text-white' : 'text-white/60 hover:text-white'
            }`}
            aria-label={label}
        >
            {iconContent()}
            <span className={`text-[10px] uppercase font-black tracking-widest mt-1 ${isActive ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
        </button>
    );
};

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ activeTab, onTabPress, profilePictureUrl }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 nav-spectral-bg animate-spectral-flow shadow-2xl z-40 overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>
      <div className="container mx-auto flex justify-around items-center h-full relative z-10 px-4">
        {tabs.map(tab => (
          <TabButton
            key={tab.name}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.name}
            onPress={() => onTabPress(tab.name)}
            isProfileTab={tab.name === 'profile'}
            profilePictureUrl={profilePictureUrl}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomTabNavigator;
