import React from 'react';
import SearchBar from './SearchBar';
import { TmdbMedia } from './types';

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
}

const Header: React.FC<HeaderProps> = ({ currentUser, profilePictureUrl, onAuthClick, onGoToProfile, onSelectShow, onGoHome, onMarkShowAsWatched, query, onQueryChange, isOnSearchScreen, isHoliday, holidayName }) => {
  const iconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJhIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0ZERTA0NyIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0VBQjMwOCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiByeD0iMzIiIGZpbGw9IiMwMDAwMDAiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyNCAyNCkgc2NhbGUoLjYyNSkiPjxyZWN0IHk9IjQwIiB3aWR0aD0iMTI4IiBoZWlnaHQ9Ijg4IiByeD0iOCIgZmlsbD0iIzFGMjkzNyIvPjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMzIiIHJ4PSI0IiBmaWxsPSIjMzc0MTUxIi8+PHBhdGggZD0iTTIwIDBoMjBMMjAgMzJIMHpNNjAgMGgyMEw2MCAzMkg0MHpNMTAwIDBoMjBMMTAwIDMySDgwIoiIGZpbGw9IiNGREUwNDciLz48Y2lyY2xlIGN4PSI2NCIgY3k9Ijg0IiByPSIyOCIgZmlsbD0idXJsKCNhKSIvPjxwYXRoIGQ9Ik01NiA3MmwyMiAxMi0yMiAxMnoiIGZpbGw9IiMwMDAiLz48L2c+PC9zdmc+";
  return (
    <header className="sticky top-0 z-30 py-2 px-6 bg-backdrop backdrop-blur-md shadow-lg">
      <div className="container mx-auto flex justify-between items-center gap-4">
        <div 
          onClick={onGoHome}
          className="flex flex-col items-center flex-shrink-0 cursor-pointer"
        >
            <img src={iconDataUri} alt="SceneIt Logo" className="h-8 w-8" />
            <h1 className="text-xs font-bold bg-accent-gradient bg-clip-text text-transparent -mt-1 uppercase tracking-tighter">CineMontauge</h1>
        </div>

        <div className="flex-1 flex justify-center items-center">
            {isHoliday && (
                <div className="hidden md:flex items-center space-x-2 mr-4 px-3 py-1 bg-card-gradient rounded-full shadow-md animate-fade-in">
                    <span role="img" aria-label="Party Popper">🎉</span>
                    