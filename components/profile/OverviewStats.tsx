import React from 'react';
import { CalculatedStats } from '../../types';
import { TvIcon, FilmIcon, ClockIcon } from '../Icons';

const StatDetail: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
    <div className="flex flex-col items-center">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary uppercase tracking-wider">{label}</p>
    </div>
);

const StatBox: React.FC<{ title: string; icon: React.ReactNode; daily: number; weekly: number; monthly: number; yearly: number; isHours?: boolean }> = ({ title, icon, daily, weekly, monthly, yearly, isHours }) => {
    const format = (val: number) => isHours ? `~${Math.round(val)}h` : val;
    return (
        <div className="bg-card-gradient rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
                <div className="text-primary-accent">{icon}</div>
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
                <StatDetail value={format(daily)} label="Today" />
                <StatDetail value={format(weekly)} label="This Week" />
                <StatDetail value={format(monthly)} label="This Month" />
                <StatDetail value={format(yearly)} label="This Year" />
            </div>
        </div>
    );
};


const OverviewStats: React.FC<{ stats: CalculatedStats }> = ({ stats }) => {
    const dailyHours = (stats.episodesWatchedToday * 45 + stats.moviesWatchedToday * 100) / 60;

    return (
        <div className="space-y-4">
            <StatBox 
                title="Episodes Watched"
                icon={<TvIcon className="w-8 h-8"/>}
                daily={stats.episodesWatchedToday}
                weekly={stats.watchedThisWeek}
                monthly={stats.episodesWatchedThisMonth}
                yearly={stats.episodesWatchedThisYear}
            />
            <StatBox 
                title="Movies Watched"
                icon={<FilmIcon className="w-8 h-8"/>}
                daily={stats.moviesWatchedToday}
                weekly={stats.moviesWatchedThisWeek}
                monthly={stats.moviesWatchedThisMonth}
                yearly={stats.moviesWatchedThisYear}
            />
            <StatBox 
                title="Hours Watched"
                icon={<ClockIcon className="w-8 h-8"/>}
                daily={dailyHours}
                weekly={stats.hoursWatchedThisWeek}
                monthly={stats.hoursWatchedThisMonth}
                yearly={stats.hoursWatchedThisYear}
                isHours
            />
        </div>
    );
};

export default OverviewStats;
