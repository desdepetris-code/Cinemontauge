
import React, { useState, useEffect, useMemo } from 'react';
import { UserData, HistoryItem } from '../types';
import { useCalculatedStats } from '../hooks/useCalculatedStats';
// Added TrophyIcon to imports
import { ChevronDownIcon, StarIcon, FireIcon, ClockIcon, TvIcon, FilmIcon, ChatBubbleLeftRightIcon, HeartIcon, UsersIcon, BoltIcon, TrophyIcon } from '../components/Icons';
import { getImageUrl } from '../utils/imageUtils';
import { getUserAnalytics, supabase } from '../services/supabaseClient';

interface StatsScreenProps {
  userData: UserData;
  genres: Record<number, string>;
}

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-card-gradient p-6 rounded-3xl border border-white/5 shadow-xl">
        <h3 className="text-lg font-black text-text-primary uppercase tracking-widest mb-6">{title}</h3>
        {children}
    </div>
);

const StatHighlightCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon?: React.ReactNode }> = ({ title, value, subtitle, icon }) => (
    <div className="bg-bg-secondary/20 p-6 rounded-[2rem] border border-white/5 shadow-xl group hover:border-primary-accent/30 transition-all">
        <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">{title}</p>
            {icon && <div className="text-primary-accent opacity-40 group-hover:opacity-100 transition-opacity">{icon}</div>}
        </div>
        <p className="text-4xl font-black text-text-primary tracking-tighter leading-none">{value}</p>
        {subtitle && <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-3 opacity-60">{subtitle}</p>}
    </div>
);

const HorizontalBarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    if (data.length === 0) return <div className="text-text-secondary text-center h-48 flex items-center justify-center font-bold uppercase tracking-widest text-[10px] opacity-40">Registry genre data pending...</div>;
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="space-y-4">
            {data.map(({ label, value }) => (
                <div key={label} className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-text-primary">{label}</span>
                        <span className="text-primary-accent">{value}</span>
                    </div>
                    <div className="flex-grow bg-bg-secondary/40 rounded-full h-2 shadow-inner border border-white/5">
                        <div
                            className="bg-accent-gradient rounded-full h-full transition-all duration-1000 ease-out"
                            style={{ width: `${(value / maxValue) * 100}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const VerticalBarChart: React.FC<{ data: { label: string; value: number }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="flex justify-around items-end h-48 gap-2">
            {data.map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center flex-grow text-center group">
                    <div className="text-[10px] font-black text-primary-accent mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{value}</div>
                    <div className="w-full bg-bg-secondary/40 rounded-xl flex-grow overflow-hidden border border-white/5 shadow-inner">
                        <div
                            className="w-full bg-accent-gradient transition-all duration-1000 ease-out h-0"
                            style={{ height: `${(value / maxValue) * 100}%`, marginTop: 'auto' }}
                        ></div>
                    </div>
                    <div className="text-[9px] font-black text-text-secondary uppercase tracking-tighter mt-2 group-hover:text-text-primary transition-colors">{label}</div>
                </div>
            ))}
        </div>
    );
};

const moodColors: Record<string, string> = {
    '😊': '#4CAF50', '😂': '#FFC107', '😍': '#E91E63',
    '😢': '#2196F3', '🤯': '#9C27B0', '🤔': '#795548', '😠': '#F44336'
};

const DonutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, item) => acc + item.value, 0);
    if (total === 0) return <div className="text-text-secondary text-center h-48 flex items-center justify-center font-bold uppercase tracking-widest text-[10px] opacity-40">No mood entries in registry.</div>;

    let cumulativePercent = 0;
    const segments = data.map(item => {
        const percent = (item.value / total) * 100;
        const startAngle = cumulativePercent;
        cumulativePercent += percent;
        return { ...item, percent, startAngle };
    });

    const conicGradient = segments.map(s => `${s.color} ${s.startAngle}% ${s.startAngle + s.percent}%`).join(', ');
    const midGradient = `radial-gradient(transparent 55%, transparent 56%)`; // Actually we want transparent donut hole if we have a nice bg

    return (
        <div className="flex flex-col items-center justify-center gap-8 py-4">
            <div
                className="w-48 h-48 rounded-full shadow-2xl relative border-4 border-white/5"
                style={{
                    background: `conic-gradient(${conicGradient})`,
                }}
            >
                <div className="absolute inset-0 m-12 bg-bg-primary rounded-full border border-white/5 shadow-inner flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-2xl font-black text-text-primary">{total}</p>
                        <p className="text-[8px] font-black uppercase tracking-widest text-text-secondary">Entries</p>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full px-4">
                {segments.map(s => (
                    <div key={s.label} className="flex items-center gap-3 p-2 bg-bg-secondary/20 rounded-xl border border-white/5">
                        <span className="text-2xl">{s.label}</span>
                        <div className="min-w-0">
                            <p className="text-xs font-black text-text-primary leading-none">{Math.round(s.percent)}%</p>
                            <p className="text-[8px] font-bold text-text-secondary uppercase tracking-widest mt-1">{s.value} Logs</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const StatsScreen: React.FC<StatsScreenProps> = ({ userData, genres }) => {
  const localStats = useCalculatedStats(userData);
  const [activeFilter, setActiveFilter] = useState<'all' | 'month'>('all');
  const [dbAnalytics, setDbAnalytics] = useState<any>(null);
  const [loadingDb, setLoadingDb] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setLoadingDb(true);
            const analytics = await getUserAnalytics(user.id);
            if (analytics) setDbAnalytics(analytics);
            setLoadingDb(false);
        }
    };
    fetchAnalytics();
  }, []);

  // Added useMemo to React imports
  const analytics = useMemo(() => {
    if (!dbAnalytics) return {
        current_streak: localStats.currentStreak, 
        longest_streak: localStats.longestStreak,
        movies_watched_today: localStats.moviesWatchedToday,
        episodes_watched_today: localStats.episodesWatchedToday,
        notes_created_today: localStats.notesCreatedToday,
        likes_given: 0,
        likes_received: 0,
        comments_made: userData.comments.length,
        follows_made: 0
    };
    return dbAnalytics;
  }, [dbAnalytics, localStats, userData.comments.length]);

  const topGenresAllTime = Object.entries(localStats.genreDistributionAllTime)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([id, value]) => ({ label: genres[Number(id)] || 'Unknown', value }));
  
  const topGenresThisMonth = Object.entries(localStats.genreDistributionThisMonth)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 5)
      .map(([id, value]) => ({ label: genres[Number(id)] || 'Unknown', value }));

  const topMoods = Object.entries(localStats.moodDistribution)
      .sort((a, b) => (b[1] as number) - (a[1] as number))
      .slice(0, 6)
      .map(([label, value]) => ({ label, value, color: moodColors[label] || '#9CA3AF' }));

  const weeklyActivityData = [
    { label: 'Sun', value: localStats.weeklyActivity[0] }, { label: 'Mon', value: localStats.weeklyActivity[1] },
    { label: 'Tue', value: localStats.weeklyActivity[2] }, { label: 'Wed', value: localStats.weeklyActivity[3] },
    { label: 'Thu', value: localStats.weeklyActivity[4] }, { label: 'Fri', value: localStats.weeklyActivity[5] },
    { label: 'Sat', value: localStats.weeklyActivity[6] },
  ];

  return (
    <div className="space-y-12 animate-fade-in pb-20">
        <header>
            <h1 className="text-5xl font-black text-text-primary uppercase tracking-tighter">Analytics</h1>
            <p className="text-sm font-bold text-text-secondary uppercase tracking-[0.3em] mt-2 opacity-60">Quantifying your cinematic journey</p>
        </header>
        
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatHighlightCard title="Current Streak" value={analytics.current_streak} subtitle="Consecutive Days" icon={<FireIcon className="w-5 h-5" />} />
            {/* Added TrophyIcon to imports */}
            <StatHighlightCard title="Longest Streak" value={analytics.longest_streak} subtitle="All-Time Record" icon={<TrophyIcon className="w-5 h-5" />} />
            <StatHighlightCard title="Total Volume" value={localStats.totalEpisodesWatched + localStats.moviesCompleted} subtitle="Items Captured" icon={<BoltIcon className="w-5 h-5" />} />
            <StatHighlightCard title="Time Spent" value={`~${localStats.totalHoursWatched}h`} subtitle="Est. Screen Time" icon={<ClockIcon className="w-5 h-5" />} />
        </section>

        <section>
             <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-black text-text-primary uppercase tracking-widest whitespace-nowrap">Daily Activity</h2>
                <div className="h-px w-full bg-white/5"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-bg-secondary/10 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                    <TvIcon className="w-8 h-8 text-rose-500 mb-4 opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">Episodes Today</p>
                    <p className="text-5xl font-black text-text-primary leading-none">{analytics.episodes_watched_today}</p>
                </div>
                <div className="bg-bg-secondary/10 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                    <FilmIcon className="w-8 h-8 text-sky-400 mb-4 opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">Movies Today</p>
                    <p className="text-5xl font-black text-text-primary leading-none">{analytics.movies_watched_today}</p>
                </div>
                <div className="bg-bg-secondary/10 p-8 rounded-[2.5rem] border border-white/5 flex flex-col items-center text-center">
                    <ChatBubbleLeftRightIcon className="w-8 h-8 text-amber-400 mb-4 opacity-40" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary mb-2">Notes Created</p>
                    <p className="text-5xl font-black text-text-primary leading-none">{analytics.notes_created_today}</p>
                </div>
            </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartContainer title="Weekly Activity Signature">
                <VerticalBarChart data={weeklyActivityData} />
            </ChartContainer>
            <ChartContainer title="Social Presence">
                <div className="grid grid-cols-2 gap-6 h-full content-center">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Comments Made</p>
                        <p className="text-3xl font-black text-text-primary">{analytics.comments_made}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Likes Received</p>
                        <p className="text-3xl font-black text-text-primary">{analytics.likes_received}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Likes Given</p>
                        <p className="text-3xl font-black text-text-primary">{analytics.likes_given}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Follows Made</p>
                        <p className="text-3xl font-black text-text-primary">{analytics.follows_made}</p>
                    </div>
                </div>
            </ChartContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <ChartContainer title="Genre Affinity">
                    <div className="flex p-1 bg-bg-secondary rounded-2xl mb-8 self-start border border-white/5 w-fit">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeFilter === 'all' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                        >All Time</button>
                        <button
                            onClick={() => setActiveFilter('month')}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeFilter === 'month' ? 'bg-accent-gradient text-on-accent shadow-lg' : 'text-text-secondary hover:text-text-primary'}`}
                        >This Month</button>
                    </div>
                    <HorizontalBarChart data={activeFilter === 'all' ? topGenresAllTime : topGenresThisMonth} />
                </ChartContainer>
            </div>
            
            <ChartContainer title="Emotional Spectrum">
                <DonutChart data={topMoods} />
            </ChartContainer>
        </div>
        
        <ChartContainer title="Chronological Activity (Last 12 Months)">
             <VerticalBarChart data={localStats.monthlyActivity.map(m => ({ label: m.month, value: m.count }))} />
        </ChartContainer>
    </div>
  );
};

export default StatsScreen;
