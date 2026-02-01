
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
