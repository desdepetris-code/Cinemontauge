
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

/**
 * CINEMONTAUGE REGISTRY SYNC - CORE CLIENT
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
 * IDENTITY & PREFERENCES
 */

export const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
};

export const getUserAnalytics = async (userId: string) => {
    const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

/**
 * LIBRARY & CLOUD SYNC
 */

export const syncLibraryItemToDb = async (userId: string, tmdbId: number, mediaType: string, status: string | null) => {
    if (userId === 'guest') return;
    
    if (status === null) {
        const { error } = await supabase
            .from('library')
            .delete()
            .match({ user_id: userId, tmdb_id: tmdbId });
        if (error) console.error("Cloud Registry Delete Error:", error);
    } else {
        const { error } = await supabase
            .from('library')
            .upsert({
                user_id: userId,
                tmdb_id: tmdbId,
                media_type: mediaType,
                status: status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,tmdb_id' });
        if (error) console.error("Cloud Registry Sync Error:", error);
    }
};

/**
 * RECOMMENDATION TRACKING
 */

export const syncRecommendationStatus = async (tmdbId: number, status: 'Pending' | 'Completed') => {
    const { error } = await supabase
        .from('library')
        .update({ recommendation_status: status })
        .match({ tmdb_id: tmdbId });
    if (error) throw error;
};

export const fetchGlobalMediaStats = async () => {
    const { data, error } = await supabase
        .from('library')
        .select('recommendation_status, media_type');
    
    if (error) throw error;
    
    const stats = {
        total: data.length,
        pending: data.filter(i => i.recommendation_status === 'Pending').length,
        completed: data.filter(i => i.recommendation_status === 'Completed').length
    };
    return stats;
};

export const fetchGlobalRegistryBatch = async (status: 'Pending' | 'Completed' | 'all', limit: number = 100) => {
    let query = supabase.from('library').select('tmdb_id, media_type, recommendation_status');
    
    if (status !== 'all') {
        query = query.eq('recommendation_status', status);
    }
    
    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return data;
};

/**
 * SOCIAL & COMMUNITY REGISTRY
 */

export const fetchUserBadges = async (userId: string) => {
    const { data, error } = await supabase.from('user_badges').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
};

export const fetchSocialFeed = async (userId: string) => {
    const { data, error } = await supabase
        .from('social_feed_cache')
        .select('*, actor:profiles!actor_id(username, avatar_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) throw error;
    return data;
};

export const submitUserReport = async (report: { target_id: string, target_type: string, reason: string, comments?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('user_reports').insert({
        ...report,
        reporter_id: user?.id
    });
    if (error) throw error;
};

/**
 * DATA INTEGRITY & CACHING
 */

export const getCachedProviders = async (tmdbId: number) => {
    const { data, error } = await supabase.from('provider_registry_cache').select('*').eq('tmdb_id', tmdbId).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const logSyncEvent = async (syncData: { source: string, status: string, items_added: number, error_message?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('sync_logs').insert({
        user_id: user.id,
        ...syncData
    });
};

/**
 * ADMIN & ANNOUNCEMENTS
 */

export const fetchActiveAnnouncements = async () => {
    const now = new Date().toISOString();
    const { data, error } = await supabase
        .from('system_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const uploadAdminReport = async (fileName: string, blob: Blob) => {
    const { error } = await supabase.storage
        .from('admin-reports')
        .upload(fileName, blob);
    if (error) throw error;
};

/**
 * ACTION SYNC METHODS
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

export const syncRatingRpc = async (tmdbId: number, mediaType: string, rating: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.rpc('sync_rating', {
        p_user_id: user.id,
        p_tmdb_id: tmdbId,
        p_media_type: mediaType,
        p_rating: rating
    });
    if (error) throw error;
};

export const saveTraktToken = async (userId: string, token: any) => {
    const { error } = await supabase.from('trakt_tokens').upsert({
        user_id: userId,
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        expires_in: token.expires_in,
        created_at_token: token.created_at
    }, { onConflict: 'user_id' });
    if (error) throw error;
};

export const getTraktToken = async (userId: string) => {
    const { data, error } = await supabase.from('trakt_tokens').select('*').eq('user_id', userId).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        created_at: data.created_at_token
    };
};

export const deleteTraktToken = async (userId: string) => {
    const { error } = await supabase.from('trakt_tokens').delete().eq('user_id', userId);
    if (error) throw error;
};

export const uploadCustomMedia = async (userId: string, tmdbId: number, assetType: 'poster' | 'backdrop', file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${tmdbId}_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${assetType}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('custom-media')
        .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('custom-media')
        .getPublicUrl(filePath);

    const { error: dbError } = await supabase.from('custom_media').insert({
        user_id: userId,
        tmdb_id: tmdbId,
        asset_type: assetType,
        url: publicUrl
    });

    if (dbError) throw dbError;
    return publicUrl;
};

export const deleteCustomMedia = async (userId: string, tmdbId: number, url: string) => {
    const pathParts = url.split('/custom-media/');
    if (pathParts.length > 1) {
        const filePath = pathParts[1];
        await supabase.storage.from('custom-media').remove([filePath]);
    }

    const { error } = await supabase.from('custom_media').delete().match({
        user_id: userId,
        tmdb_id: tmdbId,
        url: url
    });
    if (error) throw error;
};
