


import React, { useMemo } from 'react';
import { TmdbMediaDetails, TmdbSeasonDetails, Episode, WatchProgress } from '../types';
import { ChevronDownIcon, CheckCircleIcon, BookOpenIcon } from './Icons';
import { getImageUrl } from '../utils/imageUtils';
import { PLACEHOLDER_STILL, TMDB_IMAGE_BASE_URL } from '../constants';
import FallbackImage from './FallbackImage';

interface SeasonAccordionProps {
  season: TmdbMediaDetails['seasons'][0];
  showId: number;
  isExpanded: boolean;
  onToggle: () => void;
  seasonDetails: TmdbSeasonDetails | undefined;
  watchProgress: WatchProgress;
  onToggleEpisode: (showId: number, season: number, episode: number, currentStatus: number) => void;
  onOpenJournal: (season: number, episode: Episode) => void;
  showPosterPath: string | null | undefined;
  tvdbShowPosterPath: string | null | undefined;
}

const getFullImageUrl = (path: string | null | undefined, size: string) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // for TVDB images
    return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
};

const SeasonAccordion: React.FC<SeasonAccordionProps> = ({
  season,
  showId,
  isExpanded,
  onToggle,
  seasonDetails,
  watchProgress,
  onToggleEpisode,
  onOpenJournal,
  showPosterPath,
  tvdbShowPosterPath,
}) => {
  const seasonProgressPercent = useMemo(() => {
    const episodes = seasonDetails?.episodes || [];
    if (episodes.length === 0) return 0;
    
    const watchedCount = episodes.filter(ep => 
      watchProgress[showId]?.[season.season_number]?.[ep.episode_number]?.status === 2
    ).length;
    
    return (watchedCount / episodes.length) * 100;
  }, [seasonDetails, watchProgress, showId, season.season_number]);

  return (
    <div id={`season-${season.season_number}`} className="bg-card-gradient rounded-lg shadow-md overflow-hidden">
      <div className="flex items-center p-4 cursor-pointer" onClick={onToggle}>
        <div className="flex-grow">
          <h3 className="font-bold text-lg text-text-primary">{season.name}</h3>
          <p className="text-sm text-text-secondary">{season.episode_count} Episodes</p>
        </div>
        <div className="w-1/3 mx-4">
            <div className="w-full bg-bg-secondary rounded-full h-1.5">
                <div className="bg-accent-gradient h-1.5 rounded-full" style={{ width: `${seasonProgressPercent}%` }}></div>
            </div>
        </div>
        <ChevronDownIcon className={`h-6 w-6 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <div className="border-t border-bg-secondary">
          {!seasonDetails ? (
            <div className="p-4 text-center text-text-secondary">Loading episodes...</div>
          ) : (
            <ul className="divide-y divide-bg-secondary">
              {(seasonDetails?.episodes || []).map(ep => {
                const epProgress = watchProgress[showId]?.[season.season_number]?.[ep.episode_number];
                const isWatched = epProgress?.status === 2;
                
                const stillSrcs = [
                    getFullImageUrl(ep.still_path, 'w300'),
                    getFullImageUrl(season.poster_path, 'w342'),
                    getFullImageUrl(showPosterPath, 'w342'),
                    getFullImageUrl(tvdbShowPosterPath, 'original'),
                ];
                
                return (
                  <li key={ep.id} className="p-4 flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <FallbackImage 
                        srcs={stillSrcs}
                        placeholder={PLACEHOLDER_STILL}
                        alt={ep.name} 
                        className="w-full sm:w-40 h-auto sm:h-24 object-cover rounded-md flex-shrink-0" 
                        loading="lazy" 
                    />
                    <div className="flex-grow">
                      <h4 className="font-semibold text-text-primary">{ep.episode_number}. {ep.name}</h4>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-2">{ep.overview}</p>
                    </div>
                    <div className="flex items-center space-x-2 flex-shrink-0 self-start sm:self-center">
                      <button
                        onClick={() => onOpenJournal(season.season_number, ep)}
                        className={`p-2 rounded-full transition-colors ${epProgress?.journal ? 'text-primary-accent' : 'text-text-secondary'} hover:bg-bg-secondary`}
                        aria-label="Add or view journal entry"
                      >
                        <BookOpenIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => onToggleEpisode(showId, season.season_number, ep.episode_number, epProgress?.status || 0)}
                        className={`p-2 rounded-full transition-colors ${isWatched ? 'text-green-500' : 'text-text-secondary'} hover:bg-bg-secondary`}
                        aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                      >
                        <CheckCircleIcon className="h-6 w-6" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SeasonAccordion;