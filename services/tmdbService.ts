
import { TMDB_API_BASE_URL, TMDB_API_KEY } from '../constants';
import { TmdbMedia, TmdbMediaDetails, TmdbSeasonDetails, WatchProviderResponse } from '../types';
import { getFromCache, setToCache } from '../utils/cacheUtils';

// --- Caching Logic ---
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const clearMediaCache = (id: number, mediaType: 'tv' | 'movie'): void => {
    const cacheKey = `tmdb_details_v4_${mediaType}_${id}`;
    try {
        localStorage.removeItem(cacheKey);
        console.log(`Cleared TMDB cache for ${mediaType} ${id}`);
    } catch (error) {
        console.error("Error clearing TMDB cache", error);
    }
}
// --- End Caching Logic ---

const fetchFromTmdb = async <T,>(endpoint: string): Promise<T> => {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${TMDB_API_BASE_URL}/${endpoint}${separator}api_key=${TMDB_API_KEY}`;
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
    }
  };
  const response = await fetch(url, options);
  
  if (!response.ok) {
    let message = 'Failed to fetch data from TMDB';
    try {
        const errorData = await response.json();
        if (errorData && errorData.status_message) {
            message = `TMDB Error: ${errorData.status_message}`;
        }
    } catch(e) {
        // Could not parse error JSON, stick with the default message
    }
    throw new Error(message);
  }
  
  return response.json();
};

export const searchMedia = async (query: string): Promise<TmdbMedia[]> => {
    if (!query) return [];

    const yearRegex = /\b(19|20)\d{2}\b/;
    const yearMatch = query.match(yearRegex);

    if (yearMatch) {
        const year = yearMatch[0];
        const titleQuery = query.replace(yearRegex, '').trim();

        if (!titleQuery) {
            return [];
        }

        const [movieResults, tvResults] = await Promise.all([
            fetchFromTmdb<{ results: TmdbMedia[] }>(`search/movie?query=${encodeURIComponent(titleQuery)}&primary_release_year=${year}`),
            fetchFromTmdb<{ results: TmdbMedia[] }>(`search/tv?query=${encodeURIComponent(titleQuery)}&first_air_date_year=${year}`)
        ]);

        const moviesWithMediaType = movieResults.results.map(item => ({ ...item, media_type: 'movie' as const }));
        const tvWithMediaType = tvResults.results.map(item => ({ ...item, media_type: 'tv' as const }));

        const combinedResults = [...moviesWithMediaType, ...tvWithMediaType];
        
        // Sort by popularity to interleave movies and tv shows
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        combinedResults.sort((a: any, b: any) => b.popularity - a.popularity);

        return combinedResults;

    } else {
        // Original logic for searches without a year
        const data = await fetchFromTmdb<{ results: (TmdbMedia & { media_type: 'movie' | 'tv' | 'person' })[] }>(`search/multi?query=${encodeURIComponent(query)}`);
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
    }
};

export const getMediaDetails = async (id: number, mediaType: 'tv' | 'movie'): Promise<TmdbMediaDetails> => {
  const cacheKey = `tmdb_details_v4_${mediaType}_${id}`;
  const cachedData = getFromCache<TmdbMediaDetails>(cacheKey);
  if (cachedData) {
    return cachedData;
  }
  
  let endpoint = `${mediaType}/${id}`;
  if (mediaType === 'tv') {
    endpoint += `?append_to_response=videos,images,recommendations,external_ids,credits`;
  } else {
    endpoint += `?append_to_response=videos,images,recommendations,credits`;
  }

  const data = await fetchFromTmdb<TmdbMediaDetails>(endpoint);
  setToCache(cacheKey, data, CACHE_TTL);
  return data;
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number): Promise<TmdbSeasonDetails> => {
  const cacheKey = `tmdb_season_${tvId}_${seasonNumber}`;
  const cachedData = getFromCache<TmdbSeasonDetails>(cacheKey);
  if(cachedData) {
      return cachedData;
  }
  const data = await fetchFromTmdb<TmdbSeasonDetails>(`tv/${tvId}/season/${seasonNumber}`);
  // Inject season_number into each episode
  data.episodes = data.episodes.map(episode => ({
    ...episode,
    season_number: seasonNumber,
  }));
  setToCache(cacheKey, data, CACHE_TTL);
  return data;
};

interface Genre {
  id: number;
  name: string;
}

export const getGenres = async (): Promise<Record<number, string>> => {
  const cacheKey = 'tmdb_genres_v2';
  const cachedData = getFromCache<Record<number, string>>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  const [tvGenres, movieGenres] = await Promise.all([
    fetchFromTmdb<{ genres: Genre[] }>('genre/tv/list'),
    fetchFromTmdb<{ genres: Genre[] }>('genre/movie/list'),
  ]);

  const allGenres = new Map<number, string>();
  [...tvGenres.genres, ...movieGenres.genres].forEach(genre => {
    allGenres.set(genre.id, genre.name);
  });
  
  const genreMap = Object.fromEntries(allGenres);
  setToCache(cacheKey, genreMap, CACHE_TTL);
  return genreMap;
};

export const getTrendingMedia = async (): Promise<TmdbMedia[]> => {
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>('trending/all/week');
    return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
}

export const getNewReleases = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const endpoint = mediaType === 'tv' ? 'tv/on_the_air' : 'movie/now_playing';
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(endpoint);
    return data.results.map(item => ({...item, media_type: mediaType}));
};

export const getPopularShowsAllTime = async (): Promise<TmdbMedia[]> => {
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>('discover/tv?sort_by=popularity.desc');
    return data.results.map(item => ({...item, media_type: 'tv'}));
};

export const getNewSeasons = async (): Promise<TmdbMediaDetails[]> => {
    const popularShows = await getPopularShowsAllTime();

    const detailPromises = popularShows.slice(0, 40).map(show => getMediaDetails(show.id, 'tv').catch(() => null));
    const allDetails = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => d !== null);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const showsWithNewSeasons = allDetails.filter(details => {
        if (!details.seasons || details.seasons.length <= 1) {
            return false;
        }
        const latestSeason = [...details.seasons]
            .filter(s => s.season_number > 0)
            .sort((a, b) => b.season_number - a.season_number)[0];

        if (latestSeason?.air_date) {
            const airDate = new Date(latestSeason.air_date);
            return airDate >= thirtyDaysAgo && airDate <= new Date(); // Ensure it's not in the future
        }
        return false;
    });

    showsWithNewSeasons.sort((a, b) => {
         const latestSeasonA = [...a.seasons!]
            .filter(s => s.season_number > 0)
            .sort((a, b) => b.season_number - a.season_number)[0];
         const latestSeasonB = [...b.seasons!]
            .filter(s => s.season_number > 0)
            .sort((a, b) => b.season_number - a.season_number)[0];

        const dateA = new Date(latestSeasonA.air_date!).getTime();
        const dateB = new Date(latestSeasonB.air_date!).getTime();
        return dateB - dateA;
    });

    return showsWithNewSeasons;
};


export const discoverMedia = async (
    mediaType: 'tv' | 'movie', 
    filters: { genre?: number; year?: number; sortBy?: string }
): Promise<TmdbMedia[]> => {
    let endpoint = `discover/${mediaType}?sort_by=${filters.sortBy || 'popularity.desc'}`;
    if (filters.genre) {
        endpoint += `&with_genres=${filters.genre}`;
    }
    if (filters.year) {
        const yearKey = mediaType === 'tv' ? 'first_air_date_year' : 'primary_release_year';
        endpoint += `&${yearKey}=${filters.year}`;
    }
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(endpoint);
    return data.results.map(item => ({...item, media_type: mediaType}));
};

export const getWatchProviders = async (id: number, mediaType: 'tv' | 'movie'): Promise<WatchProviderResponse> => {
    const cacheKey = `tmdb_providers_${mediaType}_${id}`;
    const cachedData = getFromCache<WatchProviderResponse>(cacheKey);
    if (cachedData) {
        return cachedData;
    }
    const data = await fetchFromTmdb<WatchProviderResponse>(`${mediaType}/${id}/watch/providers`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
}
