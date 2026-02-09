import React, { useState, useEffect, useMemo } from 'react';
import { CalculatedStats, UserData } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface User {
  id: string;
}

interface StatsNarrativeProps {
  stats: CalculatedStats;
  genres: Record<number, string>;
  userData: UserData;
  currentUser: User | null;
}

const StatsNarrative: React.FC<StatsNarrativeProps> = ({ stats, genres, userData, currentUser }) => {
  const userId = currentUser ? currentUser.id : 'guest';
  const [joinDate] = useLocalStorage<string | null>(`cinemontauge_join_date_${userId}`, null);

  const peakDays = useMemo(() => {
    const activity = new Map<string, { movies: number, episodes: number }>();
    const validHistory = userData.history?.filter(h => h.timestamp && !isNaN(new Date(h.timestamp).getTime())) || [];
    if (validHistory.length === 0) return { mostMovies: { count: 0, date: '' }, mostEpisodes: { count: 0, date: '' } };

    validHistory.forEach(item => {
        const date = new Date(item.timestamp).toDateString();
        if (!activity.has(date)) {
            activity.set(date, { movies: 0, episodes: 0 });
        }
        const day = activity.get(date)!;
        if (item.media_type === 'movie') {
            day.movies++;
        } else {
            day.episodes++;
        }
    });

    let maxMovies = 0;
    let maxMoviesDate = '';
    let maxEpisodes = 0;
    let maxEpisodesDate = '';

    for (const [date, counts] of activity.entries()) {
        if (counts.movies > maxMovies) {
            maxMovies = counts.movies;
            maxMoviesDate = date;
        }
        if (counts.episodes > maxEpisodes) {
            maxEpisodes = counts.episodes;
            maxEpisodesDate = date;
        }
    }
    return {
        mostMovies: { count: maxMovies, date: maxMoviesDate ? new Date(maxMoviesDate).toLocaleDateString() : '' },
        mostEpisodes: { count: maxEpisodes, date: maxEpisodesDate ? new Date(maxEpisodesDate).toLocaleDateString() : '' }
    };
  }, [userData.history]);

  const {
    totalHoursWatched,
    totalEpisodesWatched,
    moviesCompleted,
    topGenresAllTime,
    longestStreak,
    journalCount,
  } = stats;
  
  const topGenre = genres[topGenresAllTime[0]] || 'a variety of genres';

  if (totalEpisodesWatched === 0 && moviesCompleted === 0) {
      return (
        <div className="bg-bg-secondary/50 p-4 rounded-lg mb-8 text-text-secondary text-sm space-y-2">
            <p>Welcome to your profile overview! Start tracking shows and movies to see your personalized stats here.</p>
        </div>
      );
  }

  return (
    <div className="bg-bg-secondary/50 p-4 rounded-lg mb-8 text-text-secondary text-sm space-y-2">
      <p>
        Welcome back! 
        {joinDate && ` You've been a CineMontauge user since ${new Date(joinDate).toLocaleDateString()}. `}
        In that time, you've watched <strong className="text-text-primary">{totalEpisodesWatched} episodes</strong> and <strong className="text-text-primary">{moviesCompleted} movies</strong>, 
        totaling approximately <strong className="text-text-primary">{totalHoursWatched} hours</strong> of content.
      </p>
      <p>
        Your logs show you're a big fan of <strong className="text-text-primary">{topGenre}</strong>.
        You've captured your thoughts in <strong className="text-text-primary">{journalCount} journal entries</strong> and achieved an impressive watch streak of <strong className="text-text-primary">{longestStreak} days</strong>.
        {peakDays.mostEpisodes.count > 0 && (
            ` Your most active day for binging shows was on ${peakDays.mostEpisodes.date}, when you watched ${peakDays.mostEpisodes.count} episodes!`
        )}
        {peakDays.mostMovies.count > 0 && (
            ` Your biggest movie marathon was on ${peakDays.mostMovies.date}, with ${peakDays.mostMovies.count} movies watched.`
        )}
         Keep it up!
      </p>
    </div>
  );
};

export default StatsNarrative;