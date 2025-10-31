import { GoogleGenAI, Type } from "@google/genai";
import { UserData, TrackedItem, TmdbMedia } from '../types';
import { searchMedia, discoverMedia } from './tmdbService';

// FIX: Implement AI recommendation service using Gemini API.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface RecommendedTitle {
    title: string;
    year: number;
    reason: string;
}

export const getAIRecommendations = async (userData: UserData): Promise<{ recommendation: RecommendedTitle, media: TmdbMedia }[]> => {
    // 1. Get user's top rated/favorited items
    const favoriteItems = userData.favorites;
    const highlyRatedItems = Object.entries(userData.ratings)
        .filter(([, ratingInfo]) => ratingInfo.rating >= 4)
        .map(([id]) => {
            const allItems = [...userData.watching, ...userData.planToWatch, ...userData.completed, ...userData.favorites, ...userData.onHold, ...userData.dropped];
            return allItems.find(item => item.id === Number(id));
        })
        .filter((item): item is TrackedItem => !!item);
    
    const seedItems = [...favoriteItems, ...highlyRatedItems];
    const uniqueSeedItems = Array.from(new Map(seedItems.map(item => [item.id, item])).values());
    
    if (uniqueSeedItems.length === 0) {
        // No user data, return generic popular items instead
        try {
            const [popularMovies, popularTv] = await Promise.all([
                discoverMedia('movie', { sortBy: 'popularity.desc', vote_count_gte: 500 }),
                discoverMedia('tv', { sortBy: 'popularity.desc', vote_count_gte: 250 })
            ]);

            const genericRecs: { recommendation: RecommendedTitle, media: TmdbMedia }[] = [];
            // Interleave movies and TV shows
            for (let i = 0; i < 5; i++) {
                if (popularMovies[i]) {
                    genericRecs.push({
                        recommendation: {
                            title: popularMovies[i].title || popularMovies[i].name || '',
                            year: popularMovies[i].release_date ? parseInt(popularMovies[i].release_date.substring(0, 4)) : 0,
                            reason: 'Popular Movie'
                        },
                        media: popularMovies[i]
                    });
                }
                if (popularTv[i]) {
                    genericRecs.push({
                        recommendation: {
                            title: popularTv[i].title || popularTv[i].name || '',
                            year: popularTv[i].first_air_date ? parseInt(popularTv[i].first_air_date.substring(0, 4)) : 0,
                            reason: 'Popular TV Show'
                        },
                        media: popularTv[i]
                    });
                }
            }
            // Sort by popularity and take top 5
            return genericRecs
                .sort((a, b) => (b.media.popularity || 0) - (a.media.popularity || 0))
                .slice(0, 5);

        } catch (e) {
            console.error("Error fetching generic recommendations:", e);
            // Throw an error with a user-friendly message
            throw new Error("Could not fetch popular recommendations at this time. Please check your network connection.");
        }
    }

    const titles = uniqueSeedItems.slice(0, 10).map(item => item.title).join(', ');
    const allUserMediaIds = new Set(uniqueSeedItems.map(i => i.id));

    const prompt = `Based on a user's interest in the following movies and TV shows, recommend 5 new movies or TV shows they might like. The user likes: ${titles}. For each recommendation, provide a brief, one-sentence reason why they would like it. Do not recommend titles from the input list.`;

    // 2. Call Gemini API
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "The title of the recommended movie or show." },
                            year: { type: Type.INTEGER, description: "The release year of the recommendation." },
                            reason: { type: Type.STRING, description: "A brief, one-sentence reason for the recommendation." },
                        },
                        required: ["title", "year", "reason"],
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        const recommendations: RecommendedTitle[] = JSON.parse(jsonText);

        if (!recommendations || recommendations.length === 0) return [];
        
        // 3. Find media details for recommendations
        const searchPromises = recommendations.map(rec => searchMedia(`${rec.title} ${rec.year}`));
        const searchResults = await Promise.all(searchPromises);

        const finalRecommendations: { recommendation: RecommendedTitle, media: TmdbMedia }[] = [];
        searchResults.forEach((results, index) => {
            // Find the best match that is not already in the user's lists
            const bestMatch = results.find(r => !allUserMediaIds.has(r.id));
            if (bestMatch) {
                finalRecommendations.push({
                    recommendation: recommendations[index],
                    media: bestMatch,
                });
            }
        });

        return finalRecommendations;

    } catch (e) {
        console.error("Error getting AI recommendations:", e);
        if ((e as Error).message.includes('API key not valid')) {
            throw new Error("AI recommendations are disabled. An invalid API key was provided for the Gemini API.");
        }
        throw new Error("Could not fetch AI recommendations at this time.");
    }
};