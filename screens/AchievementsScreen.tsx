import React, { useMemo } from 'react';
import { UserData } from '../types';
import { useAchievements } from '../hooks/useAchievements';
import AchievementBadge from '../components/AchievementBadge';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { ChevronLeftIcon } from '../components/Icons';

interface AchievementsScreenProps {
  userData: UserData;
  onBack?: () => void;
}

const AchievementsScreen: React.FC<AchievementsScreenProps> = ({ userData, onBack }) => {
  const achievements = useAchievements(userData);
  const [pendingRewards] = useLocalStorage<string[]>('pendingRewards', []);
  
  const sortedAchievements = useMemo(() => [...achievements].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    const difficultyOrder = { 'Hard': 0, 'Medium': 1, 'Easy': 2 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  }), [achievements]);

  const gridContent = (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedAchievements.map(ach => 
          <AchievementBadge 
              key={ach.id} 
              achievement={ach} 
              isPending={pendingRewards.includes(ach.id)}
          />
      )}
    </div>
  );

  if (onBack) {
    // Standalone screen view
    return (
      <div className="animate-fade-in max-w-4xl mx-auto px-4 pb-8">
        <header className="flex items-center mb-6 relative">
          <button onClick={onBack} className="absolute left-0 p-2 bg-backdrop rounded-full text-text-primary hover:bg-bg-secondary transition-colors">
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-bold text-text-primary text-center w-full">Achievements</h1>
        </header>
        {gridContent}
      </div>
    );
  }

  // Tab content view (no header, no extra padding wrapper)
  return (
    <div className="animate-fade-in">
        {gridContent}
    </div>
  );
};

export default AchievementsScreen;
