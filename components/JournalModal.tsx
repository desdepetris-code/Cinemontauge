
import React, { useState, useEffect } from 'react';
import { JournalEntry, TmdbMediaDetails, Episode, WatchProgress } from '../types';
import { getSeasonDetails } from '../services/tmdbService';
import { XMarkIcon } from './Icons';

interface JournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: JournalEntry | null, seasonNumber: number, episodeNumber: number) => void;
  mediaDetails: TmdbMediaDetails | null;
  initialSeason?: number;
  initialEpisode?: Episode;
  watchProgress: WatchProgress;
}

const moods = ['😊', '😂', '😍', '😢', '🤯', '🤔', '😠', '😴', '🥳', '😡', '🤮', '💔'];

const JournalModal: React.FC<JournalModalProps> = ({ isOpen, onClose, onSave, mediaDetails, initialSeason, initialEpisode, watchProgress }) => {
  const [text, setText] = useState('');
  const [mood, setMood] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<number | undefined>(initialSeason);
  const [selectedEpisode, setSelectedEpisode] = useState<number | undefined>(initialEpisode?.episode_number);
  const [episodesForSeason, setEpisodesForSeason] = useState<Episode[]>([]);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (mediaDetails?.media_type === 'tv') {
            const seasonNum = initialSeason ?? mediaDetails.seasons?.find(s => s.season_number > 0)?.season_number ?? 1;
            setSelectedSeason(seasonNum);
            setSelectedEpisode(initialEpisode?.episode_number ?? 1);
        } else {
            const entry = watchProgress[mediaDetails?.id || 0]?.[0]?.[0]?.journal;
            setText(entry?.text || '');
            setMood(entry?.mood || '');
        }
    }
  }, [isOpen, initialSeason, initialEpisode, mediaDetails, watchProgress]);
  
  useEffect(() => {
    if (isOpen && mediaDetails?.media_type === 'tv' && selectedSeason !== undefined) {
      setIsLoadingEpisodes(true);
      getSeasonDetails(mediaDetails.id, selectedSeason)
        .then(data => {
          setEpisodesForSeason(data.episodes);
          if (!data.episodes.some(e => e.episode_number === selectedEpisode)) {
            setSelectedEpisode(1);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoadingEpisodes(false));
    }
  }, [isOpen, mediaDetails, selectedSeason]);

  useEffect(() => {
    if (mediaDetails?.media_type === 'tv' && selectedSeason !== undefined && selectedEpisode !== undefined) {
      const entry = watchProgress[mediaDetails.id]?.[selectedSeason]?.[selectedEpisode]?.journal;
      setText(entry?.text || '');
      setMood(entry?.mood || '');
    }
  }, [mediaDetails, selectedSeason, selectedEpisode, watchProgress]);

  if (!isOpen || !mediaDetails) return null;

  const handleSave = () => {
    const seasonToSave = mediaDetails.media_type === 'tv' ? selectedSeason! : 0;
    const episodeToSave = mediaDetails.media_type === 'tv' ? selectedEpisode! : 0;
    
    if (!text.trim() && !mood) {
        onSave(null, seasonToSave, episodeToSave);
    } else {
        onSave({ text, mood, timestamp: new Date().toISOString() }, seasonToSave, episodeToSave);
    }
    onClose();
  };

  const currentEpisode = episodesForSeason.find(e => e.episode_number === selectedEpisode);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[200] p-4" onClick={onClose}>
      <div className="bg-bg-primary rounded-[2.5rem] shadow-2xl w-full max-w-lg p-10 animate-fade-in relative border border-white/10" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors z-10">
            <XMarkIcon className="w-5 h-5" />
        </button>
        <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-1">Journal Reflection</h2>
        <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.3em] mb-8 opacity-60 truncate">{mediaDetails.name}</p>
        
        {mediaDetails.media_type === 'tv' && (
          <div className="grid grid-cols-2 gap-2 mb-6">
              <select 
                  value={selectedSeason} 
                  onChange={e => setSelectedSeason(Number(e.target.value))}
                  className="w-full text-xs font-black uppercase tracking-widest"
              >
                  {mediaDetails.seasons?.map(s => <option key={s.id} value={s.season_number}>Season {s.season_number}</option>)}
              </select>
              <select 
                  value={selectedEpisode} 
                  onChange={e => setSelectedEpisode(Number(e.target.value))}
                  className="w-full text-xs font-black uppercase tracking-widest"
                  disabled={isLoadingEpisodes}
              >
                  {isLoadingEpisodes 
                      ? <option>Loading...</option> 
                      : episodesForSeason.map(e => <option key={e.id} value={e.episode_number}>E{e.episode_number}: {e.name}</option>)}
              </select>
          </div>
        )}
        
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Capture your thoughts here..."
          style={{ fontFamily: 'var(--font-journal)' }}
          className="w-full h-48 p-5 bg-bg-secondary rounded-3xl text-text-primary focus:outline-none border border-white/5 shadow-inner text-lg leading-relaxed resize-none"
        />

        <div className="my-8">
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-4 block opacity-60 ml-2">Emotional Resonance</label>
          <div className="grid grid-cols-6 gap-2">
            {moods.map(m => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-3xl p-3 rounded-2xl transition-all transform hover:scale-110 active:scale-95 ${mood === m ? 'bg-primary-accent/20 border border-primary-accent/40 shadow-lg' : 'bg-transparent border border-transparent'}`}
                aria-label={`Mood: ${m}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSave}
            className="w-full py-5 rounded-[1.5rem] bg-accent-gradient text-on-accent font-black uppercase tracking-[0.2em] text-xs shadow-2xl transform transition-all hover:scale-[1.02] active:scale-95"
          >
            Archive Entry
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-text-secondary bg-bg-secondary font-black uppercase tracking-widest text-[9px] hover:text-text-primary transition-all"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
};

export default JournalModal;
