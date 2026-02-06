import React, { useState, useMemo, useEffect } from 'react';
import { UserData, TmdbMedia, WatchStatus, CustomList, LiveWatchMediaInfo, TrackedItem, Reminder, ShortcutSettings, AppPreferences, JournalEntry, WeeklyPick } from '../types';
import HeroBanner from '../components/HeroBanner';
import ShortcutNavigation from '../components/ShortcutNavigation';
import ContinueWatching from '../components/ContinueWatching';
import NewSeasons from '../components/NewSeasons';
import { discoverMedia, getNowPlayingMovies } from '../services/tmdbService';
import { TMDB_API_KEY } from '../constants';
import MyListSuggestions from '../components/MyListSuggestions';
import LiveWatchControls from '../components/LiveWatchControls';
import DateTimeDisplay from '../components/DateTimeDisplay';
import PlanToWatch from '../components/PlanToWatch';
import StatsWidget from '../components/StatsWidget';
import RelatedRecommendations from '../components/RelatedRecommendations';
import NewReleases from '../components/NewReleases';
import TrendingSection from '../components/TrendingSection';
import GenericCarousel from '../components/GenericCarousel';
import NewlyPopularEpisodes from '../components/NewlyPopularEpisodes';
import { getEnrichedMediaFromBackend } from '../services/backendService';
import Top10Carousel from '../components/Top10Carousel';
import { FilmIcon, TvIcon, TrophyIcon, SparklesIcon, MountainIcon } from '../components/Icons';

interface DashboardProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie' | 'person') => void;
  onSelectShowInModal: (id: number, media_type: 'tv' | 'movie') => void;
  watchProgress: UserData['watchProgress'];
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onShortcutNavigate: (tabId: string) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  setCustomLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
  liveWatchMedia: LiveWatchMediaInfo | null;
  liveWatchElapsedSeconds: number;
  liveWatchIsPaused: boolean;
  onLiveWatchTogglePause: () => void;
  onLiveWatchStop: () => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
  timezone: string;
  genres: Record<number, string>;
  timeFormat: '12h' | '24h';
  reminders: Reminder[];
  onToggleReminder: (newReminder: Reminder | null, reminderId: string) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  shortcutSettings: ShortcutSettings;
  preferences: AppPreferences;
  onRemoveWeeklyPick: (pick: any) => void;
  onOpenNominateModal: () => void;
  showRatings: boolean;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onRateEpisode: (showId: number, seasonNumber: number, episodeNumber: number, rating: number) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  onToggleWeeklyFavorite: (item: WeeklyPick, replacementId?: number) => void;
}

const ApiKeyWarning: React.FC = () => (
    <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mx-6 text-center border border-red-500/40">
        <h3 className="font-black uppercase tracking-tight">TMDB API Key Missing</h3>
        <p className="mt-2 text-sm font-black uppercase">The content carousels on this page cannot be loaded.</p>
    </div>
);

const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
    <div className="flex items-center gap-3 mb-6 px-6">
        <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter leading-none">{title}</h2>
        </div>
    </div>
);

interface DiscoverContentProps extends Pick<DashboardProps, 'onSelectShow' | 'onOpenAddToListModal' | 'onMarkShowAsWatched' | 'onToggleFavoriteShow' | 'favorites' | 'userData' | 'timezone' | 'onShortcutNavigate' | 'genres' | 'reminders' | 'onToggleReminder' | 'onUpdateLists' | 'preferences' | 'timeFormat' | 'showRatings' | 'onToggleEpisode' | 'onStartLiveWatch' | 'onToggleFavoriteEpisode' | 'onRateEpisode' | 'onSaveJournal' | 'onAddWatchHistory' | 'pausedLiveSessions' | 'onToggleWeeklyFavorite'> {}

const DiscoverContent: React.FC<DiscoverContentProps> = 
({ onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, userData, timezone, onShortcutNavigate, genres, reminders, onToggleReminder, onUpdateLists, preferences, timeFormat, showRatings, onToggleEpisode, onStartLiveWatch, onToggleFavoriteEpisode, onRateEpisode, onSaveJournal, onAddWatchHistory, pausedLiveSessions, onToggleWeeklyFavorite }) => {
    const carouselProps = { onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, completed: userData.completed, userData, timeFormat, showRatings };

    return (
        <div className="space-y-16">
          <div>
            <SectionHeader title="Now in Theaters" icon={<FilmIcon className="w-8 h-8 text-sky-400" />} />
            <GenericCarousel fetcher={getNowPlayingMovies} {...carouselProps} title="Now Playing" />
          </div>
          
          {preferences.dashShowUpcoming && (
            <>
              <div>
                <SectionHeader title="Upcoming TV Premieres" icon={<TvIcon className="w-8 h-8 text-rose-500" />} />
                <GenericCarousel 
                    title="TV Premieres" 
                    fetcher={() => discoverMedia('tv', { sortBy: 'popularity.desc', 'first_air_date.gte': new Date().toISOString().split('T')[0] })} 
                    {...carouselProps} 
                />
              </div>
              <div>
                <SectionHeader title="Upcoming Movie Releases" icon={<FilmIcon className="w-8 h-8 text-sky-500" />} />
                <GenericCarousel 
                    title="Movie Releases" 
                    fetcher={() => discoverMedia('movie', { sortBy: 'popularity.desc', 'primary_release_date.gte': new Date().toISOString().split('T')[0] })} 
                    {...carouselProps} 
                />
              </div>
            </>
          )}

          <div>
            <SectionHeader title="Top 10 Movies" icon={<TrophyIcon className="w-8 h-8 text-yellow-500" />} />
            <Top10Carousel mediaType="movie" {...carouselProps} title="Top 10 Movies" onUpdateLists={onUpdateLists} />
          </div>
          <div>
            <SectionHeader title="Top 10 TV Shows" icon={<TrophyIcon className="w-8 h-8 text-yellow-500" />} />
            <Top10Carousel mediaType="tv" {...carouselProps} title="Top 10 TV Shows" onUpdateLists={onUpdateLists} />
          </div>
          
          {preferences.dashShowTrending && (
            <>
              <NewReleases mediaType="movie" title="🍿 New Popular Movie Releases" {...carouselProps} timezone={timezone} onViewMore={() => onShortcutNavigate('allNewReleases')} />
              <NewlyPopularEpisodes 
                onSelectShow={onSelectShow} 
                userData={userData} 
                onToggleEpisode={onToggleEpisode} 
                onStartLiveWatch={onStartLiveWatch} 
                preferences={preferences}
                onToggleFavoriteEpisode={onToggleFavoriteEpisode}
                onRateEpisode={onRateEpisode}
                onSaveJournal={onSaveJournal}
                onAddWatchHistory={onAddWatchHistory}
                onUpdateLists={onUpdateLists}
                pausedLiveSessions={pausedLiveSessions}
                onToggleWeeklyFavorite={onToggleWeeklyFavorite}
              />
              <TrendingSection mediaType="tv" title="🔥 Trending TV Shows" {...carouselProps} onViewMore={() => onShortcutNavigate('allTrendingTV')} />
              <TrendingSection mediaType="movie" title="🔥 Trending Movies" {...carouselProps} onViewMore={() => onShortcutNavigate('allTrendingMovies')} />
            </>
          )}
          
          {preferences.dashShowRecommendations && (
            <>
              <GenericCarousel title="💥 Top Rated Action & Adventure" fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 300, genre: '28|12' })} {...carouselProps} onViewMore={() => onShortcutNavigate('allTopRated')} />
              <GenericCarousel title="🎭 Binge-Worthy TV Dramas" fetcher={() => discoverMedia('tv', { sortBy: 'popularity.desc', genre: 18, vote_count_gte: 100 })} {...carouselProps} onViewMore={() => onShortcutNavigate('allBingeWorthy')} />
              <GenericCarousel title="🤠 Western Fans Registry" fetcher={() => discoverMedia('movie', { sortBy: 'popularity.desc', genre: 37, vote_count_gte: 10 })} {...carouselProps} icon={<MountainIcon className="w-8 h-8 text-amber-600" />} onViewMore={() => onShortcutNavigate('allWesterns')} />
              <GenericCarousel title="💎 Hidden Gems" fetcher={() => discoverMedia('movie', { sortBy: 'vote_average.desc', vote_count_gte: 20, vote_count_lte: 400 })} {...carouselProps} onViewMore={() => onShortcutNavigate('allHiddenGems')} />
            </>
          )}
        </div>
    );
};

const Dashboard: React.FC<DashboardProps> = (props) => {
  const { userData, onSelectShow, watchProgress, onToggleEpisode, onShortcutNavigate, onOpenAddToListModal, liveWatchMedia, liveWatchElapsedSeconds, liveWatchIsPaused, onLiveWatchTogglePause, onLiveWatchStop, onMarkShowAsWatched, onToggleFavoriteShow, favorites, pausedLiveSessions, timezone, genres, timeFormat, reminders, onToggleReminder, onUpdateLists, shortcutSettings, preferences, showRatings, onStartLiveWatch, onToggleFavoriteEpisode, onRateEpisode, onSaveJournal, onAddWatchHistory, onToggleWeeklyFavorite } = props;
  const isApiKeyMissing = (TMDB_API_KEY as string) === 'YOUR_TMDB_API_KEY_HERE';
  const [backendMovies, setBackendMovies] = useState<TmdbMedia[]>([]);
  const [backendShows, setBackendShows] = useState<TmdbMedia[]>([]);
  const [backendLoading, setBackendLoading] = useState(true);

  useEffect(() => {
    const fetchBackendData = async () => {
        if (isApiKeyMissing) { setBackendLoading(false); return; }
        try {
            const { movies, shows } = await getEnrichedMediaFromBackend();
            setBackendMovies(movies);
            setBackendShows(shows);
        } catch (e) { console.error(e); } finally { setBackendLoading(false); }
    };
    fetchBackendData();
  }, [isApiKeyMissing]);
  
  const carouselProps = useMemo(() => ({ 
    onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, 
    favorites, completed: userData.completed, userData, timeFormat,
    showRatings
  }), [onSelectShow, onOpenAddToListModal, onMarkShowAsWatched, onToggleFavoriteShow, favorites, userData, timeFormat, showRatings]);

  const recommendationSeedItems = useMemo(() => {
    return [...userData.watching].filter(item => {
        const progress = userData.watchProgress[item.id];
        return progress && Object.keys(progress).length > 0 && !userData.onHold.some(onHoldItem => onHoldItem.id === item.id);
    });
  }, [userData.watching, userData.watchProgress, userData.onHold]);

  const trackedShowsForNewSeasons = useMemo(() => {
    const allItems = new Map<number, TrackedItem>();
    [...userData.watching, ...userData.onHold, ...userData.allCaughtUp].forEach(item => { if (item.media_type === 'tv') allItems.set(item.id, item); });
    userData.customLists.forEach(list => { list.items.forEach(item => { if (item.media_type === 'tv') allItems.set(item.id, item as TrackedItem); }); });
    return Array.from(allItems.values());
  }, [userData.watching, userData.onHold, userData.allCaughtUp, userData.customLists]);

  return (
    <div className="animate-fade-in space-y-12 pb-24">
      <HeroBanner history={userData.history} onSelectShow={onSelectShow} />
      <DateTimeDisplay timezone={timezone} timeFormat={timeFormat} />
      {shortcutSettings.show && <ShortcutNavigation onShortcutNavigate={onShortcutNavigate} selectedTabs={shortcutSettings.tabs} />}
      {preferences.dashShowStats && <StatsWidget userData={userData} genres={genres} />}
      
      {preferences.dashShowLiveWatch && (
          <section className="px-6">
            {liveWatchMedia ? (
                <LiveWatchControls mediaInfo={liveWatchMedia} elapsedSeconds={liveWatchElapsedSeconds} isPaused={liveWatchIsPaused} onTogglePause={onLiveWatchTogglePause} onStop={onLiveWatchStop} isDashboardWidget={true} />
            ) : (
                <div className="bg-bg-secondary/20 rounded-3xl p-10 text-center border border-dashed border-white/10">
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-widest opacity-60">No Active Watch</h3>
                    <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mt-2 opacity-50">Start a live session from any show or movie page.</p>
                </div>
            )}
          </section>
      )}

      {preferences.dashShowContinueWatching && <ContinueWatching watching={userData.watching} onHold={userData.onHold} watchProgress={watchProgress} history={userData.history} onSelectShow={onSelectShow} onToggleEpisode={onToggleEpisode} pausedLiveSessions={pausedLiveSessions} globalPlaceholders={userData.globalPlaceholders} />}
      
      {preferences.dashShowNewSeasons && !isApiKeyMissing && (
        <NewSeasons title="New Seasons From Your Lists" onSelectShow={onSelectShow} trackedShows={trackedShowsForNewSeasons} watchProgress={userData.watchProgress} timezone={timezone} globalPlaceholders={userData.globalPlaceholders} />
      )}

      {preferences.dashShowRecommendations && !isApiKeyMissing && recommendationSeedItems.length > 0 && <RelatedRecommendations seedItems={recommendationSeedItems} userData={userData} {...carouselProps} />}
      
      {preferences.dashShowPlanToWatch && (
        <PlanToWatch items={userData.planToWatch} onSelectShow={onSelectShow} onViewMore={() => onShortcutNavigate('library-plan-to-watch')} globalPlaceholders={userData.globalPlaceholders} />
      )}

      {!isApiKeyMissing && <DiscoverContent 
          onSelectShow={onSelectShow} 
          onOpenAddToListModal={onOpenAddToListModal} 
          onMarkShowAsWatched={onMarkShowAsWatched} 
          onToggleFavoriteShow={onToggleFavoriteShow} 
          favorites={favorites} 
          userData={userData} 
          timezone={timezone} 
          onShortcutNavigate={onShortcutNavigate} 
          genres={genres} 
          reminders={reminders} 
          onToggleReminder={onToggleReminder} 
          onUpdateLists={onUpdateLists} 
          preferences={preferences} 
          timeFormat={timeFormat} 
          showRatings={showRatings} 
          onToggleEpisode={onToggleEpisode} 
          onStartLiveWatch={onStartLiveWatch} 
          onToggleFavoriteEpisode={onToggleFavoriteEpisode}
          onRateEpisode={onRateEpisode}
          onSaveJournal={onSaveJournal}
          onAddWatchHistory={onAddWatchHistory}
          pausedLiveSessions={pausedLiveSessions}
          onToggleWeeklyFavorite={onToggleWeeklyFavorite}
      />}
      
      {!isApiKeyMissing && (
        <section className="px-6">
            <SectionHeader title="Registry Discoveries" icon={<SparklesIcon className="w-8 h-8 text-yellow-400" />} />
            <MyListSuggestions userData={userData} onSelectShow={onSelectShow} onOpenAddToListModal={onOpenAddToListModal} />
        </section>
      )}
      {isApiKeyMissing && <ApiKeyWarning />}
    </div>
  );
};

export default Dashboard;