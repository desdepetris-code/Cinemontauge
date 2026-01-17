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

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchAndEnrich(endpoint: string, mediaType: 'movie' | 'tv'): Promise<TmdbMedia[]> {
    try {
        const response = await fetch(`${BACKEND_URL}/${endpoint}`);
        if (!response.ok) return [];
        
        const items: BackendMedia[] = await response.json();
        const enrichedItems: TmdbMedia[] = [];
        const itemsToProcess = items.slice(0, 20);

        for (const item of itemsToProcess) {
            await delay(100); 
            const searchResults = await searchMedia(`${item.title} ${item.year}`);
            const match = searchResults.find(res => 
                res.media_type === mediaType && 
                (res.release_date?.startsWith(String(item.year)) || res.first_air_date?.startsWith(String(item.year))) &&
                res.poster_path
            );
            if (match) enrichedItems.push(match);
        }
        return enrichedItems;
    } catch (error) {
        // Silently return empty on network errors to avoid console noise
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