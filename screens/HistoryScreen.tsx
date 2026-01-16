import React, { useState, useMemo } from 'react';
import { HistoryItem, UserData, SearchHistoryItem, TmdbMedia, TrackedItem, Comment, UserRatings } from '../types';
import { TrashIcon, ChevronDownIcon, StarIcon, SearchIcon, ClockIcon, ChatBubbleOvalLeftEllipsisIcon, HeartIcon } from '../components/Icons';
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
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="relative">
            <input
                type="text"
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-bg-secondary text-text-primary placeholder-text-secondary rounded-xl border border-white/5 focus:border-primary-accent focus:outline-none focus:ring-1 focus:ring-primary-accent transition-all shadow-inner"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="relative">
                <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value as HistoryFilter)} 
                    className="w-full appearance-none bg-bg-secondary border-none rounded-xl py-2 px-3 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-accent shadow-sm"
                >
                    <option value="all">All Types</option>
                    <option value="tv">TV Shows</option>
                    <option value="movie">Movies</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
            </div>
            <div className="relative">
                <select 
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value as DateFilter)} 
                    className="w-full appearance-none bg-bg-secondary border-none rounded-xl py-2 px-3 text-text-primary text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-accent shadow-sm"
                >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none" />
            </div>
        </div>
      </div>

      <section className="space-y-4">
        {sortedHistory.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {sortedHistory.map(item => {
              const { day, month, year, fullWithTime } = formatHistoryDate(item.timestamp, timezone);
              
              // Fallback logic for images
              const imagePaths = [
                  item.episodeStillPath ? getImageUrl(item.episodeStillPath, 'w500', 'still') : null,
                  item.seasonPosterPath ? getImageUrl(item.seasonPosterPath, 'w342') : null,
                  item.poster_path ? getImageUrl(item.poster_path, 'w342') : null
              ].filter(Boolean);

              return (
                <div key={item.logId} className="group relative bg-bg-secondary/20 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden transition-all hover:bg-bg-secondary/40 flex items-center p-3 gap-4">
                    <div className="w-20 h-30 sm:w-24 sm:h-36 flex-shrink-0 cursor-pointer shadow-2xl rounded-xl overflow-hidden bg-black/40 border border-white/10" onClick={() => onSelectShow(item.id, item.media_type)}>
                        <img 
                            src={imagePaths[0] || getImageUrl(null, 'w342')} 
                            alt={item.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    </div>
                    <div 
                        className="flex-grow min-w-0 cursor-pointer"
                        onClick={() => onSelectShow(item.id, item.media_type)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${item.media_type === 'tv' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {item.media_type}
                            </span>
                            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-tighter opacity-60">
                                {formatTimeFromDate(item.timestamp, timezone)}
                            </span>
                        </div>
                        <h3 className="font-black text-lg text-text-primary truncate leading-tight group-hover:text-primary-accent transition-colors">{item.title}</h3>
                        {item.media_type === 'tv' && (
                            <div className="mt-1">
                                <p className="text-sm font-bold text-text-secondary uppercase tracking-widest">
                                    Season {item.seasonNumber} • Episode {item.episodeNumber}
                                </p>
                                {item.episodeTitle && <p className="text-sm text-text-secondary/70 italic truncate mt-0.5 font-medium">"{item.episodeTitle}"</p>}
                            </div>
                        )}
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mt-3 opacity-40">{fullWithTime}</p>
                    </div>

                    <div className="flex flex-col items-center justify-between h-full py-2">
                        <div className="flex flex-col items-center bg-bg-primary/60 backdrop-blur-md rounded-xl p-2 min-w-[50px] shadow-lg border border-white/5">
                            <span className="text-xs font-black text-primary-accent uppercase tracking-widest leading-none">{month}</span>
                            <span className="text-2xl font-black text-text-primary leading-none mt-1">{day}</span>
                            {year && <span className="text-[10px] font-bold text-text-secondary mt-1">{year}</span>}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item); }}
                            className="mt-4 p-2 rounded-full text-text-secondary/30 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Delete from history"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5">
            <ClockIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Timeline Empty</h2>
            <p className="mt-2 text-text-secondary font-medium px-10">
                {searchQuery ? "No matching moments found in your history." : "Your cinematic journey is just beginning. Start tracking to see your timeline grow."}
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
  <div className="space-y-6">
    <div className="flex justify-between items-center px-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-secondary opacity-60">Recent Searches</h2>
        {searchHistory.length > 0 && <button onClick={onClear} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">Clear All</button>}
    </div>
    {searchHistory.length > 0 ? (
      <ul className="space-y-2">
        {searchHistory.map(item => (
          <li key={item.timestamp} className="bg-bg-secondary/30 rounded-xl p-4 flex items-center justify-between hover:bg-bg-secondary/50 transition-colors">
            <div className="flex items-center gap-4">
                <SearchIcon className="w-5 h-5 text-primary-accent" />
                <div>
                  <p className="text-text-primary font-bold">{item.query}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/60 mt-0.5">{formatDateTime(item.timestamp, timezone)}</p>
                </div>
            </div>
            <button onClick={() => onDelete(item.timestamp)} className="p-2 rounded-full text-text-secondary/30 hover:text-red-500 hover:bg-red-500/10 transition-all"><TrashIcon className="w-5 h-5"/></button>
          </li>
        ))}
      </ul>
    ) : <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5">
        <SearchIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" />
        <p className="text-text-secondary font-black uppercase tracking-widest">No Search History</p>
    </div>}
  </div>
);

// --- RATINGS HISTORY TAB ---
const RatingsHistory: React.FC<{ ratings: UserRatings; onSelect: (id: number) => void }> = ({ ratings, onSelect }) => {
    const sortedRatings = useMemo(() => {
        return Object.entries(ratings)
            // FIX: Added type casting to b[1] and a[1] to fix "Property 'date' does not exist on type 'unknown'" error.
            .sort((a, b) => new Date((b[1] as { date: string }).date).getTime() - new Date((a[1] as { date: string }).date).getTime());
    }, [ratings]);

    return (
        <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-secondary opacity-60 px-2">Your Rated Items</h2>
            {sortedRatings.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {sortedRatings.map(([id, info]) => (
                        <div key={id} onClick={() => onSelect(Number(id))} className="bg-bg-secondary/30 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-bg-secondary/50 transition-all border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-18 bg-bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                                    <img src={getImageUrl(null, 'w92')} className="w-full h-full object-cover grayscale opacity-20" alt="" />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Item #{id}</span>
                                    <div className="flex gap-1 mt-1">
                                        {[1,2,3,4,5].map(star => (
                                            <StarIcon key={star} filled={info.rating >= star} className={`w-3 h-3 ${info.rating >= star ? 'text-yellow-500' : 'text-text-secondary/20'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-text-secondary/40 uppercase tracking-tighter">{formatDate(info.date, 'UTC', { month: 'short', day: 'numeric' })}</span>
                        </div>
                    ))}
                </div>
            ) : <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5"><StarIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" /><p className="text-text-secondary font-black uppercase tracking-widest">No ratings found</p></div>}
        </div>
    );
};

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

  const historyTabs: { id: HistoryTab, label: string, icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { id: 'watch', label: 'Timeline', icon: ClockIcon },
    { id: 'search', label: 'Searches', icon: SearchIcon },
    { id: 'ratings', label: 'Ratings', icon: StarIcon },
    { id: 'favorites', label: 'Favorites', icon: HeartIcon },
    { id: 'comments', label: 'Comments', icon: ChatBubbleOvalLeftEllipsisIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'watch': return <WatchHistory history={props.userData.history} onSelectShow={props.onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} timezone={props.timezone} />;
      case 'search': return <SearchHistory searchHistory={props.userData.searchHistory} onDelete={props.onDeleteSearchHistoryItem} onClear={props.onClearSearchHistory} timezone={props.timezone} />;
      case 'ratings': return <RatingsHistory ratings={props.userData.ratings} onSelect={(id) => props.onSelectShow(id, 'movie')} />; // Simplifying type here
      case 'favorites': return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {props.userData.favorites.length > 0 ? props.userData.favorites.map(item => <CompactShowCard key={item.id} item={item} onSelect={props.onSelectShow} />) : <div className="col-span-full py-20 text-center"><p className="text-text-secondary font-black uppercase tracking-widest">No favorites yet</p></div>}
        </div>
      );
      case 'comments': return (
        <div className="space-y-4">
            {props.userData.comments.length > 0 ? props.userData.comments.map(c => (
                <div key={c.id} className="bg-bg-secondary/30 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black text-primary-accent uppercase tracking-widest mb-1">{c.mediaKey}</p>
                    <p className="text-text-primary text-sm line-clamp-3">"{c.text}"</p>
                    <p className="text-[10px] font-black text-text-secondary/40 uppercase tracking-tighter mt-3 text-right">{formatDate(c.timestamp, props.timezone)}</p>
                </div>
            )) : <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-4 border-dashed border-white/5"><ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 text-text-secondary/20 mx-auto mb-4" /><p className="text-text-secondary font-black uppercase tracking-widest">No discussions yet</p></div>}
        </div>
      );
      default: return null;
    }
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 pb-20">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Your Legacy</h1>
        <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.2em] mt-1 opacity-60">Archive of your cinematic memories</p>
      </header>

      <div className="mb-8 relative">
        <div className="flex p-1 bg-bg-secondary/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-x-auto hide-scrollbar">
            {historyTabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap flex-1 ${activeTab === tab.id ? 'bg-accent-gradient text-on-accent shadow-xl scale-[1.02]' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default HistoryScreen;