import { TmdbMediaDetails, WatchProgress, WatchStatus, EpisodeProgress, HistoryItem } from '../types';
import { getAiredEpisodeCount } from './formatUtils';

/**
 * Determines the correct automated status for a TV show based on progress and airing details.
 */
export const calculateAutoStatus = (
    details: TmdbMediaDetails, 
    progress: WatchProgress[number] = {}
): WatchStatus | null => {
    if (details.media_type !== 'tv') return null;

    let totalWatched = 0;
    let latestWatchedSeason = 0;
    let latestWatchedEpisode = 0;

    Object.entries(progress).forEach(([sNum, season]) => {
        const sInt = Number(sNum);
        Object.entries(season).forEach(([eNum, ep]) => {
            const eInt = Number(eNum);
            if ((ep as EpisodeProgress).status === 2) {
                totalWatched++;
                if (sInt > latestWatchedSeason || (sInt === latestWatchedSeason && eInt > latestWatchedEpisode)) {
                    latestWatchedSeason = sInt;
                    latestWatchedEpisode = eInt;
                }
            }
        });
    });

    // CRITICAL: If no episodes are watched, the show cannot be in an automated 'Watching' or 'Completed' state.
    if (totalWatched === 0) return null;

    const totalAired = getAiredEpisodeCount(details);
    const totalInShow = details.number_of_episodes || 0;

    // Rule: Completed
    // If show is ended/canceled and user has marked the final episode (total watched >= total episodes)
    if ((details.status === 'Ended' || details.status === 'Canceled') && totalWatched >= totalInShow) {
        return 'completed';
    }

    // Rule: All Caught Up
    // If user has marked the latest aired episode
    if (totalWatched >= totalAired) {
        return 'allCaughtUp';
    }

    // Rule: Watching
    // If there are more episodes that have aired after the episode they marked as watched
    return 'watching';
};

/**
 * Determines the correct status for a movie based on history, active sessions, and manual presets.
 */
export const calculateMovieAutoStatus = (
    mediaId: number,
    history: HistoryItem[],
    pausedSessions: Record<number, any>,
    manualPreset?: WatchStatus
): WatchStatus | null => {
    const hasHistory = history.some(h => h.id === mediaId && !h.logId.startsWith('live-'));
    const isPaused = !!pausedSessions[mediaId];

    if (hasHistory) return 'completed';
    if (isPaused) return 'watching';
    if (manualPreset) return manualPreset;
    
    return null;
};

export const isManualStatus = (status: WatchStatus | null): boolean => {
    return status === 'planToWatch' || status === 'onHold' || status === 'dropped';
};