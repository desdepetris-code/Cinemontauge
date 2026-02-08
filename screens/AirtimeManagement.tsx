
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserData, TmdbMediaDetails, TmdbMedia, Episode, TrackedItem, DownloadedPdf, ReportType, PendingRecommendationCheck } from '../types';
import { getMediaDetails, getSeasonDetails, discoverMediaPaginated } from '../services/tmdbService';
import { generateAirtimePDF, generateSupabaseSpecPDF, generateSummaryReportPDF } from '../utils/pdfExportUtils';
// FIX: Added missing HourglassIcon and CalendarIcon to resolve 'Cannot find name' errors.
import { ChevronLeftIcon, CloudArrowUpIcon, ArchiveBoxIcon, FireIcon, ClockIcon, ArrowPathIcon, InformationCircleIcon, PlayPauseIcon, SparklesIcon, DownloadIcon, PhotoIcon, TvIcon, FilmIcon, SearchIcon, TrashIcon, ListBulletIcon, TrophyIcon, DocumentTextIcon, QuestionMarkCircleIcon, UsersIcon, HourglassIcon, CalendarIcon } from '../components/Icons';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { confirmationService } from '../services/confirmationService';
import MissingInfoModal from '../components/MissingInfoModal';
import { uploadAdminReport } from '../services/supabaseClient';
import Logo from '../components/Logo';

interface AirtimeManagementProps {
    onBack: () => void;
    userData: UserData;
    setPendingRecommendationChecks: React.Dispatch<React.SetStateAction<PendingRecommendationCheck[]>>;
    setFailedRecommendationReports: React.Dispatch<React.SetStateAction<TrackedItem[]>>;
}

const MASTER_PIN = "999236855421340";
const DEFAULT_MATCH_LIMIT = 100;

const AirtimeManagement: React.FC<AirtimeManagementProps> = ({ onBack, userData, setPendingRecommendationChecks, setFailedRecommendationReports }) => {
    const [pin, setPin] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [isGenerating, setIsGenerating] = useState<ReportType | 'library_dump' | 'recommendation_audit' | 'rec_gap_report' | null>(null);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, matches: 0 });
    const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState(false);
    const [downloadedPdfs, setDownloadedPdfs] = useLocalStorage<DownloadedPdf[]>('cinemontauge_reports', []);

    const [reportOffsets, setReportOffsets] = useLocalStorage<Record<string, any>>('cinemontauge_report_offsets', {
        missing_airtime_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_runtime_ep: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_runtime_movie: { page: 1, index: 0, part: 1, mediaType: 'movie' },
        missing_airdate_movie: { page: 1, index: 0, part: 1, mediaType: 'movie' },
        missing_airdate_ep: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        no_recs_movie: { page: 1, index: 0, part: 1, mediaType: 'movie' },
        no_recs_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_cast_images: { page: 1, index: 0, part: 1, mediaType: 'tv' }, // Defaults to TV for scan feed
        missing_poster_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_poster_movie: { page: 1, index: 0, part: 1, mediaType: 'movie' },
        missing_backdrop_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_backdrop_movie: { page: 1, index: 0, part: 1, mediaType: 'movie' }
    });

    const runFullLibraryDump = () => {
        setIsGenerating('library_dump');
        const allItems = [
            ...userData.watching,
            ...userData.planToWatch,
            ...userData.completed,
            ...userData.onHold,
            ...userData.dropped,
            ...userData.allCaughtUp
        ];
        
        const unique = Array.from(new Map(allItems.map(i => [i.id, i])).values());
        const rows = unique.map(i => ({
            title: i.title,
            status: i.media_type.toUpperCase(),
            details: `TMDB ID: ${i.id}`
        }));
        
        if (rows.length > 0) {
            generateAirtimePDF("Full Library Registry Dump", rows, 1);
            confirmationService.show(`Library dump of ${rows.length} items exported to PDF.`);
        } else {
            confirmationService.show("Registry is empty. No items to dump.");
        }
        setIsGenerating(null);
    };

    const handleSendMissingInfo = (type: string, data: any) => {
        const subject = `Registry Update: ${type}`;
        let body = `Audit Report Details:\n------------------\nReport Type: ${type}\nGenerated At: ${new Date().toLocaleString()}\n\n`;
        if (data.name) body += `Talent Name: ${data.name}\n`;
        if (data.imdbLink) body += `IMDb Link: ${data.imdbLink}\n`;
        if (data.description) body += `Description: ${data.description}\n`;
        if (data.status) body += `Status: ${data.status}\n`;
        window.location.href = `mailto:sceneit623@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setIsMissingInfoModalOpen(false);
        confirmationService.show("Missing info report dispatched.");
    };

    const runAuditReport = async (type: ReportType, label: string) => {
        setIsGenerating(type);
        setScanProgress({ current: 0, total: 0, matches: 0 });
        const rows: { title: string; status: string; details: string }[] = [];
        const offset = reportOffsets[type] || { page: 1, index: 0, part: 1, mediaType: 'tv' };
        
        let totalScanned = 0;
        let matchesFound = 0;
        
        try {
            let currentPage = offset.page;
            while (matchesFound < DEFAULT_MATCH_LIMIT && currentPage < offset.page + 5) {
                const data = await discoverMediaPaginated(offset.mediaType, { page: currentPage, sortBy: 'popularity.desc' });
                if (!data || data.results.length === 0) break;

                for (let i = (currentPage === offset.page ? offset.index : 0); i < data.results.length; i++) {
                    const item = data.results[i];
                    totalScanned++;
                    setScanProgress({ current: totalScanned, total: 500, matches: matchesFound });
                    
                    let isMatch = false;
                    let findings = "";
                    let itemStatus = "Flagged";

                    // LOGIC HUB FOR 12 PDF TYPES
                    switch (type) {
                        case 'missing_airtime_tv': {
                            const details = await getMediaDetails(item.id, 'tv');
                            const hasOverride = !!AIRTIME_OVERRIDES[item.id];
                            if (details.status === 'Returning Series' && !details.next_episode_to_air && !hasOverride) {
                                isMatch = true;
                                findings = "Returning series with no next episode date or manual override.";
                            }
                            break;
                        }
                        case 'missing_runtime_ep': {
                            const details = await getMediaDetails(item.id, 'tv');
                            if (details.seasons) {
                                const lastSeason = details.seasons.find(s => s.season_number === details.last_episode_to_air?.season_number);
                                if (lastSeason) {
                                    const sd = await getSeasonDetails(item.id, lastSeason.season_number);
                                    const badEps = sd.episodes.filter(e => !e.runtime || e.runtime === 0);
                                    if (badEps.length > 0) {
                                        isMatch = true;
                                        findings = `S${lastSeason.season_number} has ${badEps.length} episodes missing runtime data.`;
                                    }
                                }
                            }
                            break;
                        }
                        case 'missing_runtime_movie': {
                            const details = await getMediaDetails(item.id, 'movie');
                            if (!details.runtime || details.runtime === 0) {
                                isMatch = true;
                                findings = "Movie metadata has no length/duration listed.";
                            }
                            break;
                        }
                        case 'missing_airdate_movie': {
                            if (!item.release_date) {
                                isMatch = true;
                                findings = "Primary release date is missing in registry.";
                            }
                            break;
                        }
                        case 'missing_airdate_ep': {
                            const details = await getMediaDetails(item.id, 'tv');
                            if (details.seasons) {
                                const lastSeason = details.seasons.find(s => s.season_number === details.last_episode_to_air?.season_number);
                                if (lastSeason) {
                                    const sd = await getSeasonDetails(item.id, lastSeason.season_number);
                                    const badEps = sd.episodes.filter(e => !e.air_date);
                                    if (badEps.length > 0) {
                                        isMatch = true;
                                        findings = `S${lastSeason.season_number} has ${badEps.length} episodes missing air dates.`;
                                    }
                                }
                            }
                            break;
                        }
                        case 'no_recs_movie':
                        case 'no_recs_tv': {
                            const details = await getMediaDetails(item.id, offset.mediaType);
                            if (!details.recommendations?.results || details.recommendations.results.length === 0) {
                                isMatch = true;
                                findings = "Recommendation engine returned empty results for this title.";
                            }
                            break;
                        }
                        case 'missing_cast_images': {
                            const details = await getMediaDetails(item.id, offset.mediaType);
                            const placeholders = details.credits?.cast?.filter(c => !c.profile_path).slice(0, 5);
                            if (placeholders && placeholders.length > 0) {
                                isMatch = true;
                                findings = `Missing talent portraits for: ${placeholders.map(p => p.name).join(', ')}`;
                            }
                            break;
                        }
                        case 'missing_poster_tv':
                        case 'missing_poster_movie': {
                            if (!item.poster_path) {
                                isMatch = true;
                                findings = "Visual ID Gap: Main poster asset is missing.";
                            }
                            break;
                        }
                        case 'missing_backdrop_tv':
                        case 'missing_backdrop_movie': {
                            if (!item.backdrop_path) {
                                isMatch = true;
                                findings = "Visual ID Gap: Cinematic backdrop asset is missing.";
                            }
                            break;
                        }
                    }

                    if (isMatch) {
                        rows.push({
                            title: item.title || item.name || 'Unknown',
                            status: itemStatus,
                            details: `TMDB ID: ${item.id} • ${findings}`
                        });
                        matchesFound++;
                    }

                    if (matchesFound >= DEFAULT_MATCH_LIMIT) {
                        setReportOffsets(prev => ({
                            ...prev,
                            [type]: { ...prev[type], page: currentPage, index: i + 1 }
                        }));
                        break;
                    }
                    if (totalScanned % 10 === 0) await new Promise(r => setTimeout(r, 30)); 
                }
                if (matchesFound >= DEFAULT_MATCH_LIMIT) break;
                currentPage++;
            }

            if (rows.length > 0) {
                const { blob, fileName } = generateSummaryReportPDF(label, rows, {
                    totalScanned,
                    matchesFound,
                    criteria: label,
                    partNumber: offset.part
                });
                
                await uploadAdminReport(fileName, blob);
                
                setDownloadedPdfs(prev => [{
                    id: `rep-${Date.now()}`,
                    title: label,
                    timestamp: new Date().toISOString(),
                    part: offset.part,
                    rows: [] 
                }, ...prev]);

                setReportOffsets(prev => ({
                    ...prev,
                    [type]: { ...prev[type], part: (prev[type]?.part || 1) + 1 }
                }));
                confirmationService.show(`Registry Audit "${label}" Uploaded to Portal Archive.`);
            } else {
                confirmationService.show(`Registry check passed for: ${label}`);
            }
        } catch (e) {
            console.error(e);
            alert("Report pipeline failed.");
        } finally {
            setIsGenerating(null);
        }
    };

    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-white">
                <Logo className="w-24 h-24 mb-8" />
                <h1 className="text-3xl font-black mb-2 uppercase tracking-tighter">OWNER ACCESS</h1>
                <p className="text-text-secondary mb-8 text-[10px] uppercase tracking-[0.3em]">Registry Clearance Required</p>
                <div className="w-full max-w-xs space-y-4">
                    <input 
                        type="password" 
                        value={pin}
                        onChange={e => { setPin(e.target.value); setPinError(false); }}
                        placeholder="•••••••••••••••"
                        className={`w-full bg-bg-secondary border-2 ${pinError ? 'border-red-500 animate-shake' : 'border-white/10'} rounded-2xl p-4 text-center text-xl tracking-[0.5em] focus:outline-none transition-all shadow-inner`}
                    />
                    <button 
                        onClick={() => { if (pin === MASTER_PIN) setIsAuthorized(true); else setPinError(true); }}
                        className="w-full py-4 rounded-2xl bg-accent-gradient text-on-accent font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-transform"
                    >
                        Verify Identity
                    </button>
                    <button onClick={onBack} className="w-full py-2 text-[9px] font-black text-text-secondary uppercase tracking-[0.2em] hover:text-white transition-colors">Return to App</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-12 px-6 pb-20 max-w-7xl mx-auto">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-4 bg-bg-secondary/40 rounded-2xl text-text-primary hover:text-primary-accent border border-white/5 transition-all shadow-xl group">
                        <ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Owner Portal</h1>
                        <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-1 opacity-60">System Registry Maintenance</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="bg-card-gradient rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <ArchiveBoxIcon className="w-6 h-6 text-primary-accent" />
                            Registry Integrity Audits
                        </h2>
                        {isGenerating && (
                            <div className="flex items-center gap-3 bg-primary-accent/10 px-4 py-2 rounded-full border border-primary-accent/20">
                                <ArrowPathIcon className="w-4 h-4 text-primary-accent animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">Scanning Registry...</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_airtime_tv', 'Missing TV Airtime')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <ClockIcon className="w-6 h-6 text-amber-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Missing Airtime</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">TV Shows Only</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_runtime_ep', 'Missing Episode Runtimes')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <HourglassIcon className="w-6 h-6 text-rose-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Ep Runtime Gap</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">TV Episodes</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_runtime_movie', 'Missing Movie Runtimes')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <FilmIcon className="w-6 h-6 text-sky-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Movie Runtime</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Movie Details</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_airdate_movie', 'Missing Movie Airdates')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <CalendarIcon className="w-6 h-6 text-emerald-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Movie Airdates</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Movie Details</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_airdate_ep', 'Missing Episode Airdates')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <ListBulletIcon className="w-6 h-6 text-purple-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Episode Airdates</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">TV Episodes</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('no_recs_movie', 'Movie Discovery Gaps')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <SparklesIcon className="w-6 h-6 text-blue-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Movie Rec Gaps</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Discovery Tab</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('no_recs_tv', 'TV Discovery Gaps')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <SparklesIcon className="w-6 h-6 text-red-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">TV Rec Gaps</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Discovery Tab</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_cast_images', 'Missing Talent Visuals')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <UsersIcon className="w-6 h-6 text-amber-500 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Talent Portait Audit</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Cast & Crew Tab</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_poster_tv', 'Missing TV Posters')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <PhotoIcon className="w-6 h-6 text-rose-300 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">TV Posters</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Main Detail Page</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_poster_movie', 'Missing Movie Posters')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <PhotoIcon className="w-6 h-6 text-sky-300 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Movie Posters</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Main Detail Page</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_backdrop_tv', 'Missing TV Backdrops')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <PhotoIcon className="w-6 h-6 text-rose-500 mb-4 opacity-50" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">TV Backdrops</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Header Section</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_backdrop_movie', 'Missing Movie Backdrops')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <PhotoIcon className="w-6 h-6 text-sky-500 mb-4 opacity-50" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Movie Backdrops</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Header Section</span>
                         </button>
                    </div>

                    <div className="pt-8 border-t border-white/5">
                         <button 
                            onClick={runFullLibraryDump}
                            className="w-full flex items-center justify-center gap-4 py-5 bg-bg-secondary/40 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-text-primary hover:bg-bg-secondary transition-all"
                        >
                            <ListBulletIcon className="w-5 h-5 text-yellow-400" />
                            Generate Full Library Registry Dump
                        </button>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-card-gradient rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <DocumentTextIcon className="w-6 h-6 text-primary-accent" />
                            Portal Archives
                        </h2>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {downloadedPdfs.length > 0 ? downloadedPdfs.map(report => (
                                <div key={report.id} className="p-4 bg-bg-secondary/40 rounded-2xl border border-white/5 group hover:border-primary-accent/30 transition-all">
                                    <p className="text-[11px] font-black text-text-primary uppercase truncate mb-1">{report.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-bold text-text-secondary opacity-40 uppercase tracking-widest">{new Date(report.timestamp).toLocaleDateString()}</span>
                                        <div className="flex gap-2">
                                            <DownloadIcon className="w-3.5 h-3.5 text-primary-accent" />
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 opacity-20">
                                    <ArchiveBoxIcon className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest">No archives found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-card-gradient rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <InformationCircleIcon className="w-6 h-6 text-primary-accent" />
                            Technical Specs
                        </h2>
                        <button 
                            onClick={generateSupabaseSpecPDF}
                            className="w-full flex items-center justify-center gap-4 py-5 bg-bg-secondary/40 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-text-primary hover:bg-bg-secondary transition-all"
                        >
                            <DownloadIcon className="w-5 h-5 text-primary-accent" />
                            Export Backend Blueprint
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AirtimeManagement;
