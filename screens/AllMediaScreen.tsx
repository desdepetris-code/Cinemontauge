import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { discoverMediaPaginated, getMediaDetails } from '../services/tmdbService';
import { TmdbMedia, TrackedItem, AppPreferences, UserData } from '../types';
import { ChevronLeftIcon, FilterIcon, SparklesIcon, ArrowPathIcon, EyeIcon, EyeSlashIcon, TrashIcon, ChevronDownIcon } from '../components/Icons';
import ActionCard from '../components/ActionCard';

interface AllMediaScreenProps {
  onBack: () => void;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  title: string;
  initialMediaType: 'tv' | 'movie';
  initialGenreId: number | string | null | { movie?: number | string; tv?: number | string; };
  initialSortBy: string;
  voteCountGte: number;
  voteCountLte?: number;
  showMediaTypeToggle: boolean;
  genres: Record<number, string>;
  showRatings: boolean;
  preferences: AppPreferences;
  userData: UserData;
}

interface FilterState {
    mediaType: 'all' | 'tv' | 'movie';
    genres: Set<number>;
    minYear: string;
    maxYear: string;
    minRating: number;
    sort: string;
}

const AllMediaScreen: React.FC<AllMediaScreenProps> = (props) => {
    const { onBack, onSelectShow, favorites, completed, title, initialMediaType, initialGenreId, initialSortBy, voteCountGte, voteCountLte, showMediaTypeToggle, genres, showRatings, preferences, userData } = props;
    
    const [media, setMedia] = useState<TmdbMedia[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [showFilters, setShowFilters] = useState(preferences.searchAlwaysExpandFilters);
    const [hideWatched, setHideWatched] = useState(false);

    // Filter States
    const [stagedMediaType, setStagedMediaType] = useState<'all' | 'tv' | 'movie'>(initialMediaType);
    const [stagedGenres, setStagedGenres] = useState<Set<number>>(new Set());
    const [stagedMinYear, setStagedMinYear] = useState<string>('');
    const [stagedMaxYear, setStagedMaxYear] = useState<string>('');
    const [stagedMinRating, setStagedMinRating] = useState<number>(0);
    const [stagedSort, setStagedSort] = useState<string>(initialSortBy);

    const [appliedFilters, setAppliedFilters] = useState<FilterState>({
        mediaType: initialMediaType,
        genres: new Set(),
        minYear: '',
        maxYear: '',
        minRating: 0,
        sort: initialSortBy
    });

    // Initialize staged genres from props
    useEffect(() => {
        if (initialGenreId) {
            const initial = typeof initialGenreId === 'object' && initialGenreId !== null 
                ? initialGenreId[initialMediaType] 
                : initialGenreId;
            
            if (initial) {
                setStagedGenres(new Set([Number(initial)]));
                setAppliedFilters(prev => ({ ...prev, genres: new Set([Number(initial)]) }));
            }
        }
    }, [initialGenreId, initialMediaType]);

    const loaderRef = useRef<HTMLDivElement>(null);
    const resetRef = useRef(false);

    const loadMoreMedia = useCallback(async (isReset = false) => {
        if (loading || (!hasMore && !isReset)) return;
        setLoading(true);

        const currentPage = isReset ? 1 : page;
        const currentMediaType = appliedFilters.mediaType === 'all' ? 'movie' : appliedFilters.mediaType;

        try {
            // TMDb accepts comma separated genre IDs
            const genreParam = appliedFilters.genres.size > 0 
                ? Array.from(appliedFilters.genres).join(',') 
                : undefined;

            const data = await discoverMediaPaginated(currentMediaType as 'tv' | 'movie', {
                page: currentPage,
                genre: genreParam,
                sortBy: appliedFilters.sort,
                'primary_release_date.gte': appliedFilters.minYear ? `${appliedFilters.minYear}-01-01` : undefined,
                'primary_release_date.lte': appliedFilters.maxYear ? `${appliedFilters.maxYear}-12-31` : undefined,
                'first_air_date.gte': appliedFilters.minYear ? `${appliedFilters.minYear}-01-01` : undefined,
                'first_air_date.lte': appliedFilters.maxYear ? `${appliedFilters.maxYear}-12-31` : undefined,
                vote_count_gte: appliedFilters.minRating > 0 ? voteCountGte : (voteCountGte || 10), // Use base threshold or 10
                vote_average_gte: appliedFilters.minRating > 0 ? appliedFilters.minRating : undefined,
            });
            
            if (isReset) {
                setMedia(data.results);
            } else {
                setMedia(prev => {
                    const existingIds = new Set(prev.map(i => i.id));
                    const uniqueNew = data.results.filter(i => !existingIds.has(i.id));
                    return [...prev, ...uniqueNew];
                });
            }
            
            setPage(currentPage + 1);
            setHasMore(currentPage < data.total_pages);
        } catch (error) {
            console.error("Failed to load media:", error);
        } finally {
            setLoading(false);
        }
    }, [page, loading, hasMore, appliedFilters, voteCountGte]);
    
    // Reset logic when applied filters change
    useEffect(() => {
        setMedia([]);
        setPage(1);
        setHasMore(true);
        resetRef.current = true;
    }, [appliedFilters]);

    useEffect(() => {
        if (resetRef.current) {
            loadMoreMedia(true);
            resetRef.current = false;
        }
    }, [loadMoreMedia]);

    const handleApplyFilters = () => {
        setAppliedFilters({
            mediaType: stagedMediaType,
            genres: new Set(stagedGenres),
            minYear: stagedMinYear,
            maxYear: stagedMaxYear,
            minRating: stagedMinRating,
            sort: stagedSort
        });
    };

    const clearFilters = () => {
        setStagedMediaType(initialMediaType);
        setStagedGenres(new Set());
        setStagedMinYear('');
        setStagedMaxYear('');
        setStagedMinRating(0);
        setStagedSort(initialSortBy);
        setAppliedFilters({
            mediaType: initialMediaType,
            genres: new Set(),
            minYear: '',
            maxYear: '',
            minRating: 0,
            sort: initialSortBy
        });
    };

    const toggleStagedGenre = (id: number) => {
        setStagedGenres(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && !loading && hasMore) {
                loadMoreMedia(false);
            }
        }, { rootMargin: '600px' });

        const currentLoader = loaderRef.current;
        if (currentLoader) {
            observer.observe(currentLoader);
        }
        return () => {
            if (currentLoader) {
                observer.unobserve(currentLoader);
            }
        };
    }, [loadMoreMedia, loading, hasMore]);

    const filteredMedia = useMemo(() => {
        let results = [...media];
        if (hideWatched) {
            results = results.filter(i => {
                const isCompleted = userData.completed.some(c => c.id === i.id);
                const isCaughtUp = userData.allCaughtUp.some(c => c.id === i.id);
                return !isCompleted && !isCaughtUp;
            });
        }
        return results;
    }, [media, hideWatched, userData.completed, userData.allCaughtUp]);

    return (
        <div className="animate-fade-in max-w-[1400px] mx-auto px-6 pb-32">
            <header className="flex flex-col md:flex-row md:items-end justify-between py-12 gap-8 sticky top-0 z-30 bg-bg-primary/90 backdrop-blur-xl -mx-6 px-6 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-4 bg-bg-secondary/40 rounded-2xl text-text-primary hover:text-primary-accent border border-white/5 transition-all shadow-xl group">
                        <ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black text-text-primary uppercase tracking-tighter leading-none">{title}</h1>
                        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.4em] mt-3 opacity-60">Registry Sector discovery pipeline active</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={() => setHideWatched(!hideWatched)}
                        className={`flex items-center gap-2 justify-center px-6 py-3 rounded-2xl transition-all border shadow-xl active:scale-95 group ${hideWatched ? 'bg-primary-accent text-on-accent border-transparent shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)]' : 'bg-bg-secondary/40 text-text-primary border-white/5 hover:bg-bg-secondary'}`}
                    >
                        {hideWatched ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">{hideWatched ? 'Unhide Watched' : 'Hide Watched'}</span>
                    </button>

                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all shadow-xl ${showFilters ? 'bg-primary-accent text-on-accent border-transparent shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.4)]' : 'bg-bg-secondary/40 text-text-primary border-white/5 hover:bg-bg-secondary'}`}
                    >
                        <FilterIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                    </button>
                </div>
            </header>
            
            <div className="mt-8 space-y-12">
                {showFilters && (
                    <div className="animate-fade-in bg-bg-secondary/10 rounded-[3rem] p-8 border border-white/5 shadow-inner space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Media Type */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-1">Media Archive</label>
                                <div className="relative">
                                    <select 
                                        value={stagedMediaType}
                                        onChange={e => setStagedMediaType(e.target.value as any)}
                                        disabled={!showMediaTypeToggle}
                                        className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-xs font-black uppercase text-text-primary focus:outline-none shadow-md disabled:opacity-50"
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
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-accent ml-1">Minimum Merit</label>
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
                                        <option value="primary_release_date.desc">Newest First</option>
                                        <option value="vote_average.desc">Highest Rated</option>
                                        <option value="original_title.asc">Alphabetical</option>
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
                                <TrashIcon className="w-4 h-4" /> Clear All
                            </button>
                            <button 
                                onClick={handleApplyFilters}
                                className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <FilterIcon className="w-5 h-5" />
                                Apply Filters
                            </button>
                        </div>
                    </div>
                )}

                {filteredMedia.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-8 animate-fade-in">
                        {filteredMedia.map((item, index) => (
                            <div key={`${item.id}-${item.media_type}-${index}`} className="animate-slide-in-up" style={{ animationDelay: `${(index % 10) * 0.05}s` }}>
                                <ActionCard 
                                    item={item} 
                                    onSelect={onSelectShow}
                                    onOpenAddToListModal={props.onOpenAddToListModal}
                                    onMarkShowAsWatched={props.onMarkShowAsWatched}
                                    onToggleFavoriteShow={props.onToggleFavoriteShow}
                                    isFavorite={favorites.some(f => f.id === item.id)}
                                    isCompleted={completed.some(c => c.id === item.id)}
                                    showRatings={showRatings}
                                    showSeriesInfo={preferences.searchShowSeriesInfo}
                                    userData={userData}
                                />
                            </div>
                        ))}
                    </div>
                ) : !loading && (
                    <div className="py-40 text-center bg-bg-secondary/10 rounded-[3rem] border-4 border-dashed border-white/5 flex flex-col items-center justify-center">
                        <SparklesIcon className="w-20 h-20 text-text-secondary/10 mb-8" />
                        <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest">Archive Empty</h2>
                        <p className="mt-2 text-sm text-text-secondary max-w-sm mx-auto uppercase tracking-widest font-bold italic opacity-40">No entries matched the current registry filters.</p>
                    </div>
                )}

                <div ref={loaderRef} className="h-40 flex flex-col justify-center items-center gap-4 pt-10">
                    {loading && (
                        <>
                            <ArrowPathIcon className="w-8 h-8 text-primary-accent animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-text-secondary animate-pulse">Syncing Next Part...</span>
                        </>
                    )}
                    {!hasMore && media.length > 0 && (
                        <div className="px-10 py-4 bg-bg-secondary/20 rounded-full border border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary opacity-40">End of Registry Reached</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllMediaScreen;