import React from 'react';
import SearchBar from './SearchBar';

interface HeaderProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const Header: React.FC<HeaderProps> = ({ onSelectShow }) => {
  const iconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDEyOCAxMjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZy1ncmFkIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzRGNDZFNSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzMxMkU4MSIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjbGFwcGVyLWJvZHktZ3JhZCIgeDE9IjAuNSIgeTE9IjAiIHgyPSIwLjUiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9vcC1jb2xvcj0iIzM3NDE1MSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzFGMjkzNyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjbGFwcGVyLXRvcC1ncmFkIiB4MT0iMC41IiB5MT0iMCIgeDI9IjAuNSIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM0QjU1NjMiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiMzNzQxNTEiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0iYWNjZW50LWdyYWQiIHgxPSIwLjUiIHkxPSIwIiB4Mj0iMC41IiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0E3OEJGRiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzg4NTBGRjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjQiIHJ5PSIyNCIgZmlsbD0iIzFFMUI0QiIvPjxyZWN0IHg9IjE0IiB5PSIxNCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHJ4PSIyMCIgcnk9IjIwIiBmaWxsPSJ1cmwoI2JnLWdyYWQpIi8+PHJlY3QgeD0iMTgiIHk9IjE4IiB3aWR0aD0iOTIiIGhlaWdodD0iOTIiIHJ4PSIxNiIgcnk9IjE2IiBmaWxsPSIjMzEyRTgxIiBmaWxsLW9wYWNpdHk9IjAuNSIvPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDI0LCAyOSkiPjxyZWN0IHg9IjIiIHk9IjI0IiB3aWR0aD0iODAiIGhlaWdodD0iNTAiIHJ4PSI1IiByeT0iNSIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjIiLz48cmVjdCB4PSIwIiB5PSIyMiIgd2lkdGg9IjgwIiBoZWlnaHQ9IjUwIiByeD0iNSIgcnk9IjUiIGZpbGw9InVybCgjY2xhcHBlci1ib2R5LWdyYWQpIi8+PHBhdGggZD0iTTMyIDM4IEw1MiA1MCBMMyA2MiBaIiBmaWxsPSJ1cmwoI2FjY2VudC1ncmFkKSIvPjxnIHRyYW5zZm9ybT0icm90YXRlKC01IDAgOSkiPjxwYXRoIGQ9Ik0yIDIgSDgyIEw3NyAyMCBILTMgWiIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjIiLz48L2c+PGcgdHJhbnNmb3JtPSJyb3RhdGUoLTUgMCA5KSI+PHBhdGggZD0iTTAgMCBIODAgTDc1IDE4IEgtNSBaIiBmaWxsPSJ1cmwoI2NsYXBwZXItdG9wLWdyYWQpIi8+PHBhdGggZD0iTTUgMiBIMTggTDEzIDE2IEgwIFoiIGZpbGw9InVybCgjYWNjZW50LWdyYWQpIi8+PHBhdGggZD0iTTI1IDIgSDM4IEwzMyAxNiBIMjAgWiIgZmlsbD0idXJsKCNhY2NlbnQtZ3JhZCkiLz48cGF0aCBkPSJNNDUgMiBINTggTDUzIDE2IEg0MCBaIiBmaWxsPSJ1cmwoI2FjY2VudC1ncmFkKSIvPjxwYXRoIGQ9Ik02NSAyIEg3OCBMNzMgMTYgSDYwIFoiIGZpbGw9InVybCgjYWNjZW50LWdyYWQpIi8+PC9nPjwvZz48L3N2Zz4=";
  return (
    <header className="sticky top-0 z-30 py-4 px-6 bg-backdrop backdrop-blur-md shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <img src={iconDataUri} alt="SceneIt Logo" className="h-8 w-8" />
            <h1 className="text-2xl font-bold text-text-primary">SceneIt</h1>
        </div>
        <div className="flex-1 px-8">
            <SearchBar onSelectResult={onSelectShow} />
        </div>
      </div>
    </header>
  );
};

export default Header;