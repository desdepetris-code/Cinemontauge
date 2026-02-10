import React from 'react';
import { TmdbMedia } from '../types';
import MediaCard from './MediaCard';
import { ArrowPathIcon } from './Icons';

interface RecommendedMediaProps {
  recommendations: TmdbMedia[];
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onRefresh?: () => void;
}

const RecommendedMedia: React.FC<RecommendedMediaProps> = ({ recommendations, onSelectShow, onRefresh }) => {
  if (!recommendations || (recommendations.length === 0 && !onRefresh)) {
    return <p className="text-text-secondary">No recommendations available at this time.</p>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest">You May Also Like</h2>
        {onRefresh && (
            <button 
                onClick={onRefresh}
                className="flex items-center gap-2 px-6 py-2.5 bg-bg-secondary/40 hover:bg-bg-secondary/60 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-text-primary border border-white/5 transition-all shadow-lg active:scale-95"
            >
                <ArrowPathIcon className="w-3.5 h-3.5 text-primary-accent" />
                Refresh Recommendations
            </button>
        )}
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recommendations.map(item => (
            <MediaCard key={item.id} item={item} onSelect={onSelectShow} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-bg-secondary/10 rounded-[2.5rem] border border-dashed border-white/10">
            <p className="text-text-secondary font-black uppercase tracking-widest text-[10px] opacity-40">No related titles found in current sector.</p>
        </div>
      )}
    </div>
  );
};

export default RecommendedMedia;