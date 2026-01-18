import React from 'react';
import SearchBar from './SearchBar';
import { TmdbMedia } from '../types';

interface User {
  id: string;
  username: string;
  email: string;
}

interface HeaderProps {
  currentUser: User | null;
  profilePictureUrl: string | null;
  onAuthClick: () => void;
  onGoToProfile: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onGoHome: () => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  isOnSearchScreen?: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  hoverReveal?: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentUser, profilePictureUrl, onAuthClick, onGoToProfile, onSelectShow, onGoHome, onMarkShowAsWatched, query, onQueryChange, isOnSearchScreen, isHoliday, holidayName, hoverReveal }) => {
  const logoUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHJ4PSIxMDAiIGZpbGw9IiM0NTBhMGEiLz48dGV4dCB4PSIyNTYiIHk9IjMyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI4MCIgZm9udC13ZWlnaHQ9IjkwMCIgZmlsbD0iI2Y4NzE3MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Q008L3RleHQ+PHJlY3QgeD0iNTAiIHk9IjM4MCIgd2lkdGg9IjQxMiIgaGVpZ2h0PSI2MCIgcng9IjMwIiBmaWxsPSIjMDAwMDAwIiBvcGFjaXR5PSIwLjUiLz48dGV4dCB4PSIyNTYiIHk9IjQyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjMyIiBmb250LXdlaWdodD0iOTAwIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBsZXR0ZXItc3BhY2luZz0iMTAiPkNJTkVNT05UQVVHRTwvdGV4dD48L3N2Zz4=";

  const hoverClasses = hoverReveal ? "opacity-0 hover:opacity-100 transition-opacity duration-300" : "opacity-100";

  return (
    <header className={`sticky top-0 z-30 py-2 px-4 bg-backdrop backdrop-blur-md shadow-lg border-b border-primary-accent/10 ${hoverClasses}`}>
      <div className="container mx-auto flex items-center justify-between gap-2 md:gap-4">
        <div 
          onClick={onGoHome}
          className="flex flex-col items-center cursor-pointer group flex-shrink-0"
        >
            <img src={logoUri} alt="CineMontauge Logo" className="h-6 w-auto md:h-8 transition-transform duration-500 group-hover:scale-110" />
            <h1 className="hidden xs:block text-[8px] md:text-[10px] font-black text-text-primary tracking-[0.1em] mt-0.5 group-hover:text-primary-accent transition-colors">CineMontauge</h1>
        </div>

        <div className="flex-grow flex justify-center items-center">
            {isHoliday && (
                <div className="hidden lg:flex items-center space-x-2 mr-4 px-3 py-1 bg-primary-accent/10 border border-primary-accent/20 rounded-full shadow-sm animate-fade-in">
                    <span role="img" aria-label="Party Popper">🎉</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">{holidayName}</span>
                </div>
            )}
            {!isOnSearchScreen && (
                <div className="w-full max-w-2xl px-2">
                    <SearchBar 
                        onSelectResult={onSelectShow} 
                        onMarkShowAsWatched={onMarkShowAsWatched} 
                        value={query} 
                        onChange={onQueryChange}
                        dropdownWider
                    />
                </div>
            )}
        </div>
        
        <div className="flex items-center justify-end flex-shrink-0">
          {currentUser ? (
            <button
              onClick={onGoToProfile}
              className="flex items-center space-x-2 rounded-full p-1 transition-all hover:bg-white/5 group"
            >
              <img
                src={profilePictureUrl || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY0NzQ4YiI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiI+PC9wYXRoPjwvc3ZnPg==`}
                alt="Profile"
                className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover bg-bg-secondary border border-transparent group-hover:border-primary-accent"
              />
              <span className="hidden sm:block text-[10px] font-bold text-text-primary uppercase tracking-widest truncate max-w-[60px] md:max-w-[80px]">{currentUser.username}</span>
            </button>
          ) : (
            <button onClick={onAuthClick} className="px-3 md:px-4 py-1.5 md:py-2 text-[9px] md:text-[10px] font-bold uppercase tracking-widest rounded-full bg-accent-gradient text-on-accent hover:opacity-90">Login</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;