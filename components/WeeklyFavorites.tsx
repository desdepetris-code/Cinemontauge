
import React, { useMemo } from 'react';
import { WeeklyPick } from '../types';
import ShowCard from './ShowCard';
import Carousel from './Carousel';
import { TrophyIcon, SparklesIcon, TvIcon, FilmIcon, UserIcon, UsersIcon } from './Icons';

interface WeeklyFavoritesProps {
  items: WeeklyPick[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie' | 'person') => void;
  onNominate: () => void;
}

const WeeklyFavorites: React.FC<WeeklyFavoritesProps> = ({ items, onSelectShow, onNominate }) => {
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  
  const sortedPicks = useMemo(() => {
      return [...items].sort((a,b) => a.dayIndex - b.dayIndex);
  }, [items]);

  return (
    <div className="my-10 relative overflow-hidden bg-bg-secondary/20 rounded-3xl mx-6 border border-white/5">
      <div className="absolute inset-0 bg-yellow-500/[0.02] pointer-events-none"></div>
      
      <div className="relative z-10 px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-500/20 rounded-2xl text-yellow-500 shadow-lg border border-yellow-500/10">
                    <TrophyIcon className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">Weekly Gems</h2>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-[0.3em] mt-2">Daily Elite Selection (28 Picks)</p>
                </div>
            </div>
            <button 
                onClick={onNominate}
                className="px-6 py-2 bg-yellow-500 text-black font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-yellow-400 transition-all transform hover:scale-105 shadow-xl flex items-center gap-2"
            >
                <SparklesIcon className="w-3 h-3" />
                {items.length === 0 ? "Nominate Picks" : "Manage Nominations"}
            </button>
          </div>

          {items.length > 0 ? (
            <Carousel>
              <div className="flex overflow-x-auto py-6 -mx-4 px-4 space-x-6 hide-scrollbar">
                {sortedPicks.map(item => (
                  <div key={`${item.id}-${item.category}-${item.dayIndex}`} className="w-44 sm:w-52 flex-shrink-0 relative group">
                    <div className="absolute -top-3 -left-3 z-30 flex flex-col gap-1">
                        <div className="bg-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-lg shadow-xl transform -rotate-12 border border-black/10 flex items-center gap-1.5 uppercase">
                            {dayNames[item.dayIndex]}
                        </div>
                        <div className="bg-backdrop/80 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-md shadow-lg self-start border border-white/10 uppercase flex items-center gap-1">
                            {item.category === 'tv' && <TvIcon className="w-2.5 h-2.5" />}
                            {item.category === 'movie' && <FilmIcon className="w-2.5 h-2.5" />}
                            {item.category === 'actor' && <UserIcon className="w-2.5 h-2.5" />}
                            {item.category === 'actress' && <UsersIcon className="w-2.5 h-2.5" />}
                            {item.category}
                        </div>
                    </div>
                    <ShowCard item={item} onSelect={onSelectShow as any} />
                  </div>
                ))}
                <div className="w-6 flex-shrink-0"></div>
              </div>
            </Carousel>
          ) : (
            <div className="bg-bg-primary/40 border border-white/5 rounded-3xl p-12 text-center animate-fade-in shadow-inner">
                <TrophyIcon className="w-16 h-16 text-yellow-500/20 mx-auto mb-6" />
                <h3 className="text-xl font-black text-text-primary uppercase tracking-widest mb-2">Hall of Fame Empty</h3>
                <p className="text-sm text-text-secondary max-w-sm mx-auto mb-8 font-medium">Your daily favorite actors, actresses, movies, and shows from this week will appear here once nominated.</p>
                <button 
                    onClick={onNominate}
                    className="px-8 py-3 bg-yellow-500 text-black font-black text-xs uppercase tracking-[0.2em] rounded-full hover:bg-yellow-400 transition-all transform hover:scale-110 shadow-2xl"
                >
                    Select Your Gems
                </button>
            </div>
          )}
      </div>
    </div>
  );
};

export default WeeklyFavorites;
