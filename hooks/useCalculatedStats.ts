import { useMemo } from 'react';
import { UserData, CalculatedStats, TrackedItem } from '../types';

export function useCalculatedStats(data: UserData): CalculatedStats {
  return useMemo(() => {
    // FIX: Filter out history items with invalid timestamps to prevent crashes.
    const validHistory = data.history.filter(h => h.timestamp && !isNaN(new Date(h.timestamp).getTime()));

    // Total episodes watched
    const totalEpisodesWatched = validHistory.filter(h => h.media_type === 'tv').length;
    const nonManualEpisodesWatched = validHistory.filter(h => h.media_type === 'tv').length;
    
    // --- Time-based Stats ---
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const watchedThisWeek = validHistory.filter(h => 
        h.media_type === 'tv' && 
        new Date(h.timestamp) >= oneWeekAgo
    ).length;
    
    const episodesWatchedToday = validHistory.filter(h =>
        h.media_type === 'tv' &&
        new Date(h.timestamp) >= today
    ).length;
    
    const moviesWatchedToday = validHistory.filter(h =>
        h.media_type === 'movie' &&
        new Date(h.timestamp) >= today
    ).length;

    const moviesWatchedThisWeek = validHistory.filter(h =>
        h.media_type === 'movie' &&
        new Date(h.timestamp) >= oneWeekAgo
    ).length;

    // --- Journal counts ---
    const allProgressEntries = Object.values(data.watchProgress)
        .flatMap(show => Object.values(show))
        .flatMap(season => Object.values(season));

    const journalCount = allProgressEntries.filter(ep => (ep as any).journal?.text).length;
    const moodJournalCount = allProgressEntries.filter(ep => (ep as any).journal?.mood).length;
    
    // --- List-based Stats ---
    const showsCompleted = data.completed.filter(i => i.media_type === 'tv').length;
    const moviesCompleted = data.completed.filter(i => i.media_type === 'movie').length;
    const totalItemsOnLists = data.watching.length + data.planToWatch.length + data.completed.length;
    const planToWatchCount = data.planToWatch.length;

    // --- Longest streak ---
    const uniqueDates = [...new Set(validHistory.map(h => new Date(h.timestamp).toDateString()))];
    uniqueDates.sort((a,b) => new Date(a).getTime() - new Date(b).getTime());
    
    let longestStreak = 0;
    if (uniqueDates.length > 0) {
        longestStreak = 1;
        let currentStreak = 1;
        for(let i = 1; i < uniqueDates.length; i++) {
            const date1 = new Date(uniqueDates[i-1]);
            const date2 = new Date(uniqueDates[i]);
            const diffTime = date2.getTime() - date1.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            
            if(diffDays === 1) {
                currentStreak++;
            } else if (diffDays > 1) { // If there's a gap, reset.
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
            // If diffDays is 0, it's the same day, so do nothing to the streak.
        }
        longestStreak = Math.max(longestStreak, currentStreak);
    }
    
    // --- Genre count & monthly stats (from history) ---
    const allTrackedItemsById = new Map<number, TrackedItem>();
    [...data.watching, ...data.planToWatch, ...data.completed, ...data.favorites].forEach(item => {
        allTrackedItemsById.set(item.id, item);
    });

    const genresFromHistory = new Set<number>();
    validHistory.forEach(historyItem => {
        const trackedItem = allTrackedItemsById.get(historyItem.id);
        if (trackedItem && trackedItem.genre_ids) {
            trackedItem.genre_ids.forEach(genreId => genresFromHistory.add(genreId));
        }
    });
    const watchedGenreCount = genresFromHistory.size;
    
    let hoursWatchedThisMonth = 0;
    const genreCountsThisMonth: Record<number, number> = {};

    const historyThisMonth = validHistory.filter(h => new Date(h.timestamp) >= oneMonthAgo);

    historyThisMonth.forEach(h => {
        if (h.media_type === 'tv') {
            hoursWatchedThisMonth += 45; // Approx. 45 min per episode
        } else {
            hoursWatchedThisMonth += 100; // Approx. 100 min per movie
        }
        const trackedItem = allTrackedItemsById.get(h.id);
        if (trackedItem && trackedItem.genre_ids) {
            trackedItem.genre_ids.forEach(genreId => {
                genreCountsThisMonth[genreId] = (genreCountsThisMonth[genreId] || 0) + 1;
            });
        }
    });
    hoursWatchedThisMonth /= 60; // Convert minutes to hours

    const topGenresThisMonth = Object.entries(genreCountsThisMonth)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => Number(id));

    return {
      totalEpisodesWatched,
      nonManualEpisodesWatched,
      longestStreak,
      watchedThisWeek,
      journalCount,
      moodJournalCount,
      showsCompleted,
      moviesCompleted,
      totalItemsOnLists,
      watchedGenreCount,
      episodesWatchedToday,
      moviesWatchedToday,
      moviesWatchedThisWeek,
      planToWatchCount,
      hoursWatchedThisMonth: Math.round(hoursWatchedThisMonth),
      topGenresThisMonth,
    };
  }, [data]);
}