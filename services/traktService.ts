
import { TRAKT_API_KEY, TRAKT_REDIRECT_URI, TRAKT_API_BASE_URL } from '../constants';
import { TraktToken, TraktWatchedMovie, TraktWatchedShow } from '../types';
import { getFromCache, setToCache } from '../utils/cacheUtils';
import { supabase, saveTraktToken, getTraktToken, deleteTraktToken } from './supabaseClient';

const ID_CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

// --- AUTHENTICATION ---

export const redirectToTraktAuth = (): void => {
    if (!TRAKT_API_KEY || TRAKT_API_KEY.includes('YOUR_')) {
        alert("Trakt Client ID is not configured. Please contact the administrator.");
        return;
    }
    const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${TRAKT_API_KEY}&redirect_uri=${encodeURIComponent(TRAKT_REDIRECT_URI)}`;
    window.location.href = authUrl;
};

export const exchangeCodeForToken = async (code: string, functionUrl: string, userId: string): Promise<TraktToken> => {
    try {
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri: TRAKT_REDIRECT_URI }),
        });

        if (!response.ok) {
            const errorJson = await response.json();
            throw new Error(errorJson.error || response.statusText);
        }

        const tokenData = await response.json();
        const token: TraktToken = {
            ...tokenData,
            created_at: Math.floor(Date.now() / 1000), 
        };

        // Persist to Supabase
        await saveTraktToken(userId, token);
        // Fix: Persist to local cache for synchronous access in CalendarScreen.
        localStorage.setItem('trakt_token_cache', JSON.stringify(token));
        return token;
    } catch (error) {
        console.error("Trakt exchange failed:", error);
        throw error;
    }
};

export const ensureValidToken = async (userId: string, functionUrl: string): Promise<TraktToken | null> => {
    const token = await getTraktToken(userId);
    if (!token) {
        localStorage.removeItem('trakt_token_cache');
        return null;
    }

    const margin = 300; // 5 minutes
    const isExpired = (token.created_at + token.expires_in - margin) < (Date.now() / 1000);

    if (isExpired) {
        try {
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: token.refresh_token, redirectUri: TRAKT_REDIRECT_URI }),
            });

            if (!response.ok) throw new Error("Failed to refresh");

            const newTokenData = await response.json();
            const newToken = {
                ...newTokenData,
                created_at: Math.floor(Date.now() / 1000),
            };

            await saveTraktToken(userId, newToken);
            // Fix: Sync local cache with refreshed token.
            localStorage.setItem('trakt_token_cache', JSON.stringify(newToken));
            return newToken;
        } catch (e) {
            console.error("Trakt refresh failed, clearing token.");
            await deleteTraktToken(userId);
            localStorage.removeItem('trakt_token_cache');
            return null;
        }
    }

    // Fix: Ensure local cache is in sync.
    localStorage.setItem('trakt_token_cache', JSON.stringify(token));
    return token;
};

// --- API FETCHING ---

const fetchFromTrakt = async (endpoint: string, userId?: string, functionUrl?: string) => {
    let token: TraktToken | null = null;
    if (userId && functionUrl) {
        token = await ensureValidToken(userId, functionUrl);
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_API_KEY,
    };

    if (token?.access_token) {
        headers['Authorization'] = `Bearer ${token.access_token}`;
    }

    const response = await fetch(`${TRAKT_API_BASE_URL}/${endpoint}`, { headers });
    if (!response.ok) return null;
    return response.json();
};

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

// Fix: Added missing export for getStoredToken used in CalendarScreen.
export const getStoredToken = (): TraktToken | null => {
    const tokenStr = localStorage.getItem('trakt_token_cache');
    if (!tokenStr) return null;
    try {
        return JSON.parse(tokenStr);
    } catch (e) {
        return null;
    }
};

// Fix: Added missing export for getSeasonEpisodesPrecision used in ShowDetail.
export const getSeasonEpisodesPrecision = async (tmdbId: number, season: number): Promise<any[]> => {
    const traktId = await resolveTraktId(tmdbId, 'show');
    if (!traktId) return [];
    const results = await fetchFromTrakt(`shows/${traktId}/seasons/${season}?extended=full`);
    return Array.isArray(results) ? results : [];
};

// Fix: Added missing export for getMoviePrecision used in ShowDetail.
export const getMoviePrecision = async (tmdbId: number): Promise<any> => {
    const traktId = await resolveTraktId(tmdbId, 'movie');
    if (!traktId) return null;
    return await fetchFromTrakt(`movies/${traktId}?extended=full`);
};

// Fix: Added missing export for getMyCalendarShows used in CalendarScreen.
export const getMyCalendarShows = async (token: TraktToken, startDate: string, days: number): Promise<any[]> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_API_KEY,
        'Authorization': `Bearer ${token.access_token}`
    };
    const response = await fetch(`${TRAKT_API_BASE_URL}/calendars/my/shows/${startDate}/${days}`, { headers });
    if (!response.ok) return [];
    return response.json();
};

// Fix: Added missing export for getMyCalendarMovies used in CalendarScreen.
export const getMyCalendarMovies = async (token: TraktToken, startDate: string, days: number): Promise<any[]> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': TRAKT_API_KEY,
        'Authorization': `Bearer ${token.access_token}`
    };
    const response = await fetch(`${TRAKT_API_BASE_URL}/calendars/my/movies/${startDate}/${days}`, { headers });
    if (!response.ok) return [];
    return response.json();
};

// --- ACTIONS ---

export const checkIn = async (userId: string, functionUrl: string, media: { tmdbId: number; type: 'movie' | 'episode'; season?: number; episode?: number }) => {
    const token = await ensureValidToken(userId, functionUrl);
    if (!token) return null;

    const body: any = { app_version: "1.0", app_date: new Date().toISOString().split('T')[0] };
    if (media.type === 'movie') {
        body.movie = { ids: { tmdb: media.tmdbId } };
    } else {
        body.episode = { ids: { tmdb: media.tmdbId }, season: media.season, number: media.episode };
    }

    const response = await fetch(`${TRAKT_API_BASE_URL}/checkin`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': TRAKT_API_KEY,
            'Authorization': `Bearer ${token.access_token}`
        },
        body: JSON.stringify(body)
    });
    return response.json();
};

export const scrobble = async (userId: string, functionUrl: string, media: { tmdbId: number; type: 'movie' | 'episode'; season?: number; episode?: number }, progress: number, action: 'start' | 'pause' | 'stop') => {
    const token = await ensureValidToken(userId, functionUrl);
    if (!token) return null;

    const body: any = { progress };
    if (media.type === 'movie') {
        body.movie = { ids: { tmdb: media.tmdbId } };
    } else {
        body.episode = { ids: { tmdb: media.tmdbId }, season: media.season, number: media.episode };
    }

    const response = await fetch(`${TRAKT_API_BASE_URL}/scrobble/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': TRAKT_API_KEY,
            'Authorization': `Bearer ${token.access_token}`
        },
        body: JSON.stringify(body)
    });
    return response.json();
};

export const getWatchedShows = (userId: string, functionUrl: string): Promise<TraktWatchedShow[]> => {
    return fetchFromTrakt('sync/watched/shows?extended=noseasons', userId, functionUrl);
};

export const getWatchedMovies = (userId: string, functionUrl: string): Promise<TraktWatchedMovie[]> => {
    return fetchFromTrakt('sync/watched/movies', userId, functionUrl);
};
