import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import ShowDetail from './screens/ShowDetail';
import BottomTabNavigator, { Tab } from './navigation/BottomTabNavigator';
import { starterShows, starterMovies } from './data/shows';
import { getGenres, getNewSeasons } from './services/tmdbService';
import { TrackedItem, WatchProgress, JournalEntry, HistoryItem, CustomImagePaths, WatchStatus, TmdbMedia, UserData, AppNotification } from './types';
import SearchScreen from './screens/SearchScreen';
import Settings from './screens/Settings';
import Profile from './screens/Profile';
import AchievementsScreen from './screens/AchievementsScreen';
import Recommendations from './screens/Recommendations';
import HistoryScreen from './screens/HistoryScreen';
import ImportsScreen from './screens/ImportsScreen';
import { useTheme } from './hooks/useTheme';
import NotificationsScreen from './screens/NotificationsScreen';


const App: React.FC = () => {
  useTheme(); // Apply theme on app load
  
  // State
  const [watching, setWatching] = useLocalStorage<TrackedItem[]>('watching_list', starterShows);
  const [planToWatch, setPlanToWatch] = useLocalStorage<TrackedItem[]>('plan_to_watch_list', starterMovies);
  const [completed, setCompleted] = useLocalStorage<TrackedItem[]>('completed_list', []);
  const [favorites, setFavorites] = useLocalStorage<TrackedItem[]>('favorites_list', []);
  const [watchProgress, setWatchProgress] = useLocalStorage<WatchProgress>('watch_progress', {});
  const [history, setHistory] = useLocalStorage<HistoryItem[]>('history', []);
  const [customImagePaths, setCustomImagePaths] = useLocalStorage<CustomImagePaths>('custom_image_paths', {});
  const [notifications, setNotifications] = useLocalStorage<AppNotification[]>('notifications', []);
  
  const [activeScreen, setActiveScreen] = useState<'home' | 'detail'>('home');
  const [activeSubScreen, setActiveSubScreen] = useState<'achievements' | 'history' | null>(null);
  const [selectedShow, setSelectedShow] = useState<{ id: number; media_type: 'tv' | 'movie' } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  
  const [genres, setGenres] = useState<Record<number, string>>({});

  useEffect(() => {
    getGenres().then(setGenres);
  }, []);
  
  const userData: UserData = useMemo(() => ({
    watching, planToWatch, completed, favorites, watchProgress, history
  }), [watching, planToWatch, completed, favorites, watchProgress, history]);

    // --- Notification Logic ---
    const addNotification = useCallback((notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
        setNotifications(prev => {
            const twentyFourHoursAgo = new Date().getTime() - (24 * 60 * 60 * 1000);
            const exists = prev.some(n => 
                n.mediaId === notification.mediaId && 
                n.type === notification.type &&
                new Date(n.timestamp).getTime() > twentyFourHoursAgo 
            );
            if (exists) {
                return prev;
            }
            const newNotification: AppNotification = {
                ...notification,
                id: `${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                read: false,
            };
            return [newNotification, ...prev].slice(0, 50); // Keep max 50 notifications
        });
    }, [setNotifications]);

    useEffect(() => {
        const checkForNewSeasons = async () => {
            try {
                const showsWithNewSeasons = await getNewSeasons();
                const watchingIds = new Set(watching.map(item => item.id));

                showsWithNewSeasons.forEach(show => {
                    if (watchingIds.has(show.id)) {
                        const latestSeason = show.seasons
                            ?.filter(s => s.season_number > 0)
                            .sort((a, b) => b.season_number - a.season_number)[0];
                        
                        if (latestSeason) {
                            addNotification({
                                type: 'new_season',
                                mediaId: show.id,
                                mediaType: 'tv',
                                title: show.name || 'Unknown Show',
                                description: `${latestSeason.name} just premiered!`,
                                poster_path: show.poster_path,
                            });
                        }
                    }
                });
            } catch (error) {
                console.error("Failed to check for new season notifications", error);
            }
        };
        checkForNewSeasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watching, addNotification]);
    // --- End Notification Logic ---

  // Handlers
  const handleSelectShow = (id: number, media_type: 'tv' | 'movie') => {
    setSelectedShow({ id, media_type });
    setActiveScreen('detail');
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setSelectedShow(null);
    setActiveScreen('home');
    setActiveSubScreen(null);
  };
  
  const handleShowHistory = () => {
    setActiveSubScreen('history');
    window.scrollTo(0, 0);
  };

  const handleShowProfile = () => {
      setActiveTab('Profile');
      window.scrollTo(0, 0);
  };

  const updateLists = useCallback((item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => {
    const listSetters: Record<WatchStatus, React.Dispatch<React.SetStateAction<TrackedItem[]>>> = {
        watching: setWatching,
        planToWatch: setPlanToWatch,
        completed: setCompleted,
        favorites: setFavorites, // This won't be used for moving, but good for completeness
    };

    // Remove from old list
    if (oldList && listSetters[oldList] && oldList !== 'favorites') {
        listSetters[oldList](prev => prev.filter(i => i.id !== item.id));
    }

    // Add to new list
    if (newList && listSetters[newList] && newList !== 'favorites') {
        listSetters[newList](prev => [item, ...prev.filter(i => i.id !== item.id)]);
    }
  }, [setCompleted, setFavorites, setPlanToWatch, setWatching]);


  const handleAddItemToList = useCallback((itemToAdd: TmdbMedia, list: WatchStatus) => {
    const trackedItem: TrackedItem = {
        id: itemToAdd.id,
        title: itemToAdd.title || itemToAdd.name || 'Untitled',
        media_type: itemToAdd.media_type,
        poster_path: itemToAdd.poster_path,
        genre_ids: itemToAdd.genre_ids,
    };
    updateLists(trackedItem, null, list);
  }, [updateLists]);

  const handleToggleEpisode = (showId: number, seasonNumber: number, episodeNumber: number, currentStatus: number) => {
      const newStatus = currentStatus === 2 ? 0 : 2;
      setWatchProgress(prev => {
          const newProgress = { ...prev };
          if (!newProgress[showId]) newProgress[showId] = {};
          if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
          
          const existingEntry = newProgress[showId][seasonNumber][episodeNumber];
          
          newProgress[showId][seasonNumber][episodeNumber] = {
              ...existingEntry,
              status: newStatus as 0 | 1 | 2,
          };
          
          return newProgress;
      });

      // Add to history if marking as watched
      if (newStatus === 2) {
          const allItems = [...watching, ...planToWatch, ...completed, ...favorites];
          const showInfo = allItems.find(item => item.id === showId);
          if (showInfo) {
              const historyEntry: HistoryItem = {
                  id: showId,
                  media_type: showInfo.media_type,
                  title: showInfo.title,
                  poster_path: showInfo.poster_path,
                  timestamp: new Date().toISOString(),
                  seasonNumber: showInfo.media_type === 'tv' ? seasonNumber : undefined,
                  episodeNumber: showInfo.media_type === 'tv' ? episodeNumber : undefined,
              };
              setHistory(prev => [historyEntry, ...prev.filter(h => !(h.id === showId && h.seasonNumber === seasonNumber && h.episodeNumber === episodeNumber))]);
          }
      }
  };

  const handleSaveJournal = (showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry) => {
      setWatchProgress(prev => {
          const newProgress = { ...prev };
          if (!newProgress[showId]) newProgress[showId] = {};
          if (!newProgress[showId][seasonNumber]) newProgress[showId][seasonNumber] = {};
          
          const existingEntry = newProgress[showId][seasonNumber][episodeNumber];
          
          newProgress[showId][seasonNumber][episodeNumber] = {
              status: existingEntry?.status || 0,
              journal: entry,
          };
          return newProgress;
      });
  };
  
  const handleToggleFavorite = (item: TrackedItem) => {
    setFavorites(prev => {
        if (prev.some(fav => fav.id === item.id)) {
            return prev.filter(fav => fav.id !== item.id);
        } else {
            return [item, ...prev];
        }
    });
  };
  
  const handleSetCustomImage = (mediaId: number, type: 'poster' | 'backdrop', path: string) => {
      setCustomImagePaths(prev => ({
          ...prev,
          [mediaId]: {
              ...prev[mediaId],
              [`${type}_path`]: path,
          }
      }));
  };
  
  const handleMarkNotificationRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };


  const renderContent = () => {
    if (activeScreen === 'detail' && selectedShow) {
      return (
        <ShowDetail
          id={selectedShow.id}
          mediaType={selectedShow.media_type}
          onBack={handleBack}
          onSelectShow={handleSelectShow}
          watchProgress={watchProgress}
          onToggleEpisode={handleToggleEpisode}
          onSaveJournal={handleSaveJournal}
          trackedLists={{ watching, planToWatch, completed }}
          onUpdateLists={updateLists}
          customImagePaths={customImagePaths}
          onSetCustomImage={handleSetCustomImage}
          favorites={favorites}
          onToggleFavoriteShow={handleToggleFavorite}
        />
      );
    }
    
    if (activeSubScreen === 'achievements') {
        return <AchievementsScreen userData={userData} onBack={handleBack} />
    }

    if (activeSubScreen === 'history') {
        return <HistoryScreen history={history} onSelectShow={handleSelectShow} onBack={handleBack} />
    }

    switch (activeTab) {
      case 'Home':
        return (
          <HomeScreen
            userData={userData}
            genres={genres}
            onSelectShow={handleSelectShow}
            watchProgress={watchProgress}
            onToggleEpisode={handleToggleEpisode}
            onShowHistory={handleShowHistory}
            onShowProfile={handleShowProfile}
            onShowAchievements={() => setActiveSubScreen('achievements')}
            onAddItemToList={handleAddItemToList}
          />
        );
      case 'Search':
          return <SearchScreen onSelectShow={handleSelectShow} genres={genres} />
      case 'Discover':
          return <Recommendations 
                    genres={genres}
                    onAdd={(item: TmdbMedia) => handleAddItemToList(item, 'planToWatch')}
                    onSelectShow={handleSelectShow}
                 />
      case 'Notifications':
        return <NotificationsScreen
                  notifications={notifications}
                  onMarkAllRead={handleMarkAllNotificationsRead}
                  onMarkOneRead={handleMarkNotificationRead}
                  onSelectShow={handleSelectShow}
                />
      case 'Profile':
          return <Profile 
                    userData={userData} 
                    onSelectShow={handleSelectShow}
                    genres={genres}
                 />
      default:
        return null;
    }
  };
  
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <div className="bg-bg-primary min-h-screen text-text-primary pb-16">
      <Header onSelectShow={handleSelectShow} />
      <main className="py-6">
        <div className="container mx-auto">
          {renderContent()}
        </div>
      </main>
      <BottomTabNavigator activeTab={activeTab} setActiveTab={setActiveTab} unreadCount={unreadCount} />
    </div>
  );
};

export default App;