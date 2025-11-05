import React, { useMemo } from 'react';
import { NewlyPopularEpisode } from '../types';
import FallbackImage from './FallbackImage';
import { getImageUrl } from '../utils/imageUtils';
import { PLACEHOLDER_STILL } from '../constants';
import { formatDate } from '../utils/formatUtils';
import { NewReleaseOverlay } from './NewReleaseOverlay';
import { isNewRelease } from '../utils/formatUtils';
import { getEpisodeTag } from '../utils/episodeTagUtils';

interface EpisodeCardProps {
    item: NewlyPopularEpisode;
    onSelectShow: (id: number, media_type: 'tv') => void;
}

const EpisodeCard: React.FC<EpisodeCardProps> = ({ item, onSelectShow }) => {
    const { showInfo, episode, showDetails } = item;

    const stillSrcs = [
        getImageUrl(episode.still_path, 'w500', 'still'),
        getImageUrl(showInfo.poster_path, 'w500', 'poster'),
    ];

    const isNew = isNewRelease(episode.air_date);

    const tag = useMemo(() => {
        if (!showDetails || !showDetails.seasons) return null;
        const season = showDetails.seasons.find(s => s.season_number === episode.season_number);
        // We don't have seasonDetails here, so it will be less accurate for finales, but it's ok.
        return getEpisodeTag(episode, season, showDetails, undefined);
    }, [episode, showDetails]);

    return (
        <div 
            className="w-64 flex-shrink-0 cursor-pointer group"
            onClick={() => onSelectShow(showInfo.id, 'tv')}
        >
            <div className="relative rounded-lg overflow-hidden shadow-lg">
                {isNew && <NewReleaseOverlay />}
                {tag && (
                    <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-full backdrop-blur-sm z-10 ${tag.className}`}>
                        {tag.text}
                    </div>
                )}
                <div className="aspect-video">
                    <FallbackImage
                        srcs={stillSrcs}
                        placeholder={PLACEHOLDER_STILL}
                        alt={`Still from ${episode.name}`}
                        className="w-full h-full object-cover bg-bg-secondary transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
            </div>
            <div className="mt-2">
                <p className="text-xs text-text-secondary">{showInfo.title}</p>
                <h4 className="font-semibold text-sm text-text-primary truncate">
                    S{episode.season_number} E{episode.episode_number}: {episode.name}
                </h4>
                <p className="text-xs text-text-secondary/80">{formatDate(episode.air_date, 'UTC')}</p>
            </div>
        </div>
    );
};

export default EpisodeCard;