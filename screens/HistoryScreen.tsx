import React, { useState, useMemo } from 'react';
import { HistoryItem, UserData, SearchHistoryItem, TmdbMedia, TrackedItem } from '../types';
import { TrashIcon, ChevronDownIcon, StarIcon, SearchIcon } from '../components/Icons';
import ListGrid from '../components/ListGrid';
import { formatDate, formatDateTime, formatTimeFromDate } from '../utils/formatUtils';
import Carousel from '../components/Carousel';
import CompactShowCard from '../components/CompactShowCard';
import { getImageUrl } from '../utils/imageUtils';

type HistoryTab = 'watch' | 'search' | 'ratings' | 'favorites' | 'comments';

// --- WATCH HISTORY TAB ---

const WatchHistory: React.FC<{
  history: HistoryItem[];
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  timezone: string;
}> = ({ history, onSelectShow, onDeleteHistoryItem, timezone }) => {
  type HistoryFilter = 'all' | 'tv' | 'movie';
  type DateFilter = 'all' | 'today' | 'week' | 'month';

  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sortedHistory = useMemo(() => {
    let items = history;

    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        items = items.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.episodeTitle?.toLowerCase().includes(query)
        );
    }

    if (filter !== 'all') {
      items = items.filter(item => item.media_type === filter);
    }

    const now = new Date();
    if (dateFilter !== 'all') {
      items = items.filter(item => {
        const itemDate = new Date(item.timestamp);
        if (dateFilter === 'today') {
          return itemDate.toDateString() === now.toDateString();
        }
        if (dateFilter === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          return itemDate >= oneWeekAgo;
        }
        if (dateFilter === 'month') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          return itemDate >= oneMonthAgo;
        }
        return true;
      });
    }
    // The history from props should already be sorted, but let's be safe.
    return [...items].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [history, filter, dateFilter, searchQuery]);

  const formatHistoryDate = (dateString: string, timezone: string) => {
    const date = new Date(dateString);
    const currentYear = new Date().getFullYear();
    const itemYear = date.getFullYear();

    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = currentYear === itemYear ? null : itemYear;
    
    const fullWithTime = formatDateTime(dateString, timezone);

    return { day, month, year, fullWithTime };
  };

  return (
    <div>
      <div className="mb-6 flex flex-col space-y-4">
        <div className="relative">
            <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-secondary text-text-primary placeholder-text-secondary rounded-lg border border-transparent focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent transition-all"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="relative">
            <select value={filter} onChange={(e) => setFilter(e.target.value as HistoryFilter)} className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent">
                <option value="all">All Types</option>
                <option value="tv">TV Shows</option>
                <option value="movie">Movies</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
            </div>
            <div className="relative">
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent">
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
            </div>
        </div>
      </div>
      <section>
        {sortedHistory.length > 0 ? (
          <div className="space-y-4">
            {sortedHistory.map(item => {
              const { day, month, year, fullWithTime } = formatHistoryDate(item.timestamp, timezone);
              return (
                <div key={item.logId} className="history-item p-3 bg-card-gradient rounded-lg shadow-md flex items-center space-x-4 group">
                    <img 
                        src={getImageUrl(item.poster_path, 'w154')} 
                        alt={item.title} 
                        className="w-24 h-36 object-contain bg-slate-900 rounded-md flex-shrink-0 cursor-pointer shadow-lg"
                        onClick={() => onSelectShow(item.id, item.media_type)}
                    />
                    <div 
                        className="flex-grow min-w-0 cursor-pointer flex flex-col justify-center"
                        onClick={() => onSelectShow(item.id, item.media_type)}
                    >
                        <p className="font-bold text-lg text-text-primary">{item.title}</p>
                        {item.media_type === 'tv' ? (
                        <>
                            <p className="text-sm font-semibold text-text-secondary">
                                Season {item.seasonNumber}: Episode {item.episodeNumber}
                            </p>
                            {item.episodeTitle && <p className="text-sm text-text-secondary italic">"{item.episodeTitle}"</p>}
                        </>
                        ) : (
                        <p className="text-sm font-semibold text-text-secondary">Movie</p>
                        )}
                        <p className="full-date mt-2">{fullWithTime}</p>
                    </div>
                    <div className="date-badge ml-auto">
                        <span className="day">{day}</span>
                        <span className="month">{month}</span>
                        {year && <span className="year">{year}</span>}
                    </div>
                    <button
                        onClick={() => onDeleteHistoryItem(item)}
                        className="p-2 rounded-full text-text-secondary/70 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        aria-label="Delete from history"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-bg-secondary/30 rounded-lg">
            <h2 className="text-xl font-bold">No History Found</h2>
            <p className="mt-2 text-text-secondary">
                {searchQuery ? "No matching records found." : "Your watch history for the selected filters is empty."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

// --- SEARCH HISTORY TAB ---

const SearchHistory: React.FC<{
  searchHistory: SearchHistoryItem[];
  onDelete: (timestamp: string) => void;
  onClear: () => void;
  timezone: string;
}> = ({ searchHistory, onDelete, onClear, timezone }) => (
  <div>
    {searchHistory.length > 0 && <button onClick={onClear} className="mb-4 text-sm font-semibold text-red-500 hover:underline">Clear All Searches</button>}
    {searchHistory.length > 0 ? (
      <ul className="divide-y divide-bg-secondary/50">
        {searchHistory.map(item => (
          <li key={item.timestamp} className="py-3 flex items-center justify-between">
            <div>
              <p className="text-text-primary">{item.query}</p>
              <p className="text-xs text-text-secondary">{formatDateTime(item.timestamp, timezone)}</p>
            </div>
            <button onClick={() => onDelete(item.timestamp)} className="p-2 rounded-full text-text-secondary hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
          </li>
        ))}
      </ul>
    ) : <div className="text-center py-20 bg-bg-secondary/30 rounded-lg"><h2 className="text-xl font-bold">No Search History</h2><p className="mt-2 text-text-secondary">Your recent searches will appear here.</p></div>}
  </div>
);

// --- MAIN SCREEN ---
interface HistoryScreenProps {
  userData: UserData;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  genres: Record<number, string>;
  timezone: string;
}

const HistoryScreen: React.FC<HistoryScreenProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('watch');

  // FIX: Renamed 'tabs' to 'historyTabs' to avoid a potential name collision.
  const historyTabs: { id: HistoryTab, label: string }[] = [
    { id: 'watch', label: 'Watch' },
    { id: 'search', label: 'Search' },
    { id: 'ratings', label: 'Ratings' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'comments', label: 'Comments' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'watch': return <WatchHistory history={props.userData.history} onSelectShow={props.onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} timezone={props.timezone} />;
      case 'search': return <SearchHistory searchHistory={props.userData.searchHistory} onDelete={props.onDeleteSearchHistoryItem} onClear={props.onClearSearchHistory} timezone={props.timezone} />;
      case 'ratings': return <div className="text-center py-10"><p className="text-text-secondary">Ratings history coming soon!</p></div>;
      case 'favorites': return <ListGrid items={props.userData.favorites} onSelect={props.onSelectShow} />;
      case 'comments': return <div className="text-center py-10"><p className="text-text-secondary">Comments history coming soon!</p></div>;
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 border-b border-bg-secondary/50">
        <Carousel>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
              {historyTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-colors ${activeTab === tab.id ? 'bg-accent-gradient text-on-accent' : 'bg-bg-secondary text-text-secondary hover:brightness-125'}`}
                >{tab.label}</button>
              ))}
            </div>
        </Carousel>
      </div>
      {renderContent()}
    </div>
  );
};

export default HistoryScreen;
