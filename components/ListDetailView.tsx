import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CustomList, AppPreferences, TrackedItem } from '../types';
import ListGrid from './ListGrid';
import { SearchIcon, FilterIcon, ChevronDownIcon, ChevronLeftIcon, TvIcon, FilmIcon, PlayPauseIcon, PencilSquareIcon, CheckCircleIcon, XMarkIcon, TrashIcon } from './Icons';
import Carousel from './Carousel';

interface ListDetailViewProps {
    list: CustomList;
    onBack: () => void;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
    onEdit: (list: CustomList) => void;
    onDelete: (id: string) => void;
    onRemoveItem: (listId: string, itemId: number) => void;
    onUpdateList: (list: CustomList) => void;
    genres: Record<number, string>;
    preferences: AppPreferences;
}

const ListDetailView: React.FC<ListDetailViewProps> = ({ list, onBack, onSelectShow, onEdit, onDelete, onRemoveItem, onUpdateList, genres, preferences }) => {
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | 'tv' | 'movie'>('all');
    const [genreFilter, setGenreFilter] = useState<string>('');
    const [showFilters, setShowFilters] = useState(preferences?.searchAlwaysExpandFilters || false);
    
    // Inline editing state for description
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [tempDescription, setTempDescription] = useState(list.description || '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setTempDescription(list.description || '');
    }, [list.description]);

    useEffect(() => {
        if (isEditingDescription && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
        }
    }, [isEditingDescription]);

    const stats = useMemo(() => {
        const tvCount = list.items.filter(i => i.media_type === 'tv').length;
        const movieCount = list.items.filter(i => i.media_type === 'movie').length;
        return { tvCount, movieCount };
    }, [list.items]);

    const filteredItems = useMemo(() => {
        return list.items.filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
            const matchesType = typeFilter === 'all' || item.media_type === typeFilter;
            const matchesGenre = !genreFilter || item.genre_ids?.includes(Number(genreFilter));
            return matchesSearch && matchesType && matchesGenre;
        });
    }, [list.items, search, typeFilter, genreFilter]);

    const handleSaveDescription = () => {
        onUpdateList({ ...list, description: tempDescription });
        setIsEditingDescription(false);
    };

    const handleCancelDescription = () => {
        setTempDescription(list.description || '');
        setIsEditingDescription(false);
    };

    const isSystemList = ['watchlist', 'upcoming-tv-watchlist', 'upcoming-movie-watchlist'].includes(list.id);

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header Section */}
            <div className="sticky top-16 md:top-2 z-40 -mx-4 px-4 py-3 bg-backdrop/80 backdrop-blur-xl border-b border-white/5 md:bg-transparent md:backdrop-blur-none md:border-none md:static">
                <header className="flex flex-col space-y-6">
                    <div className="flex items-start gap-6 flex-grow min-w-0">
                        <button 
                            onClick={onBack}
                            className="p-4 bg-bg-secondary/60 backdrop-blur-xl rounded-2xl text-text-primary hover:text-primary-accent hover:bg-bg-secondary transition-all border border-white/10 shadow-2xl group flex-shrink-0"
                        >
                            <ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        
                        <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl md:text-5xl font-black text-text-primary uppercase tracking-tighter leading-none truncate">{list.name}</h1>
                                <span className="px-3 py-1 bg-primary-accent text-on-accent text-[10px] font-black rounded-lg uppercase tracking-widest flex-shrink-0 shadow-lg">
                                    {list.items.length === 0 ? 'Zero Items' : `${list.items.length} ${list.items.length === 1 ? 'Item' : 'Items'}`}
                                </span>
                            </div>
                            
                            <div className="mt-4 max-w-2xl hidden md:block">
                                {isEditingDescription ? (
                                    <div className="space-y-3 animate-fade-in bg-bg-secondary/30 p-6 rounded-[2rem] border border-primary-accent/20">
                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-accent ml-1">Update List Narrative</label>
                                        <textarea
                                            ref={textareaRef}
                                            value={tempDescription}
                                            onChange={(e) => setTempDescription(e.target.value)}
                                            className="w-full bg-bg-primary/50 text-sm font-medium text-text-primary p-4 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-accent/20 min-h-[120px] shadow-inner resize-none"
                                            placeholder="What is the mission of this list?"
                                        />
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button 
                                                onClick={handleCancelDescription}
                                                className="px-5 py-2 rounded-xl bg-bg-secondary text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={handleSaveDescription}
                                                className="px-6 py-2 rounded-xl bg-accent-gradient text-on-accent text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 hover:scale-105 transition-transform"
                                            >
                                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                                Archive Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.2em] opacity-60 leading-relaxed pl-1">
                                            {list.description || (isSystemList ? "A system-managed built-in list. No narrative set." : "Personal curated list. No narrative set.")}
                                        </p>
                                        <button 
                                            onClick={() => setIsEditingDescription(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary/40 hover:bg-bg-secondary/60 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-text-primary border border-white/5 transition-all shadow-md active:scale-95"
                                        >
                                            <PencilSquareIcon className="w-3.5 h-3.5 text-primary-accent" />
                                            Edit Description
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-full">
                        <Carousel>
                            <div className="flex items-center gap-3 overflow-x-auto pb-2 hide-scrollbar">
                                <div className="flex-shrink-0 bg-bg-secondary/30 px-5 py-3 rounded-2xl border border-white/5 flex items-center gap-5 shadow-inner">
                                    <div className="flex items-center gap-2">
                                        <TvIcon className="w-4 h-4 text-red-400 opacity-60" />
                                        <span className="text-[11px] font-black text-text-primary whitespace-nowrap">{stats.tvCount} <span className="text-text-secondary opacity-40">Shows</span></span>
                                    </div>
                                    <div className="w-px h-4 bg-white/5"></div>
                                    <div className="flex items-center gap-2">
                                        <FilmIcon className="w-4 h-4 text-blue-400 opacity-60" />
                                        <span className="text-[11px] font-black text-text-primary whitespace-nowrap">{stats.movieCount} <span className="text-text-secondary opacity-40">Movies</span></span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onEdit(list)} 
                                    className="flex-shrink-0 p-3.5 bg-bg-secondary/40 rounded-2xl text-primary-accent hover:brightness-125 transition-all border border-white/5 text-[10px] font-black uppercase tracking-widest px-8 shadow-xl whitespace-nowrap"
                                >
                                    Edit
                                </button>
                                {!isSystemList && (
                                    <button 
                                        onClick={() => onDelete(list.id)} 
                                        className="flex-shrink-0 p-3.5 bg-red-500/10 rounded-2xl text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/10 text-[10px] font-black uppercase tracking-widest px-8 shadow-xl whitespace-nowrap"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </Carousel>
                    </div>
                </header>
            </div>

            {/* Filter Controls */}
            <section className="space-y-6 px-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full">
                        <input
                            type="text"
                            placeholder={`Search registry for items in ${list.name}...`}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-bg-secondary/40 border border-white/5 rounded-[1.5rem] font-black uppercase text-xs focus:border-primary-accent focus:outline-none shadow-2xl"
                        />
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary" />
                    </div>
                    <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center justify-center space-x-3 px-8 py-4 rounded-[1.5rem] transition-all border ${showFilters ? 'bg-primary-accent text-on-accent shadow-[0_15px_30px_-12px_rgba(var(--color-accent-primary-rgb),0.4)] border-transparent' : 'bg-bg-secondary/40 text-text-secondary hover:text-text-primary border-white/5 shadow-xl'}`}
                    >
                        <FilterIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Filters</span>
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-bg-secondary/20 rounded-[2.5rem] border border-white/5 animate-fade-in shadow-inner space-y-8">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-primary-accent ml-1">Media Archive</label>
                            <div className="relative">
                                <select 
                                    value={typeFilter}
                                    onChange={e => setTypeFilter(e.target.value as any)}
                                    className="w-full appearance-none bg-bg-primary border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black uppercase text-text-primary focus:outline-none shadow-md"
                                >
                                    <option value="all">All Content</option>
                                    <option value="movie">Films Only</option>
                                    <option value="tv">Series Only</option>
                                </select>
                                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none opacity-40" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-primary-accent ml-1">Genre Affinity</label>
                            <div className="relative">
                                <select 
                                    value={genreFilter}
                                    onChange={e => setGenreFilter(e.target.value)}
                                    className="w-full appearance-none bg-bg-secondary border-none rounded-md py-2 px-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-accent"
                                >
                                    <option value="">All Tags</option>
                                    {Object.entries(genres).sort((a,b) => (a[1] as string).localeCompare(b[1] as string)).map(([id, name]) => <option key={id} value={id}>{name as string}</option>)}
                                </select>
                                <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-secondary pointer-events-none opacity-40" />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button 
                                onClick={() => { setSearch(''); setTypeFilter('all'); setGenreFilter(''); }}
                                className="w-full py-3 bg-bg-primary text-text-secondary hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md border border-white/5"
                            >
                                Reset Calibration
                            </button>
                        </div>
                    </div>
                )}
            </section>

            <div className="pt-4 px-4">
                {filteredItems.length > 0 ? (
                    <ListGrid items={filteredItems} onSelect={onSelectShow} listId={list.id} onRemoveItem={onRemoveItem} />
                ) : (
                    <div className="py-40 text-center bg-bg-secondary/10 rounded-[3rem] border-4 border-dashed border-white/5">
                        <p className="text-xl font-black text-text-secondary/30 uppercase tracking-[0.2em]">No items in this list</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ListDetailView;