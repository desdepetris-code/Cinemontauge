import React from 'react';
import { TmdbMediaDetails } from '../types';

interface MoreInfoProps {
  details: TmdbMediaDetails | null;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => {
    if (!value && value !== 0) return null;
    return (
        <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 px-4">
            <dt className="text-sm font-medium text-text-secondary">{label}</dt>
            <dd className="mt-1 text-sm text-text-primary sm:mt-0 sm:col-span-2">{value}</dd>
        </div>
    );
};

const MoreInfo: React.FC<MoreInfoProps> = ({ details }) => {
    if (!details) return <p className="text-text-secondary">More information is not available.</p>;

    const releaseDate = details.media_type === 'tv' ? details.first_air_date : details.release_date;
    const runtime = details.media_type === 'tv' ? details.episode_run_time?.[0] : details.runtime;
    const runtimeLabel = details.media_type === 'tv' ? 'Avg. Episode Runtime' : 'Est. Runtime';
    const rating = details.vote_average ? `${details.vote_average.toFixed(1)} / 10 (${details.vote_count} votes)` : 'N/A';

    return (
        <div className="animate-fade-in bg-bg-secondary/50 rounded-lg">
            <dl className="divide-y divide-bg-secondary">
                <InfoRow label="Original Title" value={details.title || details.name} />
                <InfoRow label="Status" value={details.status} />
                <InfoRow label="Genres" value={details.genres?.map(g => g.name).join(', ')} />
                <InfoRow label="Release Date" value={releaseDate ? new Date(releaseDate).toLocaleDateString() : 'N/A'} />
                {details.media_type === 'tv' && <InfoRow label="Seasons" value={details.number_of_seasons} />}
                {details.media_type === 'tv' && <InfoRow label="Episodes" value={details.number_of_episodes} />}
                <InfoRow label={runtimeLabel} value={runtime ? `${runtime} min` : 'N/A'} />
                <InfoRow label="TMDB Rating" value={rating} />
                {details.external_ids?.tvdb_id && <InfoRow label="TheTVDB ID" value={details.external_ids.tvdb_id} />}
            </dl>
        </div>
    );
};

export default MoreInfo;