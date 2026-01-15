
import React from 'react';
import { XMarkIcon, SearchIcon, SparklesIcon } from './Icons';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  timezone: string;
  setTimezone: (timezone: string) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, timezone, setTimezone }) => {
  if (!isOpen) return null;

  const timezones = [
      { id: 'America/New_York', name: 'Eastern Time (ET)' },
      { id: 'America/Chicago', name: 'Central Time (CT)' },
      { id: 'America/Denver', name: 'Mountain Time (MT)' },
      { id: 'America/Los_Angeles', name: 'Pacific Time (PT)' },
      { id: 'Europe/London', name: 'London (GMT/BST)' },
      { id: 'Europe/Berlin', name: 'Central Europe (CET)' },
      { id: 'Asia/Tokyo', name: 'Tokyo (JST)' },
      { id: 'Australia/Sydney', name: 'Sydney (AEST)' },
      { id: 'Etc/UTC', name: 'Coordinated Universal Time (UTC)' },
  ];

  const iconDataUri = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJiZ0ciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjNDUwYTBhIi8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMmEwMTM0Ii8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImNtRyIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjRkNGQiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzAwZmZmZiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI2ZmNGQ0ZCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiBmaWxsPSJ1cmwoI2JnRykiLz48dGV4dCB4PSIyNTYiIHk9IjM2MCIgZm9udC1mYW1pbHk9IidUaW1lcyBOZXcgUm9tYW4nLCBzZXJpZiIgZm9udC1zaXplPSIyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9InVybCgjY21HKSIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjQiIGZvbnQtd2VpZ2h0PSJib2xkIj5DTTwvdGV4dD48cmVjdCB4PSI1MCIgeT0iMjQwIiB3aWR0aD0iNDEyIiBoZWlnaHQ9IjQ1IiBmaWxsPSIjMDAwIi8+PHRleHQgeD0iMjU2IiB5PSIyNzIiIGZvbnQtZmFtaWx5PSJJbnRlciwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iI2ZmZiIgbGV0dGVyLXNwYWNpbmc9IjEyIiBmb250LXdlaWdodD0iYm9sZCI+Q0lORU1PTlRBVUdFPC90ZXh0Pjwvc3ZnPg==";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in relative text-center" onClick={e => e.stopPropagation()}>
        <img src={iconDataUri} alt="cinemontauge Logo" className="h-24 w-auto mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-text-primary mb-2">Welcome to CINEMONTAUGE!</h2>
        <p className="text-text-secondary mb-6">Your personal gallery of cinematic moments. Start tracking and journaling your favorite shows and movies today.</p>
        <div className="text-left space-y-4 mb-8 bg-bg-secondary p-4 rounded-lg">
            <div className="text-left space-y-2 mb-6">
                <label htmlFor="timezone-select" className="block text-sm font-medium text-text-secondary">To ensure dates are accurate, please select your timezone:</label>
                <select id="timezone-select" value={timezone} onChange={e => setTimezone(e.target.value)} className="w-full p-2 bg-bg-primary text-text-primary rounded-md border border-bg-secondary focus:outline-none focus:ring-2 focus:ring-primary-accent">
                    {timezones.map(tz => <option key={tz.id} value={tz.id}>{tz.name}</option>)}
                </select>
            </div>
            <div className="flex items-start space-x-3">
                <SearchIcon className="w-6 h-6 text-primary-accent flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-text-primary">Find Your Favorites</h4>
                    <p className="text-sm text-text-secondary">Use the search bar at the top to instantly find any movie or show.</p>
                </div>
            </div>
             <div className="flex items-start space-x-3">
                <SparklesIcon className="w-6 h-6 text-primary-accent flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-semibold text-text-primary">Discover Something New</h4>
                    <p className="text-sm text-text-secondary">Check out the personalized recommendations based on your unique taste.</p>
                </div>
            </div>
        </div>
        <button onClick={onClose} className="w-full px-6 py-3 rounded-md text-white bg-accent-gradient hover:opacity-90 transition-opacity font-semibold">Begin Your Montage</button>
      </div>
    </div>
  );
};

export default WelcomeModal;
