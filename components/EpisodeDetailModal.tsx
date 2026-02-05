import React, { useState, useMemo } from 'react';
import { Episode, TmdbMediaDetails, TmdbSeasonDetails, WatchProgress, JournalEntry, TrackedItem, EpisodeTag, Comment, CastMember, CrewMember, AppPreferences, Note } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import FallbackImage from './FallbackImage';
import { PLACEHOLDER_STILL } from '../constants';
import { CheckCircleIcon, BookOpenIcon, StarIcon, ChevronLeftIcon, PlayCircleIcon, ChevronRightIcon, XMarkIcon, HeartIcon, ChatBubbleLeftRightIcon, PencilSquareIcon, EyeIcon, ClockIcon, GlobeAltIcon, ChevronDownIcon, PlusIcon, InformationCircleIcon, CalendarIcon } from './Icons';
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
  onAddWatchHistoryBulk: (item: TrackedItem, episodeIds: number[], timestamp: string, note: string) => void;
  onRate: () => void;
  episodeRating: number;
  onDiscuss: () => void;
  episodeNotes?: Record<number, Record<number, Record<number, Note[]>>>;
  showRatings: boolean;
  preferences: AppPreferences;
  timezone: string;
}

const EpisodeDetailModal: React.FC<EpisodeDetailModalProps> = ({
  isOpen, onClose, episode, showDetails, seasonDetails, isWatched, onToggleWatched, onOpenJournal, isFavorited, onToggleFavorite, onStartLiveWatch, onSaveJournal, watchProgress, onNext, onPrevious, onAddWatchHistory, onRate, episodeRating, onDiscuss, episodeNotes = {}, showRatings, preferences, timezone
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'timezones'>('details');
  const [revealOverview, setRevealOverview] = useState(false);

  if (!isOpen || !episode) return null;

  const today = new Date().toISOString().split('T')[0];
  const isFuture = episode.air_date && episode.air_date > today;
  const showSpoilerOverlay = preferences.enableSpoilerShield && !isWatched && !isFuture && !revealOverview;
  const airstampText = episode.airtime ? formatTimeFromDate(episode.airtime, timezone) : null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[160] p-4 animate-fade-in" onClick={onClose}>
        <div className="bg-bg-primary rounded-[3rem] shadow-2xl w-full max-w-2xl h-[90vh] flex flex-col relative overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
          
          <div className="relative h-64 flex-shrink-0 overflow-hidden">
              <div className={showSpoilerOverlay ? 'blur-2xl brightness-50 scale-110' : ''}>
                <FallbackImage srcs={[getImageUrl(episode.still_path, 'w1280', 'still'), getImageUrl(showDetails.backdrop_path, 'w1280', 'backdrop')]} placeholder={PLACEHOLDER_STILL} alt={episode.name} className="w-full h-full object-cover transition-all duration-1000" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary to-transparent"></div>
              <button onClick={onClose} className="absolute top-6 left-6 p-3 bg-black/60 backdrop-blur-md rounded-full text-white hover:bg-bg-secondary transition-all z-30 border border-white/10 shadow-2xl"><XMarkIcon className="w-6 h-6" /></button>
          </div>

          <div className="flex-grow relative overflow-hidden">
            <div className="absolute inset-0 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary-accent">{showDetails.name}</span>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-text-secondary">S{episode.season_number} E{episode.episode_number}</span>
                    </div>
                    
                    <h2 className="text-3xl md:text-5xl font-black text-text-primary uppercase tracking-tighter leading-none">{episode.name}</h2>
                    
                    <div className="flex items-center flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-primary-accent opacity-60" />
                            <span className="text-[11px] font-black uppercase text-text-primary tracking-widest">{episode.air_date ? new Date(episode.air_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unscheduled'}</span>
                        </div>
                        {airstampText && (
                            <div className="px-4 py-1.5 bg-black text-white border border-white/10 rounded-md flex items-center gap-2">
                                <ClockIcon className="w-4 h-4 text-white" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{airstampText}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative">
                    <div className={showSpoilerOverlay ? 'blur-xl select-none opacity-40 grayscale' : ''}>
                        <div className="p-8 rounded-[2rem] border border-white/5 bg-bg-secondary/20">
                            <p className="text-text-primary text-lg leading-relaxed font-medium">{episode.overview || "Registry data pending for this episode's plot summary."}</p>
                        </div>
                    </div>
                    {showSpoilerOverlay && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-6">
                            <button onClick={() => setRevealOverview(true)} className="px-10 py-5 bg-bg-primary/80 border border-primary-accent/60 rounded-[2rem] flex items-center gap-4 text-xs font-black uppercase tracking-[0.3em] text-text-primary hover:bg-primary-accent hover:text-black transition-all shadow-2xl backdrop-blur-md">
                                <EyeIcon className="w-6 h-6 text-primary-accent" />
                                Reveal Plot Details
                            </button>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="p-8 bg-bg-secondary/40 border-t border-white/5 flex flex-col gap-6 flex-shrink-0">
              <button 
                onClick={onToggleWatched}
                className={`w-full flex items-center justify-center gap-4 py-6 rounded-[2rem] font-black uppercase text-sm tracking-[0.3em] transition-all shadow-2xl active:scale-95 ${isWatched ? 'bg-bg-secondary text-green-400 border-2 border-green-400/50' : 'bg-accent-gradient text-on-accent border-none'}`}
              >
                  <CheckCircleIcon className="w-6 h-6" />
                  {isWatched ? 'Archive Entry Cleared' : 'Archive in Library'}
              </button>
              
              <div className="grid grid-cols-4 gap-3">
                  <button onClick={onToggleFavorite} className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all border ${isFavorited ? 'bg-bg-secondary border-yellow-500 text-yellow-500' : 'bg-bg-secondary/40 border-white/5 text-text-secondary'}`}>
                      <HeartIcon filled={isFavorited} className="w-6 h-6 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Favorite</span>
                  </button>
                  <button onClick={onOpenJournal} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-bg-secondary/40 border border-white/5 text-text-secondary">
                      <BookOpenIcon className="w-6 h-6 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Journal</span>
                  </button>
                  <button onClick={onRate} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-bg-secondary/40 border border-white/5 text-text-secondary">
                      <StarIcon filled={episodeRating > 0} className={`w-6 h-6 mb-2 ${episodeRating > 0 ? 'text-yellow-400' : ''}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{episodeRating > 0 ? `${episodeRating}/10` : 'Rate'}</span>
                  </button>
                  <button onClick={onDiscuss} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-bg-secondary/40 border border-white/5 text-text-secondary">
                      <ChatBubbleLeftRightIcon className="w-6 h-6 mb-2" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Comment</span>
                  </button>
              </div>
          </div>
        </div>
    </div>
  );
};

export default EpisodeDetailModal;