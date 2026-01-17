import { TmdbMedia } from '../types';
import { searchMedia } from './tmdbService';

const BACKEND_URL = 'https://7ae85159-db9f-4d5a-a7a9-516c6eceeeca-00-3c6anihggtyzv.spock.replit.dev:3000';

interface BackendMedia {
    title: string;
    year: number;
    genre: string;
    rating: number;
    description: string;
}

// A simple rate-limiting helper to avoid overwhelming the TMDB API
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchAndEnrich(endpoint: string, mediaType: 'movie' | 'tv'): Promise<TmdbMedia[]> {
    try {
        const response = await fetch(`${BACKEND_URL}/${endpoint}`);
        if (!response.ok) {
            // Silently return empty on failure to avoid console spam
            return [];
        }
        const items: BackendMedia[] = await response.json();

        const enrichedItems: TmdbMedia[] = [];

        // Limit to a reasonable number to avoid excessive API calls on page load
        const itemsToProcess = items.slice(0, 20);

        for (const item of itemsToProcess) {
            // Respectful delay to not hammer the TMDB API
            await delay(100); 
            
            // Search TMDB using title and year for enrichment
            const searchResults = await searchMedia(`${item.title} ${item.year}`);
            
            // Find the best match from search results
            const match = searchResults.find(res => 
                res.media_type === mediaType && 
                (res.release_date?.startsWith(String(item.year)) || res.first_air_date?.startsWith(String(item.year))) &&
                res.poster_path
            );
            
            if (match) {
                enrichedItems.push(match);
            }
        }
        return enrichedItems;
    } catch (error) {
        // Silently catch network errors (Failed to fetch)
        return [];
    }
}

export async function getEnrichedMediaFromBackend(): Promise<{ movies: TmdbMedia[], shows: TmdbMedia[] }> {
    const [movies, shows] = await Promise.all([
        fetchAndEnrich('movies', 'movie'),
        fetchAndEnrich('shows', 'tv'),
    ]);
    return { movies, shows };
}