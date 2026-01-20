import React, { useMemo } from 'react';
import { TmdbMediaDetails } from '../types';
import { getImageUrl } from '../utils/imageUtils';
import { formatRuntime, formatTimeFromDate } from '../utils/formatUtils';
import RelatedShows from './RelatedShows';
import ScoreStar from './ScoreStar';
import { ClockIcon } from './Icons';

interface MoreInfoProps {
  details: TmdbMediaDetails | null;
  onSelectShow: (id: number, media_type: 'tv' | 'movie') => void;
  timezone: string;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
    if (!value && value !== 0 && !(Array.isArray(value) && value.length > 0)) return null;
    return (
        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 px-4">
            <dt className="text-sm font-medium text-text-secondary">{label}</dt>
            <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">{value}</dd>
        </div>
    );
};

const MoreInfo: React.FC<MoreInfoProps> = ({ details, onSelectShow, timezone }) => {
    if (!details) return <p className="text-text-secondary">More information is not available.</p>;

    const releaseDate = details.media_type === 'tv' ? details.first_air_date : details.release_date;
    
    const runtimeValue = useMemo(() => {
        if (details.media_type === 'tv') {
            const runtimes = (details.episode_run_time || []).filter(t => t > 0);
            if (runtimes.length === 0) return 'N/A';
            if (runtimes.length === 1) return formatRuntime(runtimes[0]);

            const min = Math.min(...runtimes);
            const max = Math.max(...runtimes);

            if (min === max) return formatRuntime(min);

            return `${formatRuntime(min)} - ${formatRuntime(max)}`;
        } else {
            return formatRuntime(details.runtime);
        }
    }, [details]);

    const runtimeLabel = details.media_type === 'tv' ? 'Avg. Episode Runtime' : 'Est. Runtime';

    const languageName = useMemo(() => {
        if (!details.original_language) return null;
        try {
            const langName = new Intl.DisplayNames(['en'], { type: 'language' }).of(details.original_language);
            return langName || details.original_language.toUpperCase();
        } catch (e) {
            return details.original_language.toUpperCase();
        }
    }, [details.original_language]);

    const countryNames = useMemo(() => {
        if (!details.origin_country || details.origin_country.length === 0) return null;
        try {
            const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
            return details.origin_country.map(code => regionNames.of(code) || code).join(', ');
        } catch (e) {
            return details.origin_country.join(', ');
        }
    }, [details.origin_country]);


    const formatCurrency = (amount?: number) => {
        if (!amount || amount === 0) return 'N/A';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    // Try to find precision airtime for the first episode or movie release if available in current context
    // This is enhanced when details are enriched by Trakt in the Calendar
    const precisionTime = details.media_type === 'movie' && (details as any).airtime 
        ? formatTimeFromDate((details as any).airtime, timezone)
        : null;

    return (
        <div className="animate-fade-in">
            <div className="bg-bg-secondary/50 rounded-lg">
                <dl className="divide-y divide-bg-secondary">
                    <InfoRow label="Original Title" value={details.title || details.name} />
                    {details.tagline && <InfoRow label="Tagline" value={<i className="text-text-secondary">{details.tagline}</i>} />}
                    {details.media_type === 'tv' && <InfoRow label="Created By" value={details.created_by?.map(c => c.name).join(', ')} />}
                    <InfoRow label="Genres" value={details.genres?.map(g => g.name).join(', ')} />
                    {details.media_type === 'tv' && details.networks?.length > 0 && <InfoRow label="Networks" value={
                        <div className="flex flex-wrap gap-2 items-center">
                            {details.networks?.map(n => n.logo_path && (
                                <div key={n.id} className="bg-white px-2 py-1.5 rounded-lg shadow-sm border border-white/20 flex items-center justify-center min-w-[50px] h-10" title={n.name}>
                                    <img src={getImageUrl(n.logo_path, 'w92')} alt={n.name} className="max-h-full w-auto object-contain" />
                                </div>
                            ))}
                        </div>
                    } />}
                    <InfoRow label="Release Date" value={releaseDate ? new Date(releaseDate).toLocaleDateString() : 'N/A'} />
                    {precisionTime && (
                        <InfoRow 
                            label="Scheduled Premiere" 
                            value={
                                <div className="flex items-center gap-2 text-primary-accent font-black uppercase tracking-widest text-[10px]">
                                    <ClockIcon className="w-4 h-4" />
                                    {precisionTime}
                                </div>
                            } 
                        />
                    )}
                    <InfoRow label="Language" value={languageName} />
                    <InfoRow label="Country of Origin" value={countryNames} />
                    <InfoRow label="Production" value={
                        <div className="flex flex-wrap gap-2 items-center">
                            {details.production_companies?.map(c => (
                                <div key={c.id} className="flex items-center">
                                    {c.logo_path ? (
                                        <div className="bg-white px-2 py-1.5 rounded-lg shadow-sm border border-white/20 flex items-center justify-center min-w-[50px] h-10" title={c.name}>
                                            <img src={getImageUrl(c.logo_path, 'w92')} alt={c.name} className="max-h-full w-auto object-contain" />
                                        </div>
                                    ) : (
                                        <span className="text-text-primary font-bold text-xs bg-bg-secondary px-2 py-1 rounded-md border border-white/5">{c.name}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    } />
                    {details.media_type === 'tv' && <InfoRow label="Seasons" value={details.number_of_seasons} />}
                    {details.media_type === 'tv' && <InfoRow label="Episodes" value={details.number_of_episodes} />}
                    <InfoRow label={runtimeLabel} value={runtimeValue || 'N/A'} />
                    {details.media_type === 'movie' && <InfoRow label="Budget" value={formatCurrency(details.budget)} />}
                    {details.media_type === 'movie' && <InfoRow label="Revenue" value={formatCurrency(details.revenue)} />}
                    <InfoRow label="TMDB Rating" value={
                        details.vote_average && details.vote_average > 0 ? (
                            <div className="flex items-center gap-2">
                                 <ScoreStar score={details.vote_average} voteCount={details.vote_count} size="sm" />
                                 <span className="text-sm text-text-secondary">{details.vote_average.toFixed(1)} / 10 ({details.vote_count} votes)</span>
                            </div>
                        ) : 'N/A'
                    } />
                </dl>
            </div>
            {details?.media_type === 'tv' && details.external_ids?.tvdb_id && (
                <RelatedShows tvdbId={details.external_ids.tvdb_id} onSelectShow={onSelectShow} />
            )}
        </div>
    );
};

export default MoreInfo;