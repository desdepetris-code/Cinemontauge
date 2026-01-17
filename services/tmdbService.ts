import { TMDB_API_BASE_URL, TMDB_API_KEY } from '../constants';
import { TmdbMedia, TmdbMediaDetails, TmdbSeasonDetails, WatchProviderResponse, TmdbCollection, TmdbFindResponse, PersonDetails, TrackedItem, TmdbPerson, CalendarItem, NewlyPopularEpisode, CastMember, CrewMember } from '../types';
import { getFromCache, setToCache } from '../utils/cacheUtils';

// --- Alias Map for Enhanced Search ---
const aliasMap: Record<string, string> = {
  "svu": "Law & Order: Special Victims Unit",
  "tbbt": "The Big Bang Theory",
  "oitnb": "Orange Is the New Black",
  "twd": "The Walking Dead",
  "got": "Game of Thrones",
  "bcs": "Better Call Saul",
  "ahs": "American Horror Story",
  "ds": "Demon Slayer",
  "jjk": "Jujutsu Kaisen",
  "aot": "Attack on Titan",
  "money heist": "La Casa de Papel",
};

// --- Caching Logic ---
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours
const CACHE_TTL_SHORT = 2 * 60 * 60 * 1000; // 2 hours

export const clearMediaCache = (id: number, mediaType: 'tv' | 'movie'): void => {
    const cacheKey = `tmdb_details_v4_${mediaType}_${id}`;
    try {
        localStorage.removeItem(cacheKey);
        console.log(`Cleared TMDB cache for ${mediaType} ${id}`);
    } catch (error) {
        console.error("Error clearing TMDB cache", error);
    }
}

export const clearSeasonCache = (tvId: number, seasonNumber: number): void => {
    const cacheKey = `tmdb_season_${tvId}_${seasonNumber}`;
    try {
        localStorage.removeItem(cacheKey);
        console.log(`Cleared TMDB cache for season ${seasonNumber} of show ${tvId}`);
    } catch (error) {
        console.error("Error clearing TMDB season cache", error);
    }
};

const fetchFromTmdb = async <T,>(endpoint: string, method: 'GET' | 'POST' = 'GET', body: object | null = null, extraParams: string = ''): Promise<T> => {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${TMDB_API_BASE_URL}/${endpoint}${separator}api_key=${TMDB_API_KEY}${extraParams}`;
  const options: RequestInit = {
    method,
    headers: {
      'accept': 'application/json',
      'content-type': method === 'POST' ? 'application/json' : 'text/plain',
    }
  };
  
  if (method === 'POST' && body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    let message = 'Failed to fetch data from TMDB';
    try {
        const errorData = await response.json();
        if (errorData && errorData.status_message) {
            message = `TMDB Error: ${errorData.status_message}`;
        }
    } catch(e) {}
    throw new Error(message);
  }
  
  const data = await response.json();
  if (data.success === false) {
    throw new Error(`TMDB Error: ${data.status_message || 'The resource you requested could not be found.'}`);
  }

  return data;
};

export const searchMedia = async (query: string): Promise<TmdbMedia[]> => {
    if (!query || !query.trim()) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const searchTerm = aliasMap[normalizedQuery] || query;

    const yearRegex = /\b(19|20)\d{2}\b/;
    const yearMatch = searchTerm.match(yearRegex);

    if (yearMatch) {
        const year = yearMatch[0];
        const titleQuery = searchTerm.replace(yearRegex, '').trim();

        if (!titleQuery) return [];

        const [movieResults, tvResults] = await Promise.all([
            fetchFromTmdb<{ results: TmdbMedia[] }>(`search/movie?query=${encodeURIComponent(titleQuery)}&primary_release_year=${year}`),
            fetchFromTmdb<{ results: TmdbMedia[] }>(`search/tv?query=${encodeURIComponent(titleQuery)}&first_air_date_year=${year}`)
        ]);

        const moviesWithMediaType = movieResults.results.map(item => ({ ...item, media_type: 'movie' as const }));
        const tvWithMediaType = tvResults.results.map(item => ({ ...item, media_type: 'tv' as const }));
        const combinedResults = [...moviesWithMediaType, ...tvWithMediaType];
        combinedResults.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        return combinedResults;
    } else {
        const data = await fetchFromTmdb<{ results: (TmdbMedia & { media_type: 'movie' | 'tv' | 'person' })[] }>(`search/multi?query=${encodeURIComponent(searchTerm)}`);
        return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv') as TmdbMedia[];
    }
};

export const searchMediaPaginated = async (
    query: string,
    page: number = 1
): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    if (!query || !query.trim()) return { results: [], total_pages: 0 };
    const normalizedQuery = query.toLowerCase().trim();
    const searchTerm = aliasMap[normalizedQuery] || query;
    const data = await fetchFromTmdb<{ results: (TmdbMedia & { media_type: 'movie' | 'tv' | 'person' })[], total_pages: number }>(`search/multi?query=${encodeURIComponent(searchTerm)}&page=${page}`);
    return {
        results: data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv') as TmdbMedia[],
        total_pages: data.total_pages
    };
};

export const searchPeoplePaginated = async (
    query: string,
    page: number = 1
): Promise<{ results: TmdbPerson[], total_pages: number }> => {
    if (!query || !query.trim()) return { results: [], total_pages: 0 };
    const data = await fetchFromTmdb<{ results: TmdbPerson[], total_pages: number }>(`search/person?query=${encodeURIComponent(query)}&page=${page}`);
    return data;
};

export const findByImdbId = async (imdbId: string): Promise<TmdbFindResponse> => {
    if (!imdbId) throw new Error("IMDB ID is required");
    const cacheKey = `tmdb_find_${imdbId}`;
    const cachedData = getFromCache<TmdbFindResponse>(cacheKey);
    if (cachedData) return cachedData;
    const data = await fetchFromTmdb<TmdbFindResponse>(`find/${imdbId}?external_source=imdb_id`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const findByTvdbId = async (tvdbId: number): Promise<TmdbFindResponse> => {
    if (!tvdbId) throw new Error("TVDB ID is required");
    const cacheKey = `tmdb_find_tvdb_${tvdbId}`;
    const cachedData = getFromCache<TmdbFindResponse>(cacheKey);
    if (cachedData) return cachedData;
    const data = await fetchFromTmdb<TmdbFindResponse>(`find/${tvdbId}?external_source=tvdb_id`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getMediaDetails = async (id: number, mediaType: 'tv' | 'movie'): Promise<TmdbMediaDetails> => {
  if (!id || !mediaType) throw new Error("ID and Media Type are required for details");
  const cacheKey = `tmdb_details_v4_${mediaType}_${id}`;
  const cachedData = getFromCache<TmdbMediaDetails>(cacheKey);
  if (cachedData) return cachedData;
  
  const imageLangParam = "include_image_language=en,null";

  if (mediaType === 'tv') {
    const [detailsData, ratingsData] = await Promise.all([
        fetchFromTmdb<TmdbMediaDetails>(`${mediaType}/${id}?append_to_response=images,recommendations,external_ids,credits,videos&${imageLangParam}`),
        fetchFromTmdb<{ results: any[] }>(`tv/${id}/content_ratings`).catch(() => ({ results: [] }))
    ]);
    detailsData.content_ratings = ratingsData;
    detailsData.media_type = 'tv';
    setToCache(cacheKey, detailsData, CACHE_TTL);
    return detailsData;
  } else {
    const endpoint = `${mediaType}/${id}?append_to_response=images,recommendations,credits,videos,external_ids,release_dates&${imageLangParam}`;
    const data = await fetchFromTmdb<TmdbMediaDetails>(endpoint);
    data.media_type = 'movie';
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
  }
};

export const getSeasonDetails = async (tvId: number, seasonNumber: number): Promise<TmdbSeasonDetails> => {
  if (!tvId || seasonNumber === undefined) throw new Error("TV ID and Season Number are required");
  const cacheKey = `tmdb_season_${tvId}_${seasonNumber}`;
  const cachedData = getFromCache<TmdbSeasonDetails>(cacheKey);
  if (cachedData) return cachedData;
  const data = await fetchFromTmdb<TmdbSeasonDetails>(`tv/${tvId}/season/${seasonNumber}?append_to_response=aggregate_credits&include_image_language=en,null`);
  data.episodes = data.episodes.map(episode => ({
    ...episode,
    season_number: seasonNumber,
  }));
  setToCache(cacheKey, data, CACHE_TTL);
  return data;
};

export const getEpisodeCredits = async (tvId: number, seasonNumber: number, episodeNumber: number): Promise<any> => {
    return await fetchFromTmdb<any>(`tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/credits`);
}

export const getShowAggregateCredits = async (tvId: number, seasons: TmdbMediaDetails['seasons']): Promise<{ mainCast: CastMember[], guestStars: CastMember[], crew: CrewMember[] }> => {
    const cacheKey = `tmdb_agg_credits_v3_${tvId}`;
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;
    if (!seasons) return { mainCast: [], guestStars: [], crew: [] };
    const episodeCreditPromises: (() => Promise<any | null>)[] = [];
    for (const season of seasons) {
        if (season.season_number > 0) {
            for (let ep = 1; ep <= season.episode_count; ep++) {
                episodeCreditPromises.push(() => getEpisodeCredits(tvId, season.season_number, ep).catch(() => null));
            }
        }
    }
    const allEpisodeCredits: (any | null)[] = [];
    const batchSize = 20;
    for (let i = 0; i < episodeCreditPromises.length; i += batchSize) {
        const batch = episodeCreditPromises.slice(i, i + batchSize).map(p => p());
        const batchResults = await Promise.all(batch);
        allEpisodeCredits.push(...batchResults);
        if (episodeCreditPromises.length > batchSize) await new Promise(res => setTimeout(res, 250));
    }
    const mainCastMap = new Map<number, { person: CastMember, appearances: number, characters: Set<string> }>();
    const guestStarsMap = new Map<number, { person: CastMember, appearances: number, characters: Set<string> }>();
    const crewMap = new Map<number, { person: Omit<CrewMember, 'job'|'department'>, jobs: Set<string>, departments: Set<string> }>();
    for (const credits of allEpisodeCredits) {
        if (!credits) continue;
        credits.cast.forEach((person: any) => {
            if (!mainCastMap.has(person.id)) mainCastMap.set(person.id, { person, appearances: 0, characters: new Set() });
            const entry = mainCastMap.get(person.id)!;
            entry.appearances++;
            if (person.character) entry.characters.add(person.character);
        });
        credits.guest_stars?.forEach((person: any) => {
            if (!guestStarsMap.has(person.id)) guestStarsMap.set(person.id, { person, appearances: 0, characters: new Set() });
            const entry = guestStarsMap.get(person.id)!;
            entry.appearances++;
            if (person.character) entry.characters.add(person.character);
        });
        credits.crew.forEach((person: any) => {
            if (!crewMap.has(person.id)) {
                const { job, department, ...personInfo } = person;
                crewMap.set(person.id, { person: personInfo, jobs: new Set(), departments: new Set() });
            }
            const entry = crewMap.get(person.id)!;
            if (person.job) entry.jobs.add(person.job);
            if (person.department) entry.departments.add(person.department);
        });
    }
    const mainCast = Array.from(mainCastMap.values()).sort((a, b) => b.appearances - a.appearances).map(entry => ({ ...entry.person, character: `(${entry.appearances} ep) ${Array.from(entry.characters).join(' / ')}` }));
    const guestStars = Array.from(guestStarsMap.values()).sort((a, b) => b.appearances - a.appearances).map(entry => ({ ...entry.person, character: `(${entry.appearances} ep) ${Array.from(entry.characters).join(' / ')}` }));
    const crew: CrewMember[] = [];
    crewMap.forEach(entry => {
        const jobs = Array.from(entry.jobs).join(', ');
        if (entry.departments.size > 0) entry.departments.forEach(dept => crew.push({ ...entry.person, department: dept, job: jobs }));
        else crew.push({ ...entry.person, department: 'Other', job: jobs });
    });
    const result = { mainCast, guestStars, crew };
    setToCache(cacheKey, result, CACHE_TTL * 7 * 2);
    return result;
};

export const getGenres = async (): Promise<Record<number, string>> => {
  const cacheKey = 'tmdb_genres_v2';
  const cachedData = getFromCache<Record<number, string>>(cacheKey);
  if (cachedData) return cachedData;
  const [tvGenres, movieGenres] = await Promise.all([
    fetchFromTmdb<{ genres: { id: number, name: string }[] }>('genre/tv/list'),
    fetchFromTmdb<{ genres: { id: number, name: string }[] }>('genre/movie/list')
  ]);
  const allGenres: Record<number, string> = {};
  tvGenres.genres.forEach(genre => allGenres[genre.id] = genre.name);
  movieGenres.genres.forEach(genre => allGenres[genre.id] = genre.name);
  setToCache(cacheKey, allGenres, CACHE_TTL * 12);
  return allGenres;
};

export const discoverMedia = async (
    mediaType: 'tv' | 'movie',
    filters: any
): Promise<TmdbMedia[]> => {
    let params = `&sort_by=${filters.sortBy || 'popularity.desc'}`;
    if (filters.genre) params += `&with_genres=${filters.genre}`;
    if (filters.year) {
        if (mediaType === 'tv') params += `&first_air_date_year=${filters.year}`;
        else params += `&primary_release_year=${filters.year}`;
    }
    if(filters.vote_count_gte) params += `&vote_count.gte=${filters.vote_count_gte}`;
    if(filters.vote_count_lte) params += `&vote_count.lte=${filters.vote_count_lte}`;
    if(filters.page) params += `&page=${filters.page}`;
    if (filters['primary_release_date.gte']) params += `&primary_release_date.gte=${filters['primary_release_date.gte']}`;
    if (filters['primary_release_date.lte']) params += `&primary_release_date.lte=${filters['primary_release_date.lte']}`;
    if (filters['first_air_date.gte']) params += `&first_air_date.gte=${filters['first_air_date.gte']}`;
    if (filters['first_air_date.lte']) params += `&first_air_date.lte=${filters['first_air_date.lte']}`;
    if (filters['with_keywords']) params += `&with_keywords=${filters['with_keywords']}`;
    if (filters['with_release_type']) params += `&with_release_type=${filters['with_release_type']}`;
    if (filters.region) params += `&region=${filters.region}`;
    const cacheKey = `tmdb_discover_${mediaType}_v2_${params}`;
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if(cached) return cached;
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`discover/${mediaType}?include_adult=false&language=en-US${params}`);
    const resultsWithMediaType = data.results.map(item => ({ ...item, media_type: mediaType }));
    setToCache(cacheKey, resultsWithMediaType, CACHE_TTL_SHORT);
    return resultsWithMediaType;
};

export const discoverMediaPaginated = async (
    mediaType: 'tv' | 'movie',
    filters: any
): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    let params = `&sort_by=${filters.sortBy || 'popularity.desc'}`;
    if (filters.genre) params += `&with_genres=${filters.genre}`;
    if (filters.year) {
        if (mediaType === 'tv') params += `&first_air_date_year=${filters.year}`;
        else params += `&primary_release_year=${filters.year}`;
    }
    if(filters.vote_count_gte) params += `&vote_count.gte=${filters.vote_count_gte}`;
    if(filters.vote_count_lte) params += `&vote_count.lte=${filters.vote_count_lte}`;
    if(filters.page) params += `&page=${filters.page}`;
    if (filters['primary_release_date.gte']) params += `&primary_release_date.gte=${filters['primary_release_date.gte']}`;
    if (filters['primary_release_date.lte']) params += `&primary_release_date.lte=${filters['primary_release_date.lte']}`;
    if (filters['first_air_date.gte']) params += `&first_air_date.gte=${filters['first_air_date.gte']}`;
    if (filters['first_air_date.lte']) params += `&first_air_date.lte=${filters['first_air_date.lte']}`;
    if (filters['with_keywords']) params += `&with_keywords=${filters['with_keywords']}`;
    if (filters['with_release_type']) params += `&with_release_type=${filters['with_release_type']}`;
    if (filters.region) params += `&region=${filters.region}`;
    const cacheKey = `tmdb_discover_paginated_${mediaType}_v2_${params}`;
    const cached = getFromCache<{ results: TmdbMedia[], total_pages: number }>(cacheKey);
    if(cached) return cached;
    const data = await fetchFromTmdb<{ results: TmdbMedia[], total_pages: number }>(`discover/${mediaType}?include_adult=false&language=en-US${params}`);
    const resultsWithMediaType = data.results.map(item => ({ ...item, media_type: mediaType }));
    const response = { ...data, results: resultsWithMediaType };
    setToCache(cacheKey, response, CACHE_TTL_SHORT);
    return response;
};

export const getNewReleases = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const cacheKey = `tmdb_new_releases_v3_${mediaType}`;
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if(cached) return cached;
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = ninetyDaysAgo.toISOString().split('T')[0];
    const dateFilters = mediaType === 'tv' ? { 'first_air_date.gte': startDate, 'first_air_date.lte': today } : { 'primary_release_date.gte': startDate, 'primary_release_date.lte': today };
    const results = await discoverMedia(mediaType, { sortBy: 'popularity.desc', ...dateFilters });
    setToCache(cacheKey, results, CACHE_TTL_SHORT);
    return results;
};

export const getNewSeasons = async (forceRefresh: boolean, timezone: string): Promise<TmdbMediaDetails[]> => {
    const cacheKey = `tmdb_new_seasons_general_v2`;
    if (!forceRefresh) {
        const cached = getFromCache<TmdbMediaDetails[]>(cacheKey);
        if (cached) return cached;
    }
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    const results = await discoverMedia('tv', { sortBy: 'popularity.desc', 'first_air_date.gte': startDate, 'first_air_date.lte': today });
    const detailPromises = results.slice(0, 20).map(r => getMediaDetails(r.id, 'tv').catch(() => null));
    const detailedResults = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => d !== null);
    setToCache(cacheKey, detailedResults, CACHE_TTL_SHORT);
    return detailedResults;
};

export const getAllNewReleasesPaginated = async (page: number): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const startDate = ninetyDaysAgo.toISOString().split('T')[0];
    const data = await fetchFromTmdb<{ results: TmdbMedia[], total_pages: number }>(`discover/movie?include_adult=false&language=en-US&primary_release_date.gte=${startDate}&primary_release_date.lte=${today}&sort_by=popularity.desc&page=${page}`);
    return { ...data, results: data.results.map(item => ({ ...item, media_type: 'movie' as const })) };
};

export const getUpcomingTvPremieres = async (page: number): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const endDate = ninetyDaysFromNow.toISOString().split('T')[0];
    return await discoverMediaPaginated('tv', { page, sortBy: 'first_air_date.asc', 'first_air_date.gte': today, 'first_air_date.lte': endDate });
};

export const getUpcomingTvSeasons = async (): Promise<CalendarItem[]> => {
    const cacheKey = 'tmdb_upcoming_seasons_v1';
    const cached = getFromCache<CalendarItem[]>(cacheKey);
    if (cached) return cached;
    const [page1, page2] = await Promise.all([ discoverMedia('tv', { sortBy: 'popularity.desc', page: 1 }), discoverMedia('tv', { sortBy: 'popularity.desc', page: 2 }) ]);
    const uniqueShows = Array.from(new Map([...page1, ...page2].map(item => [item.id, item])).values());
    const detailPromises = uniqueShows.map(show => getMediaDetails(show.id, 'tv').catch(() => null));
    const detailedResults = (await Promise.all(detailPromises)).filter((d): d is TmdbMediaDetails => d !== null);
    const now = new Date();
    now.setHours(0,0,0,0);
    const upcomingSeasonItems: CalendarItem[] = detailedResults.filter(details => details.next_episode_to_air && details.next_episode_to_air.episode_number === 1 && new Date(details.next_episode_to_air.air_date) >= now).map(details => ({ id: details.id, media_type: 'tv', poster_path: details.poster_path, title: details.name || 'Untitled', date: details.next_episode_to_air!.air_date, episodeInfo: `Season ${details.next_episode_to_air!.season_number} Premiere`, network: details.networks?.[0]?.name }));
    upcomingSeasonItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setToCache(cacheKey, upcomingSeasonItems, 12 * 60 * 60 * 1000);
    return upcomingSeasonItems;
};

export const getUpcomingMovieReleases = async (page: number): Promise<{ results: TmdbMedia[], total_pages: number }> => {
    const today = new Date().toISOString().split('T')[0];
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    const endDate = ninetyDaysFromNow.toISOString().split('T')[0];
    return await discoverMediaPaginated('movie', { page, sortBy: 'primary_release_date.asc', 'primary_release_date.gte': today, 'primary_release_date.lte': endDate, 'with_release_type': '2|3', region: 'US' });
};

export const getTrending = async (mediaType: 'tv' | 'movie'): Promise<TmdbMedia[]> => {
    const cacheKey = `tmdb_trending_${mediaType}_week_v1`;
    const cached = getFromCache<TmdbMedia[]>(cacheKey);
    if (cached) return cached;
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`trending/${mediaType}/week`);
    const resultsWithMediaType = data.results.map(item => ({ ...item, media_type: mediaType }));
    setToCache(cacheKey, resultsWithMediaType, CACHE_TTL_SHORT);
    return resultsWithMediaType;
};

export const getNewlyPopularEpisodes = async (): Promise<NewlyPopularEpisode[]> => {
  const trendingShows = await getTrending('tv');
  const popularShows = await discoverMedia('tv', { sortBy: 'popularity.desc' });
  const uniqueShows = Array.from(new Map([...trendingShows, ...popularShows].map(item => [item.id, item])).values());
  const showDetailsList: (TmdbMediaDetails | null)[] = [];
  const showsToFetch = uniqueShows.slice(0, 30);
  for (let i = 0; i < showsToFetch.length; i += 10) {
      const batch = showsToFetch.slice(i, i + 10);
      showDetailsList.push(...await Promise.all(batch.map(show => getMediaDetails(show.id, 'tv').catch(() => null))));
      if (i + 10 < showsToFetch.length) await new Promise(res => setTimeout(res, 400));
  }
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  const episodes: NewlyPopularEpisode[] = [];
  for (const details of showDetailsList) {
    if (details && details.last_episode_to_air) {
      const airDate = new Date(`${details.last_episode_to_air.air_date}T00:00:00Z`);
      if (airDate >= oneMonthAgo && airDate <= new Date()) {
        episodes.push({ showInfo: { id: details.id, title: details.name || 'Untitled', media_type: 'tv', poster_path: details.poster_path, genre_ids: details.genres.map(g => g.id) }, episode: details.last_episode_to_air });
      }
    }
  }
  episodes.sort((a, b) => new Date(b.episode.air_date).getTime() - new Date(a.episode.air_date).getTime());
  return episodes.slice(0, 30);
};

export const getUpcomingMovies = async (): Promise<TmdbMedia[]> => {
    const today = new Date().toISOString().split('T')[0];
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);
    const endDate = twoMonthsLater.toISOString().split('T')[0];
    const data = await fetchFromTmdb<{ results: TmdbMedia[] }>(`discover/movie?primary_release_date.gte=${today}&primary_release_date.lte=${endDate}&sort_by=popularity.desc&region=US`);
    return data.results.map(item => ({ ...item, media_type: 'movie' }));
};

export const getPersonDetails = async (personId: number): Promise<PersonDetails> => {
    if (!personId) throw new Error("Person ID is required");
    const cacheKey = `tmdb_person_${personId}`;
    const cached = getFromCache<PersonDetails>(cacheKey);
    if(cached) return cached;
    const data = await fetchFromTmdb<PersonDetails>(`person/${personId}?append_to_response=combined_credits,images`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getWatchProviders = async (id: number, mediaType: 'tv' | 'movie'): Promise<WatchProviderResponse> => {
    if (!id || !mediaType) throw new Error("ID and Media Type are required for providers");
    const cacheKey = `tmdb_providers_${mediaType}_${id}`;
    const cached = getFromCache<WatchProviderResponse>(cacheKey);
    if(cached) return cached;
    const data = await fetchFromTmdb<WatchProviderResponse>(`${mediaType}/${id}/watch/providers`);
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getCollectionDetails = async (collectionId: number): Promise<TmdbCollection> => {
    if (!collectionId) throw new Error("Collection ID is required");
    const cacheKey = `tmdb_collection_${collectionId}`;
    const cached = getFromCache<TmdbCollection>(cacheKey);
    if(cached) return cached;
    const data = await fetchFromTmdb<TmdbCollection>(`collection/${collectionId}`);
    data.parts = data.parts.map(p => ({...p, media_type: 'movie'}));
    setToCache(cacheKey, data, CACHE_TTL);
    return data;
};

export const getCalendarMedia = async (startDate: string, days: number): Promise<CalendarItem[]> => {
  const movies = await getUpcomingMovies();
  return movies.map(m => ({ id: m.id, media_type: 'movie', poster_path: m.poster_path, title: m.title || '', date: m.release_date || '', episodeInfo: 'Movie Release' }));
};