
import React, { useState, useEffect, useMemo } from 'react';
import { searchMediaPaginated, searchPeoplePaginated } from '../services/tmdbService';
import { TmdbMedia, SearchHistoryItem, TrackedItem, TmdbPerson, UserData, CustomList, PublicCustomList, PublicUser, AppPreferences } from '../types';
import { HeartIcon, SearchIcon, FilterIcon, ChevronDownIcon, XMarkIcon, TvIcon, FilmIcon, UserIcon, UsersIcon, SparklesIcon, TrashIcon, ClockIcon, CheckCircleIcon, EyeIcon, EyeSlashIcon } from '../components/Icons';
import SearchBar from '../components/SearchBar';
import { searchPublicLists, searchUsers } from '../utils/userUtils';
import RelatedRecommendations from '../components/RelatedRecommendations';
import ActionCard from '../components/ActionCard';
import { getImageUrl } from '../utils/imageUtils';
import Carousel from '../components/Carousel';
import Recommendations from './Recommendations';

interface SearchScreenProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie', itemData?: TrackedItem) => void;
  onSelectPerson: (personId: number) => void;
  onSelectUser: (userId: string) => void;
  searchHistory: SearchHistoryItem[];
  onUpdateSearchHistory: (queryOrItem: string | TrackedItem) => void;
  onDeleteSearchHistoryItem: (timestamp: string) => void;
  onClearSearchHistory: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkPreviousEpisodesWatched: (showId: number, seasonNumber: number, lastEpisodeNumber: number) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  genres: Record<number, string>;
  userData: UserData;
  currentUser: { id: string, username: string, email: string } | null;
  onToggleLikeList: (ownerId: string, listId: string, listName: string) => void;
  timezone: string;
  showRatings: boolean;
  preferences: AppPreferences;
}

const DiscoverView: React.FC<SearchScreenProps> = (props) => {
    const { 
        userData, searchHistory, preferences, onClearSearchHistory, 
        onDeleteSearchHistoryItem, onSelectShow, onQueryChange,
        onMarkShowAsWatched, onOpenAddToListModal, onToggleFavoriteShow,
        favorites, showRatings
    } = props;

    const latestWatchedItem = useMemo(() => {
        if (!userData.history || userData.history.length === 0) return null;
        return [...userData.history]
          .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .find(h => !h.logId.startsWith('live-'));
    }, [userData.history]);
    
    const showRecentHistory = preferences.searchShowRecentHistory !== false;

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            {showRecentHistory && searchHistory && searchHistory.length > 0 && (
                <section>
                    <div className="flex justify-between items-center mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <ClockIcon className="w-6 h-6 text-primary-accent" />
                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest">Recent Searches</h2>
                        </div>
                        <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClearSearchHistory(); }}
                            className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors"
                        >
                            Clear All
                        </button>
                    </div>
                    <Carousel>
                        <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar px-2">
                            {searchHistory.map((h) => (
                                <div key={h.timestamp} className="relative group/h flex-shrink-0 w-48">
                                    <button 
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteSearchHistoryItem(h.timestamp); }}
                                        className="absolute -top-1 -right-1 z-20 p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-500 transition-all scale-90"
                                        title="Delete search from history"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                    {h.item ? (
                                        <div className="w-full">
                                            <ActionCard 
                                                item={h.item as any} 
                                                onSelect={() => onSelectShow(h.item!.id, h.item!.media_type as any)} 
                                                onOpenAddToListModal={onOpenAddToListModal} 
                                                onMarkShowAsWatched={onMarkShowAsWatched} 
                                                onToggleFavoriteShow={onToggleFavoriteShow} 
                                                isFavorite={favorites.some(f => f.id === h.item!.id)} 
                                                isCompleted={userData.completed.some(c => c.id === h.item!.id)} 
                                                showRatings={showRatings} 
                                                showSeriesInfo="hidden" 
                                                userData={userData}
                                            />
                                        </div>
                                    ) : (
                                        <button 
                                            type="button"
                                            onClick={() => onQueryChange(h.query || '')}
                                            className="w-full h-full bg-bg-secondary/40 border border-white/5 rounded-2xl p-4 text-left hover:bg-bg-secondary transition-all min-h-[100px] flex flex-col justify-center shadow-lg"
                                        >
                                            <p className="text-xs font-black text-text-primary uppercase tracking-tight line-clamp-2">"{h.query}"</p>
                                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mt-2 opacity-50">{new Date(h.timestamp).toLocaleDateString()}</p>
                                        </button>
                                    )}
                                </div>
                            ))}
                            <div className="w-4 flex-shrink-0"></div>
                        </div>
                    </Carousel>
                </section>
            )}

            <section>
                <div className="flex items-center gap-3 mb-8">
                    <SparklesIcon className="w-8 h-8 text-primary-accent" />
                    <div>
                        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">Top Picks For You</h2>
                        <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.3em] mt-2 opacity-60">Separated by category for your convenience</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <FilmIcon className="w-5 h-5 text-sky-400" />
                            <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">Top Movies</h3>
                        </div>
                        <Recommendations 
                            mediaType="movie"
                            onSelectShow={onSelectShow}
                            onMarkShowAsWatched={onMarkShowAsWatched}
                            onOpenAddToListModal={onOpenAddToListModal}
                            onToggleFavoriteShow={onToggleFavoriteShow}
                            favorites={favorites}
                            completed={userData.completed}
                            showRatings={showRatings}
                            preferences={preferences}
                            userData={userData}
                            columns="grid-cols-2 md:grid-cols-4 lg:grid-cols-4"
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                            <TvIcon className="w-5 h-5 text-rose-500" />
                            <h3 className="text-lg font-black text-text-primary uppercase tracking-widest">Top Shows</h3>
                        </div>
                        <Recommendations 
                            mediaType="tv"
                            onSelectShow={onSelectShow}
                            onMarkShowAsWatched={onMarkShowAsWatched}
                            onOpenAddToListModal={onOpenAddToListModal}
                            onToggleFavoriteShow={onToggleFavoriteShow}
                            favorites={favorites}
                            completed={userData.completed}
                            showRatings={showRatings}
                            preferences={preferences}
                            userData={userData}
                            columns="grid-cols-2 md:grid-cols-4 lg:grid-cols-4"
                        />
                    </div>
                </div>
            </section>

            {latestWatchedItem && (
                <section className="pt-4">
                    <RelatedRecommendations seedItems={[latestWatchedItem]} {...props} />
                </section>
            )}
        </div>
    );
};

type SearchTab = 'media' | 'people' | 'myLists' | 'communityLists' | 'users' | 'genres';

interface FilterState {
    mediaType: 'all' | 'tv' | 'movie';
    genres: Set<number>;
    minYear: string;
    maxYear: string;
    minRating: number;
    sort: string;
}

const SearchScreen: React.FC<SearchScreenProps> = (props) => {
  const { onSelectShow, onSelectPerson, onSelectUser, onMarkShowAsWatched, onOpenAddToListModal, onToggleFavoriteShow, favorites, genres, userData, currentUser, showRatings, preferences, onUpdateSearchHistory } = props;
  
  const [localQuery, setLocalQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('media');
  const [mediaResults, setMediaResults] = useState<TmdbMedia[]>([]);
  const [peopleResults, setPeopleResults] = useState<TmdbPerson[]>([]);
  const [myListResults, setMyListResults] = useState<CustomList[]>([]);
  const [communityListResults, setCommunityListResults] = useState<PublicCustomList[]>([]);
  const [userResults, setUserResults] = useState<PublicUser[]>([]);
  const [genreResults, setGenreResults] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showFiltersToggle, setShowFiltersToggle] = useState(preferences.searchAlwaysExpandFilters);
  const [hideWatched, setHideWatched] = useState(false);

  // Staged Filter States (User is picking but not yet applied)
  const [stagedMediaType, setStagedMediaType] = useState<'all' | 'tv' | 'movie'>('all');
  const [stagedGenres, setStagedGenres] = useState<Set<number>>(new Set());
  const [stagedMinYear, setStagedMinYear] = useState<string>('');
  const [stagedMaxYear, setStagedMaxYear] = useState<string>('');
  const [stagedMinRating, setStagedMinRating] = useState<number>(0);
  const [stagedSort, setStagedSort] = useState<string>('popularity.desc');

  // Applied Filter States (What actually affects the results)
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
      mediaType: 'all',
      genres: new Set(),
      minYear: '',
      maxYear: '',
      minRating: 0,
      sort: 'popularity.desc'
  });

  useEffect(() => {
    if (preferences.searchAlwaysExpandFilters) {
        setShowFiltersToggle(true);
    }
  }, [preferences.searchAlwaysExpandFilters]);

  useEffect(() => {
    if (localQuery.length < 1) {
        setMediaResults([]);
        setPeopleResults([]);
        setMyListResults([]);
        setCommunityListResults([]);
        setUserResults([]);
        setGenreResults([]);
        return;
    }

    const performAllSearches = async () => {
        setLoading(true);
        setError(null);
        const mediaPromise = searchMediaPaginated(localQuery, 1);
        const peoplePromise = searchPeoplePaginated(localQuery, 1);
        const lowerCaseQuery = localQuery.toLowerCase();
        
        setMyListResults(userData.customLists.filter(list => list.name.toLowerCase().includes(lowerCaseQuery)));
        setCommunityListResults(searchPublicLists(localQuery, currentUser?.id || null));
        setUserResults(searchUsers(localQuery, currentUser?.id || null));
        const genreArray = Object.entries(genres).map(([id, name]) => ({id: Number(id), name: name as string}));
        setGenreResults(genreArray.filter(g => g.name.toLowerCase().includes(lowerCaseQuery)));

        try {
            const [mediaData, peopleData] = await Promise.all([mediaPromise, peoplePromise]);
            setMediaResults(mediaData.results);
            setPeopleResults(peopleData.results);
            onUpdateSearchHistory(localQuery);
        } catch (e) { setError("Could not perform search."); } finally { setLoading(false); }
    };

    const debounceTimer = setTimeout(performAllSearches, 800);
    return () => clearTimeout(debounceTimer);
}, [localQuery, userData.customLists, genres, currentUser?.id, onUpdateSearchHistory]);

  const handleApplyFilters = () => {
      setAppliedFilters({
          mediaType: stagedMediaType,
          genres: new Set(stagedGenres),
          minYear: stagedMinYear,
          maxYear: stagedMaxYear,
          minRating: stagedMinRating,
          sort: stagedSort
      });
      // Optionally auto-collapse on mobile if needed, but for now we stay open to let them see result count change
  };

  const clearFilters = () => {
      const defaultState: FilterState = {
          mediaType: 'all',
          genres: new Set(),
          minYear: '',
          maxYear: '',
          minRating: 0,
          sort: 'popularity.desc'
      };
      setStagedMediaType('all');
      setStagedGenres(new Set());
      setStagedMinYear('');
      setStagedMaxYear('');
      setStagedMinRating(0);
      setStagedSort('popularity.desc');
      setAppliedFilters(defaultState);
  };

  const filteredAndSortedMedia = useMemo(() => {
    let results = [...mediaResults];
    
    if (hideWatched) {
        results = results.filter(i => {
            const isCompleted = userData.completed.some(c => c.id === i.id);
            const isCaughtUp = userData.allCaughtUp.some(c => c.id === i.id);
            return !isCompleted && !isCaughtUp;
        });
    }

    if (appliedFilters.mediaType !== 'all') results = results.filter(item => item.media_type === appliedFilters.mediaType);
    
    if (appliedFilters.genres.size > 0) {
        results = results.filter(item => 
            item.genre_ids?.some(gid => appliedFilters.genres.has(gid))
        );
    }

    if (appliedFilters.minYear.length === 4) {
        results = results.filter(i => {
            const yearStr = (i.release_date || i.first_air_date || '').substring(0, 4);
            return parseInt(yearStr) >= parseInt(appliedFilters.minYear);
        });
    }
    if (appliedFilters.maxYear.length === 4) {
        results = results.filter(i => {
            const yearStr = (i.release_date || i.first_air_date || '').substring(0, 4);
            return parseInt(yearStr) <= parseInt(appliedFilters.maxYear);
        });
    }

    if (appliedFilters.minRating > 0) {
        results = results.filter(i => (i.vote_average || 0) >= appliedFilters.minRating);
    }

    results.sort((a, b) => {
      switch (appliedFilters.sort) {
        case 'release_date.desc': return new Date(b.release_date || b.first_air_date || 0).getTime() - new Date(a.release_date || a.first_air_date || 0).getTime();
        case 'vote_average.desc': return (b.vote_average || 0) - (a.vote_average || 0);
        case 'alphabetical.asc': return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        case 'popularity.desc': default: return (b.popularity || 0) - (a.popularity || 0);
      }
    });
    return results;
  }, [mediaResults, appliedFilters, hideWatched, userData.completed, userData.allCaughtUp]);

  const toggleStagedGenre = (id: number) => {
      setStagedGenres(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const handleItemSelect = (id: number, media_type: 'tv' | 'movie', item: TmdbMedia) => {
    const tracked: TrackedItem = { id: item.id, title: item.title || item.name || 'Untitled', media_type: item.media_type, poster_path: item.poster_path, genre_ids: item.genre_ids };
    onUpdateSearchHistory(tracked);
    onSelectShow(id, media_type, tracked);
  };

  const renderSearchResults = () => {
    if (loading && mediaResults.length === 0) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-pulse">
                {[...Array(15)].map((_, i) => <div key={i}><div className="aspect-[2/3] bg-bg-secondary rounded-[1.5rem]"></div></div>)}
            </div>
        );
    }
    
    if (error) return <div className="text-center p-8 text-red-500 font-bold">{error}</div>;

    switch (activeTab) {
        case 'media': return (
            <div className="space-y-8">
                {filteredAndSortedMedia.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 animate-fade-in pb-10">
                        {filteredAndSortedMedia.map(item => (
                            <ActionCard 
                                key={`${item.id}-${item.media_type}`} 
                                item={item} 
                                onSelect={(id, type) => handleItemSelect(id, type, item)} 
                                onOpenAddToListModal={onOpenAddToListModal} 
                                onMarkShowAsWatched={onMarkShowAsWatched} 
                                onToggleFavoriteShow={onToggleFavoriteShow} 
                                isFavorite={favorites.some(f => f.id === item.id)} 
                                isCompleted={userData.completed.some(c => c.id === item.id)} 
                                showRatings={showRatings} 
                                showSeriesInfo={preferences.searchShowSeriesInfo} 
                                userRating={userData.ratings[item.id]?.rating || 0}
                                userData={userData}
                            />
                        ))}
                    </div>
                ) : localQuery.length > 0 ? (
                    <div className="py-40 text-center bg-bg-secondary/10 rounded-[3rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center">
                        <SparklesIcon className="w-16 h-16 text-text-secondary/20 mb-6" />
                        <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest">No Media Found</h2>
                        <p className="text-sm text-text-secondary max-w-sm mx-auto mt-2 font-medium opacity-60">Try adjusting your filters or searching for a broader term.</p>
                    </div>
                ) : null}
            </div>
        );

        case 'people': return peopleResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-10 animate-fade-in">
                {peopleResults.map(p => (
                    <div key={p.id} className="text-center group cursor-pointer" onClick={() => onSelectPerson(p.id)}>
                        <div className="relative inline-block">
                             <img src={getImageUrl(p.profile_path, 'h632', 'profile')} alt={p.name} className="w-32 h-32 md:w-40 md:h-40 mx-auto rounded-full object-cover shadow-2xl border-4 border-white/5 transition-all group-hover:scale-105 group-hover:border-primary-accent" />
                             <div className="absolute inset-0 rounded-full bg-primary-accent/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                        <p className="mt-4 text-base font-black text-text-primary uppercase tracking-tight group-hover:text-primary-accent transition-colors">{p.name}</p>
                    </div>
                ))}
            </div>
        ) : <p className="text-center py-24 text-text-secondary font-bold uppercase tracking-widest opacity-50">No people found.</p>;
        default: return null;
    }
  };

  const TabButton: React.FC<{ tabId: SearchTab; label: string; count: number }> = ({ tabId, label, count }) => (
    <button onClick={() => setActiveTab(tabId)} className={`px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap rounded-full transition-all border ${activeTab === tabId ? 'bg-accent-gradient text-on-accent border-transparent shadow-xl scale-105' : 'bg-bg-secondary/40 text-text-primary/60 border-white/10 hover:bg-bg-secondary hover:text-text-primary'}`}>
        {label} <span className="opacity-40 ml-1">({count})</span>
    </button>
  );

  return (
    <div className="px-6 relative min-h-screen pb-48">
        <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter">Exploration</h1>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60">Discover your next obsession</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            <button 
                onClick={() => setHideWatched(!hideWatched)}
                className={`flex items-center gap-2 justify-center px-6 py-3 rounded-2xl transition-all border shadow-xl active:scale-95 group ${hideWatched ? 'bg-primary-accent text-on-accent border-transparent shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]' : 'bg-bg-secondary/40 text-text-primary border-white/5 hover:bg-bg-secondary'}`}
            >
                {hideWatched ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                <span className="text-[10px] font-black uppercase tracking-widest">{hideWatched ? 'Unhide Watched' : 'Hide Watched'}</span>
            </button>

            {(preferences.searchShowFilters || preferences.searchAlwaysExpandFilters) && (
                <button 
                    onClick={() => setShowFiltersToggle(!showFiltersToggle)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all border shadow-xl active:scale-95 ${showFiltersToggle ? 'bg-primary-accent text-on-accent border-transparent shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]' : 'bg-bg-secondary/40 text-text-primary border border-white/5 shadow-lg'}`}
                >
                    <FilterIcon className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                </button>
            )}
          </div>
        </header>

        {/* --- Unified Filter Accordion Panel --- */}
        {showFiltersToggle && (
            <div className="mb-12 bg-bg-secondary/20 rounded-[2.5rem] p-8 border border-white/5 animate-fade-in shadow-inner space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Media Type */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-1">Media Archive</label>
                        <div className="relative">
                            <select 
                                value={stagedMediaType}
                                onChange={e => setStagedMediaType(e.target.value as any)}
                                className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            >
                                <option value="all">Both Archives</option>
                                <option value="movie">Movies Only</option>
                                <option value="tv">TV Shows Only</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                    </div>

                    {/* Year Range */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-1">Chronological Range</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                maxLength={4}
                                placeholder="From"
                                value={stagedMinYear}
                                onChange={e => setStagedMinYear(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            />
                            <span className="text-text-secondary opacity-30">—</span>
                            <input 
                                type="text" 
                                maxLength={4}
                                placeholder="To"
                                value={stagedMaxYear}
                                onChange={e => setStagedMaxYear(e.target.value.replace(/\D/g, ''))}
                                className="w-full bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            />
                        </div>
                    </div>

                    {/* Min Rating */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-1">Minimum Merit (Rating)</label>
                        <div className="relative">
                            <select 
                                value={stagedMinRating}
                                onChange={e => setStagedMinRating(Number(e.target.value))}
                                className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            >
                                <option value="0">Any Rating</option>
                                {[9,8,7,6,5,4,3,2,1].map(num => <option key={num} value={num}>{num}.0+</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                    </div>

                    {/* Sorting */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-1">Sort Index</label>
                        <div className="relative">
                            <select 
                                value={stagedSort}
                                onChange={e => setStagedSort(e.target.value)}
                                className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md"
                            >
                                <option value="popularity.desc">Most Popular</option>
                                <option value="release_date.desc">Newest First</option>
                                <option value="vote_average.desc">Highest Rated</option>
                                <option value="alphabetical.asc">A to Z</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Genre Multi-select */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-1">Genre Affinity Tags</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(genres).sort((a,b) => (a[1] as string).localeCompare(b[1] as string)).map(([id, name]) => (
                            <button
                                key={id}
                                onClick={() => toggleStagedGenre(Number(id))}
                                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${stagedGenres.has(Number(id)) ? 'bg-primary-accent text-on-accent border-transparent shadow-lg scale-105' : 'bg-bg-primary text-text-primary/70 border-white/10 hover:border-white/30'}`}
                            >
                                {name as string}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end items-center gap-4 border-t border-white/5 pt-6">
                    <button 
                        onClick={clearFilters}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-bg-primary text-red-400 font-black uppercase text-[10px] tracking-widest hover:bg-red-500/10 transition-all border border-white/5"
                    >
                        <TrashIcon className="w-4 h-4" /> Clear All Filters
                    </button>
                    <button 
                        onClick={handleApplyFilters}
                        className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <FilterIcon className="w-5 h-5" />
                        Filter
                    </button>
                </div>
            </div>
        )}

        {localQuery.length > 0 ? renderSearchResults() : (
            <DiscoverView 
                {...props}
                onQueryChange={setLocalQuery}
            />
        )}
        
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-40 group/nav">
            <div className="nav-spectral-bg animate-spectral-flow rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.7)] p-5 border border-white/20 backdrop-blur-2xl transition-all duration-500 hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)]">
                <div className="absolute inset-0 bg-black/50 rounded-[2.5rem] pointer-events-none"></div>
                <div className="relative z-10 flex flex-col space-y-5">
                    {localQuery.length > 0 && (
                        <Carousel>
                            <div className="flex space-x-3 overflow-x-auto pb-1 hide-scrollbar px-2">
                                <TabButton tabId="media" label="Media" count={filteredAndSortedMedia.length} />
                                <TabButton tabId="people" label="People" count={peopleResults.length} />
                                <TabButton tabId="users" label="Users" count={userResults.length} />
                                <TabButton tabId="myLists" label="My Lists" count={myListResults.length} />
                                <TabButton tabId="communityLists" label="Community" count={communityListResults.length} />
                                <TabButton tabId="genres" label="Genres" count={genreResults.length} />
                            </div>
                        </Carousel>
                    )}
                    <div className="px-2">
                        <SearchBar 
                            onSelectResult={(id, type) => {
                                const matched = filteredAndSortedMedia.find(m => m.id === id);
                                if (matched) handleItemSelect(id, type, matched);
                                else onSelectShow(id, type);
                            }} 
                            onMarkShowAsWatched={onMarkShowAsWatched}
                            value={localQuery}
                            onChange={setLocalQuery}
                            disableDropdown
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SearchScreen;
