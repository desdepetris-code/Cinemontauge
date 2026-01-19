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
    let totalWatched = 0;

    // We still count watched episodes across all seasons
    Object.values(progressForShow).forEach(season => {
        Object.values(season).forEach(ep => {
            if ((ep as EpisodeProgress).status === 2) {
                totalWatched++;
            }
        });
    });

    return { 
        watchedCount: totalWatched, 
        totalAiredCount: airedCount,
    };
  }, [details, watchProgress]);
  
  // Progress is capped at 100% based on aired episodes
  const overallPercent = totalAiredCount > 0 ? (watchedCount / totalAiredCount) * 100 : 0;

  if (totalAiredCount === 0 && watchedCount === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-text-primary mb-3">Overall Progress</h2>
      <div className="bg-card-gradient p-4 rounded-lg shadow-md relative">
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <div className="flex items-center gap-1.5 relative">
                    <span className="font-bold text-text-primary">Progress</span>
                    <button 
                        onClick={() => setShowAiredNote(!showAiredNote)}
                        className="text-text-secondary hover:text-primary-accent transition-colors"
                        aria-label="Aired episodes information"
                    >
                        <InformationCircleIcon className="w-4 h-4" />
                    </button>
                    
                    {showAiredNote && (
                        <div className="absolute left-0 top-6 w-64 p-3 bg-bg-primary border border-white/10 rounded-xl shadow-2xl z-30 animate-fade-in">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">Data Note</span>
                                <button onClick={() => setShowAiredNote(false)} className="text-text-secondary hover:text-white">
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary leading-relaxed">
                                This progress bar tracks your journey against <span className="text-text-primary font-bold">aired content</span> only. Future episodes and specials are excluded from this calculation.
                            </p>
                        </div>
                    )}
                </div>
                <span className="text-text-secondary font-medium italic text-xs">
                    {`${watchedCount} / ${totalAiredCount} eps watched`}
                </span>
            </div>
            <div className="w-full bg-bg-secondary rounded-full h-4 relative overflow-hidden mt-2">
                <div 
                    className="bg-accent-gradient h-4 rounded-full flex items-center justify-center text-xs font-bold text-on-accent transition-all duration-500"
                    style={{ width: `${Math.min(100, overallPercent)}%` }}
                >
                    {overallPercent >= 10 && `${Math.round(overallPercent)}%`}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default OverallProgress;