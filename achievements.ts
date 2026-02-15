
import { Achievement, Badge, AchievementCategory, UserData, CalculatedStats } from './types';

/**
 * Helper to generate 25 tiered milestones for a category.
 * This ensures "25 more achievements per category" as requested.
 */
const generateTieredMerits = (
  category: AchievementCategory, 
  prefix: string, 
  nameBase: string, 
  baseVal: number, 
  increment: number
): Achievement[] => {
  return Array.from({ length: 25 }).map((_, i) => {
    const tierNum = i + 1;
    const goal = baseVal + (i * increment);
    
    // // FIX: Added logic to assign difficulty based on tier index
    let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Easy';
    if (i >= 8 && i < 16) difficulty = 'Medium';
    else if (i >= 16) difficulty = 'Hard';

    return {
      id: `${prefix}_tier_${tierNum}`,
      name: `${nameBase} ${["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV"][i]}`,
      description: `Surpass ${goal} total points of activity in the ${category} sector.`,
      category,
      // // FIX: Cast tier to explicit literal union to satisfy Achievement interface
      tier: (Math.min(4, Math.floor(i / 6) + 1)) as 1 | 2 | 3 | 4,
      visibility: i < 5 ? 'visible' : 'hinted',
      scope: 'global',
      // // FIX: Added missing difficulty property
      difficulty,
      // FIX: Typed the check function parameters to resolve "Property ... does not exist on type unknown" errors.
      check: (d: UserData, s: CalculatedStats) => {
          let val = 0;
          switch(prefix) {
              case 'watch': val = d.history.length; break;
              case 'journ': val = s.journalCount; break;
              case 'rate': val = s.ratedItemsCount; break;
              case 'list_v': val = d.customLists.reduce((acc, l) => acc + l.items.length, 0); break;
              case 'streak': val = s.longestStreak; break;
              case 'mood': val = s.distinctMoodsCount; break;
              // FIX: Added explicit type cast (v as any) to resolve "Property does not exist on type unknown" errors.
              case 'cust_p': val = Object.values(d.customImagePaths).filter((v: any) => !!v.poster_path).length; break;
              case 'cust_b': val = Object.values(d.customImagePaths).filter((v: any) => !!v.backdrop_path).length; break;
              case 'disc': val = s.watchedGenreCount; break;
              case 'ser': val = s.completedSeasonsCount || 0; break;
              case 'rew': val = d.history.filter(h => d.history.filter(h2 => h2.id === h.id).length > 1).length; break;
              case 'soc': val = d.comments.length; break;
              case 'pwr': val = d.deletedHistory.length + d.deletedNotes.length; break;
          }
          return { progress: val, goal };
      }
    };
  });
};

export const allAchievements: Achievement[] = [
  // --- GENERATED CATEGORIES (25 milestones each) ---
  ...generateTieredMerits('Watching', 'watch', 'Reel Master', 10, 25),
  ...generateTieredMerits('Journaling', 'journ', 'The Chronicler', 5, 10),
  ...generateTieredMerits('Ratings & Mood', 'rate', 'The Critic', 5, 15),
  ...generateTieredMerits('Lists & Organization', 'list_v', 'Curator', 10, 20),
  ...generateTieredMerits('Consistency & Time', 'streak', 'Ritualist', 3, 7),
  ...generateTieredMerits('Ratings & Mood', 'mood', 'Emotional Spectrum', 1, 1),
  ...generateTieredMerits('Customization', 'cust_p', 'Visual Director', 1, 3),
  ...generateTieredMerits('Customization', 'cust_b', 'Canvas Architect', 1, 3),
  ...generateTieredMerits('Discovery', 'disc', 'Genre Explorer', 1, 1),
  ...generateTieredMerits('Series Progress', 'ser', 'Season Finisher', 1, 5),
  ...generateTieredMerits('Rewatching', 'rew', 'Nostalgic Heart', 5, 10),
  ...generateTieredMerits('Social', 'soc', 'Community Voice', 1, 5),
  ...generateTieredMerits('Power User', 'pwr', 'Registry Cleaner', 5, 20),

  // --- UNIQUE MILESTONES ---
  // // FIX: Added missing difficulty and updated check function parameters for unique milestones
  { 
    id: 'watch_midnight', 
    name: 'Midnight Movie', 
    description: 'Log a movie between 12 AM and 3 AM.', 
    category: 'Watching', 
    tier: 2, 
    visibility: 'hidden', 
    scope: 'global', 
    difficulty: 'Easy',
    check: (d: UserData, s: CalculatedStats) => ({ progress: d.history.some(h => { const hr = new Date(h.timestamp).getHours(); return hr >= 0 && hr <= 3; }) ? 1 : 0, goal: 1 }) 
  },
  { 
    id: 'journ_long', 
    name: 'Analytical Mind', 
    description: 'Write a journal entry over 200 words.', 
    category: 'Journaling', 
    tier: 3, 
    visibility: 'hinted', 
    scope: 'global', 
    difficulty: 'Medium',
    check: (d: UserData, s: CalculatedStats) => {
      const long = Object.values(d.watchProgress).some(sh => Object.values(sh).some(se => Object.values(se).some(ep => (ep as any).journal?.text?.split(' ').length > 200)));
      return { progress: long ? 1 : 0, goal: 1 };
  }},
];

export const badges: Badge[] = [
  { id: 'badge_archivist', name: 'Master Archivist', description: 'Volume and precision across all sectors.', category: 'Archive & Cleanup', icon: '🏛️', requirements: ['watch_tier_10', 'journ_tier_5'], tier: 3 },
  { id: 'badge_historian', name: 'Grand Historian', description: 'Unwavering dedication to the timeline.', category: 'Consistency & Time', icon: '⏳', requirements: ['streak_tier_10', 'watch_tier_5'], tier: 2 }
];
