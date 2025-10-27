import React, { useMemo } from 'react';
import { UserData } from '../types';
import { useAchievements } from '../hooks/useAchievements';
import AchievementBadge from '../components/AchievementBadge';

const AchievementsScreen: React.FC<{ userData: UserData }> = ({ userData }) => {
  const { achievements: allUserAchievements, isLoading } = useAchievements(userData);

  if (isLoading) {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-text-primary">Achievements</h1>
                <p className="text-text-secondary mt-1">Unlock badges and rewards by completing challenges.</p>
            </header>
            <div className="animate-pulse">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                    <div className="h-32 bg-bg-secondary rounded-lg"></div>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Achievements</h1>
        <p className="text-text-secondary mt-1">Unlock badges by completing challenges.</p>
      </header>

      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allUserAchievements.map(ach => (
            <AchievementBadge 
              key={ach.id} 
              achievement={ach}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default AchievementsScreen;