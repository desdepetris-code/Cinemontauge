
import React, { useState, useEffect, useMemo } from 'react';
import { CalendarItem, Reminder, ReminderType, TmdbMediaDetails } from '../types';
import { BellIcon, CheckCircleIcon } from './Icons';
import { formatDate, formatAirtime } from '../utils/formatUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_POSTER, PLACEHOLDER_STILL, TMDB_IMAGE_BASE_URL } from '../constants';
import ReminderOptionsModal from './ReminderOptionsModal';
import { getMediaDetails } from '../services/tmdbService';

interface CalendarListItemProps {
  item: CalendarItem;
  onSelect: (id: number, media_type: 'tv' | 'movie') => void;
  isReminderSet: boolean;
  onToggleReminder: (type: ReminderType | null) => void;
  isPast: boolean;
  isWatched: boolean;
  onToggleWatched: () => void;
  timezone: string;
}

const CalendarListItem: React.FC<CalendarListItemProps> = ({ item, onSelect, isReminderSet, onToggleReminder, isPast, isWatched, onToggleWatched, timezone }) => {
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null);

  useEffect(() => {
    let isMounted = true;
    getMediaDetails(item.id, item.media_type).then(data => {
        if (isMounted) setDetails(data);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [item.id, item.media_type]);

  const ageRating = useMemo(() => {
    if (!details) return null;
    if (item.media_type === 'tv') {
      const usRating = details.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
      return usRating?.rating || null;
    } else {
      const usRelease = details.release_dates?.results?.find(r => r.iso_3166_1 === 'US');
      const theatrical = usRelease?.release_dates?.find(d => d.certification);
      return theatrical?.certification || null;
    }
  }, [details, item.media_type]);

  const getAgeRatingColor = (rating: string) => {
    const r = rating.toUpperCase();
    if (['G', 'TV-G'].includes(r)) return 'bg-[#FFFFFF] text-black border border-gray-200 shadow-sm';
    if (r === 'TV-Y') return 'bg-[#008000] text-white';
    if (['PG', 'TV-PG'].includes(r) || r.startsWith('TV-Y7')) return 'bg-[#00FFFF] text-black font-black';
    if (r === 'PG-13') return 'bg-[#00008B] text-white';
    if (r === 'TV-14') return 'bg-[#800000] text-white';
    if (r === 'R') return 'bg-[#FF00FF] text-black font-black';
    if (['TV-MA', 'NC-17'].includes(r)) return 'bg-[#000000] text-white border border-white/20 shadow-md';
    return 'bg-stone-500 text-white';
  };

  const { seasonEpisode, episodeName } = useMemo(() => {
    if (item.media_type === 'tv' && item.episodeInfo) {
      const parts = item.episodeInfo.split(': ');
      if (parts.length > 1) {
        return { seasonEpisode: parts[0], episodeName: parts.slice(1).join(': ') };
      }
      return { seasonEpisode: item.episodeInfo, episodeName: null };
    }
    return { seasonEpisode: null, episodeName: null };
  }, [item.media_type, item.episodeInfo]);
  
  const handleReminderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
      if (isReminderSet) {
          onToggleReminder(null);
      } else {
          setIsReminderModalOpen(true);
      }
  };
  
  const handleSelectReminderType = (type: ReminderType) => {
      onToggleReminder(type);
      setIsReminderModalOpen(false);
  };
  
  const handleToggleWatched = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWatched();
  };

  const stripColorClass = useMemo(() => {
    if (isWatched) return 'bg-green-500';
    if (item.media_type === 'movie') {
      return item.isInCollection ? 'bg-purple-500' : 'bg-blue-500';
    }
    return 'bg-red-500';
  }, [item, isWatched]);
  
  const containerBgClass = isWatched ? 'bg-green-500/10' : (isPast ? 'bg-yellow-500/10' : 'bg-card-gradient');

  const imageSrcs = useMemo(() => {
    const getRawImageUrl = (path: string | null | undefined, size: string) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${TMDB_IMAGE_BASE_URL}${size}${path}`;
    };

    return [
      getRawImageUrl(item.still_path, 'w300'),
      getRawImageUrl(item.poster_path, 'w154'),
    ];
  }, [item.still_path, item.poster_path]);

  const formattedDate = formatDate(item.date, timezone, { month: 'long', day: 'numeric' });
  const formattedAirtime = formatAirtime(item.airtime);

  return (
    <>
      <ReminderOptionsModal 
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSelect={handleSelectReminderType}
      />
      <div
        className={`relative group ${containerBgClass} rounded-lg shadow-md transition-colors hover:bg-bg-secondary/50 cursor-pointer`}
        onClick={() => onSelect(item.id, item.media_type)}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-2 ${stripColorClass} rounded-l-lg`}></div>
        
        <div className="flex items-center space-x-2 p-2 pl-4">
             {!isPast && (
                <button
                    onClick={handleReminderClick}
                    className={`p-2 rounded-full transition-colors ${isReminderSet ? 'text-primary-accent bg-primary-accent/10' : 'text-text-secondary/50 hover:bg-bg-secondary'}`}
                    aria-label={isReminderSet ? "Remove reminder" : "Add reminder"}
                >
                    <BellIcon filled={isReminderSet} className="w-5 h-5"/>
                </button>
            )}
            {item.media_type === 'tv' && isPast && (
                <button 
                    onClick={handleToggleWatched}
                    className={`p-2 rounded-full transition-colors ${isWatched ? 'text-green-400 bg-green-500/10' : 'text-text-secondary/50 hover:bg-bg-secondary'}`}
                    aria-label={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
                >
                    <CheckCircleIcon className="w-5 h-5" />
                </button>
            )}
        </div>

        <div className="flex items-start p-3 pl-5 pt-0 space-x-3">
            <div className="relative flex-shrink-0">
                <FallbackImage
                    srcs={imageSrcs}
                    placeholder={item.media_type === 'tv' ? PLACEHOLDER_STILL : PLACEHOLDER_POSTER}
                    alt={item.title}
                    className="w-32 h-20 object-cover rounded-md bg-bg-secondary"
                />
                {ageRating && (
                    <div className={`absolute top-1 right-1 px-1 py-0.5 text-[8px] font-black rounded uppercase shadow-md z-10 border border-white/10 ${getAgeRatingColor(ageRating)}`}>
                        {ageRating}
                    </div>
                )}
            </div>
            <div className="flex-grow min-w-0">
                <h3 className="font-bold text-text-primary truncate pr-10">{item.title}</h3>
                {item.media_type === 'tv' ? (
                  <>
                      <p className="text-sm text-text-secondary truncate">{seasonEpisode}</p>
                      {episodeName && <p className="text-sm font-semibold text-text-primary truncate">{episodeName}</p>}
                  </>
                ) : (
                  <p className="text-sm font-semibold text-text-primary">{item.episodeInfo}</p>
                )}
                <div className="text-xs text-text-secondary/80 mt-1">
                    <span>{formattedDate}</span>
                    {formattedAirtime && <span> &bull; {formattedAirtime}</span>}
                    {item.network && <span> &bull; {item.network}</span>}
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default CalendarListItem;
