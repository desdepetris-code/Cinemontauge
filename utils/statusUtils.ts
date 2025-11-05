import { TmdbMediaDetails } from '../types';
import { getEpisodeTag } from './episodeTagUtils';

export const getShowStatus = (details: TmdbMediaDetails): { text: string; date?: string } | null => {
    if (details.media_type !== 'tv' || !details.status) return null;

    // --- Final Statuses ---
    if (details.status === 'Ended') return { text: 'Ended' };
    if (details.status === 'Canceled') return { text: 'Canceled' };

    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // --- Upcoming Series that has never aired ---
    // new Date('YYYY-MM-DD') parses as UTC midnight.
    if (details.first_air_date && new Date(details.first_air_date) > todayUTC && !details.last_episode_to_air) {
        return { text: 'Upcoming', date: details.first_air_date };
    }

    const nextEp = details.next_episode_to_air;
    const lastEp = details.last_episode_to_air;

    // --- Logic for shows with a scheduled next episode ---
    if (nextEp?.air_date) {
        const nextAirDate = new Date(nextEp.air_date); // YYYY-MM-DD is parsed as UTC midnight
        
        if (nextAirDate >= todayUTC) {
            // If the upcoming episode is a finale, the show is considered "On Hiatus" until the next season is announced.
            const seasonForNextEp = details.seasons?.find(s => s.season_number === nextEp.season_number);
            const tag = getEpisodeTag(nextEp, seasonForNextEp, details, undefined);
            if (tag && (tag.text === 'Season Finale' || tag.text === 'Series Finale')) {
                return { text: 'On Hiatus', date: nextEp.air_date };
            }

            // Check for mid-season break (more than 2 weeks between episodes)
            if (lastEp?.air_date) {
                const lastAirDate = new Date(lastEp.air_date);
                const diffInMs = nextAirDate.getTime() - lastAirDate.getTime();
                const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

                if (diffInDays > 14) {
                    return { text: 'Upcoming', date: nextEp.air_date };
                }
            }
            
            // Check if it's a new season premiere
            if (nextEp.episode_number === 1) {
                return { text: 'Upcoming', date: nextEp.air_date };
            }

            // Otherwise, it's a regular weekly-ish release, so it's "In Season"
            return { text: 'In Season', date: nextEp.air_date };
        }
    }
    
    // --- Logic for shows without a scheduled next episode ---
    if (details.status === 'Returning Series') {
        const renewalInfo = getRenewalStatus(details);
        // If it's renewed but has NO specific air date, it's on hiatus.
        if (renewalInfo && !renewalInfo.date && !details.next_episode_to_air) {
            return { text: 'On Hiatus' };
        }
        if (renewalInfo && renewalInfo.date) {
            return { text: 'Upcoming', date: renewalInfo.date };
        }
        return { text: 'On Hiatus' };
    }
    
    // Fallback for other non-ended statuses
    if (details.status === 'In Production' || details.status === 'Pilot') {
        return { text: 'In Production' };
    }

    // Default to 'On Hiatus' if no other condition is met (e.g., status is "Continuing" but no next episode)
    return { text: 'On Hiatus' };
};

export const getRenewalStatus = (details: TmdbMediaDetails): { text: string; date?: string } | null => {
    if (details.media_type !== 'tv' || !details.status || details.status === 'Ended' || details.status === 'Canceled') {
        return null;
    }

    const lastSeasonInArray = [...(details.seasons || [])]
        .filter(s => s.season_number > 0)
        .sort((a, b) => b.season_number - a.season_number)[0];
        
    const lastAiredSeasonNumber = details.last_episode_to_air?.season_number;

    // Infer from seasons array
    if (lastSeasonInArray && lastAiredSeasonNumber && lastSeasonInArray.season_number > lastAiredSeasonNumber) {
        const nextSeason = details.seasons?.find(s => s.season_number === lastAiredSeasonNumber + 1);
        if (nextSeason) {
            return {
                text: `Renewed for Season ${nextSeason.season_number}`,
                date: nextSeason.air_date || undefined
            };
        }
    }
    
    // Infer from 'Returning Series' status
    if (details.status === 'Returning Series' && !details.next_episode_to_air && lastAiredSeasonNumber !== undefined && lastSeasonInArray?.season_number === lastAiredSeasonNumber) {
        return { text: `Renewed for Season ${lastAiredSeasonNumber + 1}` };
    }
    
    return null;
};