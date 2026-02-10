
export type ProfileTab = 'overview' | 'history' | 'progress' | 'updates' | 'ongoing' | 'weeklyPicks' | 'library' | 'achievements' | 'lists' | 'seasonLog' | 'journal' | 'activity' | 'stats' | 'imports' | 'settings' | 'airtime_management' | 'liveWatch';

export type WatchStatus = 'watching' | 'planToWatch' | 'completed' | 'onHold' | 'dropped' | 'allCaughtUp' | 'favorites';

export type ParticleEffectName = 'snow' | 'hearts' | 'leaves' | 'confetti' | 'fireworks' | 'sparkles' | 'cherry_blossoms' | 'bats' | 'flowers' | 'pumpkins' | 'ghosts' | 'eggs';

export type ListVisibility = 'public' | 'private' | 'followers';

export type CommentVisibility = 'public' | 'private' | 'followers';

export type ReportType = 'missing_airtime_tv' | 'missing_runtime_ep' | 'missing_runtime_movie' | 'missing_airdate_movie' | 'missing_airdate_ep' | 'no_recs_movie' | 'no_recs_tv' | 'missing_cast_images' | 'missing_poster_tv' | 'missing_poster_movie' | 'missing_backdrop_tv' | 'missing_backdrop_movie';

export type ActivityType = 'WATCHED_EPISODE' | 'WATCHED_MOVIE' | 'RATED_ITEM' | 'CREATED_LIST';

export interface Theme {
  id: string;
  name: string;
  description: string;
  base: 'light' | 'dark';
  holidayDate?: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    surfaceCard: string;
    surfaceModal: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    border: string;
    buttonPrimary: string;
    buttonSecondary: string;
    bgGradient: string;
    accentGradient: string;
    cardGradient: string;
    bgBackdrop: string;
    onAccent?: string;
    patternOpacity?: string;
    fontJournal?: string;
    particleEffect?: ParticleEffectName[];
    patternBgSize?: string;
    patternBgColor?: string;
    patternBgPosition?: string;
  };
}

export interface TmdbMedia {
  id: number;
  title?: string;
  name?: string;
  media_type: 'tv' | 'movie' | 'person';
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
}

export interface TmdbMediaDetails extends TmdbMedia {
  overview?: string;
  tagline?: string;
  genres: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  last_episode_to_air?: Episode;
  next_episode_to_air?: Episode;
  seasons?: TmdbSeasonSummary[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  images?: {
    posters: TmdbImage[];
    backdrops: TmdbImage[];
  };
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  networks?: { id: number; name: string; logo_path: string | null }[];
  budget?: number;
  revenue?: number;
  original_language?: string;
  origin_country?: string[];
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string }[] }[] };
  belongs_to_collection?: { id: number; name: string };
  recommendations?: { results: TmdbMedia[] };
}

export interface TmdbSeasonSummary {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  poster_path: string | null;
  air_date?: string;
  vote_average?: number;
}

export interface TmdbSeasonDetails {
  id: number;
  season_number: number;
  name: string;
  episodes: Episode[];
  poster_path: string | null;
}

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  runtime: number | null;
  vote_average?: number;
  vote_count?: number;
  episode_type?: 'standard' | 'series_finale' | 'season_finale' | 'midseason_finale';
  airtime?: string;
}

export interface EpisodeWithAirtime extends Episode {
  airtime: string;
}

// FIX: Added missing EpisodeTag definition to resolve multiple import errors.
export interface EpisodeTag {
  text: string;
  className: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TmdbImage {
  file_path: string;
}

export interface WatchProviderResponse {
  results: Record<string, {
    flatrate?: { provider_name: string; logo_path: string }[];
    rent?: { provider_name: string; logo_path: string }[];
    buy?: { provider_name: string; logo_path: string }[];
  }>;
}

export interface TmdbCollection {
  id: number;
  name: string;
  parts: TmdbMedia[];
}

export interface TmdbFindResponse {
  movie_results: TmdbMedia[];
  tv_results: TmdbMedia[];
  person_results: any[];
}

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string | null;
  place_of_birth: string | null;
  profile_path: string | null;
  gender: number;
  combined_credits: {
    cast: PersonCredit[];
    crew: any[];
  };
  images?: { profiles: TmdbImage[] };
}

export interface PersonCredit extends TmdbMedia {
  credit_id: string;
  character?: string;
}

export interface TrackedItem {
  id: number;
  title: string;
  media_type: 'tv' | 'movie' | 'person';
  poster_path: string | null;
  genre_ids?: number[];
  release_date?: string;
  addedAt?: string;
}

export interface TmdbPerson {
  id: number;
  name: string;
  profile_path: string | null;
}

export interface CalendarItem {
  id: number;
  media_type: 'tv' | 'movie';
  poster_path: string | null;
  still_path?: string | null;
  title: string;
  date: string;
  episodeInfo: string;
  network?: string;
  overview?: string;
  isInCollection?: boolean;
  runtime?: number | null;
  airtime?: string;
}

export interface NewlyPopularEpisode {
  showInfo: {
    id: number;
    title: string;
    media_type: 'tv';
    poster_path: string | null;
    genre_ids: number[];
  };
  episode: Episode;
}

export interface UserData {
  watching: TrackedItem[];
  planToWatch: TrackedItem[];
  completed: TrackedItem[];
  onHold: TrackedItem[];
  dropped: TrackedItem[];
  allCaughtUp: TrackedItem[];
  favorites: TrackedItem[];
  watchProgress: WatchProgress;
  history: HistoryItem[];
  deletedHistory: DeletedHistoryItem[];
  deletedNotes: DeletedNote[];
  customLists: CustomList[];
  ratings: UserRatings;
  episodeRatings: EpisodeRatings;
  seasonRatings: SeasonRatings;
  favoriteEpisodes: FavoriteEpisodes;
  searchHistory: SearchHistoryItem[];
  comments: Comment[];
  mediaNotes: Record<number, Note[]>;
  episodeNotes: Record<number, Record<number, Record<number, Note[]>>>;
  weeklyFavorites: WeeklyPick[];
  weeklyFavoritesHistory: Record<string, WeeklyPick[]>;
  customEpisodeImages: Record<number, Record<number, Record<number, string>>>;
  customImagePaths: CustomImagePaths;
  globalPlaceholders: { poster?: string; backdrop?: string; still?: string };
  timezone: string;
  timeFormat: '12h' | '24h';
  blockedUserIds: string[];
  pendingRecommendationChecks: PendingRecommendationCheck[];
  failedRecommendationReports: TrackedItem[];
}

// FIX: Added missing Follows definition to resolve multiple import errors.
export type Follows = Record<string, string[]>;

export interface EpisodeProgress {
  status: 0 | 1 | 2; // 0: unwatched, 1: watching, 2: watched
  journal?: JournalEntry;
}

export type SeasonProgress = Record<number, EpisodeProgress>;
export type ShowProgress = Record<number, SeasonProgress>;
export type WatchProgress = Record<number, ShowProgress>;

export interface HistoryItem extends TrackedItem {
  logId: string;
  timestamp: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  episodeStillPath?: string | null;
  seasonPosterPath?: string | null;
  note?: string;
  startTime?: string;
  endTime?: string;
  pauseCount?: number;
}

export interface DeletedHistoryItem extends HistoryItem {
  deletedAt: string;
}

export interface UserRatings {
  [mediaId: number]: {
    rating: number;
    date: string;
  };
}

export interface EpisodeRatings {
  [showId: number]: {
    [seasonNumber: number]: {
      [episodeNumber: number]: number;
    };
  };
}

export interface SeasonRatings {
  [showId: number]: {
    [seasonNumber: number]: number;
  };
}

export interface FavoriteEpisodes {
  [showId: number]: {
    [seasonNumber: number]: {
      [episodeNumber: number]: boolean;
    };
  };
}

export interface JournalEntry {
  text: string;
  mood: string;
  timestamp: string;
}

export interface Note {
  id: string;
  text: string;
  timestamp: string;
}

export interface DeletedNote extends Note {
  deletedAt: string;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  items: CustomListItem[];
  createdAt: string;
  visibility: ListVisibility;
  likes: string[]; // User IDs
}

export interface CustomListItem extends TrackedItem {}

export interface PublicCustomList extends CustomList {
  user: {
    id: string;
    username: string;
  };
}

export interface Comment {
  id: string;
  mediaKey: string;
  text: string;
  user: PublicUser;
  timestamp: string;
  likes: string[];
  parentId: string | null;
  isSpoiler: boolean;
  visibility: CommentVisibility;
}

export interface PublicUser {
  id: string;
  username: string;
  profilePictureUrl: string | null;
}

export interface CustomImagePaths {
  [mediaId: number]: {
    poster_path?: string;
    backdrop_path?: string;
    gallery: string[];
  };
}

export interface AppNotification {
  id: string;
  type: 'new_follower' | 'list_like' | 'comment_reply' | 'revival' | 'sequel' | 'stale_show' | 'nostalgia_added' | 'nostalgia_released';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  poster_path?: string | null;
  mediaId?: number;
  mediaType?: 'tv' | 'movie';
  followerInfo?: { userId: string };
  likerInfo?: { userId: string };
}

export interface Reminder {
  id: string;
  mediaId: number;
  mediaType: 'tv' | 'movie';
  releaseDate: string;
  title: string;
  poster_path: string | null;
  episodeInfo?: string;
  selectedTypes: ReminderType[];
  frequency: 'first' | 'all';
}

export type ReminderType = '2weeks_before' | 'week_before' | '2days_before' | 'day_before' | 'hour_before' | '5min_before' | 'release' | '5min_after' | 'hour_after' | 'day_after' | '2days_after' | 'week_after' | '2weeks_after' | 'daily_7_before';

export interface LiveWatchMediaInfo {
  id: number;
  media_type: 'tv' | 'movie';
  title: string;
  poster_path: string | null;
  runtime: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  sessionId?: string; // UNIQUE IDENTIFIER FOR MULTI-SESSION SUPPORT
}

export interface LiveWatchSession {
    sessionId: string;
    mediaInfo: LiveWatchMediaInfo;
    elapsedSeconds: number;
    pausedAt: string;
    startTime: string;
    pauseCount: number;
}

export interface SearchHistoryItem {
  query?: string;
  item?: TrackedItem;
  timestamp: string;
}

export interface ShortcutSettings {
  show: boolean;
  tabs: ProfileTab[];
}

export interface NavSettings {
  tabs: string[];
  position: 'bottom' | 'left' | 'right';
  hoverRevealNav: boolean;
  hoverRevealHeader: boolean;
}

export interface AppPreferences {
  searchAlwaysExpandFilters: boolean;
  searchShowFilters: boolean;
  searchShowSeriesInfo: 'toggle' | 'expanded' | 'hidden';
  searchShowRecentHistory: boolean;
  dashShowStats: boolean;
  dashShowLiveWatch: boolean;
  dashShowContinueWatching: boolean;
  dashShowUpcoming: boolean;
  dashShowRecommendations: boolean;
  dashShowTrending: boolean;
  dashShowWeeklyGems: boolean;
  dashShowWeeklyPicks: boolean;
  dashShowNewSeasons: boolean;
  dashShowPlanToWatch: boolean;
  enableAnimations: boolean;
  enableSpoilerShield: boolean;
  showBadgesOnProfile: boolean;
  tabNavigationStyle: 'scroll' | 'dropdown';
}

export interface PrivacySettings {
  activityVisibility: 'public' | 'followers' | 'private';
}

export interface NotificationSettings {
  masterEnabled: boolean;
  newEpisodes: boolean;
  movieReleases: boolean;
  sounds: boolean;
  newFollowers: boolean;
  listLikes: boolean;
  appUpdates: boolean;
  importSyncCompleted: boolean;
  showWatchedConfirmation: boolean;
  showPriorEpisodesPopup: boolean;
}

export interface ProfileTheme {
  backgroundImage: string | null;
  fontFamily: string | null;
}

export interface WeeklyPick extends TrackedItem {
  category: 'tv' | 'movie' | 'actor' | 'actress' | 'episode';
  dayIndex: number;
  episodeNumber?: number;
  episodeTitle?: string;
  seasonNumber?: number;
}

export interface PendingRecommendationCheck {
  id: number;
  mediaType: 'tv' | 'movie';
}

export interface CalculatedStats {
  totalEpisodesWatched: number;
  nonManualEpisodesWatched: number;
  currentStreak: number;
  longestStreak: number;
  watchedThisWeek: number;
  journalCount: number;
  moodJournalCount: number;
  notesCreatedToday: number;
  showsCompleted: number;
  moviesCompleted: number;
  totalItemsOnLists: number;
  watchedGenreCount: number;
  episodesWatchedToday: number;
  moviesWatchedToday: number;
  moviesWatchedThisWeek: number;
  hoursWatchedThisWeek: number;
  planToWatchCount: number;
  hoursWatchedThisMonth: number;
  topGenresThisMonth: number[];
  genreDistributionThisMonth: Record<number, number>;
  totalHoursWatched: number;
  showsWatchingCount: number;
  moviesToWatchCount: number;
  topGenresAllTime: number[];
  genreDistributionAllTime: Record<number, number>;
  weeklyActivity: number[];
  moodDistribution: Record<string, number>;
  monthlyActivity: { month: string; count: number }[];
  episodesWatchedThisMonth: number;
  moviesWatchedThisMonth: number;
  episodesWatchedThisYear: number;
  moviesWatchedThisYear: number;
  hoursWatchedThisYear: number;
  mostActiveDay: string;
  ratedItemsCount: number;
  customListsCount: number;
  maxItemsInCustomList: number;
  distinctMoodsCount: number;
  completedSeasonsCount?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  tier: 1 | 2 | 3 | 4;
  visibility: 'visible' | 'hinted' | 'hidden';
  scope: 'global' | 'title';
  check: (userData: UserData, stats: CalculatedStats) => { progress: number; goal: number };
}

export type AchievementCategory = 'Watching' | 'Journaling' | 'Ratings & Mood' | 'Lists & Organization' | 'Consistency & Time' | 'Customization' | 'Discovery' | 'Series Progress' | 'Rewatching' | 'Social' | 'Power User' | 'Archive & Cleanup';

export interface UserAchievementStatus extends Achievement {
  unlocked: boolean;
  progress: number;
  goal: number;
  unlockDate?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  requirements: string[];
  tier: number;
}

export interface MediaUpdate {
  id: string;
  type: 'stale' | 'revival' | 'sequel' | 'nostalgia_added' | 'nostalgia_released';
  mediaId: number;
  mediaType: 'tv' | 'movie';
  title: string;
  description: string;
  poster_path: string | null;
  timestamp: string;
  details?: any;
}

export interface TraktToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  created_at: number;
}

export interface TraktWatchedMovie {
  movie: {
    title: string;
    ids: { tmdb: number };
  };
  last_watched_at: string;
}

export interface TraktWatchedShow {
  show: {
    title: string;
    ids: { tmdb: number };
  };
  plays: number;
  last_watched_at: string;
  seasons: {
    number: number;
    episodes: {
      number: number;
      plays: number;
      last_watched_at: string;
    }[];
  }[];
}

export interface SeasonLogItem {
  showId: number;
  showTitle: string;
  posterPath: string | null;
  seasonNumber: number;
  seasonName: string;
  completionDate: string;
  userStartDate: string | null;
  premiereDate: string | null;
  endDate: string | null;
}

export interface DownloadedPdf {
  id: string;
  title: string;
  timestamp: string;
  part: number;
  rows: any[];
}

export interface FriendActivity {
  user: PublicUser;
  activities: Activity[];
}

export interface Activity {
  user: PublicUser;
  timestamp: string;
  type: ActivityType;
  media?: TrackedItem;
  episodeInfo?: string;
  rating?: number;
  listName?: string;
}

export interface FullSeasonDrop {
    showId: number;
    showTitle: string;
    poster_path: string | null;
    seasonName: string;
    airtime?: string;
    network?: string;
    episodes: Episode[];
}
