import React, { useState } from 'react';
import { WeeklyPick, TrackedItem } from '../types';
import { XMarkIcon, TrophyIcon, CheckCircleIcon } from './Icons';

interface NominationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: TrackedItem;
  category: WeeklyPick['category'];
  onNominate: (pick: WeeklyPick, replacementId?: number) => void;
  currentPicks: WeeklyPick[];
}

const NominationModal: React.FC<NominationModalProps> = ({ isOpen, onClose, item, category, onNominate, currentPicks }) => {
  if (!isOpen) return null;

  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const today = new Date().getDay();
  const todayIndex = today === 0 ? 6 : today - 1;

  const handleNominate = (dayIndex: number, replacementId?: number) => {
    const pick: WeeklyPick = {
      ...item,
      category,
      dayIndex
    };
    onNominate(pick, replacementId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-bg-primary rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-white/10 relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors">
          <XMarkIcon className="w-5 h-5" />
        </button>
        
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-yellow-500 mx-auto mb-4 shadow-inner">
                <TrophyIcon className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter leading-none mb-2">Weekly Gem</h2>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest opacity-60">Nominate <span className="text-primary-accent">{item.title}</span></p>
        </div>

        <div className="space-y-2">
          {dayNames.map((day, index) => {
            const picksForDayAndCat = currentPicks.filter(p => p.dayIndex === index && p.category === category);
            const isFull = picksForDayAndCat.length >= 5;
            const alreadyNominated = picksForDayAndCat.find(p => p.id === item.id);
            const isToday = index === todayIndex;

            return (
              <div key={day} className="flex flex-col gap-1">
                <button
                  disabled={alreadyNominated !== undefined}
                  onClick={() => handleNominate(index)}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    alreadyNominated 
                        ? 'bg-primary-accent/10 border-primary-accent/30 opacity-60 cursor-not-allowed' 
                        : 'bg-bg-secondary/40 border-white/5 hover:bg-bg-secondary hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black uppercase tracking-widest ${isToday ? 'text-primary-accent' : 'text-text-primary'}`}>{day}</span>
                    {isToday && <span className="text-[8px] bg-primary-accent text-on-accent px-1.5 py-0.5 rounded font-black uppercase">Today</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-text-secondary opacity-40">{picksForDayAndCat.length}/5</span>
                    {alreadyNominated && <CheckCircleIcon className="w-4 h-4 text-primary-accent" />}
                  </div>
                </button>
                
                {isFull && !alreadyNominated && (
                   <div className="px-2 space-y-1 mt-1">
                       <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1 opacity-60 text-center">Limit Reached - Replace a Gem?</p>
                       <div className="grid grid-cols-1 gap-1">
                           {picksForDayAndCat.map(p => (
                               <button 
                                key={p.id}
                                onClick={() => handleNominate(index, p.id)}
                                className="text-[9px] font-bold text-text-secondary hover:text-primary-accent transition-colors py-1 truncate text-left px-2 bg-black/20 rounded border border-white/5"
                               >
                                   Replace: {p.title}
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