
import React, { useState, useMemo } from 'react';
import { HistoryItem, UserData, SearchHistoryItem, TmdbMedia, TrackedItem, Comment, UserRatings, DeletedHistoryItem, DeletedNote } from '../types';
import { TrashIcon, ChevronDownIcon, StarIcon, SearchIcon, ClockIcon, ChatBubbleOvalLeftEllipsisIcon, HeartIcon, CalendarIcon, TvIcon, FilmIcon, XMarkIcon, ListBulletIcon, SparklesIcon, TrophyIcon, ArrowPathIcon, InformationCircleIcon, PencilSquareIcon, PlayPauseIcon } from '../components/Icons';
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
}> = ({ history = [], onSelectShow, onDeleteHistoryItem, timezone }) => {
  const [activeFilter, setActiveFilter] = useState<WatchHistoryFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); 
  const [searchQuery, setSearchQuery] = useState('');

  const processedHistory = useMemo(() => {
    let items = Array.isArray(history) ? [...history] : [];
    if (selectedDate) items = items.filter(i => new Date(i.timestamp).toISOString().split('T')[0] === selectedDate);
    if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        items = items.filter(i => (i.title || (i as any).name || '').toLowerCase().includes(query) || i.episodeTitle?.toLowerCase().includes(query));
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
                <input type="text" placeholder="Search history..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-bg-secondary rounded-xl text-text-primary focus:outline-none border border-white/5 font-bold" />
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-text-primary opacity-80" />
            </div>
            <div className="relative min-w-[180px]">
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-10 pr-10 py-3 bg-bg-secondary rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer text-text-primary focus:outline-none border border-white/5 shadow-inner" />
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary-accent pointer-events-none" />
                {selectedDate && <button onClick={() => setSelectedDate('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"><XMarkIcon className="w-5 h-5" /></button>}
            </div>
        </div>
        <Carousel>
            <div className="flex space-x-2 overflow-x-auto pb-2 -mx-2 px-2 hide-scrollbar">
                {(['all', 'shows', 'movies', 'seasons', 'episodes'] as const).map(id => (
                    <button key={id} onClick={() => setActiveFilter(id)} className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeFilter === id ? 'bg-accent-gradient text-on-accent shadow-lg' : 'bg-bg-primary text-text-primary/70 border border-white/5'}`}>
                        <span>{id}</span>
                    </button>
                ))}
            </div>
        </Carousel>
      </div>

      {processedHistory.length === 0 ? (
        <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border border-white/5 opacity-50">
            <p className="font-bold uppercase tracking-widest text-xs">No watch logs found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {processedHistory.map(item => {
                const watchDate = new Date(item.timestamp);
                const month = watchDate.toLocaleString('default', { month: 'short' });
                const day = watchDate.getDate();
                const isLiveLog = item.startTime && item.endTime;
                const displayTitle = item.title || (item as any).name || 'Untitled';

                return (
                    <div key={item.logId} className="bg-bg-secondary/20 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col shadow-2xl animate-fade-in group">
                        <div className="w-full aspect-video relative cursor-pointer overflow-hidden" onClick={() => onSelectShow(item.id, item.media_type)}>
                            <FallbackImage srcs={[getImageUrl(item.episodeStillPath || item.seasonPosterPath || item.poster_path, 'w780')]} placeholder={PLACEHOLDER_POSTER} alt={displayTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                            <div className="absolute top-4 right-4 flex flex-col items-center bg-bg-primary px-3 py-1.5 rounded-2xl border border-white/10 shadow-lg min-w-[50px]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary-accent leading-none mb-0.5">{month}</span>
                                <span className="text-xl font-black text-white leading-none">{day}</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-grow min-w-0 cursor-pointer" onClick={() => onSelectShow(item.id, item.media_type)}>
                                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight truncate leading-tight group-hover:text-primary-accent transition-colors">{displayTitle}</h3>
                                    {item.media_type === 'tv' && (
                                        <p className="text-xs font-black text-primary-accent/80 uppercase tracking-[0.1em] mt-1">S{item.seasonNumber} E{item.episodeNumber}</p>
                                    )}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteHistoryItem(item); }} className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg border border-red-500/20 flex-shrink-0"><TrashIcon className="w-6 h-6" /></button>
                            </div>
                            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-4 opacity-50">{formatDateTime(item.timestamp, timezone)}</p>
                            {item.note && <p className="text-xs text-text-secondary italic mt-4 p-3 bg-bg-secondary/30 rounded-xl border border-white/5">"{item.note}"</p>}
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
};

const SearchHistory: React.FC<{
    history: SearchHistoryItem[];
    onDelete: (timestamp: string) => void;
    onClear: () => void;
    onQueryChange: (query: string) => void;
    onSelectShow: (id: number, type: 'tv' | 'movie') => void;
    userData: UserData;
}> = ({ history = [], onDelete, onClear, onQueryChange, onSelectShow, userData }) => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-bold text-text-primary uppercase tracking-widest">Recent Searches</h2>
                <button onClick={onClear} className="text-xs font-black uppercase text-red-500 hover:text-red-400 transition-colors">Clear All</button>
            </div>
            {!Array.isArray(history) || history.length === 0 ? (
                <div className="text-center py-20 bg-bg-secondary/10 rounded-3xl border-2 border-dashed border-white/5 opacity-50">
                    <p className="text-text-secondary font-bold uppercase tracking-widest text-xs">No search history found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map(h => (
                        <div key={h.timestamp} className="bg-bg-secondary/20 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary-accent/30 transition-all shadow-lg">
                            <div className="flex-grow min-w-0">
                                {h.item ? (
                                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectShow(h.item!.id, h.item!.media_type as any)}>
                                        <img src={getImageUrl(h.item.poster_path, 'w92')} className="w-10 h-14 object-cover rounded-lg shadow-md border border-white/10" alt="" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-text-primary truncate uppercase">{h.item.title || (h.item as any).name || 'Untitled'}</p>
                                            <p className="text-[10px] text-text-secondary uppercase tracking-widest opacity-50">{new Date(h.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="cursor-pointer px-2" onClick={() => onQueryChange(h.query || '')}>
                                        <p className="text-sm font-bold text-text-primary truncate italic">"{h.query || 'Unknown search'}"</p>
                                        <p className="text-[10px] text-text-secondary uppercase tracking-widest opacity-50">{new Date(h.timestamp).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(h.timestamp); }} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-md border border-red-500/20 ml-4 flex-shrink-0"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

interface HistoryScreenProps {
  userData: UserData;
  onSelectShow: (id: number, mediaType: 'tv' | 'movie' | 'person') => void;
  onDeleteHistoryItem: (item: HistoryItem) => void;
  onRestoreHistoryItem: (item: DeletedHistoryItem) => void;
  onPermanentDeleteHistoryItem: (logId: string) => void;
  onClearAllDeletedHistory: () => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  genres: Record<number, string>;
  timezone: string;
  onPermanentDeleteNote: (noteId: string) => void;
  onRestoreNote: (note: DeletedNote) => void;
}

const HistoryScreen: React.FC<HistoryScreenProps> = (props) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>('watch');

  const tabs: { id: HistoryTab; label: string; icon: any }[] = [
    { id: 'watch', label: 'Watching', icon: PlayPauseIcon },
    { id: 'search', label: 'Search', icon: SearchIcon },
    { id: 'ratings', label: 'Ratings', icon: StarIcon },
    { id: 'favorites', label: 'Favorites', icon: HeartIcon },
    { id: 'comments', label: 'Comments', icon: ChatBubbleOvalLeftEllipsisIcon },
    { id: 'deleted', label: 'Trash', icon: TrashIcon },
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <div className="flex overflow-x-auto space-x-2 pb-2 hide-scrollbar border-b border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-accent-gradient text-on-accent shadow-xl scale-105'
                : 'bg-bg-secondary/40 text-text-primary/60 border border-white/5 hover:bg-bg-secondary hover:text-text-primary'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'watch' && (
        <WatchHistory history={props.userData?.history || []} onSelectShow={props.onSelectShow} onDeleteHistoryItem={props.onDeleteHistoryItem} timezone={props.timezone} />
      )}
      
      {activeTab === 'search' && (
        <SearchHistory history={props.userData?.searchHistory || []} onDelete={props.onDeleteSearchHistoryItem} onClear={props.onClearSearchHistory} onQueryChange={() => {}} onSelectShow={props.onSelectShow} userData={props.userData} />
      )}

      {activeTab === 'deleted' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4 px-2">
                <div>
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-tighter">Trash Bin</h2>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest opacity-60">30-day retention period active</p>
                </div>
                <button onClick={props.onClearAllDeletedHistory} className="px-6 py-2 bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-500 hover:text-white transition-all rounded-xl shadow-lg">Purge All Data</button>
            </div>

            {(!props.userData?.deletedHistory || props.userData.deletedHistory.length === 0) && (!props.userData?.deletedNotes || props.userData.deletedNotes.length === 0) ? (
                <div className="text-center py-32 bg-bg-secondary/10 rounded-3xl border-2 border-dashed border-white/5 opacity-40">
                    <TrashIcon className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Registry trash is empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {props.userData.deletedHistory?.map(item => (
                        <div key={item.logId} className="bg-bg-secondary/30 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary-accent/30 transition-all shadow-xl">
                            <div className="flex items-center gap-4 min-w-0">
                                <img src={getImageUrl(item.poster_path, 'w92')} className="w-12 h-18 object-cover rounded-xl shadow-lg border border-white/10" alt="" />
                                <div className="min-w-0">
                                    <h3 className="font-black text-text-primary uppercase tracking-tight truncate leading-tight">{item.title || 'Untitled'}</h3>
                                    <p className="text-[8px] font-black text-red-500/60 uppercase tracking-widest mt-2 italic">Deleted {new Date(item.deletedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <button onClick={() => props.onRestoreHistoryItem(item)} className="p-3 bg-primary-accent/10 text-primary-accent rounded-xl hover:bg-primary-accent hover:text-on-accent transition-all shadow-md"><ArrowPathIcon className="w-5 h-5" /></button>
                                <button onClick={() => props.onPermanentDeleteHistoryItem(item.logId)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-md"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;
