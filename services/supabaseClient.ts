
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
 * ADMIN HELPERS
 */

export const uploadAdminReport = async (fileName: string, pdfBlob: Blob) => {
    const { data, error } = await supabase.storage
        .from('admin-reports')
        .upload(`reports/${fileName}`, pdfBlob, {
            contentType: 'application/pdf',
            upsert: true
        });
    if (error) throw error;
    return data;
};

/**
 * TRAKT REGISTRY HELPERS
 */

export const saveTraktToken = async (userId: string, token: any) => {
    const { error } = await supabase.from('trakt_tokens').upsert({
        user_id: userId,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        created_at: token.created_at,
        expires_in: token.expires_in
    });
    if (error) throw error;
};

export const getTraktToken = async (userId: string) => {
    const { data, error } = await supabase
        .from('trakt_tokens')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const deleteTraktToken = async (userId: string) => {
    const { error } = await supabase.from('trakt_tokens').delete().eq('user_id', userId);
    if (error) throw error;
    localStorage.removeItem('trakt_token_cache');
};

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
        log_id: item.log_id || item.logId,
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

export const deleteCustomMedia = async (userId: string, mediaId: number, url: string) => {
    try {
        const storagePath = url.split('/custom-media/')[1];
        if (storagePath) {
            await supabase.storage.from('custom-media').remove([storagePath]);
        }
        await supabase
            .from('custom_media')
            .delete()
            .match({ user_id: userId, tmdb_id: mediaId, url: url });
    } catch (e) {
        console.error("Delete custom media failed:", e);
    }
};

export const syncUserNote = async (userId: string, mediaId: number, notes: any[]) => {
    try {
        await supabase.from('media_notes').upsert({
            user_id: userId,
            tmdb_id: mediaId,
            notes: notes
        }, { onConflict: 'user_id,tmdb_id' });
    } catch (e) {
        console.error("Sync user note failed:", e);
    }
};

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
