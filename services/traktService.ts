import { TRAKT_API_KEY, TRAKT_REDIRECT_URI, TRAKT_API_BASE_URL } from '../constants';
import { TraktToken, TraktWatchedMovie, TraktWatchedShow, TraktWatchlistItem, TraktRating, TraktCalendarShow, TraktCalendarMovie } from '../types';
import { getFromCache, setToCache } from '../utils/cacheUtils';

const TRAKT_TOKEN_KEY = 'trakt_token';
const ID_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

// --- AUTHENTICATION ---

export const redirectToTraktAuth = (): void => {
    const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${TRAKT_API_KEY}&redirect_uri=${encodeURIComponent(TRAKT_REDIRECT_URI)}`;
    window.location.href = authUrl;
};

export const exchangeCodeForToken = async (code: string, functionUrl: string): Promise<TraktToken> => {
    if (functionUrl.includes("YOUR_PROJECT_ID")) {
        throw new Error("Firebase project ID is not configured. Trakt authentication is disabled.");
    }
    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, redirectUri: TRAKT_REDIRECT_URI }),
        });
        if (!response.ok) {
            let errorBody = 'Cloud function error';
            try {
                const errorJson = await response.json();
                errorBody = errorJson.error || response.statusText;
            } catch (e) {
                errorBody = response.statusText;
            }
            throw new Error(`Trakt token exchange failed: ${errorBody}`);
        }
        const tokenData = await response.json();
        const token: TraktToken = {
            ...tokenData,
            created_at: Math.floor(Date.now() / 1000), 
        };
        localStorage.setItem(TRAKT_TOKEN_KEY, JSON.stringify(token));
        return token;
    } catch (error) {
        console.error("Error exchanging Trakt code for token:", error);
        throw error;
    }
};

export const refreshToken = async (token: TraktToken, functionUrl: string): Promise<TraktToken> => {
    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: token.refresh_token, redirectUri: TRAKT_REDIRECT_URI }),
        });

        if (!response.ok) {
            clearTraktToken();
            throw new Error(`Failed to refresh Trakt token`);
        }
        
        const tokenData = await response.json();
        const newToken: TraktToken = {
            ...tokenData,
            created_at: Math.floor(Date.now() / 1000),
        };
        localStorage.setItem(TRAKT_TOKEN_KEY, JSON.stringify(newToken));
        return newToken;
    } catch (error) {
        clearTraktToken();
        throw error;
    }
};

export const getStoredToken = (): TraktToken | null => {
    const tokenStr = localStorage.getItem(TRAKT_TOKEN_KEY);
    return tokenStr ? JSON.parse(tokenStr) : null;
};

export const clearTraktToken = (): void => {
    localStorage.removeItem(TRAKT_TOKEN_KEY);
}

// --- API FETCHING ---

const fetchFromTrakt = async (endpoint: string, token?: TraktToken | null) => {
    const url = `${TRAKT_API_BASE_URL.replace('https://', '/proxy/')}/${endpoint}`;
    
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_API_KEY,
    };

    if (token?.access_token) {
        headers['Authorization'] = `Bearer ${token.access_token}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return response.json();
};

/**
 * Fetches trending shows with 'full' metadata to include broadcast times (airs object).
 */
export const getTrendingShowsFull = async (limit: number = 30): Promise<any[]> => {
    const cacheKey = `trakt_trending_full_${limit}`;
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return cached;

    const data = await fetchFromTrakt(`shows/trending?limit=${limit}&extended=full`);
    if (data) setToCache(cacheKey, data, 6 * 60 * 60 * 1000); // 6 hour cache
    return data || [];
};

/**
 * Resolves a TMDB ID to a Trakt Slug/ID. 
 */
export const resolveTraktId = async (tmdbId: number, type: 'movie' | 'show'): Promise<string | null> => {
    const cacheKey = `trakt_id_resolve_${type}_${tmdbId}`;
    const cached = getFromCache<string>(cacheKey);
    if (cached) return cached;

    const results = await fetchFromTrakt(`search/tmdb/${tmdbId}?type=${type}`);
    if (results && results.length > 0) {
        const traktId = results[0][type]?.ids?.slug || String(results[0][type]?.ids?.trakt);
        if (traktId) {
            setToCache(cacheKey, traktId, ID_CACHE_TTL);
            return traktId;
        }
    }
    return null;
};

export const getWatchedShows = (token: TraktToken): Promise<TraktWatchedShow[]> => {
    return fetchFromTrakt('sync/watched/shows?extended=noseasons', token);
};

export const getWatchedMovies = (token: TraktToken): Promise<TraktWatchedMovie[]> => {
    return fetchFromTrakt('sync/watched/movies', token);
};

export const getSeasonEpisodesPrecision = async (tmdbId: number, season: number): Promise<any[]> => {
    const traktSlug = await resolveTraktId(tmdbId, 'show');
    if (!traktSlug) return [];
    
    const token = getStoredToken();
    const data = await fetchFromTrakt(`shows/${traktSlug}/seasons/${season}?extended=full`, token);
    return data || [];
};

export const getMoviePrecision = async (tmdbId: number): Promise<any> => {
    const traktSlug = await resolveTraktId(tmdbId, 'movie');
    if (!traktSlug) return {};

    const token = getStoredToken();
    const data = await fetchFromTrakt(`movies/${traktSlug}?extended=full`, token);
    return data || {};
};

// --- CALENDAR FUNCTIONS ---

export const getMyCalendarShows = (token: TraktToken, startDate: string, days: number): Promise<TraktCalendarShow[]> => {
    return fetchFromTrakt(`calendars/my/shows/${startDate}/${days}?extended=full`, token);
};

export const getMyCalendarMovies = (token: TraktToken, startDate: string, days: number): Promise<TraktCalendarMovie[]> => {
    return fetchFromTrakt(`calendars/my/movies/${startDate}/${days}?extended=full`, token);
};