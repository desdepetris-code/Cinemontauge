
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, EpisodeTag } from '../types';

export function getEpisodeTag(
  episode: Episode,
  season: TmdbMediaDetails['seasons'][0] | undefined,
  showDetails: TmdbMediaDetails,
  seasonDetails: TmdbSeasonDetails | undefined
): EpisodeTag | null {
  if (!season || season.season_number === 0) return null; // No tags for specials

  let tagText: string | null = null;
  let className = 'bg-gray-600 text-white';

  // --- Priority 1: Check if it's the sequence-based finale ---
  // The user requested that the last episode in the season would be the season finale.
  const isLastInSeason = seasonDetails && episode.episode_number === seasonDetails.episodes.length;

  if (isLastInSeason) {
      const isLatestSeason = season.season_number === showDetails.number_of_seasons;
      if (isLatestSeason && (showDetails.status === 'Ended' || showDetails.status === 'Canceled')) {
          tagText = "Series Finale";
          className = 'bg-black text-white';
      } else {
          tagText = "Season Finale";
          className = 'bg-red-600 text-white';
      }
  }

  // --- Priority 2: TMDb Metadata (only if not already marked as finale by sequence) ---
  if (!tagText) {
    if (episode.episode_type === 'series_finale') {
      tagText = "Series Finale";
      className = 'bg-black text-white';
    } else if (episode.episode_type === 'season_finale') {
      // We only apply this if it's actually the last episode to prevent premature labeling
      // unless the sequence check already caught it.
      tagText = "Season Finale";
      className = 'bg-red-600 text-white';
    } else if (episode.episode_type === 'midseason_finale') {
      tagText = "Mid-Season Finale";
      className = 'bg-orange-600 text-white';
    }
  }

  // --- Priority 3: Premiere Logic ---
  if (!tagText && episode.episode_number === 1) {
    if (season.season_number === 1) {
      tagText = "Series Premiere";
      className = 'bg-purple-600 text-white';
    } else {
      tagText = "Season Premiere";
      className = 'bg-blue-600 text-white';
    }
  }

  if (tagText) {
    return { text: tagText, className };
  }

  return null;
}
