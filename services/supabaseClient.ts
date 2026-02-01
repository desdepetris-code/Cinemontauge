
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

/**
 * CINEMONTAUGE REGISTRY SYNC
 */

const getEnv = (key: string) => {
    try {
        // @ts-ignore - Vite environment variable access
        return import.meta.env[key];
    } catch (e) {
        return undefined;
    }
};

const supabaseUrl = (
    getEnv('VITE_SUPABASE_URL') || 
    'https://cbkmocfdnrhuogwggctp.supabase.co'
).trim();

const supabaseAnonKey = (
    getEnv('VITE_SUPABASE_ANON_KEY') || 
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNia21vY2ZkbnJodW9nd2dnY3RwIiwicm9sZSI6ImFubCI6ImFub24iLCJpYXQiOjE3NjkyNjk5MTcsImV4cCI6MjA4NDg0NTkxN30.Ja9uv__ZlHjy4yJ3KoR2vw8rClYJTq5kYzaHPHWMrMg'
).trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Caches basic TMDB metadata in Supabase for faster global discovery.
 */
export const syncMediaRegistryCache = async (item: { tmdb_id: number, title: string, poster_path: string | null, backdrop_path: string | null, media_type: string }) => {
    return await supabase
        .from('media_registry_cache')
        .upsert({
            tmdb_id: item.tmdb_id,
            title: item.title,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
            media_type: item.media_type
        });
};

/**
 * Toggles a social interaction (Like/Bookmark).
 */
export const toggleInteraction = async (userId: string, targetId: string, targetType: 'comment' | 'list' | 'journal', type: 'like' | 'bookmark' = 'like') => {
    // Check if exists
    const { data } = await supabase
        .from('interactions')
        .select('id')
        .match({ user_id: userId, target_id: targetId, target_type: targetType, type })
        .single();

    if (data) {
        return await supabase.from('interactions').delete().eq('id', data.id);
    } else {
        return await supabase.from('interactions').insert({
            user_id: userId,
            target_id: targetId,
            target_type: targetType,
            type
        });
    }
};

/**
 * Blocks another user from social interactions.
 */
export const blockUser = async (userId: string, blockedId: string) => {
    return await supabase
        .from('user_blocking')
        .upsert({ blocker_id: userId, blocked_id: blockedId });
};

/**
 * Unblocks a user.
 */
export const unblockUser = async (userId: string, blockedId: string) => {
    return await supabase
        .from('user_blocking')
        .delete()
        .match({ blocker_id: userId, blocked_id: blockedId });
};

/**
 * Fetches the IDs of users blocked by the current user.
 */
export const fetchBlockedUsers = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_blocking')
        .select('blocked_id')
        .eq('blocker_id', userId);
    
    if (error) return [];
    return data.map(d => d.blocked_id);
};

/**
 * Syncs user XP to their central profile.
 */
export const syncUserXp = async (userId: string, xp: number) => {
    return await supabase
        .from('profiles')
        .update({ user_xp: xp })
        .eq('id', userId);
};

/**
 * Persists a user's "Weekly Gem" nomination.
 */
export const syncWeeklyPick = async (userId: string, tmdbId: number, category: string, weekKey: string, dayIndex: number, isRemove: boolean = false) => {
    if (isRemove) {
        return await supabase
            .from('weekly_picks')
            .delete()
            .match({ user_id: userId, tmdb_id: tmdbId, week_key: weekKey });
    }

    return await supabase
        .from('weekly_picks')
        .upsert({
            user_id: userId,
            tmdb_id: tmdbId,
            category,
            week_key: weekKey,
            day_index: dayIndex
        });
};

/**
 * Fetches user analytics (streaks, daily activity, social metrics)
 */
export const getUserAnalytics = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();
    
    if (error) {
        console.warn("Analytics fetch failed:", error.message);
        return null;
    }
    return data;
};

/**
 * Syncs a Journal Entry to the database.
 */
export const syncJournalEntry = async (userId: string, tmdbId: number, season: number, episode: number, entry: any) => {
    if (!entry) {
        return await supabase
            .from('journal_entries')
            .delete()
            .match({ user_id: userId, tmdb_id: tmdbId, season_number: season, episode_number: episode });
    }

    return await supabase
        .from('journal_entries')
        .upsert({
            user_id: userId,
            tmdb_id: tmdbId,
            season_number: season,
            episode_number: episode,
            content: entry.text,
            mood: entry.mood,
            timestamp: entry.timestamp
        }, { onConflict: 'user_id,tmdb_id,season_number,episode_number' });
};

/**
 * Syncs User Notes to the database.
 */
export const syncUserNote = async (userId: string, tmdbId: number, note: any, isDelete: boolean = false) => {
    if (isDelete) {
        return await supabase
            .from('user_notes')
            .delete()
            .match({ user_id: userId, id: note.id });
    }

    return await supabase
        .from('user_notes')
        .upsert({
            id: note.id,
            user_id: userId,
            tmdb_id: tmdbId,
            content: note.text,
            timestamp: note.timestamp
        });
};

/**
 * Helper to upload custom posters/backdrops to 'custom-media' bucket.
 */
export const uploadCustomMedia = async (
    userId: string, 
    tmdbId: number, 
    type: 'poster' | 'backdrop' | 'episode', 
    source: string | File,
    season?: number,
    episode?: number
): Promise<string | null> => {
    try {
        let blob: Blob;
        let ext = 'jpg';

        if (source instanceof File) {
            blob = source;
            ext = source.name.split('.').pop() || 'jpg';
        } else {
            const response = await fetch(source);
            blob = await response.blob();
            ext = blob.type.split('/').pop() || 'jpg';
        }

        const fileName = `${type}_${Date.now()}.${ext}`;
        const path = `${userId}/${tmdbId}/${type}/${fileName}`;

        const { error, data } = await supabase.storage
            .from('custom-media')
            .upload(path, blob, {
                upsert: true,
                // @ts-ignore - metadata for RLS
                metadata: { owner_id: userId }
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('custom-media')
            .getPublicUrl(path);

        await supabase
            .from('custom_media')
            .insert({
                user_id: userId,
                tmdb_id: tmdbId,
                asset_type: type,
                url: publicUrl,
                season_number: season,
                episode_number: episode
            });

        return publicUrl;
    } catch (e) {
        console.error("Upload failed:", e);
        return null;
    }
};

/**
 * Helper to delete user-uploaded media.
 */
export const deleteCustomMedia = async (userId: string, url: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('custom_media')
            .delete()
            .eq('user_id', userId)
            .eq('url', url);

        if (error) throw error;

        const urlParts = url.split('/custom-media/');
        if (urlParts.length === 2) {
            const path = urlParts[1];
            await supabase.storage
                .from('custom-media')
                .remove([path]);
        }

        return true;
    } catch (e) {
        console.error("Delete failed:", e);
        return false;
    }
};
