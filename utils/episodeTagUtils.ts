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

  // --- Strictly use TMDb Metadata for Finales ---
  // The user requested: "If an episode is not labeled as season finale or series finale in tmdb it should not be labeled as that on the episode on this site."
  if (episode.episode_type === 'series_finale') {
    tagText = "Series Finale";
    className = 'bg-black text-white';
  } else if (episode.episode_type === 'season_finale') {
    tagText = "Season Finale";
    className = 'bg-red-600 text-white';
  } else if (episode.episode_type === 'midseason_finale') {
    tagText = "Mid-Season Finale";
    className = 'bg-orange-600 text-white';
  }

  // --- Priority 2: Premiere Logic (only if not a finale) ---
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