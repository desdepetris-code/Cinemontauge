
import React, { useState, useEffect, useRef } from 'react';
import { TraktIcon } from '../components/ServiceIcons';
import * as tmdbService from '../services/tmdbService';
import { HistoryItem, TrackedItem, TraktToken, UserRatings, WatchProgress, UserData } from '../types';
import * as traktService from '../services/traktService';
import { firebaseConfig } from '../firebaseConfig';
import { XMarkIcon, CheckCircleIcon, CloudArrowUpIcon, InformationCircleIcon, ArrowPathIcon, ListBulletIcon } from '../components/Icons';
import { confirmationService } from '../services/confirmationService';
import * as googleDriveService from '../services/googleDriveService';
import { getTraktToken, deleteTraktToken } from '../services/supabaseClient';

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
    <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-primary uppercase tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-text-secondary mt-1 font-medium">{subtitle}</p>}
    </div>
);

const TraktImporter: React.FC<{ onImport: (data: any) => void; userId: string }> = ({ onImport, userId }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    
    const TRAKT_AUTH_FUNCTION_URL = `https://us-central1-${firebaseConfig.projectId}.cloudfunctions.net/traktAuth`;

    useEffect(() => {
        const checkRegistry = async () => {
            if (!userId || userId === 'guest') return;
            try {
                const token = await getTraktToken(userId);
                setIsConnected(!!token);
            } catch (e) { console.error(e); }
        };
        checkRegistry();
    }, [userId]);

    // Handle OAuth Callback
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const isTraktCallback = window.location.pathname.includes('/auth/trakt/callback');

        if (code && (isTraktCallback || !window.location.pathname.includes('/'))) {
            window.history.replaceState({}, document.title, '/');
            
            const handleExchange = async () => {
                if (!userId || userId === 'guest') {
                    setError("You must be logged in to link Trakt.");
                    return;
                }
                setIsLoading(true);
                setFeedback("Establishing Registry Connection...");
                try {
                    await traktService.exchangeCodeForToken(code, TRAKT_AUTH_FUNCTION_URL, userId);
                    setIsConnected(true);
                    confirmationService.show("Successfully linked to Trakt Registry.");
                } catch (e: any) {
                    setError(`Connection failed: ${e.message}`);
                } finally {
                    setIsLoading(false);
                }
            };
            handleExchange();
        }
    }, [userId, TRAKT_AUTH_FUNCTION_URL]);

    const handleImport = async () => {
        if (!isConnected) return;

        setIsLoading(true);
        setError(null);
        try {
            setFeedback('Validating credentials...');
            const token = await traktService.ensureValidToken(userId, TRAKT_AUTH_FUNCTION_URL);
            if (!token) throw new Error("Auth required.");

            const history: HistoryItem[] = [];
            const completed: TrackedItem[] = [];
            const watchProgress: WatchProgress = {};

            setFeedback('Synchronizing Movies...');
            const watchedMovies = await traktService.getWatchedMovies(userId, TRAKT_AUTH_FUNCTION_URL);
            watchedMovies?.forEach(item => {
                if (item.movie?.ids?.tmdb) {
                    const trackedItem = { id: item.movie.ids.tmdb, title: item.movie.title, media_type: 'movie' as const, poster_path: null };
                    completed.push(trackedItem);
                    history.push({ ...trackedItem, logId: `trakt-movie-${item.movie.ids.tmdb}`, timestamp: item.last_watched_at });
                }
            });

            setFeedback('Synchronizing Series...');
            const watchedShows = await traktService.getWatchedShows(userId, TRAKT_AUTH_FUNCTION_URL);
            watchedShows?.forEach(item => {
                if (item.show?.ids?.tmdb) {
                    const showId = item.show.ids.tmdb;
                    const trackedItem = { id: showId, title: item.show.title, media_type: 'tv' as const, poster_path: null };
                    if (!watchProgress[showId]) watchProgress[showId] = {};
                    item.seasons.forEach(season => {
                        if (!watchProgress[showId][season.number]) watchProgress[showId][season.number] = {};
                        season.episodes.forEach(ep => {
                            watchProgress[showId][season.number][ep.number] = { status: 2 };
                            history.push({ ...trackedItem, logId: `trakt-tv-${showId}-${season.number}-${ep.number}`, timestamp: ep.last_watched_at, seasonNumber: season.number, episodeNumber: ep.number });
                        });
                    });
                    if (item.plays > 0) completed.push(trackedItem);
                }
            });

            onImport({ history, completed, planToWatch: [], watchProgress, ratings: {} });
            setFeedback(`Reconciled ${history.length} events.`);
            confirmationService.show(`Sync complete! Library reconciled.`);
        } catch (e: any) {
            setError(`Sync failed: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDisconnect = async () => {
        if (window.confirm("Sever connection to Trakt Registry? Data already imported will remain.")) {
            try {
                await deleteTraktToken(userId);
                setIsConnected(false);
                confirmationService.show("Registry connection severed.");
            } catch (e) {
                alert("Failed to disconnect.");
            }
        }
    }

    return (
        <div className="bg-card-gradient rounded-lg shadow-md p-6 mt-8 border border-white/5">
            <div className="flex items-start space-x-4">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 shadow-inner">
                    <TraktIcon className="w-6 h-6"/>
                </div>
                <div className="flex-grow">
                    <SectionHeader title="Trakt.tv Registry Sync" />
                    <p className="text-sm text-text-secondary -mt-4 mb-4 font-medium">Automatic cloud-sync for your cross-platform history.</p>
                </div>
            </div>

            {isConnected ? (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                        <div className="flex items-center gap-2 text-green-400 text-xs font-black uppercase tracking-widest">
                            <CheckCircleIcon className="w-4 h-4" /> Registry Synced
                        </div>
                        <button onClick={handleDisconnect} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:underline">Disconnect</button>
                    </div>
                    <button 
                        onClick={handleImport} 
                        disabled={isLoading} 
                        className="w-full py-4 bg-bg-secondary rounded-2xl font-black uppercase text-xs tracking-widest border border-white/5 hover:brightness-125 transition-all group overflow-hidden relative"
                    >
                        <div className="absolute inset-0 nav-spectral-bg opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <span className="relative z-10">{isLoading ? feedback : 'Run Registry Reconciliation'}</span>
                    </button>
                </div>
            ) : (
                <button 
                    onClick={traktService.redirectToTraktAuth} 
                    disabled={isLoading}
                    className="w-full text-center bg-bg-secondary p-5 rounded-2xl font-black uppercase text-xs flex items-center justify-center space-x-3 border border-white/5 hover:bg-bg-secondary/70 transition-all shadow-lg active:scale-95"
                >
                    {isLoading ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <TraktIcon className="w-5 h-5" />}
                    <span>{isLoading ? 'Redirecting to Registry...' : 'Link Trakt Registry'}</span>
                </button>
            )}

            {error && <p className="text-[10px] text-red-400 text-center mt-4 font-black uppercase tracking-widest bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</p>}
        </div>
    );
};

interface ImportsScreenProps {
    onImportCompleted: (historyItems: HistoryItem[], completedItems: TrackedItem[]) => void;
    onTraktImportCompleted: (data: any) => void;
    onTmdbImportCompleted: (data: any) => void;
    onJsonImportCompleted: (data: any) => void;
    userData: UserData;
}

const ImportsScreen: React.FC<ImportsScreenProps> = ({ onImportCompleted, onTraktImportCompleted, onTmdbImportCompleted, onJsonImportCompleted, userData }) => {
  // Use current user ID for registry sync
  const currentUserId = localStorage.getItem('supabase.auth.token') ? JSON.parse(localStorage.getItem('supabase.auth.token')!).currentSession?.user?.id : 'guest';

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8 px-2 pb-24">
        <div className="bg-primary-accent/5 p-6 rounded-3xl border border-primary-accent/20 mb-8 flex items-start gap-4">
            <InformationCircleIcon className="w-6 h-6 text-primary-accent flex-shrink-0" />
            <p className="text-xs font-black uppercase tracking-widest text-primary-accent leading-relaxed">
                Reconciliation Mode: Importing data merges with your current library. Identical events are automatically skipped to maintain registry integrity.
            </p>
        </div>

      <TraktImporter onImport={onTraktImportCompleted} userId={currentUserId} />
      {/* Other importers... */}
    </div>
  );
};

export default ImportsScreen;
