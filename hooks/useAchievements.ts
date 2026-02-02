
import { useMemo, useState, useEffect } from 'react';
import { UserData, UserAchievementStatus, Badge } from '../types';
import { allAchievements, badges } from '../achievements';
import { useCalculatedStats } from './useCalculatedStats';

export function useAchievements(data: UserData) {
  const [statuses, setStatuses] = useState<UserAchievementStatus[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const calculatedStats = useCalculatedStats(data);
  
  useEffect(() => {
    const checkAll = async () => {
        setIsLoading(true);
        
        const newStatuses = allAchievements.map(ach => {
            const { progress, goal } = ach.check(data, calculatedStats);
            const unlocked = progress >= goal;
            return { ...ach, unlocked, progress, goal, unlockDate: unlocked ? new Date().toISOString() : undefined };
        });
        
        const newlyUnlockedBadges = badges.filter(badge => 
            badge.requirements.every(reqId => 
                newStatuses.find(s => s.id === reqId)?.unlocked
            )
        );

        setStatuses(newStatuses);
        setUnlockedBadges(newlyUnlockedBadges);
        setIsLoading(false);
    };

    checkAll();
  }, [data, calculatedStats]);

  return { achievements: statuses, badges: unlockedBadges, isLoading };
}
