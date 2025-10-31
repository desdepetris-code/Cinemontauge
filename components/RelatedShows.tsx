import React, { useState, useEffect } from 'react';
import { getTvdbRelatedShows } from '../services/tvdbService';
import { findByTvdbId } from '../services/tmdbService';
import { TmdbMedia } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { PLACEHOLDER_POSTER } from '../constants';

interface RelatedShow {
    tmdbMedia: TmdbMedia;
    relationship: string;
}

interface RelatedShowsProps {
    tvdbId: number;
    onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
}

const RelatedShowCard: React.FC<{ item: RelatedShow; onSelect: () => void }> = ({ item, onSelect }) => {
    return (
        <div onClick={onSelect} className="w-32 flex-shrink-0 cursor-pointer group">
            <div className="relative rounded-lg overflow-hidden shadow-md">
                <img src={getImageUrl(item.tmdbMedia.poster_path, 'w154')} alt={item.tmdbMedia.name} className="w-full aspect-[2/3] object-cover bg-bg-secondary"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                <span className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 bg-backdrop rounded-full backdrop-blur-sm text-text-primary">{item.relationship}</span>
            </div>
            <p className="text-xs font-semibold text-text-primary mt-1 truncate group-hover:underline">{item.tmdbMedia.name}</p>
        </div>
    );
};

const RelatedShows: React.FC<RelatedShowsProps> = ({ tvdbId, onSelectShow }) => {
    const [relatedShows, setRelatedShows] = useState<RelatedShow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelated = async () => {
            setLoading(true);
            try {
                const tvdbRelations = await getTvdbRelatedShows(tvdbId);
                const enrichedRelations: RelatedShow[] = [];

                for (const relation of tvdbRelations) {
                    if (!relation.id) continue;
                    const tmdbResult = await findByTvdbId(relation.id);
                    const tmdbShow = tmdbResult.tv_results[0];
                    if (tmdbShow && tmdbShow.poster_path) {
                        enrichedRelations.push({
                            tmdbMedia: tmdbShow,
                            relationship: relation.typeName,
                        });
                    }
                }
                setRelatedShows(enrichedRelations);
            } catch (error) {
                console.error("Failed to fetch related shows:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRelated();
    }, [tvdbId]);
    
    if (loading) {
        return (
             <div className="mt-8 animate-pulse">
                <div className="h-6 w-1/3 bg-bg-secondary rounded mb-4"></div>
                <div className="flex space-x-4">
                    <div className="w-32 h-48 bg-bg-secondary rounded-lg flex-shrink-0"></div>
                    <div className="w-32 h-48 bg-bg-secondary rounded-lg flex-shrink-0"></div>
                    <div className="w-32 h-48 bg-bg-secondary rounded-lg flex-shrink-0"></div>
                </div>
            </div>
        )
    }

    if (relatedShows.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold text-text-primary mb-4">Related Shows</h3>
            <div className="flex overflow-x-auto space-x-4 pb-2 -mx-2 px-2 hide-scrollbar">
                {relatedShows.map(show => (
                    <RelatedShowCard key={show.tmdbMedia.id} item={show} onSelect={() => onSelectShow(show.tmdbMedia.id, 'tv')} />
                ))}
            </div>
        </div>
    );
};

export default RelatedShows;
