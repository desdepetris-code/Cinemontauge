
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { UserData, TmdbMediaDetails, TmdbMedia, Episode, TrackedItem, DownloadedPdf, CustomImagePaths, ReportType, CastMember, CrewMember, AppNotification, NotificationSettings } from '../types';
import { getMediaDetails, getSeasonDetails, discoverMediaPaginated } from '../services/tmdbService';
import { generateAirtimePDF, generateSupabaseSpecPDF } from '../utils/pdfExportUtils';
import { ChevronLeftIcon, CloudArrowUpIcon, CheckCircleIcon, ArchiveBoxIcon, FireIcon, ClockIcon, ArrowPathIcon, InformationCircleIcon, PlayPauseIcon, LockClosedIcon, SparklesIcon, DownloadIcon, PhotoIcon, TvIcon, FilmIcon, SearchIcon, XMarkIcon, UserIcon, MegaphoneIcon, TrashIcon, CircleStackIcon, BoltIcon, UsersIcon } from '../components/Icons';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { confirmationService } from '../services/confirmationService';
import * as pushNotificationService from '../services/pushNotificationService';
import BroadcastModal from '../components/BroadcastModal';
import { supabase } from '../services/supabaseClient';
import Logo from '../components/Logo';

interface AirtimeManagementProps {
    onBack: () => void;
    userData: UserData;
}

const MASTER_PIN = "999236855421340";
const DEFAULT_MATCH_LIMIT = 100;
const TEST_PROFILE_ID = '9957fe71-75df-4233-a549-05ecbef52766';

interface ReportOffset {
    page: number;
    index: number;
    part: number;
    mediaType: 'tv' | 'movie';
}

/**
 * Owner portal for registry truth database auditing and system management.
 */
const AirtimeManagement: React.FC<AirtimeManagementProps> = ({ onBack, userData }) => {
    const [pin, setPin] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [isGenerating, setIsGenerating] = useState<ReportType | null>(null);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, matches: 0 });
    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
    const [downloadedPdfs, setDownloadedPdfs] = useLocalStorage<DownloadedPdf[]>('cinemontauge_reports', []);

    // Brand Asset Capture
    const logoRef = useRef<SVGSVGElement>(null);

    // Connection Test State
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testResult, setTestResult] = useState<any>(null);

    const [reportOffsets, setReportOffsets] = useLocalStorage<Record<string, ReportOffset>>('cinemontauge_report_offsets', {
        ongoing: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        hiatus: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        legacy: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        integrity: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        deep_ongoing: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder_tv: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder_movies: { page: 1, index: 0, part: 1, mediaType: 'movie' },
        placeholder_episodes: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        library: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        no_recommendations: { page: 1, index: 0, part: 1, mediaType: 'tv' },
        placeholder_people: { page: 1, index: 0, part: 1, mediaType: 'tv' }
    });

    const deviceCount = useMemo(() => {
        const globalRegistryStr = localStorage.getItem('cinemontauge_global_device_tokens');
        const globalRegistry = globalRegistryStr ? JSON.parse(globalRegistryStr) : [];
        return globalRegistry.length;
    }, []);

    const handleDownloadLogo = () => {
        if (!logoRef.current) {
            console.error("Logo ref is missing");
            return;
        }
        
        try {
            const svg = logoRef.current;
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            
            const exportSize = 1000;
            canvas.width = exportSize;
            canvas.height = exportSize;
            
            const ctx = canvas.getContext("2d");
            if (!ctx) return;

            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const img = new Image();
            const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
            const url = URL.createObjectURL(svgBlob);

            img.onload = () => {
                ctx.drawImage(img, 0, 0, exportSize, exportSize);
                const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
                
                const downloadLink = document.createElement('a');
                downloadLink.href = jpgUrl;
                downloadLink.download = 'cinemontauge-brand-asset.jpg';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                
                URL.revokeObjectURL(url);
                confirmationService.show("Logo exported as 1000px JPEG.");
            };
            img.src = url;
        } catch (error) {
            console.error("Failed to download logo:", error);
            alert("JPEG Export failed. Your browser might be restricting canvas operations.");
        }
    };

    const handleGlobalBroadcast = async (title: string, message: string) => {
        confirmationService.show("Preparing global broadcast...");
        
        try {
            const permission = await pushNotificationService.requestNotificationPermission();
            if (permission === 'granted') {
                await pushNotificationService.triggerLocalNotification(title, message);
            }

            const usersJson = localStorage.getItem('cinemontauge_users');
            const allUsers = usersJson ? JSON.parse(usersJson) : [];
            
            allUsers.forEach((user: any) => {
                const userNotifKey = `notifications_${user.id}`;
                const userNotifsStr = localStorage.getItem(userNotifKey);
                const userNotifs = userNotifsStr ? JSON.parse(userNotifsStr) : [];
                
                const newNotif: AppNotification = {
                    id: `broadcast-${Date.now()}-${user.id}`,
                    type: 'app_update',
                    title: title,
                    description: message,
                    timestamp: new Date().toISOString(),
                    read: false
                };
                localStorage.setItem(userNotifKey, JSON.stringify([newNotif, ...userNotifs].slice(0, 50)));
            });

            confirmationService.show(`Broadcast successfully delivered to ${allUsers.length + 1} users.`);
            setIsBroadcastModalOpen(false);
        } catch (e) {
            console.error(e);
            alert("Broadcast dispatch failed.");
        }
    };

    const runAuditReport = async (type: ReportType, label: string) => {
        setIsGenerating(type);
        setScanProgress({ current: 0, total: 0, matches: 0 });
        const rows: { title: string; status: string; details: string }[] = [];
        const offset = reportOffsets[type];
        
        const seenPeopleIds = new Set<number>();
        
        try {
            let currentPage = offset.page;
            let currentMatches = 0;

            while (currentMatches < DEFAULT_MATCH_LIMIT && currentPage < offset.page + 10) {
                const data = await discoverMediaPaginated(offset.mediaType, { page: currentPage, sortBy: 'popularity.desc' });
                if (!data || data.results.length === 0) break;

                for (let i = (currentPage === offset.page ? offset.index : 0); i < data.results.length; i++) {
                    const item = data.results[i];
                    setScanProgress(prev => ({ ...prev, current: i, total: data.results.length, matches: currentMatches }));
                    
                    if (type === 'ongoing') {
                        const hasTruth = !!AIRTIME_OVERRIDES[item.id];
                        if (!hasTruth) {
                            rows.push({
                                title: item.title || item.name || 'Unknown',
                                status: item.media_type.toUpperCase(),
                                details: `TMDB ID: ${item.id} • Popularity: ${Math.round(item.popularity || 0)}`
                            });
                            currentMatches++;
                        }
                    } else if (type === 'no_recommendations') {
                        // Look for items that have aired recently (last 30 days) and check recommendations
                        const releaseDate = new Date(item.release_date || item.first_air_date || 0);
                        const tenDaysAgo = new Date();
                        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
                        
                        // Check if it aired at least 1 day ago but not more than 30
                        if (releaseDate < new Date() && releaseDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
                            // Fix: Cast item.media_type to 'tv' | 'movie' to match getMediaDetails signature
                            const details = await getMediaDetails(item.id, item.media_type as 'tv' | 'movie');
                            if (!details.recommendations?.results || details.recommendations.results.length === 0) {
                                rows.push({
                                    title: details.title || details.name || 'Unknown',
                                    status: details.media_type.toUpperCase(),
                                    details: `Aired: ${releaseDate.toLocaleDateString()} • ID: ${details.id} • Recommendations Tab is empty.`
                                });
                                currentMatches++;
                            }
                        }
                    } else if (type === 'placeholder_people') {
                        // Scan media and their credits for people without images
                        // Fix: Cast item.media_type to 'tv' | 'movie' to match getMediaDetails signature
                        const details = await getMediaDetails(item.id, item.media_type as 'tv' | 'movie');
                        if (details.credits?.cast) {
                            for (const person of details.credits.cast) {
                                if (!person.profile_path && !seenPeopleIds.has(person.id)) {
                                    seenPeopleIds.add(person.id);
                                    rows.push({
                                        title: person.name,
                                        status: `Person (ID: ${person.id})`,
                                        details: `Character: ${person.character} • On Show/Movie: ${details.title || details.name}`
                                    });
                                    currentMatches++;
                                }
                                if (currentMatches >= DEFAULT_MATCH_LIMIT) break;
                            }
                        }
                    }

                    if (currentMatches >= DEFAULT_MATCH_LIMIT) {
                        setReportOffsets(prev => ({
                            ...prev,
                            [type]: { ...prev[type], page: currentPage, index: i + 1 }
                        }));
                        break;
                    }
                }
                if (currentMatches >= DEFAULT_MATCH_LIMIT) break;
                currentPage++;
                // Artificial delay to prevent TMDB rate limiting during heavy scans
                await new Promise(r => setTimeout(r, 200));
            }

            if (rows.length > 0) {
                generateAirtimePDF(label, rows, offset.part);
                setDownloadedPdfs(prev => [{
                    id: `rep-${Date.now()}`,
                    title: label,
                    timestamp: new Date().toISOString(),
                    part: offset.part,
                    rows
                }, ...prev]);

                setReportOffsets(prev => ({
                    ...prev,
                    [type]: { ...prev[type], part: prev[type].part + 1 }
                }));
                confirmationService.show(`${label} Generated!`);
            } else {
                confirmationService.show(`No ${label} matches found in this scan batch.`);
            }
        } catch (e) {
            console.error(e);
            alert("Report generation failed.");
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
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-6">
                    <button onClick={onBack} className="p-4 bg-bg-secondary/40 rounded-2xl text-text-primary hover:text-primary-accent border border-white/5 transition-all shadow-xl group">
                        <ChevronLeftIcon className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-text-primary uppercase tracking-tighter">Owner Portal</h1>
                        <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-1 opacity-60">Registry Management & Overrides</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-card-gradient rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8 lg:col-span-2">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <ArchiveBoxIcon className="w-6 h-6 text-primary-accent" />
                            Truth Audit Pipeline
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('ongoing', 'Missing Truth (Ongoing)')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <div className="flex items-center justify-between w-full mb-4">
                                <div className={`p-3 rounded-2xl ${isGenerating === 'ongoing' ? 'bg-primary-accent text-on-accent' : 'bg-bg-primary text-amber-400'}`}>
                                    {isGenerating === 'ongoing' ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <ClockIcon className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Part {reportOffsets.ongoing.part}</span>
                            </div>
                            <span className="text-sm font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent transition-colors">Ongoing Audit</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('no_recommendations', 'Movies and show detail pages without recommendations on the tab')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <div className="flex items-center justify-between w-full mb-4">
                                <div className={`p-3 rounded-2xl ${isGenerating === 'no_recommendations' ? 'bg-primary-accent text-on-accent' : 'bg-bg-primary text-sky-400'}`}>
                                    {isGenerating === 'no_recommendations' ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Part {reportOffsets.no_recommendations.part}</span>
                            </div>
                            <span className="text-sm font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent transition-colors">Missing Recommendations</span>
                         </button>

                         <button 
                            disabled={!!isGenerating}
                            onClick={() => runAuditReport('placeholder_people', 'Missing Cast and Crew Images')}
                            className="flex flex-col p-6 bg-bg-secondary/40 rounded-3xl border border-white/5 hover:border-primary-accent/40 transition-all text-left group"
                         >
                            <div className="flex items-center justify-between w-full mb-4">
                                <div className={`p-3 rounded-2xl ${isGenerating === 'placeholder_people' ? 'bg-primary-accent text-on-accent' : 'bg-bg-primary text-rose-400'}`}>
                                    {isGenerating === 'placeholder_people' ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <UsersIcon className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-black text-text-secondary opacity-40 uppercase tracking-widest">Part {reportOffsets.placeholder_people.part}</span>
                            </div>
                            <span className="text-sm font-black text-text-primary uppercase tracking-widest group-hover:text-primary-accent transition-colors">Person Image Audit</span>
                         </button>
                    </div>
                    
                    {isGenerating && (
                        <div className="bg-bg-primary/60 rounded-2xl p-6 border border-primary-accent/20 animate-fade-in shadow-inner">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary-accent">Pipeline Scanning...</span>
                                <span className="text-[10px] font-black text-text-secondary">{scanProgress.matches} matches</span>
                            </div>
                            <div className="w-full bg-bg-secondary rounded-full h-2 overflow-hidden shadow-inner">
                                <div className="bg-accent-gradient h-full rounded-full transition-all duration-300" style={{ width: `${(scanProgress.current / (scanProgress.total || 1)) * 100}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-8">
                    <div className="bg-card-gradient rounded-3xl p-8 border border-white/10 shadow-2xl space-y-6">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <SparklesIcon className="w-6 h-6 text-primary-accent" />
                            Brand Identity
                        </h2>
                        <div className="bg-black/60 rounded-2xl p-6 border border-white/5 flex flex-col items-center">
                            <Logo className="w-32 h-32 mb-6" />
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest text-center mb-6 leading-relaxed">
                                High-res JPEG capture for Google OAuth<br/>Consent & Social Profiles.
                            </p>
                            <button 
                                onClick={handleDownloadLogo}
                                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-primary-accent/10 border border-primary-accent/20 text-primary-accent font-black uppercase tracking-widest text-[10px] hover:bg-primary-accent hover:text-on-accent transition-all shadow-lg active:scale-95"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                Download 1000px JPEG
                            </button>
                        </div>
                    </div>

                    <div className="bg-card-gradient rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8">
                        <h2 className="text-xl font-black text-text-primary uppercase tracking-widest flex items-center gap-3">
                            <BoltIcon className="w-6 h-6 text-yellow-500" />
                            Live Hub
                        </h2>
                        <div className="grid grid-cols-1 gap-3">
                            <button 
                                onClick={() => setIsBroadcastModalOpen(true)}
                                className="w-full flex items-center gap-4 p-4 bg-bg-secondary/40 rounded-2xl border border-white/5 hover:bg-bg-secondary transition-all group"
                            >
                                <div className="p-3 bg-red-500/10 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-on-accent transition-all">
                                    <MegaphoneIcon className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <span className="text-xs font-black uppercase tracking-widest text-text-primary block">Global Broadcast</span>
                                    <span className="text-[9px] font-bold text-text-secondary uppercase tracking-widest opacity-40">Targeting {deviceCount} Devices</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <BroadcastModal 
                isOpen={isBroadcastModalOpen}
                onClose={() => setIsBroadcastModalOpen(false)}
                onSend={handleGlobalBroadcast}
                deviceCount={deviceCount}
            />
            
            <div className="fixed -left-[4000px] top-0 pointer-events-none opacity-0">
                <Logo ref={logoRef} className="w-[1000px] h-[1000px]" />
            </div>
        </div>
    );
};

export default AirtimeManagement;
