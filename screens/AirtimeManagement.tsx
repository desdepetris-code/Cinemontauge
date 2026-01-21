import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UserData, TmdbMediaDetails, TmdbMedia, Episode, TmdbSeasonDetails, TrackedItem } from '../types';
import { getMediaDetails, getSeasonDetails, discoverMediaPaginated } from '../services/tmdbService';
import { generateAirtimePDF } from '../utils/pdfExportUtils';
import { ChevronLeftIcon, CloudArrowUpIcon, CheckCircleIcon, ArchiveBoxIcon, FireIcon, ClockIcon, ArrowPathIcon, InformationCircleIcon, PlayPauseIcon, LockClosedIcon, SparklesIcon } from '../components/Icons';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';
import { useLocalStorage } from '../hooks/useLocalStorage';
// Add missing confirmationService import
import { confirmationService } from '../services/confirmationService';

interface AirtimeManagementProps {
    onBack: () => void;
    userData: UserData;
}

type ReportType = 'ongoing' | 'hiatus' | 'past' | 'legacy' | 'integrity' | 'deep_ongoing';

const MASTER_PIN = "999236855421340";
// Approx rows per 10 pages (Shows + Episodes + Spacing)
const CHUNK_SIZE = 250;

const AirtimeManagement: React.FC<AirtimeManagementProps> = ({ onBack, userData }) => {
    const [pin, setPin] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [isGenerating, setIsGenerating] = useState<ReportType | null>(null);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, matches: 0 });

    // Persistent storage for where we are in each report
    const [reportOffsets, setReportOffsets] = useLocalStorage<Record<string, number>>('sceneit_report_offsets', {
        ongoing: 0,
        hiatus: 0,
        legacy: 0,
        integrity: 0,
        deep_ongoing: 0
    });

    const allLibraryItems = useMemo(() => {
        const combined = [
            ...(userData.watching || []),
            ...(userData.planToWatch || []),
            ...(userData.completed || []),
            ...(userData.allCaughtUp || []),
            ...(userData.onHold || []),
            ...(userData.dropped || []),
            ...(userData.favorites || [])
        ];
        return Array.from(new Map(combined.map(i => [i.id, i])).values());
    }, [userData]);

    const handlePinInput = useCallback((digit: string) => {
        setPin(prev => {
            if (prev.length >= 15) return prev;
            const newPin = prev + digit;
            if (newPin.length === 15) {
                if (newPin === MASTER_PIN) {
                    setIsAuthorized(true);
                    setPinError(false);
                } else {
                    setPinError(true);
                    setTimeout(() => { setPin(''); setPinError(false); }, 1000);
                }
            }
            return newPin;
        });
    }, []);

    useEffect(() => {
        if (isAuthorized) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (/^\d$/.test(e.key)) handlePinInput(e.key);
            else if (e.key === 'Backspace') setPin(prev => prev.slice(0, -1));
            else if (e.key === 'Escape') setPin('');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAuthorized, handlePinInput]);

    const auditShow = async (item: TmdbMediaDetails | TrackedItem, type: string, rows: any[], dates: any) => {
        const show: TmdbMediaDetails | null = (item as any).status 
            ? (item as TmdbMediaDetails) 
            : await getMediaDetails(item.id, 'tv').catch(() => null);
        
        if (!show) return 0;

        const isDeepScan = type === 'integrity' || type === 'deep_ongoing' || type === 'legacy';
        const seasonsToScan = isDeepScan 
            ? (show.seasons?.filter(s => s.season_number > 0) || []) 
            : [{ season_number: show.next_episode_to_air?.season_number || show.last_episode_to_air?.season_number || 1 }];

        let matchCount = 0;

        for (const s of seasonsToScan) {
            try {
                const seasonDetails = await getSeasonDetails(show.id, s.season_number);
                const hasOverride = !!AIRTIME_OVERRIDES[show.id];

                const missingEpisodes = seasonDetails.episodes.filter(ep => {
                    const epKey = `S${ep.season_number}E${ep.episode_number}`;
                    const isAlreadyManaged = hasOverride && (AIRTIME_OVERRIDES[show.id].episodes?.[epKey] || AIRTIME_OVERRIDES[show.id].time);
                    if (isAlreadyManaged) return false;

                    if (type === 'ongoing') {
                        if (!ep.air_date) return false;
                        const epDate = new Date(ep.air_date);
                        return epDate >= dates.sevenDaysAgo && epDate <= dates.sevenDaysFromNow;
                    }
                    if (type === 'deep_ongoing') {
                        if (ep.air_date) {
                            const epDate = new Date(ep.air_date);
                            const isUrgent = epDate >= dates.sevenDaysAgo && epDate <= dates.sevenDaysFromNow;
                            if (isUrgent) return false;
                        }
                        return true;
                    }
                    if (type === 'hiatus') {
                        return !ep.air_date || new Date(ep.air_date) > dates.sevenDaysFromNow;
                    }
                    return true;
                });

                if (missingEpisodes.length > 0) {
                    matchCount++;
                    rows.push({
                        title: `>> ${show.name?.toUpperCase()} (Show ID: ${show.id})`,
                        status: show.status,
                        details: `S${s.season_number} | Missing ${missingEpisodes.length} Truths`
                    });

                    missingEpisodes.forEach(ep => {
                        rows.push({
                            title: `   - E${ep.episode_number}: ${ep.name}`,
                            status: ep.air_date || 'DATE UNKNOWN',
                            details: `Ep ID: ${ep.id}`
                        });
                    });
                }
            } catch (e) {}
        }
        return matchCount;
    };

    const handleResetOffset = (e: React.MouseEvent, type: ReportType) => {
        e.stopPropagation();
        setReportOffsets(prev => ({ ...prev, [type]: 0 }));
        // Correctly call confirmationService
        confirmationService.show(`Progress reset for ${type} report.`);
    };

    const handleGenerateReport = async (type: ReportType) => {
        setIsGenerating(type);
        setScanProgress({ current: 0, total: 0, matches: 0 });

        try {
            let reportTitle = "";
            let rows: any[] = [];
            const now = new Date();
            const dates = {
                sevenDaysFromNow: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)),
                sevenDaysAgo: new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000))
            };

            const STATUS_ONGOING = ['Returning Series', 'In Production', 'Planned', 'Pilot'];
            const STATUS_LEGACY = ['Ended', 'Canceled'];

            const currentOffset = reportOffsets[type] || 0;

            if (type === 'integrity') {
                reportTitle = "Master Integrity Scan: Personal Library Gaps";
                const shows = allLibraryItems.filter(i => i.media_type === 'tv');
                setScanProgress({ current: 0, total: shows.length, matches: 0 });
                let matches = 0;
                for (const show of shows) {
                    matches += await auditShow(show, type, rows, dates);
                    setScanProgress(p => ({ ...p, current: p.current + 1, matches }));
                }
            } else if (type === 'past') {
                reportTitle = "Owner Status Check: Library Summary";
                const details = await Promise.all(allLibraryItems.filter(i => i.media_type === 'tv').map(i => getMediaDetails(i.id, 'tv').catch(() => null)));
                rows = details.filter((d): d is TmdbMediaDetails => d !== null).map(d => ({
                    title: d.name || '',
                    status: d.status,
                    details: `ID: ${d.id} | Seasons: ${d.number_of_seasons}`
                }));
            } else {
                const statusFilter = type === 'legacy' ? STATUS_LEGACY : STATUS_ONGOING;
                reportTitle = type === 'legacy' ? "Missing Truths: Legacy Archive" : 
                              type === 'ongoing' ? "Missing Truths: Global Urgent" :
                              type === 'hiatus' ? "Missing Truths: Global Hiatus" : "Missing Truths: Deep Archive";

                const firstPage = await discoverMediaPaginated('tv', { sortBy: 'popularity.desc', page: 1 });
                const totalPages = Math.min(firstPage.total_pages, 500); 
                setScanProgress({ current: 1, total: totalPages, matches: 0 });

                let matches = 0;
                for (let page = 1; page <= totalPages; page++) {
                    const data = await discoverMediaPaginated('tv', { sortBy: 'popularity.desc', page });
                    for (const result of data.results) {
                        const details = await getMediaDetails(result.id, 'tv').catch(() => null);
                        if (details && statusFilter.includes(details.status)) {
                            matches += await auditShow(details, type, rows, dates);
                        }
                    }
                    setScanProgress(p => ({ ...p, current: page, matches }));
                    // Performance hint: If we've found enough to fill several "parts" and we're far past our offset,
                    // we could stop early. But for "Get everything", we scan all then slice.
                }
            }

            if (rows.length === 0) {
                alert(`Perfect Coverage! No missing data found.`);
                setReportOffsets(prev => ({ ...prev, [type]: 0 }));
                return;
            }

            // Implementation of 10-page "Remember Me" Chunking
            const sliceToExport = rows.slice(currentOffset, currentOffset + CHUNK_SIZE);
            
            if (sliceToExport.length === 0) {
                if (currentOffset > 0) {
                    alert("You've reached the end of this report. Resetting to Part 1.");
                    setReportOffsets(prev => ({ ...prev, [type]: 0 }));
                } else {
                    alert("No missing data found.");
                }
                return;
            }

            const processedCount = generateAirtimePDF(reportTitle, sliceToExport, 10);
            
            // Update offset only if we processed a full chunk or hit the end
            const newOffset = currentOffset + processedCount;
            setReportOffsets(prev => ({ ...prev, [type]: newOffset >= rows.length ? 0 : newOffset }));

            if (newOffset < rows.length) {
                // Correctly call confirmationService
                confirmationService.show(`Part 10-page Segment Saved. Next click will start at Part ${Math.ceil(newOffset/CHUNK_SIZE) + 1}.`);
            } else {
                // Correctly call confirmationService
                confirmationService.show("Report complete! Resetting to Part 1.");
            }

        } catch (err) {
            console.error("PDF Gen Error:", err);
            alert("Report generation failed.");
        } finally {
            setIsGenerating(null);
        }
    };

    const getProgressText = (type: ReportType) => {
        if (isGenerating === type) {
            if (scanProgress.total === 0) return "Initializing...";
            return `Scanning: ${scanProgress.current}/${scanProgress.total} | Found: ${scanProgress.matches}`;
        }
        const offset = reportOffsets[type] || 0;
        if (offset === 0) return null;
        return `Current Progress: Part ${Math.ceil(offset/CHUNK_SIZE) + 1}`;
    };

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in px-6">
                <div className="bg-bg-secondary/40 border border-white/10 rounded-[3rem] p-10 w-full max-w-sm shadow-2xl text-center backdrop-blur-xl">
                    <div className={`w-20 h-20 rounded-3xl mx-auto mb-8 flex items-center justify-center transition-all duration-500 ${pinError ? 'bg-red-500 animate-shake' : 'bg-primary-accent shadow-[0_0_30px_rgba(var(--color-accent-primary-rgb),0.4)]'}`}>
                        <LockClosedIcon className="w-10 h-10 text-on-accent" />
                    </div>
                    <h2 className="text-2xl font-black text-text-primary uppercase tracking-tighter mb-2">Master Key</h2>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-8">Type or click to unlock portal</p>
                    <div className="flex justify-center gap-1.5 mb-10">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-primary-accent scale-110 shadow-[0_0_8px_var(--color-accent-primary)]' : 'bg-white/10'}`}></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "DEL"].map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    if (key === "CLR") setPin("");
                                    else if (key === "DEL") setPin(prev => prev.slice(0, -1));
                                    else handlePinInput(key);
                                }}
                                className={`h-14 rounded-2xl font-black text-lg transition-all active:scale-90 flex items-center justify-center ${key === "CLR" || key === "DEL" ? 'bg-white/5 text-[10px] uppercase tracking-widest text-text-secondary' : 'bg-bg-primary/60 text-text-primary border border-white/5 hover:border-primary-accent/40 shadow-lg'}`}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={onBack} className="mt-8 text-xs font-black uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors">Return to Safety</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-6 pb-20">
            <header className="flex items-center mb-10 relative">
                <button onClick={onBack} className="absolute left-0 p-3 bg-bg-secondary rounded-full text-text-primary hover:text-primary-accent transition-all">
                    <ChevronLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-4xl font-black text-text-primary text-center w-full uppercase tracking-tighter">Owner Portal</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                    <div className="bg-primary-accent/10 border border-primary-accent/20 rounded-3xl p-8 shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <CheckCircleIcon className="w-8 h-8 text-primary-accent" />
                            <h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">Active Truths</h2>
                        </div>
                        <p className="text-sm text-text-secondary font-medium leading-relaxed">
                            System airtimes currently overridden. All global reports automatically skip these entries.
                        </p>
                        <div className="mt-6 flex items-baseline gap-2">
                            <span className="text-5xl font-black text-text-primary">{Object.keys(AIRTIME_OVERRIDES).length}</span>
                            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Profiles</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-text-secondary opacity-60 px-2">High-Priority Scans</h2>
                        
                        <div className="relative group">
                            <button 
                                onClick={() => handleGenerateReport('integrity')}
                                disabled={isGenerating !== null}
                                className="w-full flex items-center justify-between p-6 bg-white text-black rounded-3xl hover:bg-slate-100 transition-all shadow-2xl relative overflow-hidden"
                            >
                                <div className="flex items-center gap-4 text-left relative z-10">
                                    <div className="p-3 bg-black/5 rounded-xl">
                                        <SparklesIcon className="w-6 h-6 text-black" />
                                    </div>
                                    <div className="min-w-0 pr-10">
                                        <span className="text-sm font-black uppercase tracking-widest truncate block">Library Integrity Scan</span>
                                        <p className="text-[10px] font-bold uppercase opacity-60">{getProgressText('integrity') || 'Audit 100% of your personal lists'}</p>
                                    </div>
                                </div>
                                {isGenerating === 'integrity' ? <ArrowPathIcon className="w-5 h-5 animate-spin relative z-10" /> : <CloudArrowUpIcon className="w-5 h-5 relative z-10" />}
                            </button>
                            {(reportOffsets.integrity || 0) > 0 && (
                                <button onClick={(e) => handleResetOffset(e, 'integrity')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-full z-20 shadow-lg hover:bg-red-600 transition-colors" title="Reset progress to Part 1">
                                    <ArrowPathIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="relative group">
                            <button 
                                onClick={() => handleGenerateReport('deep_ongoing')}
                                disabled={isGenerating !== null}
                                className="w-full flex items-center justify-between p-6 bg-primary-accent text-on-accent rounded-3xl hover:brightness-110 transition-all group shadow-2xl relative overflow-hidden"
                            >
                                <div className="flex items-center gap-4 text-left relative z-10">
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        <ArchiveBoxIcon className="w-6 h-6" />
                                    </div>
                                    <div className="min-w-0 pr-10">
                                        <span className="text-sm font-black uppercase tracking-widest truncate block">Deep Archive: Ongoing</span>
                                        <p className="text-[10px] font-bold uppercase opacity-80">{getProgressText('deep_ongoing') || 'Audit all past seasons of active shows'}</p>
                                    </div>
                                </div>
                                {isGenerating === 'deep_ongoing' ? <ArrowPathIcon className="w-5 h-5 animate-spin relative z-10" /> : <CloudArrowUpIcon className="w-5 h-5 relative z-10" />}
                            </button>
                            {(reportOffsets.deep_ongoing || 0) > 0 && (
                                <button onClick={(e) => handleResetOffset(e, 'deep_ongoing')} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-on-accent text-primary-accent rounded-full z-20 shadow-lg hover:bg-red-600 hover:text-white transition-colors" title="Reset progress to Part 1">
                                    <ArrowPathIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-text-secondary opacity-60 px-2 mb-2">Global Discovery Reports (10-Page Chunks)</h2>
                    
                    <div className="relative">
                        <button 
                            onClick={() => handleGenerateReport('ongoing')}
                            disabled={isGenerating !== null}
                            className="w-full flex items-center justify-between p-5 bg-bg-secondary/40 border border-white/5 rounded-2xl hover:border-primary-accent/30 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-500/20 rounded-xl text-red-500">
                                    <FireIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left min-w-0">
                                    <span className="text-xs font-black text-text-primary uppercase tracking-widest">Urgent (±7 Days)</span>
                                    <p className="text-[9px] text-text-secondary font-bold uppercase mt-0.5">{getProgressText('ongoing') || 'Scanning all discovery pages'}</p>
                                </div>
                            </div>
                            {isGenerating === 'ongoing' ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CloudArrowUpIcon className="w-4 h-4 opacity-20 group-hover:opacity-100" />}
                        </button>
                        {(reportOffsets.ongoing || 0) > 0 && (
                            <button onClick={(e) => handleResetOffset(e, 'ongoing')} className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 bg-bg-primary text-text-secondary rounded-full hover:text-red-500 transition-colors" title="Reset to Part 1">
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => handleGenerateReport('hiatus')}
                            disabled={isGenerating !== null}
                            className="w-full flex items-center justify-between p-5 bg-bg-secondary/40 border border-white/5 rounded-2xl hover:border-primary-accent/30 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                    <PlayPauseIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left min-w-0">
                                    <span className="text-xs font-black text-text-primary uppercase tracking-widest">Global Hiatus Backlog</span>
                                    <p className="text-[9px] text-text-secondary font-bold uppercase mt-0.5">{getProgressText('hiatus') || 'Scanning all discovery pages'}</p>
                                </div>
                            </div>
                            {isGenerating === 'hiatus' ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CloudArrowUpIcon className="w-4 h-4 opacity-20 group-hover:opacity-100" />}
                        </button>
                        {(reportOffsets.hiatus || 0) > 0 && (
                            <button onClick={(e) => handleResetOffset(e, 'hiatus')} className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 bg-bg-primary text-text-secondary rounded-full hover:text-red-500 transition-colors" title="Reset to Part 1">
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="relative">
                        <button 
                            onClick={() => handleGenerateReport('legacy')}
                            disabled={isGenerating !== null}
                            className="w-full flex items-center justify-between p-5 bg-bg-secondary/40 border border-white/5 rounded-2xl hover:border-primary-accent/30 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-500/20 rounded-xl text-slate-500">
                                    <ArchiveBoxIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left min-w-0">
                                    <span className="text-xs font-black text-text-primary uppercase tracking-widest">Legacy/Ended Gaps</span>
                                    <p className="text-[9px] text-text-secondary font-bold uppercase mt-0.5">{getProgressText('legacy') || 'Scanning all discovery pages'}</p>
                                </div>
                            </div>
                            {isGenerating === 'legacy' ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CloudArrowUpIcon className="w-4 h-4 opacity-20 group-hover:opacity-100" />}
                        </button>
                        {(reportOffsets.legacy || 0) > 0 && (
                            <button onClick={(e) => handleResetOffset(e, 'legacy')} className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 bg-bg-primary text-text-secondary rounded-full hover:text-red-500 transition-colors" title="Reset to Part 1">
                                <ArrowPathIcon className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <button 
                        onClick={() => handleGenerateReport('past')}
                        disabled={isGenerating !== null}
                        className="w-full flex items-center justify-between p-5 bg-bg-secondary/40 border border-white/5 rounded-2xl hover:border-primary-accent/30 transition-all group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-500">
                                <ClockIcon className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <span className="text-xs font-black text-text-primary uppercase tracking-widest">System Audit</span>
                                <p className="text-[9px] text-text-secondary font-bold uppercase mt-0.5">Full library status summary</p>
                            </div>
                        </div>
                        {isGenerating === 'past' ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <CloudArrowUpIcon className="w-4 h-4 opacity-20 group-hover:opacity-100" />}
                    </button>
                </section>
            </div>
            
            <div className="mt-12 p-8 bg-bg-secondary/10 rounded-3xl border-2 border-dashed border-white/5">
                <h3 className="text-lg font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                    <InformationCircleIcon className="w-5 h-5 text-primary-accent" />
                    Pagination Memory
                </h3>
                <ol className="mt-6 space-y-4 text-sm text-text-secondary font-medium">
                    <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary-accent/20 text-primary-accent flex items-center justify-center flex-shrink-0 text-xs font-black">1</span>
                        Reports now remember your last download. Click the report button again to download the <span className="text-text-primary font-bold">next 10-page chunk</span>.
                    </li>
                    <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary-accent/20 text-primary-accent flex items-center justify-center flex-shrink-0 text-xs font-black">2</span>
                        To restart an audit from Part 1, click the <span className="text-text-primary font-bold">reset icon</span> that appears next to the progress indicator.
                    </li>
                    <li className="flex gap-4">
                        <span className="w-6 h-6 rounded-full bg-primary-accent/20 text-primary-accent flex items-center justify-center flex-shrink-0 text-xs font-black">3</span>
                        Updating a show in <span className="text-text-primary font-bold">data/airtimeOverrides.ts</span> permanently clears it from all PDF parts upon your next scan.
                    </li>
                </ol>
            </div>
        </div>
    );
};

export default AirtimeManagement;