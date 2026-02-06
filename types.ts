export interface Theme {
  id: string;
  name: string;
  description: string;
  base: 'light' | 'dark';
  holidayDate?: { month: number; day: number }; // month is 0-indexed (0=Jan, 1=Feb, etc.)
  colors: {
    bgGradient: string;
    accentGradient: string;
    cardGradient: string;
    textColorPrimary: string;
    textColorSecondary: string;
    accentPrimary: string;
    accentSecondary: string;
    bgPrimary: string;
    bgSecondary: string;
    bgBackdrop: string;
    error?: string;
    success?: string;
    onAccent?: string;
    particleEffect?: ParticleEffectName[];
    patternBgSize?: string;
    patternBgColor?: string;
    patternBgPosition?: string;
    patternOpacity?: string;
    fontHeading?: string;
    fontBody?: string;
    fontJournal?: string;
  };
}

/* // FIX: Expanded ParticleEffectName to include all effects supported by BackgroundParticleEffects.tsx and ThemeTransitionAnimation.tsx */
export type ParticleEffectName = 'snow' | 'hearts' | 'leaves' | 'confetti' | 'fireworks' | 'sparkles' | 'cherry_blossoms' | 'bats' | 'flowers' | 'pumpkins' | 'ghosts' | 'eggs';

export type WatchStatus = 'watching' | 'planToWatch' | 'completed' | 'onHold' | 'dropped' | 'allCaughtUp' | 'favorites';

export interface TrackedItem {
  id: number;
  title: string;
  media_type: 'tv' | 'movie' | 'person';
  poster_path: string | null;
  genre_ids?: number[];
  release_date?: string;
  addedAt?: string;
}

export interface PendingRecommendationCheck {
  id: number;
  title: string;
  mediaType: 'tv' | 'movie';
  firstNoticedDate: string;
  lastCheckedDate: string;
  retryCount: number;
  poster_path: string | null;
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
  genre_ids?: number[];
  popularity?: number;
  vote_average?: number;
  vote_count?: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order?: number;
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

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string;
  still_path: string | null;
  runtime: number | null;
  vote_average?: number;
  vote_count?: number;
  episode_type?: string;
  crew?: CrewMember[];
  guest_stars?: CastMember[];
  airtime?: string;
}

export interface TmdbMediaDetails extends TmdbMedia {
  genres: { id: number; name: string }[];
  tagline?: string;
  overview?: string;
  status?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  runtime?: number;
  last_episode_to_air?: Episode;
  next_episode_to_air?: Episode;
  seasons?: {
    id: number;
    name: string;
    overview: string;
    season_number: number;
    episode_count: number;
    air_date: string | null;
    poster_path: string | null;
  }[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  images?: {
    posters: TmdbImage[];
    backdrops: TmdbImage[];
  };
  recommendations?: {
    results: TmdbMedia[];
  };
  external_ids?: {
    tvdb_id?: number;
    imdb_id?: string;
  };
  content_ratings?: {
    results: { iso_3166_1: string; rating: string }[];
  };
  release_dates?: {
    results: { iso_3166_1: string; release_dates: { certification: string }[] }[];
  };
  belongs_to_collection?: { id: number; name: string; poster_path: string; backdrop_path: string };
  networks?: { id: number; name: string; logo_path: string }[];
  production_companies?: { id: number; name: string; logo_path: string }[];
  budget?: number;
  revenue?: number;
  original_language?: string;
  origin_country?: string[];
}

export interface TmdbSeasonDetails {
  id: number;
  name: string;
  season_number: number;
  poster_path: string | null;
  episodes: Episode[];
  air_date?: string;
  vote_average?: number;
}

export interface PersonDetails {
  id: number;
  name: string;
  biography?: string;
  birthday: string | null;
  place_of_birth?: string;
  profile_path: string | null;
  gender?: number;
  combined_credits?: {
    cast: PersonCredit[];
    crew: PersonCredit[];
  };
  images?: {
    profiles: TmdbImage[];
  };
}

export interface PersonCredit extends TmdbMedia {
  character?: string;
  job?: string;
  credit_id: string;
}

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

export interface JournalEntry {
  text: string;
  mood: string;
  timestamp: string;
}

export interface EpisodeProgress {
  status: 0 | 1 | 2;
  journal?: JournalEntry;
}

export type SeasonProgress = Record<number, EpisodeProgress>;
export type ShowProgress = Record<number, SeasonProgress>;
export type WatchProgress = Record<number, ShowProgress>;

export interface Note {
  id: string;
  text: string;
  timestamp: string;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  items: CustomListItem[];
  createdAt: string;
  visibility: ListVisibility;
  likes: string[];
}

export type CustomListItem = TrackedItem;

export type ListVisibility = 'public' | 'followers' | 'private';

export interface UserRatings {
  [mediaId: number]: {
    rating: number;
    date: string;
  };
}

export type EpisodeRatings = Record<number, Record<number, Record<number, number>>>;
export type SeasonRatings = Record<number, Record<number, number>>;

export type FavoriteEpisodes = Record<number, Record<number, Record<number, boolean>>>;

export interface LiveWatchMediaInfo {
  id: number;
  media_type: 'tv' | 'movie';
  title: string;
  poster_path: string | null;
  runtime: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

export interface SearchHistoryItem {
  query?: string;
  item?: TrackedItem;
  timestamp: string;
}

export interface Comment {
  id: string;
  mediaKey: string;
  user: PublicUser;
  text: string;
  parentId: string | null;
  isSpoiler: boolean;
  visibility: CommentVisibility;
  timestamp: string;
  likes: string[];
}

export type CommentVisibility = 'public' | 'followers' | 'private';

export interface PublicUser {
  id: string;
  username: string;
  profilePictureUrl: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  mediaId?: number;
  mediaType?: 'tv' | 'movie';
  poster_path?: string | null;
  followerInfo?: { userId: string };
  likerInfo?: { userId: string };
  commentInfo?: { commentId: string, authorId: string };
}

export interface WeeklyPick extends TrackedItem {
  category: 'tv' | 'movie' | 'actor' | 'actress' | 'episode';
  dayIndex: number;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
}

export interface DeletedHistoryItem extends HistoryItem {
  deletedAt: string;
}

export interface DeletedNote extends Note {
  deletedAt: string;
  mediaId: number;
  mediaTitle: string;
  context: string;
}

export interface CustomImagePaths {
  [mediaId: number]: {
    poster_path?: string;
    backdrop_path?: string;
    gallery: string[];
  };
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

export type ReminderType = 'release' | 'hour_before' | 'hour_after' | '5min_before' | '5min_after' | 'day_before' | 'day_after' | '2days_before' | '2days_after' | 'week_before' | 'week_after' | '2weeks_before' | '2weeks_after' | 'daily_7_before' | 'daily_7_after';

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

export interface AppPreferences {
  searchAlwaysExpandFilters: boolean;
  searchShowFilters: boolean;
  searchShowSeriesInfo: 'expanded' | 'toggle' | 'hidden';
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

export interface PrivacySettings {
  activityVisibility: 'public' | 'followers' | 'private';
}

export interface ProfileTheme {
  backgroundImage: string | null;
  fontFamily: string | null;
}

export type ProfileTab = 'overview' | 'history' | 'progress' | 'updates' | 'ongoing' | 'weeklyPicks' | 'library' | 'achievements' | 'lists' | 'seasonLog' | 'journal' | 'activity' | 'stats' | 'imports' | 'settings' | 'airtime_management';

export type Follows = Record<string, string[]>;

export interface PublicCustomList extends CustomList {
  user: {
    id: string;
    username: string;
    profilePictureUrl?: string | null;
  };
}

export type ScreenName = 'home' | 'search' | 'calendar' | 'progress' | 'profile';

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
  check: (data: UserData, stats: CalculatedStats) => { progress: number; goal: number };
}

export interface UserAchievementStatus extends Achievement {
  unlocked: boolean;
  progress: number;
  goal: number;
  unlockDate?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type AchievementCategory = 'Watching' | 'Journaling' | 'Ratings & Mood' | 'Lists & Organization' | 'Consistency & Time' | 'Customization' | 'Discovery' | 'Series Progress' | 'Rewatching' | 'Social' | 'Power User' | 'Archive & Cleanup';

export interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  requirements: string[];
  tier: 1 | 2 | 3;
}

export interface TmdbFindResponse {
  movie_results: TmdbMedia[];
  person_results: TmdbPerson[];
  tv_results: TmdbMedia[];
  tv_episode_results: any[];
  tv_season_results: any[];
}

export interface TmdbPerson extends TmdbMedia {
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

export interface TvdbToken {
  token: string;
  expiry: number;
}

export interface TvdbShow {
  id: number;
  name: string;
  artworks?: { type: number; image: string }[];
}

export interface TvdbRelatedShow {
  id: number;
  typeName: string;
}

export interface WatchProviderResponse {
  results: {
    US?: {
      flatrate?: { provider_name: string; logo_path: string }[];
      rent?: { provider_name: string; logo_path: string }[];
      buy?: { provider_name: string; logo_path: string }[];
    };
  };
}

export interface TmdbCollection {
  id: number;
  name: string;
  parts: TmdbMedia[];
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

export type ReportType = 'ongoing' | 'hiatus' | 'placeholder_tv' | 'placeholder_movies' | 'placeholder_people' | 'no_recommendations' | 'missing_airtime' | 'missing_status';

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

export type ActivityType = 'WATCHED_EPISODE' | 'WATCHED_MOVIE' | 'RATED_ITEM' | 'CREATED_LIST';

export interface FullSeasonDrop {
    showId: number;
    showTitle: string;
    seasonName: string;
    poster_path: string | null;
    airtime: string;
    episodes: Episode[];
    network?: string;
}

export type EpisodeWithAirtime = Episode & { airtime: string };

export interface TraktWatchedMovie {
    last_watched_at: string;
    movie: {
        title: string;
        ids: {
            tmdb: number;
        };
    };
}

export interface TraktWatchedShow {
    plays: number;
    last_watched_at: string;
    show: {
        title: string;
        ids: {
            tmdb: number;
        };
    };
    seasons: {
        number: number;
        episodes: {
            number: number;
            plays: number;
            last_watched_at: string;
        }[];
    }[];
}

export interface TraktToken {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    created_at: number;
}

export interface EpisodeTag {
  text: string;
  className: string;
}