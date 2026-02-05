import React, { useState, useEffect, useCallback, useRef } from 'react';
import { discoverMediaPaginated } from '../services/tmdbService';
import { TmdbMedia, TrackedItem, AppPreferences, UserData } from '../types';
import { ChevronLeftIcon, FilterIcon, SparklesIcon, ArrowPathIcon } from '../components/Icons';
import ActionCard from '../components/ActionCard';
import GenreFilter from '../components/GenreFilter';

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

const AllMediaScreen: React.FC<AllMediaScreenProps> = (props) => {
    const { onBack, onSelectShow, favorites, completed, title, initialMediaType, initialGenreId, initialSortBy, voteCountGte, voteCountLte, showMediaTypeToggle, genres, showRatings, preferences, userData } = props;
    
    const [media, setMedia] = useState<TmdbMedia[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [mediaType, setMediaType] = useState(initialMediaType);
    const [genreId, setGenreId] = useState<number | string | null>(
        typeof initialGenreId === 'object' && initialGenreId !== null ? initialGenreId[initialMediaType] ?? null : initialGenreId
    );
    const [showFilters, setShowFilters] = useState(preferences.searchAlwaysExpandFilters);

    const loaderRef = useRef<HTMLDivElement>(null);
    const resetRef = useRef(false);

    const loadMoreMedia = useCallback(async (isReset = false) => {
        if (loading || (!hasMore && !isReset)) return;
        setLoading(true);

        const currentPage = isReset ? 1 : page;

        try {
            const data = await discoverMediaPaginated(mediaType, {
                page: currentPage,
                genre: genreId || undefined,
                sortBy: initialSortBy,
                vote_count_gte: voteCountGte,
                vote_count_lte: voteCountLte,
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
    }, [page, loading, hasMore, mediaType, genreId, initialSortBy, voteCountGte, voteCountLte]);
    
    // Reset logic when core filters change
    useEffect(() => {
        setMedia([]);
        setPage(1);
        setHasMore(true);
        resetRef.current = true;
    }, [mediaType, genreId]);

    useEffect(() => {
        if (resetRef.current) {
            loadMoreMedia(true);
            resetRef.current = false;
        }
    }, [loadMoreMedia]);

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
                    {showMediaTypeToggle && (
                        <div className="flex p-1 bg-bg-secondary/40 rounded-2xl border border-white/5 shadow-inner">
                            <button 
                                onClick={() => setMediaType('movie')} 
                                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mediaType === 'movie' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Films
                            </button>
                            <button 
                                onClick={() => setMediaType('tv')} 
                                className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${mediaType === 'tv' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                            >
                                Series
                            </button>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all shadow-xl ${showFilters ? 'bg-primary-accent text-on-accent border-transparent' : 'bg-bg-secondary/40 text-text-primary border-white/5 hover:bg-bg-secondary'}`}
                    >
                        <FilterIcon className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                    </button>
                </div>
            </header>
            
            <div className="mt-8 space-y-12">
                {showFilters && (
                    <div className="animate-fade-in bg-bg-secondary/10 rounded-[3rem] p-8 border border-white/5 shadow-inner">
                        <div className="flex items-center gap-4 mb-6 px-4">
                            <SparklesIcon className="w-6 h-6 text-primary-accent" />
                            <h2 className="text-xl font-black text-text-primary uppercase tracking-widest">Affinity Calibration</h2>
                        </div>
                        <GenreFilter 
                            genres={genres} 
                            selectedGenreId={typeof genreId === 'number' ? genreId : null} 
                            onSelectGenre={(id) => setGenreId(id)} 
                        />
                    </div>
                )}

                {media.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-8 animate-fade-in">
                        {media.map((item, index) => (
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