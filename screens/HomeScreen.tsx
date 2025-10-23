import React, { useState, useMemo } from 'react';
import { UserData, WatchStatus, TrackedItem, WatchProgress, TmdbMedia } from '../types';
import ShowCard from '../components/ShowCard';
import GenreFilter from '../components/GenreFilter';
import StatusFilter from '../components/StatusFilter';
import ContinueWatchingProgressCard from '../components/ContinueWatchingProgressCard';
import TopShortcuts from '../components/DashboardIcons';
import NewReleases from '../components/NewReleases';
import NewSeasons from '../components/NewSeasons';
import TrendingPopular from '../components/TrendingPopular';

interface HomeScreenProps {
  userData: UserData;
  genres: Record<number, string>;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  watchProgress: WatchProgress;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onShowHistory: () => void;
  onShowProfile: () => void;
  onShowAchievements: () => void;
  onAddItemToList: (item: TmdbMedia, list: WatchStatus) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ userData, genres, onSelectShow, watchProgress, onToggleEpisode, onShowHistory, onShowProfile, onShowAchievements, onAddItemToList }) => {
  const { watching, planToWatch, completed, favorites } = userData;
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<WatchStatus | null>(null);

  const allItems = useMemo(() => {
    const all = [...watching, ...planToWatch, ...completed];
    const uniqueItems = new Map<number, TrackedItem>();
    all.forEach(item => {
      if (!uniqueItems.has(item.id)) {
        uniqueItems.set(item.id, item);
      }
    });
    return Array.from(uniqueItems.values());
  }, [watching, planToWatch, completed]);

  const filteredItems = useMemo(() => {
    let itemsToFilter = allItems;

    if (selectedStatus) {
      const statusToListMap = {
        watching: watching,
        planToWatch: planToWatch,
        completed: completed,
        favorites: favorites,
      };
      const listForStatus = statusToListMap[selectedStatus];
      const idsInList = new Set(listForStatus.map(item => item.id));
      itemsToFilter = allItems.filter(item => idsInList.has(item.id));
    }

    if (selectedGenreId) {
      return itemsToFilter.filter(item => item.genre_ids?.includes(selectedGenreId));
    }

    return itemsToFilter;
  }, [allItems, selectedGenreId, selectedStatus, watching, planToWatch, completed, favorites]);
  
  const continueWatchingItems = useMemo(() => {
    return userData.watching.filter(item => item.media_type === 'tv');
  }, [userData.watching]);

  return (
    <div className="animate-fade-in">
       <TopShortcuts 
        onShowHistory={onShowHistory}
        onShowProgress={onShowProfile}
        onShowWatchlist={onShowProfile}
        onShowFavorites={onShowProfile}
        onShowBadges={onShowAchievements}
      />

      {continueWatchingItems.length > 0 && !selectedStatus && !selectedGenreId && (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary px-6 mb-2">Continue Watching</h2>
            <div className="flex overflow-x-auto py-2 -mx-2 px-6">
                {(continueWatchingItems || []).map(item => (
                    <div key={item.id} className="w-64 flex-shrink-0 px-2">
                         <ContinueWatchingProgressCard
                            item={item}
                            watchProgress={watchProgress}
                            onSelectShow={onSelectShow}
                            onToggleEpisode={onToggleEpisode}
                        />
                    </div>
                ))}
            </div>
        </div>
      )}

      <NewReleases onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />
      
      <NewSeasons onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />

      <TrendingPopular onSelectShow={onSelectShow} onAddItemToList={onAddItemToList} />

      <h2 className="text-2xl font-bold text-text-primary px-6 mb-2">My Lists</h2>
      <StatusFilter selectedStatus={selectedStatus} onSelectStatus={setSelectedStatus} />
      <GenreFilter genres={genres} selectedGenreId={selectedGenreId} onSelectGenre={setSelectedGenreId} />

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-6">
          {filteredItems.map(item => (
            <ShowCard key={item.id} item={item} onSelect={onSelectShow} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6">
          <h2 className="text-2xl font-bold text-text-primary">No Items Found</h2>
          <p className="mt-4 text-text-secondary max-w-md mx-auto">
            Your lists are empty or no items match the current filters. Try adding a show or movie using the search bar!
          </p>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;