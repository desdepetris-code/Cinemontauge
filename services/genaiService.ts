import { TmdbMedia } from "../types";
import { getTrending } from "./tmdbService";

/**
 * Reverted: No longer uses AI. Returns standard trending media as a fallback.
 */
export const getAIRecommendations = async (): Promise<{ recommendation: any; media: TmdbMedia }[]> => {
  try {
    const [movies, tv] = await Promise.all([
      getTrending('movie'),
      getTrending('tv')
    ]);
    
    const combined = [...movies, ...tv]
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 12);

    return combined.map(media => ({
      recommendation: { reason: "Trending this week" },
      media
    }));
  } catch (error) {
    return [];
  }
};

/**
 * Reverted: Contextual recommendations are now handled via standard TMDB similarity in the UI.
 */
export const getAIContextualRecommendations = async (): Promise<{ recommendation: any; media: TmdbMedia }[]> => {
  return [];
};