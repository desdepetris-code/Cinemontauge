
import React, { useState, useEffect, useMemo } from 'react';
import { UserData, SeasonLogItem } from '../types';
import { getMediaDetails, getSeasonDetails } from '../services/tmdbService';
import { getImageUrl } from '../utils/imageUtils';

interface SeasonLogScreenProps {
    userData: UserData;
    onSelectShow: (id: number, mediaType: 'tv' | 'movie') => void;
}

const SeasonLogScreen: React.FC<SeasonLogScreenProps> = ({ userData, onSelectShow }) => {
    const [seasonLog, setSeasonLog] = useState<SeasonLogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const calculateSeasonLog = async () => {
            setIsLoading(true);
            const tvShows = [...userData.watching, ...userData.completed].filter(item => item.media_type === 'tv');
            const uniqueTvShowIds = Array.from(new Set(tvShows.map(s => s.id)));

            const completedSeasons: SeasonLogItem[] = [];

            const detailPromises = uniqueTvShowIds.map(id => getMediaDetails(id, 'tv').catch(() => null));
            const allDetails = await Promise.all(detailPromises);

            for (const details of allDetails) {
                if (!details || !details.seasons) continue;

                const progressForShow = userData.watchProgress[details.id];
                if (!progressForShow) continue;

                const seasonsForCalc = details.seasons.filter(s => s.season_number > 0);

                for (const season of seasonsForCalc) {
                    if (season.episode_count === 0) continue;

                    let watchedCount = 0;
                    for (let i = 1; i <= season.episode_count; i++) {
                        if (progressForShow[season.season_number]?.[i]?.status === 2) {
                            watchedCount++;
                        }
                    }

                    if (watchedCount >= season.episode_count) {
                        const seasonHistory = userData.history.filter(h => h.id === details.id && h.seasonNumber === season.season_number);
                        seasonHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                        const userStartDate = seasonHistory.length > 0 ? seasonHistory[0].timestamp : null;
                        const completionDate = seasonHistory.length > 0 ? seasonHistory[seasonHistory.length - 1].timestamp : new Date().toISOString();
                        
                        let premiereDate: string | null = null;
                        let endDate: string | null = null;

                        try {
                            const seasonDetails = await getSeasonDetails(details.id, season.season_number);
                            if (seasonDetails.episodes && seasonDetails.episodes.length > 0) {
                                const airedEpisodes = seasonDetails.episodes.filter(e => e.air_date);
                                airedEpisodes.sort((a,b) => new Date(a.air_date).getTime() - new Date(b.air_date).getTime());
                                if(airedEpisodes.length > 0) {
                                    premiereDate = airedEpisodes[0].air_date;
                                    endDate = airedEpisodes[airedEpisodes.length - 1].air_date;
                                }
                            }
                        } catch (e) { console.error(`Could not fetch season details for log for show ${details.id} season ${season.season_number}`, e) }
                        
                        completedSeasons.push({
                            showId: details.id,
                            showTitle: details.name || 'Unknown Show',
                            posterPath: season.poster_path || details.poster_path,
                            seasonNumber: season.season_number,
                            seasonName: season.name,
                            completionDate: completionDate,
                            userStartDate,
                            premiereDate,
                            endDate,
                        });
                    }
                }
            }
            
            completedSeasons.sort((a,b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());
            setSeasonLog(completedSeasons);
            setIsLoading(false);
        };

        calculateSeasonLog();
    }, [userData]);

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center p-3 bg-bg-secondary/50 rounded-lg">
                        <div className="w-24 h-36 bg-bg-secondary rounded-md"></div>
                        <div className="ml-4 flex-grow space-y-2">
                            <div className="h-5 bg-bg-secondary rounded w-3/4"></div>
                            <div className="h-4 bg-bg-secondary rounded w-1/2"></div>
                            <div className="h-3 bg-bg-secondary rounded w-5/6 mt-4"></div>
                            <div className="h-3 bg-bg-secondary rounded w-5/6"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const DateInfo: React.FC<{label: string, value: string | null}> = ({label, value}) => {
        if (!value) return null;
        return (
            <div>
                <span className="font-semibold text-text-secondary/80">{label}:</span>
                <span className="ml-1">{new Date(value).toLocaleDateString()}</span>
            </div>
        );
    }

    return (
        <section>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-accent-gradient mb-4">Completed Seasons Log</h2>
            {seasonLog.length > 0 ? (
                <div className="bg-card-gradient rounded-lg shadow-md divide-y divide-bg-secondary">
                    {seasonLog.map(item => (
                        <div 
                            key={`${item.showId}-${item.seasonNumber}`}
                            onClick={() => onSelectShow(item.showId, 'tv')}
                            className="flex items-start p-4 cursor-pointer hover:bg-bg-secondary/50 space-x-4"
                        >
                            <img src={getImageUrl(item.posterPath, 'w154')} alt={item.showTitle} className="w-24 rounded-md flex-shrink-0"/>
                            <div className="flex-grow">
                                <p className="font-bold text-lg text-text-primary">{item.showTitle}</p>
                                <p className="font-semibold text-md text-text-secondary">{item.seasonName}</p>
                                
                                <div className="text-xs text-text-secondary mt-3 space-y-1">
                                    <DateInfo label="Season Aired" value={item.premiereDate} />
                                    <DateInfo label="You Started" value={item.userStartDate} />
                                    <DateInfo label="You Finished" value={item.completionDate} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center bg-bg-secondary/30 rounded-lg">
                    <p className="text-text-secondary">You haven't completed any seasons yet. Keep watching!</p>
                </div>
            )}
        </section>
    );
};

export default SeasonLogScreen;
