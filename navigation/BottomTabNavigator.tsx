import React from 'react';
import { HomeIcon, SearchIcon as SearchNavIcon, CogIcon, UserIcon, SparklesIcon, CloudArrowUpIcon, BellIcon } from '../components/Icons';

export type Tab = 'Home' | 'Search' | 'Discover' | 'Notifications' | 'Profile';

interface BottomTabNavigatorProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  unreadCount: number;
}

const NavItem: React.FC<{
  label: Tab;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  showIndicator?: boolean;
}> = ({ label, icon, isActive, onClick, showIndicator }) => (
  <button
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
      isActive ? 'text-primary-accent' : 'text-text-secondary hover:text-text-primary'
    }`}
    aria-label={label}
  >
    {showIndicator && (
        <span className="absolute top-1.5 right-[calc(50%-1.25rem)] w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-backdrop"></span>
    )}
    {icon}
    <span className="text-xs mt-1">{label}</span>
  </button>
);

const BottomTabNavigator: React.FC<BottomTabNavigatorProps> = ({ activeTab, setActiveTab, unreadCount }) => {
  const tabs: { label: Tab; icon: React.ReactNode }[] = [
    { label: 'Home', icon: <HomeIcon className="h-6 w-6" /> },
    { label: 'Discover', icon: <SparklesIcon className="h-6 w-6" /> },
    { label: 'Search', icon: <SearchNavIcon className="h-6 w-6" /> },
    { label: 'Notifications', icon: <BellIcon className="h-6 w-6" /> },
    { label: 'Profile', icon: <UserIcon className="h-6 w-6" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-backdrop backdrop-blur-md shadow-lg border-t border-bg-secondary z-40">
      <div className="container mx-auto h-full flex justify-around items-stretch">
        {tabs.map(tab => (
          <NavItem
            key={tab.label}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.label}
            onClick={() => setActiveTab(tab.label)}
            showIndicator={tab.label === 'Notifications' && unreadCount > 0}
          />
        ))}
      </div>
    </nav>
  );
};

export default BottomTabNavigator;