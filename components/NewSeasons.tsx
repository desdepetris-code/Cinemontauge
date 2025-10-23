
import React, { useState, useEffect } from 'react';
import { getNewSeasons } from '../services/tmdbService';
import { TmdbMedia, TmdbMediaDetails, WatchStatus } from '../types';
import { PlusIcon } from './Icons';
import FallbackImage from './FallbackImage';
import { TMDB_IMAGE_BASE_URL, PLACEHOLDER_POSTER } from '../constants';

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

const NewSeasonCard: React.FC<{
    item: TmdbMediaDetails;
    onSelect: (id: number, media_type: 'tv' | 'movie') => void;
    onAdd: (item: TmdbMedia, list: WatchStatus) => void;
}> = ({ item, onSelect, onAdd }) => {
    
    const posterSrcs = [
        getFullImageUrl(item.poster_path, 'w342'),
    ];

    const latestSeason = item.seasons
        ?.filter(s => s.season_number > 0)
        .sort((a, b) => b.season_number - a.season_number)[0];

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const mediaItem: TmdbMedia = {
            id: item.id,
            name: item.name,
            title: item.title,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            media_type: 'tv',
            genre_ids: item.genres?.map(g => g.id),
        };
        onAdd(mediaItem, 'planToWatch');
    };

    return (
        <div 
            className="w-48 flex-shrink-0 relative rounded-lg overflow-hidden shadow-lg group cursor-pointer"
            onClick={() => onSelect(item.id, item.media_type)}
        >
            <div className="aspect-[2/3]">
                <FallbackImage 
                    srcs={posterSrcs}
                    placeholder={PLACEHOLDER_POSTER}
                    alt={`${item.name} poster`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-2">
                 <h3 className="text-white font-bold text-sm truncate">{item.name}</h3>
                 {latestSeason?.air_date && (
                    <p className="text-xs text-white/80">
                        {latestSeason.name} premiered {new Date(latestSeason.air_date).toLocaleDateString()}
                    </p>
                 )}
            </div>
             <button
                onClick={handleAddClick}
                className="absolute top-2 right-2 p-1.5 bg-backdrop rounded-full text-white opacity-0 group-hover:opacity-100 hover:bg-primary-accent transition-all"
                aria-label={`Add ${item.name} to Plan to Watch`}
            >
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
    );
};


interface NewSeasonsProps {
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  onAddItemToList: (item: TmdbMedia, list: WatchStatus) => void;
}

const NewSeasons: React.FC<NewSeasonsProps> = ({ onSelectShow, onAddItemToList }) => {
    const [newSeasonShows, setNewSeasonShows] = useState<TmdbMediaDetails[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReleases = async () => {
            try {
                const shows = await getNewSeasons();
                setNewSeasonShows(shows.slice(0, 10)); // Limit to 10
            } catch (error) {
                console.error("Failed to fetch new seasons", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReleases();
    }, []);

    if (loading) {
        return (
             <div className="mb-8">
                <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">📺 New Seasons & Premieres</h2>
                <div className="flex overflow-x-auto py-2 -mx-2 px-6 animate-pulse space-x-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-48 h-[270px] flex-shrink-0">
                             <div className="w-full h-full bg-bg-secondary rounded-lg"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (newSeasonShows.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-text-primary px-6 mb-4">📺 New Seasons & Premieres</h2>
            <div className="flex overflow-x-auto py-2 -mx-2 px-6 space-x-4">
                {newSeasonShows.map(item => (
                    <NewSeasonCard 
                        key={item.id}
                        item={item}
                        onSelect={onSelectShow}
                        onAdd={onAddItemToList}
                    />
                ))}
                <div className="w-4 flex-shrink-0"></div>
            </div>
        </div>
    );
};

export default NewSeasons;
