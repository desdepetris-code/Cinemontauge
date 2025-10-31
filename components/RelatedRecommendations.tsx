import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HistoryItem, TmdbMedia, UserData, TrackedItem } from '../types';
import { getMediaDetails } from '../services/tmdbService';
import GenericCarousel from './GenericCarousel';

interface RelatedRecommendationsProps {
  seedItem: HistoryItem;
  userData: UserData;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onOpenAddToListModal: (item: TmdbMedia | TrackedItem) => void;
  onMarkShowAsWatched: (item: TmdbMedia, date?: string) => void;
  onToggleFavoriteShow: (item: TrackedItem) => void;
  favorites: TrackedItem[];
  completed: TrackedItem[];
}

const RelatedRecommendations: React.FC<RelatedRecommendationsProps> = (props) => {
  const { seedItem, userData, ...carouselProps } = props;
  const [recommendations, setRecommendations] = useState<TmdbMedia[]>([]);
  const [loading, setLoading] = useState(true);

  const allUserMediaIds = useMemo(() => {
    const ids = new Set<number>();
    userData.watching.forEach(i => ids.add(i.id));
    userData.planToWatch.forEach(i => ids.add(i.id));
    userData.completed.forEach(i => ids.add(i.id));
    return ids;
  }, [userData]);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      try {
        const details = await getMediaDetails(seedItem.id, seedItem.media_type);
        if (details.recommendations && details.recommendations.results) {
          const filteredRecs = details.recommendations.results.filter(
            rec => !allUserMediaIds.has(rec.id) && rec.poster_path && rec.backdrop_path
          );
          setRecommendations(filteredRecs);
        }
      } catch (error) {
        console.error(`Failed to fetch recommendations for ${seedItem.title}`, error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, [seedItem, allUserMediaIds]);

  const fetcher = useCallback(() => Promise.resolve(recommendations), [recommendations]);

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <GenericCarousel
      title={`Because You Watched ${seedItem.title}`}
      fetcher={fetcher}
      recommendationReason={`Based on ${seedItem.title}`}
      {...carouselProps}
    />
  );
};

export default RelatedRecommendations;