import { TmdbMediaDetails } from '../types';
import { getEpisodeTag } from './episodeTagUtils';

export const getShowStatus = (details: TmdbMediaDetails): string | null => {
    if (details.media_type !== 'tv' || !details.status) return null;

    if (details.status === 'Ended') return 'Ended';
    if (details.status === 'Canceled') return 'Canceled';

    const lastAiredEpisode = details.last_episode_to_air;
    if (lastAiredEpisode) {
        const lastSeasonInfo = details.seasons?.find(s => s.season_number === lastAiredEpisode.season_number);
        // We pass undefined for seasonDetails because we often don't have it readily available without another API call
        const tag = getEpisodeTag(lastAiredEpisode, lastSeasonInfo, details, undefined);

        if (tag?.text === 'Series Finale') return 'Ended';
        if (tag?.text === 'Season Finale') return 'Ongoing/Off Season';
    }
    
    if (['Returning Series', 'In Production', 'Pilot'].includes(details.status)) {
       return 'Ongoing/In Season';
    }
    
    // Fallback for shows that are between seasons but don't have a clear "Returning Series" status.
    return 'Ongoing/Off Season';
}
