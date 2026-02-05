import React, { useState, useEffect, useMemo } from 'react';
import { getNewlyPopularEpisodes, getMediaDetails, getSeasonDetails } from '../services/tmdbService';
import { NewlyPopularEpisode, TmdbMediaDetails, TmdbSeasonDetails, UserData, AppPreferences, TrackedItem, LiveWatchMediaInfo, JournalEntry, HistoryItem, Note, WatchStatus, WeeklyPick } from '../types';
import Carousel from './Carousel';
import EpisodeCard from './EpisodeCard';
import EpisodeDetailModal from './EpisodeDetailModal';

interface NewlyPopularEpisodesProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  userData: UserData;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number, showInfo: TrackedItem, episodeName?: string) => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  preferences: AppPreferences;
  onToggleFavoriteEpisode: (showId: number, seasonNumber: number, episodeNumber: number) => void;
  onRateEpisode: (showId: number, seasonNumber: number, episodeNumber: number, rating: number) => void;
  onSaveJournal: (showId: number, season: number, episode: number, entry: JournalEntry | null) => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  onUpdateLists: (item: TrackedItem, oldList: WatchStatus | null, newList: WatchStatus | null) => void;
  pausedLiveSessions: Record<number, { mediaInfo: LiveWatchMediaInfo; elapsedSeconds: number; pausedAt: string }>;
  // --- PICK PROPS ---
  onToggleWeeklyFavorite: (item: WeeklyPick, replacementId?: number) => void;
}

const NewlyPopularEpisodes: React.FC<NewlyPopularEpisodesProps> = ({ 
    onSelectShow, 
    userData, 
    onToggleEpisode, 
    onStartLiveWatch, 
    preferences,
    onToggleFavoriteEpisode,
    onRateEpisode,
    onSaveJournal,
    onAddWatchHistory,
    onUpdateLists,
    pausedLiveSessions,
    onToggleWeeklyFavorite
}) => {
    const [episodes, setEpisodes] = useState<NewlyPopularEpisode[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [selectedItem, setSelectedItem] = useState<NewlyPopularEpisode | null>(null);
    const [extraDetails, setExtraDetails] = useState<{ show: TmdbMediaDetails; season: TmdbSeasonDetails } | null>(null);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    useEffect(() => {
        const fetchEpisodes = async () => {
            setLoading(true);
            try {
                const results = await getNewlyPopularEpisodes();
                setEpisodes(results);
            } catch (error) {
                console.error("Failed to fetch newly popular episodes", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEpisodes();
    }, []);

    const handleOpenDetail = async (item: NewlyPopularEpisode) => {
        setSelectedItem(item);
        setIsFetchingDetails(true);
        try {
            const [show, season] = await Promise.all([
                getMediaDetails(item.showInfo.id, 'tv'),
                getSeasonDetails(item.showInfo.id, item.episode.season_number)
            ]);
            setExtraDetails({ show, season });
        } catch (error) {
            console.error("Failed to fetch episode popup details", error);
            setSelectedItem(null);
        } finally {
            setIsFetchingDetails(false);
        }
    };

    const handleCloseDetail = () => {
        setSelectedItem(null);
        setExtraDetails(null);
    };

    const handleToggleWatchedInModal = () => {
        if (!selectedItem) return;
        const currentProgress = userData.watchProgress[selectedItem.showInfo.id]?.[selectedItem.episode.season_number]?.[selectedItem.episode.episode_number];
        const currentStatus = currentProgress?.status || 0;
        
        onToggleEpisode(
            selectedItem.showInfo.id, 
            selectedItem.episode.season_number, 
            selectedItem.episode.episode_number, 
            currentStatus, 
            selectedItem.showInfo as TrackedItem, 
            selectedItem.episode.name
        );
    };

    const currentShowStatus = useMemo(() => {
        if (!selectedItem) return null;
        const id = selectedItem.showInfo.id;
        if (userData.watching.some(i => i.id === id)) return 'watching';
        if (userData.planToWatch.some(i => i.id === id)) return 'planToWatch';
        if (userData.onHold.some(i => i.id === id)) return 'onHold';
        if (userData.dropped.some(i => i.id === id)) return 'dropped';
        if (userData.completed.some(i => i.id === id)) return 'completed';
        if (userData.allCaughtUp.some(i => i.id === id)) return 'allCaughtUp';
        return null;
    }, [selectedItem, userData]);

    const handleUpdateShowStatus = (newStatus: WatchStatus | null) => {
        if (!selectedItem) return;
        const item: TrackedItem = {
            id: selectedItem.showInfo.id,
            title: selectedItem.showInfo.title,
            media_type: 'tv',
            poster_path: selectedItem.showInfo.poster_path,
        };
        onUpdateLists(item, currentShowStatus, newStatus);
    };

    if (loading) {
        return (
             <div className="my-8">
                <div className="h-8 w-3/4 bg-bg-secondary rounded-md mb-4 px-6"></div>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 animate-pulse space-x-4 hide-scrollbar">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-64 flex-shrink-0">
                             <div className="aspect-video bg-bg-secondary rounded-lg"></div>
                             <div className="h-4 bg-bg-secondary rounded-md mt-2 w-3/4"></div>
                             <div className="h-3 bg-bg-secondary rounded-md mt-1 w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (episodes.length === 0) {
        return null;
    }

    const isWatched = selectedItem ? userData.watchProgress[selectedItem.showInfo.id]?.[selectedItem.episode.season_number]?.[selectedItem.episode.episode_number]?.status === 2 : false;
    const isFavorited = selectedItem ? !!userData.favoriteEpisodes[selectedItem.showInfo.id]?.[selectedItem.episode.season_number]?.[selectedItem.episode.episode_number] : false;
    const episodeRating = selectedItem ? (userData.episodeRatings[selectedItem.showInfo.id]?.[selectedItem.episode.season_number]?.[selectedItem.episode.episode_number] || 0) : 0;
    const pausedSession = selectedItem ? pausedLiveSessions[selectedItem.showInfo.id] : undefined;

    return (
        <div className="my-8">
            <div className="mb-4 px-6">
                <h2 className="text-2xl font-bold text-text-primary">📺 Newly Popular Episodes</h2>
            </div>
            <Carousel>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4 hide-scrollbar">
                    {episodes.map(item => (
                        <EpisodeCard 
                            key={`${item.showInfo.id}-${item.episode.id}`}
                            item={item}
                            onSelectShow={onSelectShow}
                            onOpenDetail={handleOpenDetail}
                        />
                    ))}
                    <div className="w-4 flex-shrink-0"></div>
                </div>
            </Carousel>

            {/* Episode Pop-Up Modal */}
            {selectedItem && extraDetails && (
                <EpisodeDetailModal 
                    isOpen={!!selectedItem}
                    onClose={handleCloseDetail}
                    episode={selectedItem.episode}
                    showDetails={extraDetails.show}
                    seasonDetails={extraDetails.season}
                    isWatched={isWatched}
                    onToggleWatched={handleToggleWatchedInModal}
                    onOpenJournal={() => {}} 
                    isFavorited={isFavorited}
                    onToggleFavorite={() => onToggleFavoriteEpisode(selectedItem.showInfo.id, selectedItem.episode.season_number, selectedItem.episode.episode_number)}
                    onStartLiveWatch={onStartLiveWatch}
                    onSaveJournal={onSaveJournal}
                    watchProgress={userData.watchProgress}
                    history={userData.history}
                    onAddWatchHistory={onAddWatchHistory}
                    onRate={() => {}} 
                    episodeRating={episodeRating}
                    onDiscuss={() => {}}
                    preferences={preferences}
                    timezone={userData.timezone}
                    showRatings={true}
                    currentShowStatus={currentShowStatus}
                    onUpdateShowStatus={handleUpdateShowStatus}
                    onViewFullShow={() => {
                        onSelectShow(selectedItem.showInfo.id, 'tv');
                        handleCloseDetail();
                    }}
                    pausedSession={pausedSession}
                    weeklyFavorites={userData.weeklyFavorites}
                    onToggleWeeklyFavorite={onToggleWeeklyFavorite}
                />
            )}
            
            {isFetchingDetails && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[210] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-primary-accent border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-black uppercase tracking-widest text-white animate-pulse">Syncing Episode Archive...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewlyPopularEpisodes;