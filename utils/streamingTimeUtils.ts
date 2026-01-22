import { WatchProviderResponse } from '../types';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';

/**
 * Estimates the local streaming release time based on the detected provider.
 * Strictly limited to Owner Overrides as requested.
 */
export const estimateStreamingTime = (
    providers: WatchProviderResponse | null,
    targetTimezone: string,
    timeFormat: '12h' | '24h',
    tmdbId?: number,
    seasonEpisodeKey?: string // e.g. "S1E1"
): { time: string; provider: string } | null => {
    
    if (tmdbId && AIRTIME_OVERRIDES[Number(tmdbId)]) {
        const override = AIRTIME_OVERRIDES[Number(tmdbId)];
        
        // Priority 1: Episode Specific Time
        // Priority 2: Show Default Time
        const timeToUse = (seasonEpisodeKey && override.episodes?.[seasonEpisodeKey]) 
            || override.time;

        if (!timeToUse) return null;

        // Return descriptive string directly (e.g. "9:00 pm ET")
        return { time: timeToUse, provider: override.provider };
    }

    return null;
};