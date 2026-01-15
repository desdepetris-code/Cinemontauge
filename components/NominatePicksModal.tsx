import React, { useState, useMemo } from 'react';
import { TrackedItem, UserData, TmdbMedia, HistoryItem, WeeklyPick } from '../types';
import { XMarkIcon, SearchIcon, TvIcon, FilmIcon, UserIcon, UsersIcon, SparklesIcon } from './Icons';
import { searchMedia, searchPeoplePaginated } from '../services/tmdbService';
import { TMDB_IMAGE_BASE_URL } from '../constants';

interface NominatePicksModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: UserData;
    onNominate: (pick: WeeklyPick) => void;
    currentPicks: WeeklyPick[];
}

type Tab = 'media' | 'person';

const NominatePicksModal: React.FC<NominatePicksModalProps> = ({ isOpen, onClose, userData, onNominate, currentPicks }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<TmdbMedia[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('media');
    const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1); // 0:Mon - 6:Sun
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (query: string, tab: Tab = activeTab) => {
        setSearchQuery(query);
        if (query.length > 2) {
            setIsLoading(true);
            try {
                if (tab === 'media') {
                    const results = await searchMedia(query);
                    setSearchResults(results.slice(0, 15));
                } else {
                    const results = await searchPeoplePaginated(query, 1);
                    setSearchResults(results.results.slice(0, 15).map(p => ({ ...p, media_type: 'person' as const } as any)));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const handleTabChange = (newTab: Tab) => {
        setActiveTab(newTab);
        if (searchQuery.length > 2) {
            handleSearch(searchQuery, newTab);
        }
    };

    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    if (!isOpen) return null;

    const handleSelect = (item: TmdbMedia | any) => {
        let category: WeeklyPick['category'] = 'tv';
        if (item.media_type === 'tv') category = 'tv';
        else if (item.media_type === 'movie') category = 'movie';
        else if (item.media_type === 'person') {
            // gender: 1 = Female, 2 = Male
            category = item.gender === 1 ? 'actress' : 'actor';
        }

        const pick: WeeklyPick = {
            id: item.id,
            title: item.title || item.name || 'Untitled',
            media_type: item.media_type,
            poster_path: item.poster_path || item.profile_path,
            category: category,
            dayIndex: selectedDay,
        };
        onNominate(pick);
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={onClose}>
            <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-fade-in border border-white/10" onClick={e => e.stopPropagation()}>
                <header className="p-6 border-b border-white/10 flex justify-between items-center bg-card-gradient">
                    <div>
                        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Choose Your Pick</h2>
                        <p className="text-[10px] text-text-secondary uppercase font-bold tracking-widest mt-1">Select a Category, Day, and Title</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-text-secondary transition-colors"><XMarkIcon className="w-6 h-6" /></button>
                </header>

                <div className="px-6 py-4 space-y-6 bg-bg-secondary/30">
                    {/* Day Selection */}
                    <div className="flex flex-col space-y-2">
                        <h3 className="text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] ml-1">Nominate for Day</h3>
                        <div className="flex p-1 bg-bg-primary rounded-xl border border-white/5">
                            {dayNames.map((day, i) => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(i)}
                                    className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${selectedDay === i ? 'bg-accent-gradient text-on-accent shadow-lg scale-105' : 'text-text-secondary hover:text-text-primary'}`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search & Tab */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-grow relative">
                            <input 
                                type="text" 
                                placeholder={`Search for a ${activeTab === 'media' ? 'Show or Movie' : 'Actor or Actress'}...`}
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-bg-primary text-text-primary placeholder-text-secondary/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-accent border border-white/5 shadow-inner font-semibold"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        </div>
                        <div className="flex p-1 bg-bg-primary rounded-2xl border border-white/5 shadow-inner">
                            <button 
                                onClick={() => handleTabChange('media')}
                                className={`flex items-center space-x-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'media' ? 'bg-bg-secondary text-primary-accent shadow-md' : 'text-text-secondary'}`}
                            >
                                <TvIcon className="w-4 h-4" />
                                <span>Media</span>
                            </button>
                            <button 
                                onClick={() => handleTabChange('person')}
                                className={`flex items-center space-x-2 px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'person' ? 'bg-bg-secondary text-primary-accent shadow-md' : 'text-text-secondary'}`}
                            >
                                <UserIcon className="w-4 h-4" />
                                <span>People</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto p-6 bg-bg-primary">
                    {searchQuery.length > 2 ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Results</h3>
                                {isLoading && <span className="animate-pulse text-primary-accent text-[9px] font-black uppercase tracking-widest">Searching...</span>}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {searchResults.map(item => {
                                    const category = item.media_type === 'tv' ? 'tv' : item.media_type === 'movie' ? 'movie' : (item.gender === 1 ? 'actress' : 'actor');
                                    const isPicked = currentPicks.some(p => p.id === item.id && p.category === category && p.dayIndex === selectedDay);
                                    const isPickedDifferentDay = currentPicks.some(p => p.id === item.id && p.category === category && p.dayIndex !== selectedDay);
                                    
                                    return (
                                        <button 
                                            key={`${item.id}-${item.media_type}`}
                                            onClick={() => handleSelect(item)}
                                            className={`flex items-center space-x-4 p-3 rounded-2xl text-left transition-all border ${isPicked ? 'bg-primary-accent/10 border-primary-accent shadow-lg' : 'bg-bg-secondary/40 border-transparent hover:bg-bg-secondary hover:border-white/5 hover:scale-[1.01]'}`}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <img src={(item.poster_path || item.profile_path) ? `${TMDB_IMAGE_BASE_URL}w92${item.poster_path || item.profile_path}` : ''} alt="" className="w-12 h-18 object-cover rounded-xl bg-bg-secondary shadow-md" />
                                                <div className="absolute -top-1 -left-1 p-1 bg-backdrop rounded-full border border-white/10">
                                                    {item.media_type === 'tv' ? <TvIcon className="w-3 h-3 text-red-400" /> : item.media_type === 'movie' ? <FilmIcon className="w-3 h-3 text-blue-400" /> : (item.gender === 1 ? <UsersIcon className="w-3 h-3 text-pink-400" /> : <UserIcon className="w-3 h-3 text-yellow-400" />)}
                                                </div>
                                            </div>
                                            <div className="min-w-0 flex-grow">
                                                <p className="font-black text-text-primary truncate text-sm uppercase tracking-tight">{item.title || item.name}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{item.media_type}</span>
                                                    {(item.release_date || item.first_air_date) && <span className="text-[10px] text-text-secondary/50 font-bold">• {(item.release_date || item.first_air_date).substring(0,4)}</span>}
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                {isPicked ? (
                                                    <span className="text-[10px] font-black text-green-400 uppercase tracking-widest bg-green-400/10 px-2 py-1 rounded-lg border border-green-400/20">Selected</span>
                                                ) : isPickedDifferentDay ? (
                                                     <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">Nominated</span>
                                                ) : (
                                                    <span className="text-[10px] font-black text-primary-accent uppercase tracking-widest group-hover:underline">Nominate</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
                            <SparklesIcon className="w-16 h-16 text-text-secondary/20 mb-4" />
                            <p className="text-sm font-black text-text-secondary uppercase tracking-[0.2em]">Enter 3 characters to search</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NominatePicksModal;
