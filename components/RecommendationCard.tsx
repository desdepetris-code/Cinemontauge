import React, { useState, useEffect } from 'react';
import { searchMedia } from '../services/tmdbService';
import { TmdbMedia, RecommendedMovie } from '../types';
import MediaCard from './MediaCard';

interface RecommendationCardProps {
  movie: RecommendedMovie;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ movie, onSelectShow }) => {
  const [mediaDetails, setMediaDetails] = useState<TmdbMedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const results = await searchMedia(`${movie.title} ${movie.year}`);
        const bestMatch = results.find(
          (result) =>
            result.media_type === 'movie' &&
            (result.release_date?.substring(0, 4) === String(movie.year))
        );
        setMediaDetails(bestMatch || results[0] || null);
      } catch (error) {
        console.error("Failed to fetch recommendation details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [movie]);

  if (loading) {
    return (
        <div className="rounded-lg overflow-hidden shadow-lg animate-pulse">
            <div className="w-full aspect-[2/3] bg-bg-secondary"></div>
        </div>
    );
  }

  if (!mediaDetails) {
    return null; // Don't render if we can't find a match
  }

  return <MediaCard item={mediaDetails} onSelect={onSelectShow} />;
};

export default RecommendationCard;
