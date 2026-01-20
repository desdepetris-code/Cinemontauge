import React, { useState, useEffect } from 'react';
import { TmdbMedia, TrackedItem, UserData, AppPreferences } from '../types';
import { getTopPicksMixed } from '../services/tmdbService';
import ActionCard from '../components/ActionCard';
import { FireIcon } from '../components/Icons';

interface RecommendationsProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
  showRatings: boolean;
  preferences: AppPreferences;
  userData: UserData;
}

const Recommendations: React.FC<RecommendationsProps> = ({ 
    onSelectShow, 
    onOpenAddToListModal, 
    onMarkShowAsWatched, 
    onToggleFavoriteShow, 
    favorites, 
    completed, 
    showRatings, 
    preferences,
    userData 
}) => {
    const [topPicks, setTopPicks] = useState<TmdbMedia[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTopPicks = async () => {
            setLoading(true);
            try {
                const results = await getTopPicksMixed();
                setTopPicks(results);
            } catch (e) {
                console.error("Failed to fetch discovery items", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTopPicks();
    }, []);

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-bg-secondary/40 rounded-3xl animate-pulse"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-8">
                {topPicks.map((item) => (
                    <ActionCard 
                        key={`${item.id}-${item.media_type}`} 
                        item={item} 
                        onSelect={onSelectShow}
                        onOpenAddToListModal={onOpenAddToListModal}
                        onMarkShowAsWatched={onMarkShowAsWatched}
                        onToggleFavoriteShow={onToggleFavoriteShow}
                        isFavorite={favorites.some(f => f.id === item.id)}
                        isCompleted={completed.some(c => c.id === item.id)}
                        showRatings={showRatings}
                        showSeriesInfo={preferences.searchShowSeriesInfo}
                        userRating={userData.ratings[item.id]?.rating || 0}
                    />
                ))}
            </div>
        </div>
    );
};

export default Recommendations;