import React, { useState, useMemo } from 'react';
import { HistoryItem, UserData, SearchHistoryItem, TmdbMedia, TrackedItem, Comment, UserRatings, DeletedHistoryItem } from '../types';
import { TrashIcon, ChevronDownIcon, StarIcon, SearchIcon, ClockIcon, ChatBubbleOvalLeftEllipsisIcon, HeartIcon, CalendarIcon, TvIcon, FilmIcon, XMarkIcon, ListBulletIcon, SparklesIcon, TrophyIcon, ArrowPathIcon, InformationCircleIcon } from '../components/Icons';
import { formatDate, formatDateTime, formatTimeFromDate } from '../utils/formatUtils';
import Carousel from '../components/Carousel';
import CompactShowCard from '../components/CompactShowCard';
import ActionCard from '../components/ActionCard';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from '../components/FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL } from '../constants';

type HistoryTab = 'watch' | 'search' | 'ratings' | 'favorites' | 'comments' | 'deleted';

// --- WATCH HISTORY TAB ---
type WatchHistoryFilter = 'all' | 'shows' | 'movies' | 'seasons' | 'episodes' | 'movies_episodes' | 'movies_seasons';

const WatchHistory: React.FC<{
  history: HistoryItem[];
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  timezone: string;
}> = ({ history, onSelectShow, onDeleteHistoryItem, timezone }) => {
  const [activeFilter, setActiveFilter] = useState<WatchHistoryFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [searchQuery, setSearchQuery] = useState('');

  const processedHistory = useMemo(() => {
    let items = [...history];
    if (selectedDate) items = items.filter(i => new Date(i.timestamp).toISOString().split('T')[0] === selectedDate);
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        items = items.filter(i => i.title.toLowerCase().includes(query) || i.episodeTitle?.toLowerCase().includes(query));
    }
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    switch (activeFilter) {
        case 'shows': {
            const grouped = new Map<number, HistoryItem>();
            items.filter(h => h.media_type === 'tv').forEach(item => {
                if (!grouped.has(item.id)) grouped.set(item.id, { ...item, episodeNumber: undefined, logId: `show-group-${item.id}` });
            });
            return Array.from(grouped.values());
        }
        case 'episodes': return items.filter(h => h.media_type === 'tv');
        case 'movies': return items.filter(h => h.media_type === 'movie');
        case 'seasons': {
            const grouped = new Map<string, HistoryItem>();
            items.filter(h => h.media_type === 'tv').forEach(item => {
                const key = `${item.id}-s${item.seasonNumber}`;
                if (!grouped.has(key)) grouped.set(key, { ...item, episodeNumber: undefined, logId: `season-group-${key}` });
            });
            return Array.from(grouped.values());
        }
        default: return items;
    }
  }, [history, activeFilter, searchQuery, selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
                <input type="text" placeholder="Search history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 font-bold" />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-primary opacity-80" />
            </div>
            <div className="relative min-w-[180px]">
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-10 pr-10 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-accent pointer-events-none" />
                {selectedDate && <button onClick={() => setSelectedDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"><XMarkIcon className="w-5 h-5" /></button>}
            </div>
        </div>
        <Carousel>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
                {(['all', 'shows', 'movies', 'seasons', 'episodes'] as const).map(id => (
                    <button key={id} onClick={() => setActiveFilter(id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all type-box-filter ${activeFilter === id ? 'bg-accent-gradient text-on-accent' : 'bg-bg-primary text-text-primary/70'}`}>
                        <span>{id}</span>
                    </button>
                ))}
            </div>
        </Carousel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {processedHistory.map(item => {
            const watchDate = new Date(item.timestamp);
            const month = watchDate.toLocaleString('default', { month: 'short' });
            const day = watchDate.getDate();

            return (
                <div key={item.logId} className="bg-bg-secondary/20 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl animate-fade-in group">
                    {/* Top Image Section */}
                    <div className="w-full aspect-video relative cursor-pointer overflow-hidden" onClick={() => onSelectShow(item.id, item.media_type)}>
                        <FallbackImage srcs={[getImageUrl(item.episodeStillPath || item.seasonPosterPath || item.poster_path, 'w780')]} placeholder={PLACEHOLDER_POSTER} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        
                        {/* Date Widget Thing Overlay */}
                        <div className="absolute top-4 right-4 flex flex-col items-center bg-backdrop/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 shadow-lg min-w-[50px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary-accent leading-none mb-0.5">{month}</span>
                            <span className="text-xl font-black text-white leading-none">{day}</span>
                        </div>
                    </div>

                    {/* Bottom Info Section */}
                    <div className="p-6 flex items-center justify-between gap-4">
                        <div className="flex-grow min-w-0">
                            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight truncate leading-tight group-hover:text-primary-accent transition-colors">
                                {item.title}
                            </h3>
                            {item.media_type === 'tv' && (
                                <p className="text-xs font-black text-primary-accent/80 uppercase tracking-[0.1em] mt-1">
                                    S{item.seasonNumber} E{item.episodeNumber} {item.episodeTitle && <span className="text-text-secondary opacity-60 ml-1"> &bull; {item.episodeTitle}</span>}
                                </p>
                            )}
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-2 opacity-50">
                                {formatDateTime(item.timestamp, timezone)}
                            </p>
                        </div>

                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item); }}
                            className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg border border-red-500/20"
                            title="Delete this capture"
                        >
                            <TrashIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

// --- RECENTLY DELETED TAB ---
const RecentlyDeleted: React.FC<{
    items: DeletedHistoryItem[];
    onRestore: (item: DeletedHistoryItem) => void;
    onPermanentDelete: (logId: string) => void;
    timezone: string;
}> = ({ items, onRestore, onPermanentDelete, timezone }) => {
    const sortedItems = useMemo(() => [...items].sort((a,b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()), [items]);

    const getDaysRemaining = (deletedAt: string) => {
        const diff = Date.now() - new Date(deletedAt).getTime();
        const daysPassed = diff / (1000 * 60 * 60 * 24);
        return Math.max(0, Math.ceil(30 - daysPassed));
    };

    return (
        <div className="space-y-6">
            <div className="p-4 bg-primary-accent/5 rounded-2xl border border-primary-accent/10 flex items-center gap-4">
                <InformationCircleIcon className="w-6 h-6 text-primary-accent flex-shrink-0" />
                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                    Items deleted in the last 30 days are stored here. After 30 days, they are permanently removed automatically. 
                    Restoring an item will place it back into your main watch history timeline.
                </p>
            </div>

            {sortedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedItems.map(item => (
                        <div key={item.logId} className="flex gap-4 p-4 bg-bg-secondary/20 rounded-2xl border border-white/5 group animate-fade-in opacity-80 hover:opacity-100 transition-opacity">
                            <img src={getImageUrl(item.poster_path, 'w92')} className="w-16 h-24 rounded-lg object-cover bg-bg-secondary flex-shrink-0" alt="" />
                            <div className="flex-grow min-w-0 flex flex-col justify-center">
                                <h3 className="text-text-primary font-black uppercase tracking-tight truncate">{item.title}</h3>
                                {item.media_type === 'tv' && (
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">
                                        S{item.seasonNumber} E{item.episodeNumber}
                                    </p>
                                )}
                                <div className="mt-3 flex items-center gap-2">
                                    <div className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md text-[9px] font-black uppercase tracking-widest border border-red-500/20">
                                        {getDaysRemaining(item.deletedAt)} Days Left
                                    </div>
                                    <span className="text-[9px] font-black text-text-secondary/40 uppercase tracking-widest">Deleted {new Date(item.deletedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 self-center">
                                <button 
                                    onClick={() => onRestore(item)}
                                    className="p-3 bg-bg-secondary rounded-xl text-text-primary hover:text-green-400 hover:bg-green-400/10 transition-all border border-white/5"
                                    title="Restore Log"
                                >
                                    <ArrowPathIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => { if(window.confirm("Permanently delete this log?")) onPermanentDelete(item.logId); }}
                                    className="p-3 bg-bg-secondary rounded-xl text-text-primary hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5"
                                    title="Delete Permanently"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 opacity-50 flex flex-col items-center">
                    <TrashIcon className="w-16 h-16 text-text-secondary/20 mb-4" />
                    <p className="text-text-secondary font-black uppercase tracking-widest">No recently deleted items</p>
                </div>
            )}
        </div>
    );
};

// --- SEARCH HISTORY TAB ---
const SearchHistory: React.FC<{
  searchHistory: SearchHistoryItem[];
  onDelete: (timestamp: string) => void;
  onClear: () => void;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  timezone: string;
}> = ({ searchHistory, onDelete, onClear, onSelectShow, timezone }) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center px-2">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-secondary opacity-60">Recent Activity</h2>
        {searchHistory.length > 0 && <button onClick={() => { if(window.confirm("Clear all search history?")) onClear(); }} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline">Clear All</button>}
    </div>
    {searchHistory.length > 0 ? (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {searchHistory.map(item => (
          <div key={item.timestamp} className="relative group">
            <button onClick={() => onDelete(item.timestamp)} className="absolute -top-2 -right-2 z-30 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><XMarkIcon className="w-3.5 h-3.5" /></button>
            {item.item ? (
              <div className="space-y-2 cursor-pointer" onClick={() => onSelectShow(item.item!.id, item.item!.media_type)}>
                <ActionCard item={item.item as any} onSelect={() => onSelectShow(item.item!.id, item.item!.media_type)} onOpenAddToListModal={() => {}} onMarkShowAsWatched={() => {}} onToggleFavoriteShow={() => {}} isFavorite={false} isCompleted={false} showRatings={false} showSeriesInfo="hidden" />
                <p className="text-[8px] font-black text-text-secondary/40 uppercase tracking-widest text-center">{formatDate(item.timestamp, timezone, { month: 'short', day: 'numeric' })}</p>
              </div>
            ) : (
              <div className="bg-bg-secondary/30 rounded-2xl p-4 h-full flex flex-col justify-center items-center text-center border border-white/5 hover:bg-bg-secondary/50 transition-all cursor-default group-hover:border-primary-accent/30">
                <SearchIcon className="w-6 h-6 text-primary-accent mb-2 opacity-60" />
                <p className="text-sm text-text-primary font-black uppercase tracking-tight line-clamp-2">"{item.query}"</p>
                <p className="text-[9px] font-black uppercase tracking-widest text-text-secondary/40 mt-3">{formatDate(item.timestamp, timezone, { month: 'short', day: 'numeric' })}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    ) : <div className="text-center py-20 opacity-50"><p className="text-text-secondary font-black uppercase tracking-widest">No history found</p></div>}
  </div>
);

// --- MAIN SCREEN ---
interface HistoryScreenProps {
  userData: UserData;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onRestoreHistoryItem?: (item: DeletedHistoryItem) => void;
  onPermanentDeleteHistoryItem?: (logId: string) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  genres: Record<number, string>;
  timezone: string;
}

const HistoryScreen: React.FC<HistoryScreenProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('watch');
  const tabs: { id: HistoryTab, label: string, icon: any }[] = [
    { id: 'watch', label: 'Timeline', icon: ClockIcon },
    { id: 'search', label: 'Searches', icon: SearchIcon },
    { id: 'ratings', label: 'Ratings', icon: StarIcon },
    { id: 'favorites', label: 'Favorites', icon: HeartIcon },
    { id: 'comments', label: 'Comments', icon: ChatBubbleOvalLeftEllipsisIcon },
    { id: 'deleted', label: 'Deleted', icon: TrashIcon },
  ];

  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 pb-20">
      <header className="mb-8">
        <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Your Legacy</h1>
      </header>
      <div className="mb-8 flex p-1 bg-bg-secondary/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center justify-center gap-2 px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex-1 ${activeTab === tab.id ? 'bg-accent-gradient text-on-accent' : 'text-text-secondary hover:text-text-primary'}`}>
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
              </button>
          ))}
      </div>
      {activeTab === 'watch' && <WatchHistory history={props.userData.history} onSelectShow={props.onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} timezone={props.timezone} />}
      {activeTab === 'search' && <SearchHistory searchHistory={props.userData.searchHistory} onDelete={props.onDeleteSearchHistoryItem} onClear={props.onClearSearchHistory} onSelectShow={props.onSelectShow} timezone={props.timezone} />}
      {activeTab === 'favorites' && <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">{props.userData.favorites.map(i => <CompactShowCard key={i.id} item={i} onSelect={props.onSelectShow} />)}</div>}
      {activeTab === 'deleted' && <RecentlyDeleted items={props.userData.deletedHistory} onRestore={props.onRestoreHistoryItem!} onPermanentDelete={props.onPermanentDeleteHistoryItem!} timezone={props.timezone} />}
    </div>
  );
};

export default HistoryScreen;