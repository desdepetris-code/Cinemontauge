import React, { useState, useMemo } from 'react';
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, WatchProgress, JournalEntry, TrackedItem, EpisodeTag, Comment, CastMember, CrewMember, AppPreferences, Note } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';
// Added PlusIcon and InformationCircleIcon to imports
import { CheckCircleIcon, BookOpenIcon, StarIcon, ChevronLeftIcon, PlayCircleIcon, ChevronRightIcon, XMarkIcon, HeartIcon, ChatBubbleLeftRightIcon, PencilSquareIcon, EyeIcon, ClockIcon, GlobeAltIcon, ChevronDownIcon, PlusIcon, InformationCircleIcon } from './Icons';
import { LiveWatchMediaInfo } from '../types';
import { formatRuntime, isNewRelease, formatTimeFromDate } from '../utils/formatUtils';
import { getEpisodeTag } from '../utils/episodeTagUtils';
import MarkAsWatchedModal from './MarkAsWatchedModal';
import ScoreStar from './ScoreStar';
import { allTimezones } from '../data/timezones';

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
  onNext: () => void;
  onPrevious: () => void;
  onAddWatchHistory: (item: TrackedItem, seasonNumber: number, episodeNumber: number, timestamp?: string, note?: string, episodeName?: string) => void;
  onRate: () => void;
  episodeRating: number;
  onDiscuss: () => void;
  episodeNotes?: Record<number, Record<number, Record<number, Note[]>>>;
  showRatings: boolean;
  preferences: AppPreferences;
  timezone: string;
}

const CrewList: React.FC<{ crew: CrewMember[] }> = ({ crew }) => {
    if (!crew || crew.length === 0) return null;
    return (
        <div>
            <h4 className="font-semibold text-text-primary mt-4 mb-2">Crew</h4>
            <ul className="text-sm text-text-secondary space-y-1">
                {crew.map(member => <li key={member.id}>{member.name} <span className="text-text-secondary/70">({member.job})</span></li>)}
            </ul>
        </div>
    );
};

const GuestStarsList: React.FC<{ stars: CastMember[] }> = ({ stars }) => {
    if (!stars || stars.length === 0) return null;
    return (
        <div>
            <h4 className="font-semibold text-text-primary mt-4 mb-2">Guest Stars</h4>
            <ul className="text-sm text-text-secondary space-y-1">
                {stars.map(star => <li key={star.id}>{star.name} <span className="text-text-secondary/70">as {star.character}</span></li>)}
            </ul>
        </div>
    );
};

const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = ({
  isOpen, onClose, episode, showDetails, seasonDetails, isWatched, onToggleWatched, onOpenJournal, isFavorited, onToggleFavorite, onStartLiveWatch, onSaveJournal, watchProgress, onNext, onPrevious, onAddWatchHistory, onRate, episodeRating, onDiscuss, episodeNotes = {}, showRatings, preferences, timezone
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'timezones'>('details');
  const [isRequestingTimezone, setIsRequestingTimezone] = useState(false);
  const [requestedTimezone, setRequestedTimezone] = useState('');
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isLogWatchModalOpen, setIsLogWatchModalOpen] = useState(false);
  const [revealOverview, setRevealOverview] = useState(false);
  const minSwipeDistance = 50;

  const ageRating = useMemo(() => {
    if (!showDetails) return null;
    const usRating = showDetails.content_ratings?.results?.find(r => r.iso_3166_1 === 'US');
    return usRating?.rating || null;
  }, [showDetails]);

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

  if (!isOpen || !episode) return null;

  const currentEpisodeNotes = episodeNotes[showDetails.id]?.[episode.season_number]?.[episode.episode_number] || [];

  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(0);
      setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > minSwipeDistance;
      const isRightSwipe = distance < -minSwipeDistance;

      if (isLeftSwipe) { onNext(); setRevealOverview(false); }
      else if (isRightSwipe) { onPrevious(); setRevealOverview(false); }
      
      setTouchStart(0);
      setTouchEnd(0);
  };
  
  const currentIndex = seasonDetails.episodes.findIndex(e => e.id === episode.id);
  const isFirst = currentIndex <= 0;
  const isLast = currentIndex >= seasonDetails.episodes.length - 1;

  const today = new Date().toISOString().split('T')[0];
  const isFuture = episode.air_date && episode.air_date > today;

  const handleLiveWatch = () => {
    const mediaInfo: LiveWatchMediaInfo = {
        id: showDetails.id,
        media_type: 'tv',
        title: showDetails.name || 'Show',
        poster_path: showDetails.poster_path,
        runtime: showDetails.episode_run_time?.[0] || 45,
        seasonNumber: episode.season_number,
        episodeNumber: episode.episode_number,
        episodeTitle: episode.name,
    };
    onStartLiveWatch(mediaInfo);
    onClose();
  };
  
  const handleSaveLogWatch = (data: { date: string, note: string }) => {
    if (!episode) return;
    const trackedItem: TrackedItem = {
        id: showDetails.id,
        title: showDetails.name || 'Untitled',
        media_type: 'tv',
        poster_path: showDetails.poster_path,
        genre_ids: showDetails.genres.map(g => g.id),
    };
    onAddWatchHistory(trackedItem, episode.season_number, episode.episode_number, data.date, data.note, episode.name);
  };

  const handleSendTimezoneRequest = () => {
    if (!requestedTimezone) return;
    const subject = `Timezone Addition Request: ${requestedTimezone}`;
    const body = `Hi CineMontauge Team,\n\nI would like to request adding the following timezone to the app's airtime registry:\n\nTimezone: ${requestedTimezone}\n\nContext: This helps me track "${showDetails.name}" more accurately.\n\nThank you!`;
    window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setIsRequestingTimezone(false);
  };

  const season = showDetails.seasons?.find(s => s.season_number === episode.season_number);
  const tag: EpisodeTag | null = getEpisodeTag(episode, season, showDetails, seasonDetails);
  const isNew = isNewRelease(episode.air_date);
  
  const stillSrcs = [
      getImageUrl(episode.still_path, 'w500', 'still'),
      getImageUrl(seasonDetails.poster_path, 'w500', 'poster'),
      getImageUrl(showDetails.poster_path, 'w500', 'poster'),
  ];

  const showSpoilerOverlay = preferences.enableSpoilerShield && !isWatched && !isFuture && !revealOverview;
  const airstampText = episode.airtime ? formatTimeFromDate(episode.airtime, timezone) : null;

  return (
    <>
      <MarkAsWatchedModal
        isOpen={isLogWatchModalOpen}
        onClose={() => setIsLogWatchModalOpen(false)}
        mediaTitle={`S${episode.season_number} E${episode.episode_number}: ${episode.name}`}
        onSave={handleSaveLogWatch}
      />
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-bg-primary rounded-lg shadow-xl w-full max-w-2xl h-[90vh] flex flex-col animate-fade-in relative overflow-hidden" onClick={e => e.stopPropagation()}>
          
          {/* Request Timezone Overlay */}
          {isRequestingTimezone && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-fade-in">
                <div className="bg-bg-primary max-sm w-full rounded-3xl p-8 border border-white/10 shadow-2xl relative">
                    <button onClick={() => setIsRequestingTimezone(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-text-secondary"><XMarkIcon className="w-5 h-5" /></button>
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 bg-primary-accent/10 rounded-2xl flex items-center justify-center text-primary-accent mx-auto mb-4">
                            <GlobeAltIcon className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter">Request Timezone</h3>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-2">What time zone do you want?</p>
                    </div>
                    <div className="space-y-4">
                        <div className="relative">
                            <select 
                                value={requestedTimezone}
                                onChange={(e) => setRequestedTimezone(e.target.value)}
                                className="w-full p-4 bg-bg-secondary rounded-2xl text-text-primary font-bold focus:outline-none border border-white/10 appearance-none text-sm"
                            >
                                <option value="">Select a missing timezone...</option>
                                {allTimezones.map(tz => (
                                    <option key={tz.id} value={tz.id}>{tz.name}</option>
                                ))}
                                <option value="Custom/Other">Other (Type in email)</option>
                            </select>
                            <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-text-secondary pointer-events-none" />
                        </div>
                        <button 
                            onClick={handleSendTimezoneRequest}
                            disabled={!requestedTimezone}
                            className="w-full py-4 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase tracking-widest text-xs shadow-xl hover:scale-[1.02] transition-transform disabled:opacity-30"
                        >
                            Draft Request
                        </button>
                    </div>
                </div>
            </div>
          )}

          <div className="relative h-48 flex-shrink-0 overflow-hidden">
              <div className={showSpoilerOverlay ? 'blur-xl brightness-50 scale-110' : ''}>
                <FallbackImage
                    srcs={stillSrcs}
                    placeholder={PLACEHOLDER_STILL}
                    alt={episode.name}
                    className="w-full h-full object-cover rounded-t-lg transition-all duration-700"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute top-4 right-16 flex items-center space-x-2">
                {isNew && <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-cyan-500/20 text-cyan-300">New</span>}
                {tag && (
                    <div className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm ${tag.className}`}>
                        {tag.text}
                    </div>
                )}
              </div>
              <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10"><ChevronLeftIcon className="h-6 w-6" /></button>
              <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-backdrop backdrop-blur-sm rounded-full text-text-primary hover:bg-bg-secondary transition-colors z-10"><XMarkIcon className="h-6 w-6" /></button>
              <div className="absolute bottom-0 left-0 p-4 flex items-end space-x-3">
                  <img src={getImageUrl(showDetails.poster_path, 'w92')} alt="Show Poster" className="w-12 h-18 object-cover rounded-md border-2 border-white/20"/>
                  <img src={getImageUrl(seasonDetails.poster_path, 'w92')} alt="Season Poster" className="w-12 h-18 object-cover rounded-md border-2 border-white/20"/>
              </div>
          </div>

          <div className="bg-bg-secondary/40 border-b border-white/5 flex px-6 flex-shrink-0">
              <button 
                onClick={() => setActiveTab('details')}
                className={`py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === 'details' ? 'text-primary-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                  Overview
                  {activeTab === 'details' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-accent rounded-full"></div>}
              </button>
              <button 
                onClick={() => setActiveTab('timezones')}
                className={`py-3 px-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-2 ${activeTab === 'timezones' ? 'text-primary-accent' : 'text-text-secondary hover:text-text-primary'}`}
              >
                  <ClockIcon className="w-3.5 h-3.5" />
                  Time Zones
                  {activeTab === 'timezones' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary-accent rounded-full"></div>}
              </button>
          </div>

          <div className="flex-grow relative overflow-hidden" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
              {activeTab === 'details' ? (
                <>
                    {!isFirst && (
                        <button onClick={() => { onPrevious(); setRevealOverview(false); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-backdrop rounded-full text-text-primary z-20 hover:bg-bg-secondary transition-colors">
                            <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                    )}
                    <div className="absolute inset-0 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        <div>
                            <p className="text-sm font-semibold text-text-secondary">{showDetails.name} &bull; S{episode.season_number} E{episode.episode_number}</p>
                            <div className="flex items-center space-x-4 mt-1">
                                <h2 className="text-2xl font-bold text-text-primary">{episode.name}</h2>
                                {showRatings && (() => {
                                    if (episode.vote_average && episode.vote_average > 0) {
                                        return <ScoreStar score={episode.vote_average} voteCount={episode.vote_count} size="sm" />;
                                    }
                                    if (episode.vote_average === 0) {
                                        if (tag?.text?.includes('Premiere')) return null;
                                        return <span className="text-[10px] text-text-secondary/50 font-black uppercase tracking-widest px-2 py-1 bg-bg-secondary rounded-md">No Rating</span>;
                                    }
                                    return null;
                                })()}
                            </div>
                            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-text-secondary/80 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <CheckCircleIcon className="w-3.5 h-3.5 opacity-50" />
                                    <span>{episode.air_date ? new Date(episode.air_date + 'T00:00:00').toLocaleDateString() : 'Unscheduled'}</span>
                                </div>
                                {airstampText && (
                                    <div className="flex items-center gap-1.5 bg-primary-accent/10 px-2 py-0.5 rounded border border-primary-accent/20 text-primary-accent">
                                        <ClockIcon className="w-3.5 h-3.5" />
                                        <span className="font-black uppercase tracking-widest">{airstampText}</span>
                                    </div>
                                )}
                                {episode.runtime && episode.runtime > 0 && <span>&bull; {formatRuntime(episode.runtime)}</span>}
                                {ageRating && (
                                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm border border-white/10 ${getAgeRatingColor(ageRating)}`}>
                                            {ageRating}
                                        </span>
                                )}
                            </div>
                        </div>

                        <div className="relative">
                            <div className={showSpoilerOverlay ? 'blur-md select-none opacity-40 grayscale' : ''}>
                                <p className="text-text-secondary text-sm leading-relaxed">{episode.overview || "No description available."}</p>
                            </div>
                            {showSpoilerOverlay && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                                    <button 
                                        onClick={() => setRevealOverview(true)}
                                        className="px-6 py-2 bg-bg-secondary border border-primary-accent/30 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-primary-accent/20 transition-all shadow-xl"
                                    >
                                        <EyeIcon className="w-4 h-4 text-primary-accent" />
                                        Reveal Plot
                                    </button>
                                    <p className="text-[10px] font-black text-text-secondary/40 uppercase tracking-widest">Spoiler Shield Active</p>
                                </div>
                            )}
                        </div>

                        {/* Crew and Guest Stars */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                            <GuestStarsList stars={episode.guest_stars || []} />
                            <CrewList crew={episode.crew || []} />
                        </div>
                        
                        {/* Notes Section */}
                        {currentEpisodeNotes.length > 0 && (
                            <div className="pt-6 border-t border-white/5">
                                <h4 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                                    <PencilSquareIcon className="w-4 h-4 text-primary-accent" />
                                    Episode Notes
                                </h4>
                                <div className="space-y-3">
                                    {currentEpisodeNotes.map(note => (
                                        <div key={note.id} className="p-4 bg-bg-secondary/40 rounded-xl border border-white/5">
                                            <p className="text-sm text-text-secondary leading-relaxed">{note.text}</p>
                                            <p className="text-[8px] font-black text-text-secondary/40 uppercase tracking-widest mt-2">{new Date(note.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {!isLast && (
                        <button onClick={() => { onNext(); setRevealOverview(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-backdrop rounded-full text-text-primary z-20 hover:bg-bg-secondary transition-colors">
                            <ChevronRightIcon className="h-6 w-6" />
                        </button>
                    )}
                </>
              ) : (
                <div className="p-8 space-y-8 animate-fade-in overflow-y-auto h-full custom-scrollbar">
                    <div className="text-center">
                        <h3 className="text-xl font-black text-text-primary uppercase tracking-tighter mb-2">Global Release Map</h3>
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-widest opacity-60">Estimated broadcast times across regions</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                         {allTimezones.slice(0, 12).map(tz => (
                             <div key={tz.id} className="flex justify-between items-center p-4 bg-bg-secondary/30 rounded-2xl border border-white/5">
                                 <span className="text-xs font-bold text-text-secondary uppercase tracking-widest truncate max-w-[180px]">{tz.name}</span>
                                 <span className="text-sm font-black text-text-primary">
                                     {episode.airtime ? formatTimeFromDate(episode.airtime, tz.id) : 'TBA'}
                                 </span>
                             </div>
                         ))}
                    </div>
                    
                    <button 
                        onClick={() => setIsRequestingTimezone(true)}
                        className="w-full py-4 rounded-2xl bg-bg-secondary/60 border border-white/5 text-primary-accent font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-bg-secondary transition-all"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Request Missing Timezone
                    </button>
                </div>
              )}
          </div>

          <div className="p-6 bg-bg-secondary/40 border-t border-white/5 flex flex-col gap-4 flex-shrink-0">
              <div className="flex gap-2">
                  <button 
                    onClick={onToggleWatched}
                    className={`flex-grow flex items-center justify-center gap-3 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${isWatched ? 'bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-accent-gradient text-on-accent shadow-xl'}`}
                  >
                      <CheckCircleIcon className="w-5 h-5" />
                      {isWatched ? 'Watched' : 'Mark Watched'}
                  </button>
                  <button 
                    onClick={handleLiveWatch}
                    className="p-4 rounded-2xl bg-bg-primary border border-white/10 text-primary-accent hover:bg-bg-secondary transition-all"
                    title="Live Watch"
                  >
                      <PlayCircleIcon className="w-6 h-6" />
                  </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                  <button onClick={onToggleFavorite} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isFavorited ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-bg-primary/60 border-white/5 text-text-secondary hover:text-text-primary'}`}>
                      <HeartIcon filled={isFavorited} className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase mt-1">Favorite</span>
                  </button>
                  <button onClick={onOpenJournal} className="flex flex-col items-center justify-center p-3 rounded-xl bg-bg-primary/60 border border-white/5 text-text-secondary hover:text-text-primary transition-all">
                      <BookOpenIcon className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase mt-1">Journal</span>
                  </button>
                  <button onClick={onRate} className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${episodeRating > 0 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-bg-primary/60 border-white/5 text-text-secondary hover:text-text-primary'}`}>
                      <StarIcon filled={episodeRating > 0} className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase mt-1">{episodeRating > 0 ? `${episodeRating}/10` : 'Rate'}</span>
                  </button>
                  <button onClick={onDiscuss} className="flex flex-col items-center justify-center p-3 rounded-xl bg-bg-primary/60 border border-white/5 text-text-secondary hover:text-text-primary transition-all">
                      <ChatBubbleLeftRightIcon className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase mt-1">Discuss</span>
                  </button>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EpisodeDetailModal;
