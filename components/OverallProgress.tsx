import React, { useMemo } from 'react';
import { TmdbMediaDetails, WatchProgress } from '../types';
import { getAiredEpisodeCount } from '../utils/formatUtils';

interface OverallProgressProps {
  details: TmdbMediaDetails;
  watchProgress: WatchProgress;
}

const OverallProgress: React.FC<OverallProgressProps> = ({ details, watchProgress }) => {
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
            if (ep.status === 2) {
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
      <div className="bg-card-gradient p-4 rounded-lg shadow-md">
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="font-bold text-text-primary">Aired Progress</span>
                <span className="text-text-secondary">{`${watchedCount} / ${totalAiredCount} aired episodes`}</span>
            </div>
            <div className="w-full bg-bg-secondary rounded-full h-4 relative overflow-hidden">
                <div 
                    className="bg-accent-gradient h-4 rounded-full flex items-center justify-center text-xs font-bold text-on-accent transition-all duration-500"
                    style={{ width: `${Math.min(100, overallPercent)}%` }}
                >
                    {overallPercent >= 5 && `${Math.round(overallPercent)}%`}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default OverallProgress;