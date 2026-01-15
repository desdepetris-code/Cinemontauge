
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
  const cmLogoUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZ0ciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNDUwYTBhIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMmEwMTM0Ii8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImNtRyIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjRkNGQiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzAwZmZmZiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmNGQ0ZCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSJ1cmwoI2JnRykiLz48dGV4dCB4PSIyNTYiIHk9IjM2MCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9InVybCgjY21HKSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjQiIGZvbnQtd2VpZ2h0PSJib2xkIj5DTTwvdGV4dD48cmVjdCB4PSI1MCIgeT0iMjQwIiB3aWR0aD0iNDEyIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjMDAwIi8+PHRleHQgeD0iMjU2IiB5PSIyNzIiIGZvbnQtZmFtaWx5PSJJbnRlciwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgbGV0dGVyLXNwYWNpbmc9IjEyIiBmb250LXdlaWdodD0iYm9sZCI+Q0lORU1PTlRBVUdFPC90ZXh0Pjwvc3ZnPg==";

  const hoverClasses = hoverReveal ? "opacity-0 hover:opacity-100 transition-opacity duration-300" : "opacity-100";

  return (
    <header className={`sticky top-0 z-30 py-2 px-6 bg-backdrop backdrop-blur-md shadow-lg border-b border-primary-accent/10 ${hoverClasses}`}>
      <div className="container mx-auto flex justify-between items-center gap-4">
        <div 
          onClick={onGoHome}
          className="flex flex-col items-center cursor-pointer group flex-shrink-0"
        >
            <img src={cmLogoUri} alt="CineMontauge Logo" className="h-8 w-auto transition-transform duration-500 group-hover:scale-110" />
            <h1 className="text-[10px] font-black text-text-primary tracking-[0.1em] mt-0.5 group-hover:text-primary-accent transition-colors">CineM<span className="lowercase">ontauge</span></h1>
        </div>

        <div className="flex-1 flex justify-center items-center max-w-xl">
            {isHoliday && (
                <div className="hidden md:flex items-center space-x-2 mr-4 px-3 py-1 bg-primary-accent/10 border border-primary-accent/20 rounded-full shadow-sm animate-fade-in">
                    <span role="img" aria-label="Party Popper">🎉</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">{holidayName}</span>
                </div>
            )}
            {!isOnSearchScreen && (
                <SearchBar 
                    onSelectResult={onSelectShow} 
                    onMarkShowAsWatched={onMarkShowAsWatched} 
                    value={query} 
                    onChange={onQueryChange}
                    dropdownWider
                />
            )}
        </div>
        
        <div className="flex items-center justify-end w-32 md:w-48 flex-shrink-0">
          {currentUser ? (
            <button
              onClick={onGoToProfile}
              className="flex items-center space-x-2 rounded-full p-1 transition-all hover:bg-white/5 group"
            >
              <img
                src={profilePictureUrl || `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzY0NzQ4YiI+PHBhdGggZD0iTTEyIDEyYzIuMjEgMCA0LTEuNzkgNC00cy0xLjc5LTQtNC00LTQgMS43OS00IDQgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiI+PC9wYXRoPjwvc3ZnPg==`}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover bg-bg-secondary border border-transparent group-hover:border-primary-accent"
              />
              <span className="hidden md:block text-[10px] font-bold text-text-primary uppercase tracking-widest truncate max-w-[80px]">{currentUser.username}</span>
            </button>
          ) : (
            <button onClick={onAuthClick} className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full bg-accent-gradient text-on-accent hover:opacity-90">Login</button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
