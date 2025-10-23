import { Achievement } from './types';

export const allAchievements: Achievement[] = [
  // --- Daily Watch Goals ---
  {
    id: 'daily_episode_sprinter',
    name: 'Episode Sprinter',
    description: 'Watch 12 episodes in a single day. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.episodesWatchedToday,
      goal: 12,
    }),
  },
  {
    id: 'daily_movie_marathon',
    name: 'Movie Marathon',
    description: 'Watch 5 movies in a single day. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipFeature',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.moviesWatchedToday,
      goal: 5,
    }),
  },
  {
    id: 'daily_mixed_media',
    name: 'Mixed Media Day',
    description: 'Watch 8 episodes and 2 movies in a day. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipFeature',
    adminApprovalRequired: true,
    check: (data, stats) => {
        const episodeProgress = Math.min(stats.episodesWatchedToday / 8, 1);
        const movieProgress = Math.min(stats.moviesWatchedToday / 2, 1);
        const totalProgress = Math.floor(((episodeProgress + movieProgress) / 2) * 100);
        return { progress: totalProgress, goal: 100 };
    },
  },

  // --- Weekly Watch Goals ---
  {
    id: 'weekly_binger',
    name: 'Weekly Binger',
    description: 'Watch 35 episodes within 7 days. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.watchedThisWeek,
      goal: 35,
    }),
  },
  {
    id: 'weekly_movie_collector',
    name: 'Movie Collector',
    description: 'Watch 10 movies within 7 days. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipFeature',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.moviesWatchedThisWeek,
      goal: 10,
    }),
  },
  {
    id: 'weekly_mixed_media',
    name: 'Mixed Media Week',
    description: 'Watch 25 episodes and 5 movies in a week. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipFeature',
    adminApprovalRequired: true,
    check: (data, stats) => {
        const episodeProgress = Math.min(stats.watchedThisWeek / 25, 1);
        const movieProgress = Math.min(stats.moviesWatchedThisWeek / 5, 1);
        const totalProgress = Math.floor(((episodeProgress + movieProgress) / 2) * 100);
        return { progress: totalProgress, goal: 100 };
    },
  },

  // --- Streak & Consistency ---
  {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Watch an episode on 4 consecutive days.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.longestStreak,
      goal: 4,
    }),
  },
  {
    id: 'week_streak',
    name: 'Week Streak',
    description: 'Maintain a 7-day watch streak.',
    difficulty: 'Medium',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.longestStreak,
      goal: 7,
    }),
  },
    {
    id: 'marathon_viewer',
    name: 'Marathon Viewer',
    description: 'Watch 12 episodes over a 7-day period.',
    difficulty: 'Medium',
    reward: 'vipFeature',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.watchedThisWeek,
      goal: 12,
    }),
  },
  {
    id: 'dedication',
    name: 'Dedication',
    description: 'Achieve a 20-day watch streak. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
      progress: stats.longestStreak,
      goal: 20,
    }),
  },
  
  // --- Engagement & Interaction ---
  {
    id: 'note_taker',
    name: 'Note Taker',
    description: 'Add journal entries to 8 different episodes.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.journalCount,
      goal: 8,
    }),
  },
  {
    id: 'mood_tracker',
    name: 'Mood Tracker',
    description: 'Use the mood tracker for 8 episodes.',
    difficulty: 'Medium',
    reward: 'vipFeature',
    adminApprovalRequired: false,
    check: (data, stats) => ({
      progress: stats.moodJournalCount,
      goal: 8,
    }),
  },
  {
    id: 'community_star',
    name: 'Community Star',
    description: 'Engage by adding notes to 20 episodes. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => ({
        progress: stats.journalCount,
        goal: 20,
    }),
  },

  // --- Collection & Variety ---
  {
    id: 'genre_explorer',
    name: 'Genre Explorer',
    description: 'Watch shows or movies from 4 different genres.',
    difficulty: 'Easy',
    reward: 'none',
    adminApprovalRequired: false,
    check: (data, stats) => ({
        progress: stats.watchedGenreCount,
        goal: 4,
    }),
  },
    {
    id: 'watchlist_builder',
    name: 'Watchlist Builder',
    description: 'Add 20 shows/movies to your "Plan to Watch" list.',
    difficulty: 'Medium',
    reward: 'vipFeature',
    adminApprovalRequired: false,
    check: (data, stats) => ({
        progress: stats.planToWatchCount,
        goal: 20,
    }),
  },
  {
    id: 'eclectic_viewer',
    name: 'Eclectic Viewer',
    description: 'Watch 30 episodes across at least 5 genres. (Imports excluded)',
    difficulty: 'Hard',
    reward: 'vipPass',
    adminApprovalRequired: true,
    check: (data, stats) => {
        const episodeProgress = Math.min(stats.totalEpisodesWatched / 30, 1);
        const genreProgress = Math.min(stats.watchedGenreCount / 5, 1);
        const totalProgress = Math.floor(((episodeProgress + genreProgress) / 2) * 100);
        return { progress: totalProgress, goal: 100 };
    },
  },
];
