import { useMemo } from 'react';
import { UserData, UserAchievementStatus } from '../types';
import { allAchievements } from '../achievements';
import { useCalculatedStats } from './useCalculatedStats';

export function useAchievements(data: UserData): UserAchievementStatus[] {
  const calculatedStats = useCalculatedStats(data);
  
  const achievementStatus = useMemo(() => {
    return allAchievements.map(ach => {
      const { progress, goal } = ach.check(data, calculatedStats);
      const unlocked = progress >= goal;
      return { ...ach, unlocked, progress, goal };
    });
  }, [data, calculatedStats]);

  return achievementStatus;
}