import React, { useState } from 'react';
import { WeeklyPick, TrackedItem, Episode } from '../types';
import { XMarkIcon, TrophyIcon, CheckCircleIcon, TvIcon, ListBulletIcon, ArrowPathIcon } from './Icons';

interface NominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TrackedItem;
  category: WeeklyPick['category'];
  onNominate: (pick: WeeklyPick, replacementId?: number) => void;
  currentPicks: WeeklyPick[];
  episodeInfo?: Episode | null;
}

const NominationModal: React.FC<NominationModalProps> = ({ isOpen, onClose, item, category, onNominate, currentPicks, episodeInfo }) => {
  const [target, setTarget] = useState<'show' | 'episode'>(episodeInfo ? 'episode' : 'show');
  const [replacingDayIndex, setReplacingDayIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const currentCategory = (category === 'tv' && target === 'episode') ? 'episode' : category;

  const handleNominate = (dayIndex: number, replacementId?: number) => {
    const pick: WeeklyPick = {
      ...item,
      category: currentCategory,
      dayIndex,
      ...(currentCategory === 'episode' && episodeInfo ? {
          seasonNumber: episodeInfo.season_number,
          episodeNumber: episodeInfo.episode_number,
          episodeTitle: episodeInfo.name
      } : {})
    };
    onNominate(pick, replacementId);
    setReplacingDayIndex(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-white/10 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 mx-auto mb-4 shadow-inner">
                <TrophyIcon className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter leading-none mb-2">Weekly Gem</h2>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-60">Nominate favorited content</p>
        </div>

        {category === 'tv' && episodeInfo && (
            <div className="mb-6 p-1 bg-bg-secondary rounded-xl border border-white/5 flex shadow-inner">
                <button 
                    onClick={() => { setTarget('show'); setReplacingDayIndex(null); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${target === 'show' ? 'bg-primary-accent text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <TvIcon className="w-3.5 h-3.5" />
                    Series
                </button>
                <button 
                    onClick={() => { setTarget('episode'); setReplacingDayIndex(null); }}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${target === 'episode' ? 'bg-primary-accent text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                >
                    <ListBulletIcon className="w-3.5 h-3.5" />
                    Episode
                </button>
            </div>
        )}

        <div className="mb-6 text-center">
            <h3 className="text-sm font-black text-text-primary uppercase tracking-tight truncate px-2">{target === 'episode' ? episodeInfo?.name : item.title}</h3>
            {target === 'episode' && <p className="text-[9px] font-bold text-primary-accent uppercase tracking-widest mt-1">S{episodeInfo?.season_number} E{episodeInfo?.episode_number} • {item.title}</p>}
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[40vh] custom-scrollbar pr-1">
          {dayNames.map((day, index) => {
            const picksForDayAndCat = currentPicks.filter(p => p.dayIndex === index && p.category === currentCategory);
            const isFull = picksForDayAndCat.length >= 5;
            
            const alreadyNominated = currentPicks.find(p => 
                p.id === item.id && 
                p.dayIndex === index && 
                p.category === currentCategory &&
                (currentCategory === 'episode' ? p.episodeNumber === episodeInfo?.episode_number : true)
            );
            
            const isToday = index === todayIndex;
            const isReplacingThis = replacingDayIndex === index;

            return (
              <div key={day} className="flex flex-col gap-1">
                <button
                  disabled={alreadyNominated !== undefined || (isFull && !isReplacingThis)}
                  onClick={() => isFull ? setReplacingDayIndex(index) : handleNominate(index)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    alreadyNominated 
                        ? 'bg-primary-accent/10 border-primary-accent/30 opacity-60 cursor-not-allowed' 
                        : isFull && !isReplacingThis
                            ? 'bg-bg-secondary/20 border-white/5 opacity-50'
                            : 'bg-bg-secondary/40 border-white/5 hover:bg-bg-secondary hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-primary-accent' : 'text-text-primary'}`}>{day}</span>
                    {isToday && <span className="text-[8px] bg-primary-accent text-on-accent px-1.5 py-0.5 rounded font-black uppercase">Today</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-tighter ${isFull ? 'text-red-400' : 'text-text-secondary opacity-40'}`}>
                        {isFull ? 'Full (5/5)' : `${picksForDayAndCat.length}/5`}
                    </span>
                    {alreadyNominated && <CheckCircleIcon className="w-4 h-4 text-primary-accent" />}
                    {isFull && !alreadyNominated && !isReplacingThis && <ArrowPathIcon className="w-4 h-4 text-text-secondary opacity-20" />}
                  </div>
                </button>
                
                {isReplacingThis && (
                   <div className="bg-bg-secondary/60 rounded-2xl p-4 mt-1 border border-primary-accent/30 animate-fade-in space-y-3">
                       <div className="flex justify-between items-center mb-2">
                           <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest">Select Pick to Replace</p>
                           <button onClick={() => setReplacingDayIndex(null)}><XMarkIcon className="w-4 h-4 text-text-secondary" /></button>
                       </div>
                       <div className="grid grid-cols-1 gap-2">
                           {picksForDayAndCat.map(p => (
                               <button 
                                key={`${p.id}-${p.episodeNumber || 'all'}`}
                                onClick={() => handleNominate(index, p.id)}
                                className="text-[10px] font-bold text-text-primary hover:text-primary-accent transition-colors py-2 truncate text-left px-3 bg-black/20 rounded-xl border border-white/5 flex items-center justify-between"
                               >
                                   <span className="truncate flex-grow">{p.category === 'episode' ? `E${p.episodeNumber}: ${p.episodeTitle}` : p.title}</span>
                                   <span className="text-[8px] font-black text-red-500 uppercase ml-2 flex-shrink-0">Replace</span>
                               </button>
                           ))}
                       </div>
                   </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NominationModal;