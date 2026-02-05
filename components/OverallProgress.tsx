import React, { useMemo, useState } from 'react';
import { TmdbMediaDetails, WatchProgress, EpisodeProgress } from '../types';
import { getAiredEpisodeCount } from '../utils/formatUtils';
import { InformationCircleIcon, XMarkIcon } from './Icons';

interface OverallProgressProps {
  details: TmdbMediaDetails;
  watchProgress: WatchProgress;
}

const OverallProgress: React.FC<OverallProgressProps> = ({ details, watchProgress }) => {
  const [showAiredNote, setShowAiredNote] = useState(false);

  const { watchedCount, totalAiredCount } = useMemo(() => {
    if (!details.seasons) {
        return { watchedCount: 0, totalAiredCount: 0 };
    }

    const airedCount = getAiredEpisodeCount(details);
    const progressForShow = watchProgress[details.id] || {};
    
    let regularWatched = 0;

    // Calculate Regular Seasons only
    Object.entries(progressForShow).forEach(([sNum, season]) => {
        if (Number(sNum) === 0) return; // Skip specials for the main summary bar
        Object.values(season).forEach(ep => {
            if ((ep as EpisodeProgress).status === 2) regularWatched++;
        });
    });

    return { 
        watchedCount: regularWatched, 
        totalAiredCount: airedCount
    };
  }, [details, watchProgress]);
  
  const overallPercent = totalAiredCount > 0 ? (watchedCount / totalAiredCount) * 100 : 0;

  if (totalAiredCount === 0 && watchedCount === 0) return null;

  return (
    <section className="mb-8 space-y-6">
      {/* Main Aired Content Progress Bar */}
      {(totalAiredCount > 0 || watchedCount > 0) && (
        <div>
          <h2 className="text-xl font-bold text-white mb-3">Overall Progress</h2>
          <div className="bg-white/5 p-5 rounded-3xl shadow-xl relative border border-white/10">
            <div className="flex justify-between items-center text-sm mb-2">
                <div className="flex items-center gap-1.5 relative">
                    <span className="font-black text-[10px] uppercase tracking-widest text-white">All Seasons</span>
                    <button 
                        onClick={() => setShowAiredNote(!showAiredNote)}
                        className="text-white hover:opacity-80 transition-colors"
                        aria-label="Aired episodes information"
                    >
                        <InformationCircleIcon className="w-4 h-4 opacity-50 hover:opacity-100" />
                    </button>
                    
                    {showAiredNote && (
                        <div className="absolute left-0 top-6 w-64 p-3 bg-bg-primary border border-white/10 rounded-xl shadow-2xl z-30 animate-fade-in">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white">Aired Status</span>
                                <button onClick={() => setShowAiredNote(false)} className="text-white hover:opacity-70">
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                            <p className="text-[10px] text-white/70 leading-relaxed font-medium">
                                This bar calculates progress based strictly on <span className="text-white font-bold">episodes that have already aired</span>. Specials and future releases are excluded here.
                            </p>
                        </div>
                    )}
                </div>
                <span className="text-white font-black text-[10px] uppercase tracking-widest opacity-60">
                    {`${watchedCount} / ${totalAiredCount} Watched`}
                </span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-4 relative overflow-hidden shadow-inner border border-white/5">
                <div 
                    className="bg-accent-gradient h-4 rounded-full flex items-center justify-center text-[10px] font-black text-on-accent transition-all duration-1000 ease-out shadow-[0_0_15px_white]"
                    style={{ width: `${Math.min(100, overallPercent)}%` }}
                >
                    {overallPercent >= 12 && `${Math.round(overallPercent)}%`}
                </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OverallProgress;