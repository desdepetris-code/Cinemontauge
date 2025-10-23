import React from 'react';
import { BadgeIcon, ClockIcon, UserIcon, BookOpenIcon, StarIcon } from './Icons';

interface TopShortcutsProps {
  onShowHistory: () => void;
  onShowProgress: () => void;
  onShowWatchlist: () => void;
  onShowFavorites: () => void;
  onShowBadges: () => void;
}

const IconLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center space-y-2 text-text-primary hover:text-primary-accent transition-colors group disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 w-20"
    disabled={!onClick}
  >
    <div className="w-16 h-16 bg-bg-secondary rounded-full flex items-center justify-center group-hover:bg-primary-accent/20 transition-all duration-300 group-hover:shadow-[0_0_15px_var(--color-accent-primary)]">
      {icon}
    </div>
    <span className="text-xs font-semibold">{label}</span>
  </button>
);


const TopShortcuts: React.FC<TopShortcutsProps> = ({ onShowHistory, onShowProgress, onShowWatchlist, onShowFavorites, onShowBadges }) => {
  return (
    <div className="px-6 mb-8">
      <div className="flex items-center space-x-4 overflow-x-auto pb-4 hide-scrollbar -mx-4 px-4">
        <IconLink icon={<ClockIcon className="w-8 h-8" />} label="History" onClick={onShowHistory} />
        <IconLink icon={<UserIcon className="w-8 h-8" />} label="Progress" onClick={onShowProgress} />
        <IconLink icon={<BookOpenIcon className="w-8 h-8" />} label="Watchlist" onClick={onShowWatchlist} />
        <IconLink icon={<StarIcon className="w-8 h-8" />} label="Favorites" onClick={onShowFavorites} />
        <IconLink icon={<BadgeIcon className="w-8 h-8" />} label="Badges" onClick={onShowBadges} />
      </div>
    </div>
  );
};

export default TopShortcuts;