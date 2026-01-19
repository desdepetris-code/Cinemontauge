import { UserData, TmdbMedia, TrackedItem } from '../types';
import { searchMedia, discoverMedia, getMediaDetails } from './tmdbService';

interface RecommendedTitle {
    title: string;
    year: number;
    reason: string;
}

/**
 * AI-powered reasons for media are disabled. This function now returns an empty object.
 */
export const getAIReasonsForMedia = async (mediaList: TmdbMedia[]): Promise<Record<number, string>> => {
    return Promise.resolve({});
};

const getGenericRecommendations = async (): Promise<{ recommendation: RecommendedTitle, media: TmdbMedia }[]> => {
    try {
        const [
            popularMoviesP1,
            popularTvP1,
        ] = await Promise.all([
            discoverMedia('movie', { sortBy: 'popularity.desc', vote_count_gte: 500, page: 1 }),
            discoverMedia('tv', { sortBy: 'popularity.desc', vote_count_gte: 250, page: 1 }),
        ]);

        const combined = [...popularMoviesP1, ...popularTvP1].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        const uniqueMedia = Array.from(new Map(combined.map(item => [item.id, item])).values());

        return uniqueMedia.slice(0, 30).map(media => ({
            recommendation: {
                title: media.title || media.name || '',
                year: media.release_date ? parseInt(media.release_date.substring(0, 4)) : (media.first_air_date ? parseInt(media.first_air_date.substring(0, 4)) : 0),
                reason: media.media_type === 'movie' ? 'Popular Worldwide' : 'Trending Now'
            },
            media: media
        }));
    } catch (e) {
        return [];
    }
};

/**
 * Generates recommendations based on user favorites and ratings of 5/10 or more.
 */
export const getAIRecommendations = async (userData: UserData): Promise<{ recommendation: RecommendedTitle, media: TmdbMedia }[]> => {
    const seeds = new Set<number>();
    const seedMeta = new Map<number, string>();

    // 1. Collect Favorites
    userData.favorites.forEach(f => {
        seeds.add(f.id);
        seedMeta.set(f.id, `Based on your favorite: ${f.title}`);
    });

    // 2. Collect High Ratings (>= 5)
    Object.entries(userData.ratings).forEach(([id, r]) => {
        const ratingVal = (r as { rating: number }).rating;
        if (ratingVal >= 5) {
            seeds.add(Number(id));
            const item = [...userData.completed, ...userData.watching, ...userData.onHold].find(i => i.id === Number(id));
            if (item) seedMeta.set(Number(id), `Because you rated ${item.title} highly`);
        }
    });

    if (seeds.size === 0) {
        return getGenericRecommendations();
    }

    try {
        // Limit to top 5 seeds to keep it performant and relevant
        const topSeeds = Array.from(seeds).slice(-5).reverse();
        const recPromises = topSeeds.map(async (id) => {
            const item = [...userData.favorites, ...userData.watching, ...userData.completed, ...userData.onHold].find(i => i.id === id);
            if (!item) return [];
            
            const details = await getMediaDetails(id, item.media_type as 'tv' | 'movie').catch(() => null);
            if (!details || !details.recommendations?.results) return [];
            
            return details.recommendations.results.slice(0, 8).map(res => ({
                recommendation: {
                    title: res.title || res.name || '',
                    year: 0,
                    reason: seedMeta.get(id) || `Similar to your rated title: ${item.title}`
                },
                media: { ...res, media_type: item.media_type }
            }));
        });

        const nestedRecs = await Promise.all(recPromises);
        const flatRecs = nestedRecs.flat();

        // Remove duplicates and items already in user library
        const userIds = new Set([
            ...userData.watching.map(i => i.id),
            ...userData.completed.map(i => i.id),
            ...userData.planToWatch.map(i => i.id),
            ...userData.onHold.map(i => i.id),
            ...userData.dropped.map(i => i.id),
            ...userData.allCaughtUp.map(i => i.id)
        ]);

        const uniqueRecs = new Map<number, any>();
        flatRecs.forEach(r => {
            if (!userIds.has(r.media.id)) {
                uniqueRecs.set(r.media.id, r);
            }
        });

        const finalRecs = Array.from(uniqueRecs.values()).sort((a,b) => (b.media.popularity || 0) - (a.media.popularity || 0));

        if (finalRecs.length < 10) {
            const generic = await getGenericRecommendations();
            return [...finalRecs, ...generic].slice(0, 30);
        }

        return finalRecs.slice(0, 30);
    } catch (e) {
        console.error("Recommendation engine error:", e);
        return getGenericRecommendations();
    }
};