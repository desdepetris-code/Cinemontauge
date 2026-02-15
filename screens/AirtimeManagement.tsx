import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserData, TmdbMediaDetails, TmdbMedia, TrackedItem, DownloadedPdf, ReportType, PendingRecommendationCheck } from '../types';
import { getMediaDetails, getSeasonDetails, discoverMediaPaginated } from '../services/tmdbService';
// FIX: Removed non-existent generateAirtimePDF from import to resolve module error
import { generateSupabaseSpecPDF, generateSummaryReportPDF, generateRecTrackingPDF } from '../utils/pdfExportUtils';
import { ChevronLeftIcon, CloudArrowUpIcon, ArchiveBoxIcon, FireIcon, ClockIcon, ArrowPathIcon, InformationCircleIcon, PlayPauseIcon, SparklesIcon, DownloadIcon, PhotoIcon, TvIcon, FilmIcon, SearchIcon, TrashIcon, ListBulletIcon, TrophyIcon, DocumentTextIcon, QuestionMarkCircleIcon, UsersIcon, HourglassIcon, CalendarIcon, CheckCircleIcon, PencilSquareIcon } from '../components/Icons';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { confirmationService } from '../services/confirmationService';
import MissingInfoModal from '../components/MissingInfoModal';
import { uploadAdminReport, fetchGlobalMediaStats, syncRecommendationStatus, fetchGlobalRegistryBatch } from '../services/supabaseClient';
import Logo from '../components/Logo';

interface AirtimeManagementProps {
    onBack: () => void;
    userData: UserData;
    setPendingRecommendationChecks: React.Dispatch<React.SetStateAction<PendingRecommendationCheck[]>>;
    setFailedRecommendationReports: React.Dispatch<React.SetStateAction<TrackedItem[]>>;
}

const MASTER_PIN = "999236855421340";
const BATCH_LIMIT = 100;

/**
 * Action card component with Download/Action button on the far left.
 */
const OwnerActionButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    onClick: () => void;
    disabled?: boolean;
    isLoading?: boolean;
}> = ({ icon, label, sublabel, onClick, disabled, isLoading }) => (
    <button 
        onClick={onClick}
        disabled={disabled || isLoading}
        className="flex items-center gap-6 p-6 bg-bg-secondary/40 rounded-3xl border border-white/10 hover:border-primary-accent/60 transition-all text-left group shadow-xl active:scale-[0.98]"
    >
        <div className="p-4 bg-primary-accent/20 rounded-2xl text-primary-accent group-hover:scale-110 transition-transform">
            {isLoading ? <ArrowPathIcon className="w-8 h-8 animate-spin" /> : icon}
        </div>
        <div className="flex-grow min-w-0">
            <span className="block text-sm font-black text-text-primary uppercase tracking-widest truncate">{label}</span>
            <span className="text-[10px] text-text-secondary opacity-40 uppercase font-bold tracking-tighter mt-1 block">{sublabel}</span>
        </div>
    </button>
);

const AirtimeManagement: React.FC<AirtimeManagementProps> = ({ onBack, userData, setPendingRecommendationChecks, setFailedRecommendationReports }) => {
    const [pin, setPin] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [isGenerating, setIsGenerating] = useState<ReportType | 'library_dump' | 'rec_tracking' | null>(null);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, matches: 0 });
    const [downloadedPdfs, setDownloadedPdfs] = useLocalStorage<DownloadedPdf[]>('cinemontauge_reports', []);
    
    // Tracking Stats
    const [recStats, setRecStats] = useState({ total: 0, pending: 0, completed: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    const [reportOffsets, setReportOffsets] = useLocalStorage<Record<string, any>>('cinemontauge_report_offsets', {
        missing_airtime_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_runtime_ep: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_runtime_movie: { page: 1, index: 0, part: 1, mediaType: 'movie' },
        missing_cast_images: { page: 1, index: 0, part: 1, mediaType: 'tv' }, 
        missing_poster_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_poster_movie: { page: 1, index: 0, part: 1, mediaType: 'movie' }
    });

    useEffect(() => {
        if (isAuthorized) {
            refreshStats();
        }
    }, [isAuthorized]);

    const refreshStats = async () => {
        setLoadingStats(true);
        try {
            const stats = await fetchGlobalMediaStats();
            setRecStats(stats);
        } catch (e) {
            console.error("Failed to fetch registry stats", e);
        } finally {
            setLoadingStats(false);
        }
    };

    /**
     * MASTER RECOMMENDATION CHECKLIST (BATCH 100)
     */
    const runRecTrackingReport = async () => {
        setIsGenerating('rec_tracking' as any);
        try {
            // Fetch next 100 pending items from the global Supabase registry
            const batch = await fetchGlobalRegistryBatch('Pending', BATCH_LIMIT);
            
            if (batch.length === 0) {
                confirmationService.show("All registry items have completed recommendations.");
                return;
            }

            // Map data for PDF rows
            const rows = await Promise.all(batch.map(async (item) => {
                const details = await getMediaDetails(item.tmdb_id, item.media_type as 'tv' | 'movie').catch(() => null);
                return {
                    title: details?.title || details?.name || 'Unknown',
                    type: item.media_type === 'tv' ? 'Series' : 'Film',
                    year: (details?.release_date || details?.first_air_date)?.substring(0, 4) || 'N/A',
                    genres: details?.genres?.map(g => g.name).join(', ') || "N/A",
                    id: item.tmdb_id,
                    status: 'Pending'
                };
            }));

            const { blob, fileName } = generateRecTrackingPDF(rows);
            await uploadAdminReport(fileName, blob);
            
            // Auto-trigger download
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();

            setDownloadedPdfs(prev => [{
                id: `rec-track-${Date.now()}`,
                title: `Batch Run: ${rows.length} Pending Recommendations`,
                timestamp: new Date().toISOString(),
                part: 1,
                rows: [] 
            }, ...prev]);

            confirmationService.show(`Registry Master Checklist Generated (Batch of ${rows.length}).`);
        } catch (e) {
            console.error(e);
            alert("Tracking report generation failed.");
        } finally {
            setIsGenerating(null);
        }
    };

    /**
     * TECHNICAL AUDIT (BATCH 100)
     */
    const runAuditReport = async (type: ReportType, label: string) => {
        setIsGenerating(type);
        setScanProgress({ current: 0, total: 0, matches: 0 });
        const rows: { title: string; status: string; details: string }[] = [];
        const offset = reportOffsets[type] || { page: 1, index: 0, part: 1, mediaType: 'tv' };
        
        let totalScanned = 0;
        let matchesFound = 0;
        
        try {
            let currentPage = offset.page;
            // Scan up to 10 pages or until 100 matches are found
            while (matchesFound < BATCH_LIMIT && currentPage < offset.page + 10) {
                const data = await discoverMediaPaginated(offset.mediaType, { page: currentPage, sortBy: 'popularity.desc' });
                if (!data || data.results.length === 0) break;

                for (let i = (currentPage === offset.page ? offset.index : 0); i < data.results.length; i++) {
                    const item = data.results[i];
                    totalScanned++;
                    setScanProgress({ current: totalScanned, total: 500, matches: matchesFound });
                    
                    let isMatch = false;
                    let findings = "";

                    switch (type) {
                        case 'missing_airtime_tv': {
                            const details = await getMediaDetails(item.id, 'tv');
                            if (details.status === 'Returning Series' && !details.next_episode_to_air && !AIRTIME_OVERRIDES[item.id]) {
                                isMatch = true; findings = "Returning series with no next episode date.";
                            }
                            break;
                        }
                        case 'missing_runtime_ep': {
                            const details = await getMediaDetails(item.id, 'tv');
                            if (details.seasons) {
                                const lastSeason = details.seasons.find(s => s.season_number === details.last_episode_to_air?.season_number);
                                if (lastSeason) {
                                    const sd = await getSeasonDetails(item.id, lastSeason.season_number);
                                    if (sd.episodes.some(e => !e.runtime || e.runtime === 0)) { isMatch = true; findings = "Episodes missing runtimes."; }
                                }
                            }
                            break;
                        }
                        case 'missing_cast_images': {
                            const details = await getMediaDetails(item.id, offset.mediaType);
                            if (details.credits?.cast?.some(c => !c.profile_path)) { isMatch = true; findings = "Cast placeholders detected."; }
                            break;
                        }
                        case 'missing_poster_tv':
                        case 'missing_poster_movie': {
                            if (!item.poster_path) { isMatch = true; findings = "Main poster asset is missing."; }
                            break;
                        }
                    }

                    if (isMatch) {
                        rows.push({
                            title: item.title || item.name || 'Unknown',
                            status: "Flagged",
                            details: `TMDB ID: ${item.id} • ${findings}`
                        });
                        matchesFound++;
                    }

                    if (matchesFound >= BATCH_LIMIT) {
                        setReportOffsets(prev => ({
                            ...prev,
                            [type]: { ...prev[type], page: currentPage, index: i + 1 }
                        }));
                        break;
                    }
                }
                if (matchesFound >= BATCH_LIMIT) break;
                currentPage++;
            }

            if (rows.length > 0) {
                const { blob, fileName } = generateSummaryReportPDF(label, rows, {
                    totalScanned,
                    matchesFound,
                    criteria: label,
                    partNumber: offset.part
                });
                
                await uploadAdminReport(fileName, blob).catch(e => console.error(e));
                
                // Auto-trigger download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();

                setDownloadedPdfs(prev => [{
                    id: `rep-${Date.now()}`,
                    title: `${label} (Part ${offset.part})`,
                    timestamp: new Date().toISOString(),
                    part: offset.part,
                    rows: [] 
                }, ...prev]);

                setReportOffsets(prev => ({
                    ...prev,
                    [type]: { ...prev[type], part: (prev[type]?.part || 1) + 1 }
                }));
                confirmationService.show(`Audit Part ${offset.part} Saved to Archive.`);
            } else {
                confirmationService.show(`Current scan window clear for: ${label}`);
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
                        <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-1 opacity-60">System Registry Management</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-8 lg:col-span-2">
                    {/* Recommendation Writing Tracker */}
                    <div className="bg-card-gradient rounded-[2.5rem] p-8 border-2 border-primary-accent/30 shadow-2xl space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-primary-accent/10 rounded-2xl text-primary-accent shadow-inner">
                                    <PencilSquareIcon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter">Recommendation Tracker</h2>
                                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest opacity-60">Manual Workflow (100 Item Batch)</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 bg-bg-primary/40 p-2 rounded-2xl border border-white/5">
                                <div className="text-center px-4">
                                    <span className="block text-xl font-black text-primary-accent">{loadingStats ? "..." : recStats.pending}</span>
                                    <span className="text-[8px] font-black uppercase text-text-secondary opacity-40">Pending</span>
                                </div>
                                <div className="w-px h-8 bg-white/5"></div>
                                <div className="text-center px-4">
                                    <span className="block text-xl font-black text-emerald-400">{loadingStats ? "..." : recStats.completed}</span>
                                    <span className="text-[8px] font-black uppercase text-text-secondary opacity-40">Done</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <OwnerActionButton 
                                icon={<DownloadIcon className="w-8 h-8" />}
                                label="Download Checklist"
                                sublabel="Media_Recommendation_Tracking.pdf"
                                onClick={runRecTrackingReport}
                                isLoading={isGenerating === 'rec_tracking'}
                            />
                            <OwnerActionButton 
                                icon={<ArrowPathIcon className="w-8 h-8" />}
                                label="Regenerate Stats"
                                sublabel="Sync completion metrics with Supabase"
                                onClick={refreshStats}
                                isLoading={loadingStats}
                            />
                        </div>

                        <div className="p-5 bg-primary-accent/5 rounded-2xl border border-primary-accent/10 flex items-start gap-4">
                            <InformationCircleIcon className="w-6 h-6 text-primary-accent flex-shrink-0" />
                            <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                Tracking Rule: Titles marked as <span className="text-primary-accent font-black uppercase">Completed</span> in the editorial ledger are automatically omitted from the master PDF. Batch scans pull exactly 100 Pending items at a time.
                            </p>
                        </div>
                    </div>

                    <div className="bg-card-gradient rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                                <ArchiveBoxIcon className="w-6 h-6 text-primary-accent" />
                                Batch Audit Reports
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <OwnerActionButton 
                                icon={<DownloadIcon className="w-8 h-8" />}
                                label="Scan TV Airtime"
                                sublabel="Detect 100 gaps in series schedule"
                                onClick={() => runAuditReport('missing_airtime_tv', 'Missing TV Airtime')}
                                isLoading={isGenerating === 'missing_airtime_tv'}
                            />
                            <OwnerActionButton 
                                icon={<DownloadIcon className="w-8 h-8" />}
                                label="Scan Ep Runtimes"
                                sublabel="Detect 100 gaps in episode lengths"
                                onClick={() => runAuditReport('missing_runtime_ep', 'Missing Episode Runtimes')}
                                isLoading={isGenerating === 'missing_runtime_ep'}
                            />
                            <OwnerActionButton 
                                icon={<DownloadIcon className="w-8 h-8" />}
                                label="Scan Movie Meta"
                                sublabel="Detect 100 gaps in film runtime"
                                onClick={() => runAuditReport('missing_runtime_movie', 'Missing Movie Runtimes')}
                                isLoading={isGenerating === 'missing_runtime_movie'}
                            />
                            <OwnerActionButton 
                                icon={<DownloadIcon className="w-8 h-8" />}
                                label="Scan Talent Visuals"
                                sublabel="Detect 100 missing cast portraits"
                                onClick={() => runAuditReport('missing_cast_images', 'Missing Talent Visuals')}
                                isLoading={isGenerating === 'missing_cast_images'}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-card-gradient rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-6">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <DocumentTextIcon className="w-6 h-6 text-primary-accent" />
                            Portal Archives
                        </h2>
                        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                            {downloadedPdfs.length > 0 ? downloadedPdfs.map(report => (
                                <div key={report.id} className="p-4 bg-bg-secondary/40 rounded-2xl border border-white/5 group hover:border-primary-accent/30 transition-all flex items-center justify-between">
                                    <div className="min-w-0 flex-grow">
                                        <p className="text-[11px] font-black text-text-primary uppercase truncate mb-1">{report.title}</p>
                                        <span className="text-[8px] font-bold text-text-secondary opacity-40 uppercase tracking-widest">{new Date(report.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <div className="p-2 bg-primary-accent/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DownloadIcon className="w-4 h-4 text-primary-accent" />
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

                    <div className="bg-card-gradient rounded-[2.5rem] p-8 border border-white/10 shadow-2xl space-y-6">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <InformationCircleIcon className="w-6 h-6 text-primary-accent" />
                            Global Export
                        </h2>
                        <button 
                            onClick={generateSupabaseSpecPDF}
                            className="w-full flex items-center gap-4 p-5 bg-bg-secondary/40 border border-white/5 rounded-2xl text-left group transition-all hover:bg-bg-secondary"
                        >
                            <DownloadIcon className="w-6 h-6 text-primary-accent" />
                            <div>
                                <span className="block text-[10px] font-black uppercase text-text-primary">System Blueprint</span>
                                <span className="text-[8px] font-bold text-text-secondary opacity-40 uppercase">Architecture Specification</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AirtimeManagement;
