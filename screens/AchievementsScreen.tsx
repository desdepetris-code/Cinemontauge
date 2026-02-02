
import React, { useState, useMemo } from 'react';
import { UserData, AchievementCategory, UserAchievementStatus } from '../types';
import { useAchievements } from '../hooks/useAchievements';
// FIX: Added ArrowPathIcon and CheckCircleIcon to the imported icons list
import { BadgeIcon, TrophyIcon, InformationCircleIcon, ChevronRightIcon, SparklesIcon, LockClosedIcon, ClockIcon, ArrowPathIcon, CheckCircleIcon } from '../components/Icons';
import Carousel from '../components/Carousel';

const AchievementCard: React.FC<{ ach: UserAchievementStatus }> = ({ ach }) => {
    const isLocked = !ach.unlocked;
    const isHidden = isLocked && ach.visibility === 'hidden';
    const isHinted = isLocked && ach.visibility === 'hinted';
    
    const progressPercent = Math.min((ach.progress / ach.goal) * 100, 100);

    return (
        <div className={`p-8 rounded-[2rem] border transition-all duration-700 relative overflow-hidden group ${
            ach.unlocked 
                ? 'bg-bg-secondary/40 border-primary-accent/40 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)]' 
                : 'bg-bg-secondary/10 border-white/5 opacity-60 grayscale'
        }`}>
            {/* Background Texture for Unlocked */}
            {ach.unlocked && (
                <div className="absolute inset-0 opacity-5 pointer-events-none group-hover:opacity-100 transition-opacity">
                    <TrophyIcon className="w-full h-full transform scale-150 rotate-12" />
                </div>
            )}

            <div className="flex justify-between items-start mb-6">
                <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full ${
                            ach.tier === 4 ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                            ach.tier === 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-primary-accent/10 text-primary-accent border border-primary-accent/20'
                        }`}>
                            {['I', 'II', 'III', 'ELITE'][ach.tier - 1]}
                        </span>
                    </div>
                    <h4 className="text-xl font-black text-text-primary uppercase tracking-tighter truncate leading-none">
                        {isHidden ? '???' : ach.name}
                    </h4>
                </div>
                {ach.unlocked ? (
                    <div className="p-3 bg-primary-accent rounded-2xl text-on-accent shadow-2xl animate-bounce-in">
                        <TrophyIcon className="w-6 h-6" />
                    </div>
                ) : (
                    <div className="p-3 bg-bg-primary rounded-2xl border border-white/5 text-text-secondary/20">
                        <LockClosedIcon className="w-6 h-6" />
                    </div>
                )}
            </div>

            <p className="text-xs text-text-secondary font-medium leading-relaxed mb-8 h-10 line-clamp-2">
                {isHidden ? 'Registry credentials obscured. Continue your stewardship to reveal this entry.' : 
                 isHinted && ach.progress === 0 ? 'Criteria pending activity in this sector.' :
                 ach.description}
            </p>

            <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-text-secondary/60">
                    <span>Registry Progress</span>
                    <span>{isHidden ? '0' : Math.floor(ach.progress)} / {ach.goal}</span>
                </div>
                <div className="w-full bg-bg-primary/50 h-2 rounded-full overflow-hidden border border-white/5 shadow-inner">
                    <div 
                        className={`h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(var(--color-accent-primary-rgb),0.3)] ${ach.unlocked ? 'bg-accent-gradient' : 'bg-text-secondary/30'}`}
                        style={{ width: `${isHidden ? 0 : progressPercent}%` }}
                    ></div>
                </div>
            </div>
            
            {ach.unlocked && ach.unlockDate && (
                <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
                    <ClockIcon className="w-3.5 h-3.5 text-primary-accent opacity-40" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-text-secondary/40 italic">
                        Logged {new Date(ach.unlockDate).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
};

const AchievementsScreen: React.FC<{ userData: UserData }> = ({ userData }) => {
  const { achievements, badges: userBadges, isLoading } = useAchievements(userData);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'All'>('All');

  const categories = useMemo(() => {
      const set = new Set<AchievementCategory>();
      achievements.forEach(a => set.add(a.category));
      return ['All', ...Array.from(set)] as (AchievementCategory | 'All')[];
  }, [achievements]);

  const filteredAchievements = useMemo(() => {
      let items = selectedCategory === 'All' 
        ? achievements 
        : achievements.filter(a => a.category === selectedCategory);
      
      return items.sort((a, b) => {
          if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
          return b.tier - a.tier;
      });
  }, [achievements, selectedCategory]);

  const summary = useMemo(() => {
      const unlocked = achievements.filter(a => a.unlocked).length;
      return {
          percent: Math.round((unlocked / achievements.length) * 100),
          unlocked,
          total: achievements.length
      };
  }, [achievements]);

  if (isLoading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <ArrowPathIcon className="w-10 h-10 text-primary-accent animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-secondary animate-pulse">Auditing Registry Merits...</p>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-7xl mx-auto px-4 pb-32 space-y-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-8">
        <div>
            <div className="flex items-center gap-3 mb-4">
                <TrophyIcon className="w-8 h-8 text-primary-accent" />
                <span className="text-xs font-black uppercase tracking-[0.4em] text-primary-accent">CineMontauge Archive</span>
            </div>
            <h1 className="text-6xl font-black text-text-primary uppercase tracking-tighter leading-none">The Gallery of Merit</h1>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-4 opacity-60">Verification of your journey through global cinema</p>
        </div>
        <div className="bg-bg-secondary/40 px-10 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl flex items-center gap-10 backdrop-blur-xl">
            <div className="text-center">
                <p className="text-4xl font-black text-primary-accent leading-none">{summary.unlocked}</p>
                <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest mt-2 opacity-50">Unlocked</p>
            </div>
            <div className="w-px h-12 bg-white/10"></div>
            <div className="text-center">
                <p className="text-4xl font-black text-text-primary leading-none">{summary.percent}%</p>
                <p className="text-[10px] font-black uppercase text-text-secondary tracking-widest mt-2 opacity-50">Mastery</p>
            </div>
        </div>
      </header>

      {userBadges.length > 0 && (
          <section className="animate-slide-in-up">
              <div className="flex items-center gap-6 mb-10">
                <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest whitespace-nowrap">Distinguished Credentials</h2>
                <div className="h-px w-full bg-white/10"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {userBadges.map(badge => (
                      <div key={badge.id} className="p-10 bg-accent-gradient rounded-[3rem] shadow-2xl relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-16 opacity-10 scale-150 transform translate-x-8 -translate-y-8 group-hover:scale-[2.5] transition-transform duration-2000">
                              <span className="text-[15rem] leading-none">{badge.icon}</span>
                          </div>
                          <div className="relative z-10">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl border border-white/10">
                                {badge.icon}
                            </div>
                            <h3 className="text-3xl font-black text-on-accent uppercase tracking-tighter mb-3">{badge.name}</h3>
                            <p className="text-sm text-on-accent/80 font-medium leading-relaxed max-w-[240px]">{badge.description}</p>
                            <div className="mt-6 flex items-center gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-on-accent" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-on-accent opacity-60">Identity Verified</span>
                            </div>
                          </div>
                      </div>
                  ))}
              </div>
          </section>
      )}

      <div className="sticky top-16 bg-bg-primary/95 backdrop-blur-xl z-30 -mx-6 px-6 py-6 border-b border-white/5">
        <Carousel>
            <div className="flex space-x-3 overflow-x-auto hide-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                            selectedCategory === cat 
                                ? 'bg-primary-accent text-on-accent border-transparent shadow-[0_10px_20px_-5px_rgba(var(--color-accent-primary-rgb),0.5)] scale-110 z-10' 
                                : 'bg-bg-secondary/40 text-text-primary border-white/10 hover:bg-bg-secondary'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </Carousel>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-32 animate-fade-in">
          {filteredAchievements.map(ach => (
              <AchievementCard key={ach.id} ach={ach} />
          ))}
      </div>
    </div>
  );
};

export default AchievementsScreen;
