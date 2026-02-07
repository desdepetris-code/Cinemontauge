import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UserData, TmdbMediaDetails, TmdbMedia, Episode, TrackedItem, DownloadedPdf, CustomImagePaths, ReportType, CastMember, CrewMember, AppNotification, NotificationSettings, PendingRecommendationCheck } from '../types';
import { getMediaDetails, getSeasonDetails, discoverMediaPaginated, getTrending } from '../services/tmdbService';
import { generateAirtimePDF, generateSupabaseSpecPDF, generateSummaryReportPDF } from '../utils/pdfExportUtils';
import { ChevronLeftIcon, CloudArrowUpIcon, CheckCircleIcon, ArchiveBoxIcon, FireIcon, ClockIcon, ArrowPathIcon, InformationCircleIcon, PlayPauseIcon, LockClosedIcon, SparklesIcon, DownloadIcon, PhotoIcon, TvIcon, FilmIcon, SearchIcon, XMarkIcon, UserIcon, MegaphoneIcon, TrashIcon, CircleStackIcon, BoltIcon, UsersIcon, ListBulletIcon, TrophyIcon, DocumentTextIcon, QuestionMarkCircleIcon } from '../components/Icons';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { confirmationService } from '../services/confirmationService';
import * as pushNotificationService from '../services/pushNotificationService';
import BroadcastModal from '../components/BroadcastModal';
import MissingInfoModal from '../components/MissingInfoModal';
import { supabase, uploadAdminReport } from '../services/supabaseClient';
import Logo from '../components/Logo';

interface AirtimeManagementProps {
    onBack: () => void;
    userData: UserData;
    setPendingRecommendationChecks: React.Dispatch<React.SetStateAction<PendingRecommendationCheck[]>>;
    setFailedRecommendationReports: React.Dispatch<React.SetStateAction<TrackedItem[]>>;
}

const MASTER_PIN = "999236855421340";
const DEFAULT_MATCH_LIMIT = 100;

/**
 * Owner portal for registry truth database auditing and system management.
 */
const AirtimeManagement: React.FC<AirtimeManagementProps> = ({ onBack, userData, setPendingRecommendationChecks, setFailedRecommendationReports }) => {
    const [pin, setPin] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [isGenerating, setIsGenerating] = useState<ReportType | 'library_dump' | 'recommendation_audit' | 'rec_gap_report' | 'cast_crew_audit' | null>(null);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, matches: 0 });
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState(false);
    const [downloadedPdfs, setDownloadedPdfs] = useLocalStorage<DownloadedPdf[]>('cinemontauge_reports', []);

    const [reportOffsets, setReportOffsets] = useLocalStorage<Record<string, any>>('cinemontauge_report_offsets', {
        ongoing: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        hiatus: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder_movies: { page: 1, index: 0, part: 1, mediaType: 'movie' },
        placeholder_people: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        no_recommendations: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_airtime: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        missing_status: { page: 1, index: 0, part: 1, mediaType: 'tv' }
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

    const runRecommendationAudit = async () => {
        setIsGenerating('recommendation_audit');
        const pending = [...userData.pendingRecommendationChecks];
        const failed = [...userData.failedRecommendationReports];
        const now = new Date();
        
        let checkedCount = 0;
        const totalToCheck = pending.length;
        
        const newPending: PendingRecommendationCheck[] = [];
        const newlyFailed: TrackedItem[] = [];

        for (const check of pending) {
            checkedCount++;
            setScanProgress({ current: checkedCount, total: totalToCheck, matches: failed.length });
            
            const lastCheckDate = new Date(check.lastCheckedDate);
            const diffInHours = (now.getTime() - lastCheckDate.getTime()) / (1000 * 60 * 60);
            
            if (diffInHours < 24) {
                newPending.push(check);
                continue;
            }

            try {
                const details = await getMediaDetails(check.id, check.mediaType);
                const hasRecs = details.recommendations?.results && details.recommendations.results.length > 0;
                
                if (hasRecs) {
                    continue; 
                } else {
                    if (check.retryCount >= 10) {
                        newlyFailed.push({
                            id: check.id,
                            title: check.title,
                            media_type: check.mediaType,
                            poster_path: check.poster_path,
                            addedAt: new Date().toISOString()
                        });
                    } else {
                        newPending.push({
                            ...check,
                            lastCheckedDate: now.toISOString(),
                            retryCount: check.retryCount + 1
                        });
                    }
                }
            } catch (e) {
                newPending.push({ ...check, lastCheckedDate: now.toISOString() });
            }
            await new Promise(r => setTimeout(r, 200));
        }

        setPendingRecommendationChecks(newPending);
        if (newlyFailed.length > 0) {
            setFailedRecommendationReports(prev => [...prev, ...newlyFailed]);
        }
        
        setIsGenerating(null);
        confirmationService.show(`Audit complete. ${newlyFailed.length} dead-ends found.`);
    };

    const generateRecGapReport = async () => {
        setIsGenerating('rec_gap_report');
        
        const deadEnds = userData.failedRecommendationReports;
        const currentPending = userData.pendingRecommendationChecks;
        
        const combinedGaps = [
            ...deadEnds.map(i => ({ ...i, note: 'DEAD END (Retried 10 days)' })),
            ...currentPending.map(p => ({ id: p.id, title: p.title, media_type: p.mediaType, note: `PENDING (Day ${p.retryCount}/10)` }))
        ];

        if (combinedGaps.length === 0) {
            confirmationService.show("Registry health check: No recommendation gaps found.");
            setIsGenerating(null);
            return;
        }

        const rows = combinedGaps.map(item => ({
            title: item.title,
            status: item.id.toString(),
            details: `Registry Sector: ${item.media_type.toUpperCase()} • Status: ${item.note}`
        }));

        const title = "movie and show detail pages without recommendations";
        const { blob, fileName } = generateSummaryReportPDF(
            title, 
            rows, 
            {
                totalScanned: combinedGaps.length,
                matchesFound: rows.length,
                criteria: "Missing TMDB Recommendations following airing/registry insertion.",
                partNumber: 1
            }
        );

        const reportId = `rep-rec-${Date.now()}`;
        setDownloadedPdfs(prev => [{
            id: reportId,
            title: title,
            timestamp: new Date().toISOString(),
            part: 1,
            rows: [] 
        }, ...prev]);

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        setIsGenerating(null);
        confirmationService.show("Gap report generated and saved to portal archives.");
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
                    let itemStatus = "";

                    if (type === 'placeholder_tv' || type === 'placeholder_movies') {
                        if (!item.poster_path || !item.backdrop_path) {
                            isMatch = true;
                            itemStatus = "Missing Media";
                            findings = `Missing: ${!item.poster_path ? '[POSTER]' : ''} ${!item.backdrop_path ? '[BACKDROP]' : ''}`;
                        }
                    } else if (type === 'missing_airtime') {
                        const details = await getMediaDetails(item.id, 'tv');
                        if (details.status === 'Returning Series' && !details.next_episode_to_air) {
                            isMatch = true;
                            itemStatus = "TBA Airtime";
                            findings = "Show is returning but has no scheduled airtime in registry.";
                        }
                    } else if (type === 'missing_status') {
                        const details = await getMediaDetails(item.id, 'tv');
                        if (!details.status || details.status === 'Unknown') {
                            isMatch = true;
                            itemStatus = "Invalid Status";
                            findings = "Registry status is missing or undefined.";
                        }
                    } else if (type === 'no_recommendations') {
                        const details = await getMediaDetails(item.id, item.media_type as 'tv' | 'movie');
                        if (!details.recommendations?.results || details.recommendations.results.length === 0) {
                            isMatch = true;
                            itemStatus = "Rec Gap";
                            findings = "No similar titles found in registry for this item.";
                        }
                    } else if (type === 'placeholder_people') {
                        const details = await getMediaDetails(item.id, 'tv');
                        const placeholders = details.credits?.cast?.filter(c => !c.profile_path).slice(0, 3);
                        if (placeholders && placeholders.length > 0) {
                            isMatch = true;
                            itemStatus = "Person Placeholders";
                            findings = `Cast missing images: ${placeholders.map(p => p.name).join(', ')}`;
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
                    if (totalScanned % 5 === 0) await new Promise(r => setTimeout(r, 50)); 
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
                confirmationService.show(`Registry Audit "${label}" Uploaded to Supabase.`);
            } else {
                confirmationService.show(`Registry is healthy for criteria: ${label}`);
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
                    <button onClick={onBack} className="w-full py-2 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] hover:text-white transition-colors">Return to App</button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-12 px-6 pb-20 max-w-7xl mx-auto">
             <MissingInfoModal 
                isOpen={isMissingInfoModalOpen}
                onClose={() => setIsMissingInfoModalOpen(false)}
                onSend={handleSendMissingInfo}
             />
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
                    <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                        <ArchiveBoxIcon className="w-6 h-6 text-primary-accent" />
                        Automated Data Audits
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('placeholder_tv', 'TV Image Placeholders')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <PhotoIcon className="w-6 h-6 text-rose-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Placeholder Audit</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">TV & Movies</span>
                         </button>

                         <button 
                            onClick={() => setIsMissingInfoModalOpen(true)}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <QuestionMarkCircleIcon className="w-6 h-6 text-emerald-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Missing Information</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Manual Content Gaps</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_airtime', 'Airdates Gap Analysis')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <ClockIcon className="w-6 h-6 text-amber-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Airtime Gaps</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Returning Series</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('missing_status', 'Status Integrity Check')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <PlayPauseIcon className="w-6 h-6 text-sky-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Status Failures</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Registry Core</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={runFullLibraryDump}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <ListBulletIcon className="w-6 h-6 text-yellow-400 mb-4" />
                            <span className="text-xs font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent">Library Registry Dump</span>
                            <span className="text-[9px] text-text-secondary opacity-40 uppercase mt-1">Full Export for Badge Ref</span>
                         </button>
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-6">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <SparklesIcon className="w-6 h-6 text-purple-400" />
                            Recommendation Intelligence
                        </h2>
                        
                        <div className="bg-bg-primary/40 rounded-3xl p-6 border border-white/5 flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex-grow">
                                <p className="text-sm font-bold text-text-primary uppercase tracking-tight">Active Recommendation Monitoring</p>
                                <p className="text-[10px] text-text-secondary font-medium mt-1 leading-relaxed">
                                    Queue: <span className="text-primary-accent font-black">{userData.pendingRecommendationChecks.length} In Progress</span><br />
                                    Dead-Ends: <span className="text-red-400 font-black">{userData.failedRecommendationReports.length} Confirmed</span>
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    disabled={!!isGenerating || userData.pendingRecommendationChecks.length === 0}
                                    onClick={runRecommendationAudit}
                                    className="flex items-center gap-2 px-6 py-3 bg-bg-secondary text-text-primary rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10 hover:border-primary-accent disabled:opacity-30"
                                >
                                    <ArrowPathIcon className={`w-4 h-4 ${isGenerating === 'recommendation_audit' ? 'animate-spin' : ''}`} />
                                    Process Daily Cycle
                                </button>
                                <button 
                                    disabled={!!isGenerating}
                                    onClick={generateRecGapReport}
                                    className="flex items-center gap-2 px-6 py-3 bg-accent-gradient text-on-accent rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:scale-105 transition-transform disabled:opacity-30"
                                >
                                    <DownloadIcon className="w-4 h-4" />
                                    Registry Rec Audit (PDF)
                                </button>
                            </div>
                        </div>
                    </div>

                    {isGenerating && (
                        <div className="p-6 bg-bg-primary/60 rounded-2xl border border-primary-accent/20 animate-fade-in">
                            <p className="text-[10px] font-black uppercase text-primary-accent mb-3">Pipeline processing registry...</p>
                            <div className="w-full bg-bg-secondary rounded-full h-1.5 overflow-hidden">
                                <div className="bg-accent-gradient h-full transition-all duration-300" style={{ width: `${scanProgress.total > 0 ? (scanProgress.current / scanProgress.total) * 100 : 50}%` }}></div>
                            </div>
                            <p className="text-[8px] font-black text-text-secondary/40 mt-2 uppercase tracking-widest">Target matches: {scanProgress.matches}</p>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    <div className="bg-card-gradient rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <DocumentTextIcon className="w-6 h-6 text-primary-accent" />
                            Registry Reports
                        </h2>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                            {downloadedPdfs.length > 0 ? downloadedPdfs.map(report => (
                                <div key={report.id} className="p-4 bg-bg-secondary/40 rounded-2xl border border-white/5 group hover:border-primary-accent/30 transition-all">
                                    <p className="text-[11px] font-black text-text-primary uppercase truncate mb-1">{report.title}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-bold text-text-secondary opacity-40 uppercase tracking-widest">{new Date(report.timestamp).toLocaleDateString()}</span>
                                        <DownloadIcon className="w-3.5 h-3.5 text-primary-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-10 opacity-20">
                                    <ArchiveBoxIcon className="w-10 h-10 mx-auto mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest">No local archives</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-card-gradient rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <InformationCircleIcon className="w-6 h-6 text-primary-accent" />
                            Technical Ops
                        </h2>
                        <button 
                            onClick={generateSupabaseSpecPDF}
                            className="w-full flex items-center justify-center gap-4 py-5 bg-bg-secondary/40 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-text-primary hover:bg-bg-secondary transition-all"
                        >
                            <DownloadIcon className="w-5 h-5 text-primary-accent" />
                            Export Blueprint
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AirtimeManagement;