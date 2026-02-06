import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, WatchProgress, JournalEntry, TrackedItem, EpisodeProgress, HistoryItem, AppPreferences, Note, LiveWatchMediaInfo, WatchStatus, WeeklyPick } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';
import { CheckCircleIcon, BookOpenIcon, StarIcon, PlayCircleIcon, XMarkIcon, HeartIcon, ChatBubbleLeftRightIcon, EyeIcon, ClockIcon, CalendarIcon, ChevronDownIcon, ChevronRightIcon, TrophyIcon, ShareIcon, ArrowPathIcon, ListBulletIcon } from './Icons';
import { formatRuntime, formatTimeFromDate } from '../utils/formatUtils';
import NominationModal from './NominationModal';
import { confirmationService } from '../services/confirmationService';

interface EpisodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  episode: Episode | null;
  showDetails: TmdbMediaDetails;
  seasonDetails: TmdbSeasonDetails;
  isWatched: boolean;
  onToggleWatched: () => void;
  onOpenJournal: () => void;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onStartLiveWatch: (mediaInfo: LiveWatchMediaInfo) => void;
  onSaveJournal: (showId: number, seasonNumber: number, episodeNumber: number, entry: JournalEntry) => void;
  watchProgress: WatchProgress;
  history: HistoryItem[];
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  onRate: () => void;
  episodeRating: number;
  onDiscuss: () => void;
  showRatings: boolean;
  preferences: AppPreferences;
  timezone: string;
  currentShowStatus: WatchStatus | null;
  onUpdateShowStatus: (status: WatchStatus | null) => void;
  onViewFullShow: () => void;
  pausedSession?: { elapsedSeconds: number };
  weeklyFavorites: WeeklyPick[];
  onToggleWeeklyFavorite: (item: WeeklyPick, replacementId?: number) => void;
}

const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = ({
  isOpen, onClose, episode, showDetails, seasonDetails, isWatched, onToggleWatched, onOpenJournal, isFavorited, onToggleFavorite, onStartLiveWatch, watchProgress, history, onRate, episodeRating, onDiscuss, preferences, timezone, currentShowStatus, onUpdateShowStatus, onViewFullShow, pausedSession, weeklyFavorites, onToggleWeeklyFavorite, onAddWatchHistory
}) => {
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);
  const [revealSpoiler, setRevealSpoiler] = useState(false);
  const [isNominationModalOpen, setIsNominationModalOpen] = useState(false);
  
  // Swipe logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    const isSwipeDown = distance > 150;
    if (isSwipeDown) onClose();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const stats = useMemo(() => {
    if (!episode || !showDetails || !seasonDetails || !seasonDetails.episodes) return null;
    
    const progress = watchProgress[showDetails.id]?.[episode.season_number] || {};
    const airedEpisodes = seasonDetails.episodes.filter(e => e.air_date && e.air_date <= new Date().toISOString().split('T')[0]);
    const watchedInSeason = Object.values(progress).filter(ep => (ep as EpisodeProgress).status === 2).length;
    
    const rewatchCount = history.filter(h => 
      h.id === showDetails.id && 
      h.seasonNumber === episode.season_number && 
      h.episodeNumber === episode.episode_number
    ).length;

    return {
      watchedInSeason,
      totalAired: airedEpisodes.length,
      rewatchCount,
      percent: airedEpisodes.length > 0 ? (watchedInSeason / airedEpisodes.length) * 100 : 0
    };
  }, [episode, showDetails, seasonDetails, watchProgress, history]);

  const isWeeklyPick = useMemo(() => {
    const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    return weeklyFavorites.some(p => 
        p.id === showDetails.id && 
        (p.category === 'tv' || (p.category === 'episode' && p.episodeNumber === episode?.episode_number)) && 
        p.dayIndex === todayIndex
    );
  }, [weeklyFavorites, showDetails.id, episode]);

  if (!isOpen || !episode) return null;

  const today = new Date().toISOString().split('T')[0];
  const isFuture = episode.air_date && episode.air_date > today;
  const showSpoilerOverlay = preferences.enableSpoilerShield && !isWatched && !isFuture && !revealSpoiler;
  const airstampText = episode.airtime ? formatTimeFromDate(episode.airtime, timezone) : null;

  const overview = episode.overview || (showDetails?.overview ? `Background data synced: ${showDetails.overview.slice(0, 100)}...` : "Registry data pending for this episode's plot summary.");
  const isLongOverview = overview.length > 250;
  const displayOverview = isOverviewExpanded ? overview : overview.slice(0, 250) + (isLongOverview ? '...' : '');

  const handleShare = async () => {
    const shareData = {
        title: `${showDetails.name || 'Show'} - ${episode.name}`,
        text: `Check out S${episode.season_number} E${episode.episode_number} of ${showDetails.name || 'Show'} on CineMontauge!`,
        url: window.location.href,
    };
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (err) { console.error('Error sharing:', err); }
    } else {
        try {
            await navigator.clipboard.writeText(window.location.href);
            confirmationService.show("Link copied to clipboard!");
        } catch (err) { console.error('Clipboard failed:', err); }
    }
  };

  const handleRewatch = () => {
    onAddWatchHistory(showDetails as TrackedItem, episode.season_number, episode.episode_number, new Date().toISOString(), "Rewatch session captured", episode.name);
    confirmationService.show("Rewatch logged to your registry!");
  };

  const statusOptions: { id: WatchStatus; label: string }[] = [
    { id: 'watching', label: 'Watching' },
    { id: 'planToWatch', label: 'Plan to Watch' },
    { id: 'onHold', label: 'On Hold' },
    { id: 'dropped', label: 'Dropped' },
  ];

  return (
    <>
    <NominationModal 
        isOpen={isNominationModalOpen} 
        onClose={() => setIsNominationModalOpen(false)} 
        item={showDetails as any} 
        episodeInfo={episode}
        category="tv" 
        onNominate={onToggleWeeklyFavorite} 
        currentPicks={weeklyFavorites} 
    />
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-end md:items-center justify-center z-[200] p-0 md:p-4 animate-fade-in" onClick={onClose}>
        <div 
          ref={modalRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="bg-bg-primary rounded-t-[3rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl h-[92vh] flex flex-col relative overflow-hidden border-x border-t border-white/10 transition-transform duration-300" 
          onClick={e => e.stopPropagation()}
        >
          {/* Swipe Handle */}
          <div className="w-full flex justify-center py-4 flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-white/20 rounded-full"></div>
          </div>
          
          <div className="relative h-64 md:h-72 flex-shrink-0 overflow-hidden">
              <div className={showSpoilerOverlay ? 'blur-2xl brightness-50 scale-110' : ''}>
                <FallbackImage 
                  srcs={[getImageUrl(episode.still_path, 'w1280', 'still'), getImageUrl(showDetails.backdrop_path, 'w1280', 'backdrop')]} 
                  placeholder={PLACEHOLDER_STILL} 
                  alt={episode.name} 
                  className="w-full h-full object-cover transition-all duration-1000" 
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/20 to-transparent"></div>
              
              <button onClick={onClose} className="absolute top-2 left-6 p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-bg-secondary transition-all z-30 border border-white/10 shadow-2xl">
                <XMarkIcon className="w-6 h-6" />
              </button>

              <button 
                onClick={onViewFullShow}
                className="absolute top-2 right-6 px-5 py-2 bg-primary-accent text-on-accent font-black uppercase text-[10px] tracking-widest rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all z-30 flex items-center gap-2 border border-white/10"
              >
                  Full Archive
                  <ChevronRightIcon className="w-4 h-4" />
              </button>
          </div>

          <div className="flex-grow relative overflow-hidden flex flex-col">
            <div className="overflow-y-auto p-10 pt-4 space-y-8 custom-scrollbar">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-accent">{showDetails.name || 'Syncing...'}</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-text-secondary">S{episode.season_number} E{episode.episode_number}</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black text-text-primary uppercase tracking-tighter leading-none">{episode.name}</h2>
                    
                    {/* SHOW STATUS SELECTOR */}
                    <div className="py-4 border-y border-white/5 space-y-3">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-40 ml-1">Series Registry Status</p>
                        <div className="flex flex-wrap gap-2">
                            {statusOptions.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => onUpdateShowStatus(currentShowStatus === opt.id ? null : opt.id)}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                                        currentShowStatus === opt.id 
                                            ? 'bg-primary-accent text-on-accent border-transparent shadow-lg scale-105' 
                                            : 'bg-bg-secondary/40 text-text-secondary border-white/5 hover:border-white/20'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {stats && (
                        <div className="flex flex-col gap-2 pt-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.2em] text-text-secondary">
                                <span>Season {episode.season_number} Progress</span>
                                <span>{stats.watchedInSeason} / {stats.totalAired} Archived</span>
                            </div>
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                <div 
                                    className="h-full bg-accent-gradient transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                    style={{ width: `${stats.percent}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-primary-accent opacity-60" />
                            <span className="text-[11px] font-black uppercase text-text-primary tracking-widest">
                                {episode.air_date ? new Date(episode.air_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unscheduled'}
                            </span>
                        </div>
                        {airstampText && (
                            <div className="px-4 py-1.5 bg-black text-white border border-white/10 rounded-md flex items-center gap-2 shadow-lg">
                                <ClockIcon className="w-4 h-4 text-white" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{airstampText}</span>
                            </div>
                        )}
                        {episode.runtime && (
                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {formatRuntime(episode.runtime)}
                            </span>
                        )}
                        {stats && stats.rewatchCount > 0 && (
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                Watched {stats.rewatchCount}x
                            </span>
                        )}
                    </div>
                </div>

                {/* ACTION GRID */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <button 
                        onClick={onToggleWatched}
                        disabled={isFuture}
                        className={`flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] transition-all shadow-2xl active:scale-95 disabled:opacity-30 ${isWatched ? 'bg-bg-secondary text-green-400 border-2 border-green-400/50' : 'bg-accent-gradient text-on-accent border-none'}`}
                    >
                        <CheckCircleIcon className="w-6 h-6" />
                        {isWatched ? 'Not Watched' : 'Mark Watched'}
                    </button>
                    
                    <button 
                        onClick={handleRewatch}
                        disabled={!isWatched}
                        className={`flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] transition-all shadow-2xl active:scale-95 disabled:opacity-30 bg-bg-secondary/40 border border-white/5 text-text-primary hover:bg-bg-secondary`}
                    >
                        <ArrowPathIcon className="w-6 h-6" />
                        Rewatch
                    </button>

                    <button 
                        onClick={() => onStartLiveWatch({ 
                            id: showDetails.id, 
                            media_type: 'tv', 
                            title: showDetails.name || '', 
                            poster_path: showDetails.poster_path, 
                            runtime: episode.runtime || 45,
                            seasonNumber: episode.season_number,
                            episodeNumber: episode.episode_number,
                            episodeTitle: episode.name
                        })} 
                        disabled={isFuture}
                        className="flex flex-col items-center justify-center gap-1 py-4 md:py-6 rounded-[2rem] bg-white text-black font-black uppercase transition-all shadow-2xl active:scale-95 disabled:opacity-30"
                    >
                        <div className="flex items-center gap-3">
                            <PlayCircleIcon className="w-6 h-6" />
                            <span className="text-sm tracking-[0.2em]">Playback</span>
                        </div>
                    </button>

                    <button 
                        onClick={() => setIsNominationModalOpen(true)}
                        className={`flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] transition-all shadow-2xl active:scale-95 border ${isWeeklyPick ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-bg-secondary/40 border-white/5 text-text-primary hover:text-yellow-500'}`}
                    >
                        <TrophyIcon className={`w-6 h-6 ${isWeeklyPick ? 'animate-pulse' : ''}`} />
                        Pick
                    </button>

                    <button 
                        onClick={handleShare}
                        className="flex items-center justify-center gap-4 py-6 rounded-[2rem] bg-bg-secondary/40 border border-white/5 text-text-primary font-black uppercase text-sm tracking-[0.2em] hover:bg-bg-secondary transition-all"
                    >
                        <ShareIcon className="w-6 h-6" />
                        Share
                    </button>
                    
                    <button 
                        onClick={onOpenJournal}
                        className="flex items-center justify-center gap-4 py-6 rounded-[2rem] bg-bg-secondary/40 border border-white/5 text-text-primary font-black uppercase text-sm tracking-[0.2em] hover:bg-sky-400/10 hover:text-sky-400 transition-all"
                    >
                        <BookOpenIcon className="w-6 h-6" />
                        Journal
                    </button>
                </div>

                <div className="relative">
                    <div className={showSpoilerOverlay ? 'blur-xl select-none opacity-40 grayscale' : ''}>
                        <div className="p-8 rounded-[2rem] border border-white/5 bg-bg-secondary/20 shadow-inner">
                            <p className="text-text-primary text-lg leading-relaxed font-medium">
                                {displayOverview}
                            </p>
                            {isLongOverview && (
                                <button 
                                  onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                                  className="mt-4 text-xs font-black uppercase text-primary-accent tracking-widest flex items-center gap-2 hover:opacity-80 transition-opacity"
                                >
                                    {isOverviewExpanded ? 'Read Less' : 'Read Full Synopsis'}
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOverviewExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            )}
                        </div>
                    </div>
                    {showSpoilerOverlay && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                            <button onClick={() => setRevealSpoiler(true)} className="px-10 py-5 bg-bg-primary/80 border border-primary-accent/60 rounded-[2rem] flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-text-primary hover:bg-primary-accent hover:text-black transition-all shadow-2xl backdrop-blur-md">
                                <EyeIcon className="w-6 h-6 text-primary-accent" />
                                Reveal Plot Details
                            </button>
                        </div>
                    )}
                </div>

                <button 
                    onClick={onViewFullShow}
                    className="w-full flex items-center justify-between p-8 bg-bg-secondary/40 rounded-[2.5rem] border border-white/5 hover:border-primary-accent/40 transition-all group shadow-xl"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-accent/10 rounded-2xl text-primary-accent">
                            <ListBulletIcon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <span className="text-lg font-black text-text-primary uppercase tracking-tighter block leading-none">Go To Full Show Page</span>
                            <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-1 opacity-60">View all seasons and discussions</span>
                        </div>
                    </div>
                    <ChevronRightIcon className="w-8 h-8 text-text-secondary group-hover:text-primary-accent transition-all group-hover:translate-x-1" />
                </button>
            </div>
          </div>
        </div>
    </div>
    </>
  );
};

export default EpisodeDetailModal;