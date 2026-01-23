import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { UserData, TmdbMediaDetails, TmdbMedia, Episode, TrackedItem, DownloadedPdf, CustomImagePaths, ReportType, CastMember, CrewMember } from '../types';
import { getMediaDetails, getSeasonDetails, discoverMediaPaginated } from '../services/tmdbService';
import { generateAirtimePDF } from '../utils/pdfExportUtils';
import { ChevronLeftIcon, CloudArrowUpIcon, CheckCircleIcon, ArchiveBoxIcon, FireIcon, ClockIcon, ArrowPathIcon, InformationCircleIcon, PlayPauseIcon, LockClosedIcon, SparklesIcon, DownloadIcon, PhotoIcon, TvIcon, FilmIcon, SearchIcon, XMarkIcon, UserIcon } from '../components/Icons';
import { AIRTIME_OVERRIDES } from '../data/airtimeOverrides';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { confirmationService } from '../services/confirmationService';

interface AirtimeManagementProps {
    onBack: () => void;
    userData: UserData;
}

const MASTER_PIN = "999236855421340";
const DEFAULT_MATCH_LIMIT = 100;
const PLACEHOLDER_MATCH_LIMIT = 50;

interface ReportOffset {
    page: number;
    index: number;
    part: number;
    mediaType: 'tv' | 'movie';
}

const AirtimeManagement: React.FC<AirtimeManagementProps> = ({ onBack, userData }) => {
    const [pin, setPin] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [pinError, setPinError] = useState(false);
    const [isGenerating, setIsGenerating] = useState<ReportType | null>(null);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, matches: 0 });
    const [overrideQuery, setOverrideQuery] = useState('');

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

    const [pdfArchive, setPdfArchive] = useLocalStorage<DownloadedPdf[]>('cinemontauge_pdf_archive', []);

    const filteredOverrides = useMemo(() => {
        if (!overrideQuery.trim()) return [];
        const q = overrideQuery.toLowerCase();
        return Object.entries(AIRTIME_OVERRIDES).filter(([id, data]) => {
            return id.includes(q) || data.provider.toLowerCase().includes(q);
        });
    }, [overrideQuery]);

    const libraryStats = useMemo(() => {
        const combined = [...userData.watching, ...userData.onHold, ...userData.allCaughtUp, ...userData.completed];
        const unique = Array.from(new Map(combined.map(i => [i.id, i])).values());
        const tv = unique.filter(i => i.media_type === 'tv');
        const truthVerified = tv.filter(show => !!AIRTIME_OVERRIDES[show.id]);
        return {
            totalShows: tv.length,
            truthVerified: truthVerified.length,
            missingTruths: tv.length - truthVerified.length
        };
    }, [userData]);

    const handlePinInput = useCallback((digit: string) => {
        setPin(prev => {
            if (prev.length >= 15) return prev;
            const newPin = prev + digit;
            if (newPin.length === 15) {
                if (newPin === MASTER_PIN) setIsAuthorized(true);
                else {
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
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isAuthorized, handlePinInput]);

    const auditShow = async (item: TmdbMedia | TmdbMediaDetails | TrackedItem, type: ReportType, rows: any[], dates: any) => {
        const show: TmdbMediaDetails | null = (item as any).status 
            ? (item as TmdbMediaDetails) 
            : await getMediaDetails(item.id, item.media_type as 'tv' | 'movie').catch(() => null);
        
        if (!show) return false;

        if (type === 'placeholder_people') {
            const credits = show.credits;
            if (!credits) return false;
            let found = false;
            const all = [...(credits.cast || []), ...(credits.crew || [])];
            all.forEach(p => {
                if (!p.profile_path) {
                    rows.push({ title: p.name, status: `ID: ${p.id}`, details: `Source: ${show.name || show.title} (${show.id})` });
                    found = true;
                }
            });
            return found;
        }

        if (type === 'no_recommendations') {
            const airDate = new Date(show.media_type === 'tv' ? show.first_air_date || '' : show.release_date || '');
            const tenDaysAfter = new Date(airDate.getTime() + (10 * 24 * 60 * 60 * 1000));
            if (new Date() >= tenDaysAfter && (!show.recommendations?.results?.length)) {
                rows.push({ title: show.name || show.title || '?', status: 'GAP', details: `ID: ${show.id} | Aired: ${airDate.toLocaleDateString()} | No Recs` });
                return true;
            }
            return false;
        }

        if (type === 'placeholder_tv' || type === 'placeholder_movies') {
            const showCustom: any = userData.customImagePaths[show.id];
            const missingP = !show.poster_path && !showCustom?.poster_path;
            const missingB = !show.backdrop_path && !showCustom?.backdrop_path;
            if (missingP || missingB) {
                rows.push({ title: show.name || show.title || '?', status: 'ASSET_GAP', details: `ID: ${show.id} | Missing: ${missingP ? 'Poster ' : ''}${missingB ? 'Backdrop' : ''}` });
                return true;
            }
            return false;
        }

        const hasOverride = !!AIRTIME_OVERRIDES[show.id];
        if (hasOverride) return false;
        if (show.media_type === 'tv') {
            rows.push({ title: show.name || '?', status: show.status, details: `ID: ${show.id} | Network: ${show.networks?.[0]?.name || 'N/A'}` });
            return true;
        }
        return false;
    };

    const handleGenerateReport = async (type: ReportType) => {
        setIsGenerating(type);
        setScanProgress({ current: 0, total: 0, matches: 0 });
        const isLibraryScan = type === 'library';
        const currentMatchLimit = type.startsWith('placeholder_') ? PLACEHOLDER_MATCH_LIMIT : DEFAULT_MATCH_LIMIT;

        try {
            let reportTitle = type === 'no_recommendations' ? "Detail Pages Missing Recommendations" :
                          type === 'placeholder_people' ? "Cast & Crew Placeholder Images" : "CineMontauge Registry Audit";
            let rows: any[] = [];
            const offset = reportOffsets[type];
            let currentMatches = 0;
            let lastPage = offset.page;
            let lastIndex = offset.index;
            let currentMediaType = offset.mediaType || (type === 'placeholder_movies' ? 'movie' : 'tv');

            if (isLibraryScan) {
                const combined = [...userData.watching, ...userData.onHold, ...userData.allCaughtUp, ...userData.completed];
                const unique = Array.from(new Map(combined.filter(i => i.media_type === 'tv').map(i => [i.id, i])).values());
                for (let i = 0; i < unique.length && currentMatches < currentMatchLimit; i++) {
                    if (await auditShow(unique[i], type, rows, {})) currentMatches++;
                    setScanProgress({ current: i + 1, total: unique.length, matches: currentMatches });
                }
            } else {
                const totalPages = 500;
                for (let page = lastPage; page <= totalPages && currentMatches < currentMatchLimit; page++) {
                    const data = await discoverMediaPaginated(currentMediaType, { sortBy: 'popularity.desc', page });
                    const startAt = (page === lastPage) ? lastIndex : 0;
                    for (let i = startAt; i < data.results.length && currentMatches < currentMatchLimit; i++) {
                        if (await auditShow(data.results[i], type, rows, {})) currentMatches++;
                        lastPage = page; lastIndex = i + 1;
                        setScanProgress({ current: page, total: totalPages, matches: currentMatches });
                    }
                    if (page >= totalPages && currentMediaType === 'tv' && type === 'placeholder_people') {
                        currentMediaType = 'movie'; lastPage = 1; lastIndex = 0;
                    }
                }
            }

            if (rows.length > 0) {
                generateAirtimePDF(reportTitle, rows, offset.part);
                const newArchive: DownloadedPdf = { id: `pdf-${Date.now()}`, title: reportTitle, timestamp: new Date().toISOString(), part: offset.part, rows };
                setPdfArchive(prev => [newArchive, ...prev].slice(0, 20));
                setReportOffsets(prev => ({ ...prev, [type]: { page: lastPage, index: lastIndex >= 20 ? 0 : lastIndex, part: offset.part + 1, mediaType: currentMediaType } }));
                confirmationService.show("Registry segment archived.");
            } else alert("No gaps identified in this segment.");

        } catch (err) { console.error(err); alert("Audit failed."); } finally { setIsGenerating(null); }
    };

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] px-4 animate-fade-in">
                <div className="w-full max-w-sm text-center">
                    <div className="mb-8 flex justify-center">
                        <div className={`p-6 rounded-[2rem] bg-bg-secondary/40 border-4 transition-all duration-500 ${pinError ? 'border-red-500 scale-95 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-primary-accent/20 shadow-2xl shadow-primary-accent/10'}`}>
                            <LockClosedIcon className={`w-12 h-12 ${pinError ? 'text-red-500 animate-shake' : 'text-primary-accent'}`} />
                        </div>
                    </div>
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter mb-2">CineMontauge Admin</h2>
                    <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.2em] mb-8 opacity-60">Enter Master Token Sequence</p>
                    <div className="flex justify-center gap-3 mb-10">
                        {Array.from({ length: 15 }).map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${pin.length > i ? 'bg-primary-accent scale-125 shadow-[0_0_8px_var(--color-accent-primary)]' : 'bg-bg-secondary border border-white/10'}`}></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
                            <button key={d} onClick={() => handlePinInput(String(d))} className="py-4 text-xl font-black rounded-2xl bg-bg-secondary/30 border border-white/5 text-text-primary hover:bg-bg-secondary transition-all active:scale-95 shadow-md">{d}</button>
                        ))}
                        <button onClick={() => setPin('')} className="py-4 text-xs font-black uppercase text-red-500 hover:bg-red-500/10 rounded-2xl transition-all">Clear</button>
                        <button onClick={() => handlePinInput('0')} className="py-4 text-xl font-black rounded-2xl bg-bg-secondary/30 border border-white/5 text-text-primary hover:bg-bg-secondary transition-all active:scale-95 shadow-md">0</button>
                        <button onClick={onBack} className="py-4 text-xs font-black uppercase text-text-secondary hover:bg-bg-secondary/10 rounded-2xl transition-all">Exit</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-4xl mx-auto px-6 pb-40">
            <header className="flex items-center mb-10 relative">
                <button onClick={onBack} className="absolute left-0 p-3 bg-bg-secondary rounded-full text-text-primary hover:text-primary-accent transition-all"><ChevronLeftIcon className="h-6 w-6" /></button>
                <h1 className="text-4xl font-black text-text-primary text-center w-full uppercase tracking-tighter">CineMontauge Truth Registry</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                    <button onClick={() => handleGenerateReport('library')} disabled={!!isGenerating} className="w-full flex items-center justify-between p-8 rounded-3xl transition-all shadow-xl bg-accent-gradient text-on-accent hover:brightness-110">
                        <div className="flex items-center gap-4 text-left">
                            <div className="p-3 rounded-2xl bg-white/20"><ArchiveBoxIcon className="w-8 h-8" /></div>
                            <div><span className="text-xl font-black uppercase tracking-tight">Internal Registry Audit</span><p className="text-[10px] font-black uppercase opacity-70">Auditing {libraryStats.totalShows} Library Items</p></div>
                        </div>
                        {isGenerating === 'library' ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <CloudArrowUpIcon className="w-6 h-6" />}
                    </button>

                    <button onClick={() => handleGenerateReport('no_recommendations')} disabled={!!isGenerating} className="w-full flex items-center justify-between p-8 rounded-3xl bg-bg-secondary/40 border border-white/5 hover:border-primary-accent/30 group">
                        <div className="flex items-center gap-4 text-left">
                            <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-500"><SparklesIcon className="w-8 h-8" /></div>
                            <div><span className="text-xl font-black uppercase tracking-tight text-text-primary">Rec Discovery Gaps</span><p className="text-[10px] font-black uppercase text-text-secondary opacity-70">Pages Without Recommendations</p></div>
                        </div>
                        {isGenerating === 'no_recommendations' ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <DownloadIcon className="w-6 h-6 opacity-40 group-hover:opacity-100" />}
                    </button>
                    
                    <div className="p-8 bg-primary-accent/10 border border-primary-accent/20 rounded-3xl shadow-xl">
                        <div className="flex items-center gap-4 mb-4"><CheckCircleIcon className="w-8 h-8 text-primary-accent" /><h2 className="text-2xl font-black text-text-primary uppercase tracking-tight">CineMontauge Coverage</h2></div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-4 bg-bg-primary/40 rounded-2xl border border-white/5"><span className="text-2xl font-black text-text-primary block">{libraryStats.truthVerified}</span><span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Verified</span></div>
                            <div className="p-4 bg-bg-primary/40 rounded-2xl border border-white/5"><span className="text-2xl font-black text-red-500 block">{libraryStats.missingTruths}</span><span className="text-[8px] font-black text-text-secondary uppercase tracking-widest">Truth Gaps</span></div>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-text-secondary opacity-60 px-2 mb-2">CineMontauge Asset Analysis</h2>
                    {[
                        { id: 'placeholder_tv', icon: <TvIcon className="w-6 h-6" />, label: 'TV Meta Gaps' },
                        { id: 'placeholder_movies', icon: <FilmIcon className="w-6 h-6" />, label: 'Movie Meta Gaps' },
                        { id: 'placeholder_people', icon: <UserIcon className="w-6 h-6" />, label: 'Person Meta Gaps' }
                    ].map(type => (
                        <button key={type.id} onClick={() => handleGenerateReport(type.id as ReportType)} disabled={!!isGenerating} className="w-full flex items-center justify-between p-5 rounded-3xl transition-all shadow-2xl bg-sky-500 text-white hover:brightness-110">
                            <div className="flex items-center gap-4 text-left">
                                <div className="p-3 rounded-xl bg-white/10">{type.icon}</div>
                                <div><span className="text-xs font-black uppercase tracking-widest">{type.label}</span><p className="text-[9px] font-bold uppercase opacity-60">{isGenerating === type.id ? `Scanning Registry...` : `Part ${reportOffsets[type.id].part} Audit`}</p></div>
                            </div>
                            {isGenerating === type.id ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
                        </button>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default AirtimeManagement;
