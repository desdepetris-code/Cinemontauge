import { UserData, MediaUpdate, AppNotification, TmdbMediaDetails, HistoryItem } from '../types';
import { getMediaDetails, getCollectionDetails } from './tmdbService';

const STALE_THRESHOLD_DAYS = 30;

export const checkForUpdates = async (userData: UserData): Promise<{ updates: MediaUpdate[], notifications: AppNotification[] }> => {
    const updates: MediaUpdate[] = [];
    const notifications: AppNotification[] = [];
    const now = new Date();

    // --- 1. Stale Shows (Watching with no activity for 30+ days) ---
    userData.watching.forEach(item => {
        if (item.media_type !== 'tv') return;
        const lastWatched = userData.history
            .filter(h => h.id === item.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

        if (lastWatched) {
            const lastDate = new Date(lastWatched.timestamp);
            const diffDays = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays >= STALE_THRESHOLD_DAYS) {
                updates.push({
                    id: `stale-${item.id}-${now.getTime()}`,
                    type: 'stale',
                    mediaId: item.id,
                    mediaType: 'tv',
                    title: item.title,
                    description: `You haven't watched this in ${Math.floor(diffDays)} days. Ready to continue?`,
                    poster_path: item.poster_path,
                    timestamp: now.toISOString()
                });
            }
        }
    });

    // --- 2. Revivals & Sequels (Heavy TMDB checking) ---
    // We limit this to top 20 completed items to avoid rate limits
    const completedItems = [...userData.completed].slice(0, 20);
    
    for (const item of completedItems) {
        // FIX: Narrow media_type to 'tv' | 'movie' to satisfy getMediaDetails signature
        if (item.media_type === 'person') continue;

        try {
            const details = await getMediaDetails(item.id, item.media_type);
            
            if (item.media_type === 'tv') {
                // Check if show has new episodes aired or upcoming after completion
                const userProgress = userData.watchProgress[item.id] || {};
                const maxSeasonInHistory = Math.max(0, ...Object.keys(userProgress).map(Number));
                
                if (details.next_episode_to_air || (details.number_of_seasons && details.number_of_seasons > maxSeasonInHistory)) {
                    const desc = details.status === 'Ended' || details.status === 'Canceled' 
                        ? `This show was previously ${details.status.toLowerCase()} but has new content coming!`
                        : `New content is available for this series.`;

                    updates.push({
                        id: `revival-${item.id}-${now.getTime()}`,
                        type: 'revival',
                        mediaId: item.id,
                        mediaType: 'tv',
                        title: item.title,
                        description: desc,
                        poster_path: item.poster_path,
                        timestamp: now.toISOString(),
                        details: details.next_episode_to_air
                    });
                }
            } else if (item.media_type === 'movie' && details.belongs_to_collection) {
                // Check movie collection for sequels
                const collection = await getCollectionDetails(details.belongs_to_collection.id);
                const sequels = collection.parts.filter(part => {
                    const isWatched = userData.completed.some(c => c.id === part.id);
                    const isUpcoming = part.release_date && new Date(part.release_date) > now;
                    const isRecent = part.release_date && new Date(part.release_date) > new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
                    return !isWatched && (isUpcoming || isRecent);
                });

                sequels.forEach(sequel => {
                    updates.push({
                        id: `sequel-${sequel.id}-${now.getTime()}`,
                        type: 'sequel',
                        mediaId: sequel.id,
                        mediaType: 'movie',
                        title: sequel.title || sequel.name || 'Untitled Sequel',
                        description: `A new installment in the ${collection.name} series is arriving!`,
                        poster_path: sequel.poster_path,
                        timestamp: now.toISOString(),
                        details: sequel
                    });
                });
            }
        } catch (e) {
            console.error(`Update check failed for ${item.title}`, e);
        }
    }

    // Filter updates against seen notifications to generate fresh ones
    // (Logic for checking against previously sent notifications could go here)
    
    updates.forEach(update => {
        notifications.push({
            id: `notif-${update.id}`,
            type: update.type === 'stale' ? 'stale_show' : update.type === 'revival' ? 'revival' : 'sequel',
            title: `Update: ${update.title}`,
            description: update.description,
            timestamp: now.toISOString(),
            read: false,
            mediaId: update.mediaId,
            mediaType: update.mediaType,
            poster_path: update.poster_path
        });
    });

    return { updates, notifications };
};