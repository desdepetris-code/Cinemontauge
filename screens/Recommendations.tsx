import React, { useState, useEffect, useMemo } from 'react';
import { UserData, TmdbMedia, TrackedItem } from '../types';
import { getAIRecommendations } from '../services/genaiService';
import { SparklesIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';
import BrandedImage from '../components/BrandedImage';

// FIX: Implemented the Recommendations screen to resolve module errors. This component was previously empty.

interface RecommendationsProps {
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
}

const RecommendationCard: React.FC<{
    recommendation: { title: string; year: number; reason: string };
    media: TmdbMedia;
    onSelect: () => void;
}> = ({ recommendation, media, onSelect }) => {
    return (
        <div className="bg-card-gradient rounded-lg shadow-lg overflow-hidden flex flex-col md:flex-row cursor-pointer h-full" onClick={onSelect}>
            <div className="md:w-40 flex-shrink-0">
                <div className="relative aspect-[2/3] md:aspect-auto md:h-full">
                    <BrandedImage title={media.title || media.name || ''}>
                        <img 
                            src={getImageUrl(media.poster_path, 'w342')}
                            alt={media.title || media.name}
                            className="w-full h-full object-cover"
                        />
                    </BrandedImage>
                </div>
            </div>
            <div className="p-4 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-text-primary">{recommendation.title} ({recommendation.year})</h3>
                <p className="text-sm text-text-secondary mt-2 italic">"{recommendation.reason}"</p>
            </div>
        </div>
    )
};

const Recommendations: React.FC<RecommendationsProps> = ({ userData, onSelectShow }) => {
    const [recommendations, setRecommendations] = useState<{ recommendation: any, media: TmdbMedia }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const hasUserData = useMemo(() => 
        userData.history.length > 0 || 
        userData.favorites.length > 0 || 
        Object.keys(userData.ratings).length > 0, 
    [userData]);

    useEffect(() => {
        const fetchRecs = async () => {
            setLoading(true);
            setError(null);
            try {
                const recs = await getAIRecommendations(userData);
                setRecommendations(recs.slice(0, 4));
            } catch (e: any) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchRecs();
    }, [userData]);

    return (
        <div className="animate-fade-in">
             {!hasUserData && (
              <p className="text-text-secondary mb-4">
                  Watch and rate items to get personalized AI recommendations!
              </p>
            )}
            
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
                    {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-bg-secondary rounded-lg"></div>)}
                </div>
            )}
            
            {error && (
                <div className="bg-red-500/20 text-red-300 p-4 rounded-lg text-center">
                    <h3 className="font-bold">Could not load recommendations</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            {!loading && !error && recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map(({ recommendation, media }) => (
                        <RecommendationCard 
                            key={media.id}
                            recommendation={recommendation}
                            media={media}
                            onSelect={() => onSelectShow(media.id, media.media_type)}
                        />
                    ))}
                </div>
            )}
            
            {!loading && !error && recommendations.length === 0 && hasUserData && (
                 <div className="text-center py-10 bg-bg-secondary/30 rounded-lg">
                    <h2 className="text-xl font-bold">Not enough data</h2>
                    <p className="mt-2 text-text-secondary">Watch, rate, or favorite some items to get your first recommendations!</p>
                </div>
            )}
        </div>
    );
};

export default Recommendations;
