
import React, { useMemo } from 'react';
import { TmdbMediaDetails, UserData, EpisodeProgress } from '../types';
import { TrophyIcon, CheckCircleIcon, BookOpenIcon, StarIcon, PhotoIcon, PlayPauseIcon, FireIcon, ArchiveBoxIcon, ClockIcon, PencilSquareIcon, HeartIcon } from './Icons';

interface ShowAchievementsTabProps {
  details: TmdbMediaDetails;
  userData: UserData;
}

interface TitleAchievement {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    unlocked: boolean;
    progress?: number;
    goal?: number;
    tier: 'Core' | 'Elite' | 'Master';
}

const ShowAchievementsTab: React.FC<ShowAchievementsTabProps> = ({ details, userData }) => {
  const titleAchievements: TitleAchievement[] = useMemo(() => {
      const id = details.id;
      const history = userData.history.filter(h => h.id === id);
      const progress = userData.watchProgress[id] || {};
      const rating = userData.ratings[id]?.rating || 0;
      const custom = userData.customImagePaths[id];
      const notes = userData.mediaNotes[id] || [];
      const fav = userData.favorites.some(f => f.id === id);
      const isTV = details.media_type === 'tv';

      const results: TitleAchievement[] = [
          {
              id: 'captured',
              name: 'Registry Verified',
              description: `This ${details.media_type} is officially logged in your ledger.`,
              icon: <CheckCircleIcon className="w-6 h-6" />,
              unlocked: history.length > 0,
              tier: 'Core'
          },
          {
              id: 'reflected',
              name: 'The Thinker',
              description: 'Captured a personal reflection in the journal for this title.',
              icon: <BookOpenIcon className="w-6 h-6" />,
              unlocked: Object.values(progress).some(s => Object.values(s).some(e => (e as any).journal)),
              tier: 'Core'
          },
          {
              id: 'scholar',
              name: 'The Scholar',
              description: 'Took 3 or more detailed notes to study this experience.',
              icon: <PencilSquareIcon className="w-6 h-6" />,
              unlocked: notes.length >= 3,
              progress: notes.length,
              goal: 3,
              tier: 'Elite'
          },
          {
              id: 'devoted',
              name: 'Cinematic Devotion',
              description: 'Favorited this title and gave it a numerical rating.',
              icon: <HeartIcon filled className="w-6 h-6" />,
              unlocked: fav && rating > 0,
              tier: 'Elite'
          }
      ];

      if (isTV) {
          const totalAired = details.number_of_episodes || 0;
          let watchedCount = 0;
          Object.values(progress).forEach(s => Object.values(s).forEach(e => { if ((e as any).status === 2) watchedCount++; }));

          results.push({
              id: 'binge',
              name: 'Binge Analyst',
              description: 'Logged 10 or more episodes of this series.',
              icon: <FireIcon className="w-6 h-6" />,
              unlocked: watchedCount >= 10,
              progress: watchedCount,
              goal: 10,
              tier: 'Core'
          });

          results.push({
              id: 'completionist',
              name: 'Show Stopper',
              description: 'Watched every aired episode in the database.',
              icon: <ArchiveBoxIcon className="w-6 h-6" />,
              unlocked: watchedCount > 0 && watchedCount >= totalAired,
              progress: watchedCount,
              goal: totalAired,
              tier: 'Master'
          });
      } else {
          results.push({
              id: 'rewatch',
              name: 'Loop Specialist',
              description: 'Watched this film at least twice.',
              icon: <ClockIcon className="w-6 h-6" />,
              unlocked: history.length >= 2,
              progress: history.length,
              goal: 2,
              tier: 'Elite'
          });
          
          results.push({
              id: 'masterpiece',
              name: 'Registry Gold',
              description: 'Rated this film a perfect 10/10.',
              icon: <StarIcon filled className="w-6 h-6" />,
              unlocked: rating === 10,
              tier: 'Master'
          });
      }

      return results;
  }, [details, userData]);

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <header className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-primary-accent/10 rounded-full border border-primary-accent/20">
              <TrophyIcon className="w-10 h-10 text-primary-accent" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Title Merit Ledger</h3>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.4em] opacity-60 mt-2">Personal achievements for {details.title || details.name}</p>
          </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {titleAchievements.map(ach => (
              <div key={ach.id} className={`p-8 rounded-[2.5rem] border transition-all duration-700 relative overflow-hidden group ${
                  ach.unlocked 
                      ? 'bg-bg-secondary/40 border-primary-accent/40 shadow-[0_20px_50px_-12px_rgba(var(--color-accent-primary-rgb),0.3)]' 
                      : 'bg-bg-secondary/10 border-white/5 opacity-50 grayscale'
              }`}>
                  <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl transition-all ${ach.unlocked ? 'bg-accent-gradient text-on-accent shadow-lg scale-110' : 'bg-bg-primary text-text-secondary/20'}`}>
                          {ach.icon}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-[0.3em] px-2 py-1 rounded-md border ${
                          ach.tier === 'Master' ? 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10' :
                          ach.tier === 'Elite' ? 'text-purple-400 border-purple-400/30 bg-purple-400/10' :
                          'text-primary-accent border-primary-accent/20 bg-primary-accent/5'
                      }`}>
                          {ach.tier}
                      </span>
                  </div>
                  
                  <h4 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-2">{ach.name}</h4>
                  <p className="text-xs text-text-secondary font-medium leading-relaxed mb-6">{ach.description}</p>
                  
                  {ach.goal !== undefined && !ach.unlocked && (
                      <div className="space-y-2">
                          <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-text-secondary/40">
                              <span>Registry Progress</span>
                              <span>{ach.progress} / {ach.goal}</span>
                          </div>
                          <div className="w-full bg-bg-primary/50 h-1.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                              <div 
                                  className="h-full bg-text-secondary/30 transition-all duration-1000"
                                  style={{ width: `${(ach.progress! / ach.goal!) * 100}%` }}
                              ></div>
                          </div>
                      </div>
                  )}

                  {ach.unlocked && (
                      <div className="flex items-center gap-2 animate-fade-in">
                          <CheckCircleIcon className="w-3.5 h-3.5 text-primary-accent" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-primary-accent">Achievement Logged</span>
                      </div>
                  )}
              </div>
          ))}
      </div>

      <div className="p-10 bg-bg-secondary/10 rounded-[3rem] border border-dashed border-white/10 text-center">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.3em] opacity-40 max-w-lg mx-auto leading-relaxed">
              Every title in your library is a separate sector of the registry. Interacting through notes, journals, and consistent watching reveals hidden milestones.
          </p>
      </div>
    </div>
  );
};

export default ShowAchievementsTab;
