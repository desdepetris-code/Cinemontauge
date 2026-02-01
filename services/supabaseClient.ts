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
 * Atomic status toggle via RPC.
 */
export const syncWatchStatusRpc = async (mediaId: number, mediaType: string, status: string | null) => {
    const { data, error } = await supabase.rpc('toggle_watch_status', {
        p_media_id: mediaId,
        p_media_type: mediaType,
        p_status: status
    });
    if (error) throw error;
    return data;
};

/**
 * Syncs user rating for a media item.
 */
export const syncRatingRpc = async (mediaId: number, mediaType: string, rating: number) => {
    const { data, error } = await supabase.rpc('set_media_rating', {
        p_media_id: mediaId,
        p_media_type: mediaType,
        p_rating: rating
    });
    if (error) throw error;
    return data;
};

/**
 * Syncs a specific watch log entry.
 */
export const syncHistoryItemRpc = async (item: any) => {
    const { data, error } = await supabase.from('history').upsert({
        log_id: item.logId,
        tmdb_id: item.id,
        media_type: item.media_type,
        timestamp: item.timestamp,
        season_number: item.seasonNumber,
        episode_number: item.episodeNumber,
        note: item.note,
        metadata: {
            episodeTitle: item.episodeTitle,
            episodeStillPath: item.episodeStillPath,
            seasonPosterPath: item.seasonPosterPath
        }
    });
    if (error) throw error;
    return data;
};

/**
 * Atomic Favorite Toggle.
 */
export const toggleFavoriteRpc = async (mediaId: number, mediaType: string) => {
    const { data, error } = await supabase.rpc('toggle_favorite', {
        p_media_id: mediaId,
        p_media_type: mediaType
    });
    if (error) throw error;
    return data;
};

/**
 * Post Comment / Reply.
 */
export const postCommentRpc = async (mediaKey: string, content: string, parentId?: string, isSpoiler: boolean = false) => {
    const { data, error } = await supabase.from('comments').insert({
        media_key: mediaKey,
        content,
        parent_id: parentId,
        is_spoiler: isSpoiler
    }).select().single();
    if (error) throw error;
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
 * Syncs User Note.
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
 * Upload custom media.
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

        const { error } = await supabase.storage
            .from('custom-media')
            .upload(path, blob, {
                upsert: true,
                // @ts-ignore
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
 * Delete custom media.
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

/**
 * Fix: added export for 'getUserAnalytics' used by StatsScreen.tsx
 */
export const getUserAnalytics = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error) {
        console.error("Error fetching analytics:", error);
        return null;
    }
    return data;
};
