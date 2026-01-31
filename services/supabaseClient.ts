
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

/**
 * CINEMONTAUGE REGISTRY SYNC
 * 
 * To ensure connection to your Supabase project:
 * 1. Ensure Vercel environment variables are named:
 *    VITE_SUPABASE_URL
 *    VITE_SUPABASE_ANON_KEY
 * 2. This client fallbacks to the verified project strings if env vars are missing.
 */

// Safe access to Vite environment variables
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

// Debug verification (safe for production as it doesn't log the full key)
console.debug('CineMontauge Supabase Sync:', {
    url: supabaseUrl.substring(0, 15) + '...',
    keyLoaded: !!supabaseAnonKey,
    keyPrefix: supabaseAnonKey.substring(0, 5)
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      // Explicitly forcing the apikey header can solve 401 issues in restricted browser environments
      'apikey': supabaseAnonKey,
    }
  }
});

/**
 * Helper to upload custom posters/backdrops to 'custom-media' bucket.
 * Now supports metadata for secure owner-based RLS.
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
            // Handle Base64 conversion
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
                // @ts-ignore - injecting ownership metadata for Storage RLS
                metadata: { owner_id: userId }
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('custom-media')
            .getPublicUrl(path);

        // Record entry in database
        const { error: dbError } = await supabase
            .from('custom_media')
            .insert({
                user_id: userId,
                tmdb_id: tmdbId,
                asset_type: type,
                url: publicUrl,
                season_number: season,
                episode_number: episode
            });

        if (dbError) console.error("Error logging media to DB:", dbError);

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
        // 1. Find the entry in the DB to get the path
        const { data, error } = await supabase
            .from('custom_media')
            .delete()
            .eq('user_id', userId)
            .eq('url', url)
            .select();

        if (error) throw error;

        // 2. Extract path from URL (Assuming standard public URL format)
        // Format: https://.../storage/v1/object/public/custom-media/USER_ID/TMDB_ID/TYPE/FILE
        const urlParts = url.split('/custom-media/');
        if (urlParts.length === 2) {
            const path = urlParts[1];
            const { error: storageError } = await supabase.storage
                .from('custom-media')
                .remove([path]);
            
            if (storageError) console.warn("Could not delete from storage bucket:", storageError);
        }

        return true;
    } catch (e) {
        console.error("Delete failed:", e);
        return false;
    }
};
