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

export const updateProfileSettings = async (userId: string, settings: any) => {
    const { error } = await supabase.from('user_settings').upsert({
        user_id: userId,
        settings: settings
    }, { onConflict: 'user_id' });
    if (error) throw error;
};

export const updateProfileTheme = async (userId: string, theme: any) => {
    const { error } = await supabase.from('user_themes').upsert({
        user_id: userId,
        theme_config: theme
    }, { onConflict: 'user_id' });
    if (error) throw error;
};

/**
 * SOCIAL & CONNECTIVITY
 */

export const syncFollow = async (followerId: string, followingId: string) => {
    const { error } = await supabase.from('follows').insert({
        follower_id: followerId,
        following_id: followingId
    });
    if (error) throw error;
};

export const syncUnfollow = async (followerId: string, followingId: string) => {
    const { error } = await supabase.from('follows').delete().match({
        follower_id: followerId,
        following_id: followingId
    });
    if (error) throw error;
};

export const fetchFollowers = async (userId: string) => {
    const { data, error } = await supabase.from('follows').select('follower_id').eq('following_id', userId);
    if (error) throw error;
    return data.map(f => f.follower_id);
};

export const fetchFollowing = async (userId: string) => {
    const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', userId);
    if (error) throw error;
    return data.map(f => f.following_id);
};

/**
 * SEARCH & TRENDS
 */

export const syncSearchEntry = async (userId: string, query: string, tmdbId?: number, mediaType?: string) => {
    const { error } = await supabase.from('search_history').insert({
        user_id: userId,
        query: query,
        tmdb_id: tmdbId,
        media_type: mediaType
    });
    if (error) console.error("Search sync failed:", error);
};

export const fetchSearchHistory = async (userId: string) => {
    const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
    if (error) throw error;
    return data;
};

/**
 * TRASH BIN (DELETION RECOVERY)
 */

export const moveItemToTrash = async (userId: string, tmdbId: number, mediaType: string, payload: any, reason?: string) => {
    const { error } = await supabase.from('trash_bin').insert({
        user_id: userId,
        tmdb_id: tmdbId,
        media_type: mediaType,
        item_payload: payload,
        reason: reason || 'Manual Deletion'
    });
    if (error) throw error;
};

export const fetchTrashBin = async (userId: string) => {
    const { data, error } = await supabase
        .from('trash_bin')
        .select('*')
        .eq('user_id', userId)
        .order('deleted_at', { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * WEEKLY GEMS (NOMINATIONS)
 */

export const syncWeeklyPick = async (userId: string, pick: any) => {
    const { error } = await supabase.from('weekly_picks').upsert({
        user_id: userId,
        tmdb_id: pick.id,
        category: pick.category,
        day_index: pick.dayIndex,
        week_key: pick.weekKey || new Date().toISOString().split('T')[0], // Defaults to current date if missing
        metadata: {
            title: pick.title,
            poster_path: pick.poster_path,
            episode_info: pick.episodeTitle
        }
    }, { onConflict: 'user_id,category,day_index,week_key' });
    if (error) throw error;
};

export const fetchWeeklyPicks = async (userId: string) => {
    const { data, error } = await supabase.from('weekly_picks').select('*').eq('user_id', userId);
    if (error) throw error;
    return data;
};

/**
 * REMINDERS & ALERTS
 */

export const syncReminder = async (userId: string, reminder: any) => {
    const { error } = await supabase.from('reminders').upsert({
        user_id: userId,
        tmdb_id: reminder.mediaId,
        media_type: reminder.mediaType,
        title: reminder.title,
        poster_path: reminder.poster_path,
        release_date: reminder.releaseDate,
        selected_types: reminder.selectedTypes,
        frequency: reminder.frequency
    }, { onConflict: 'user_id,tmdb_id,release_date' });
    if (error) throw error;
};

export const fetchReminders = async (userId: string) => {
    const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .order('release_date', { ascending: true });
    if (error) throw error;
    return data;
};

/**
 * ACTIVITY & ENGAGEMENT
 */

export const syncActivityLog = async (userId: string, activity: any) => {
    const { error } = await supabase.from('activity_logs').insert({
        user_id: userId,
        activity_type: activity.type,
        tmdb_id: activity.mediaId,
        metadata: activity.metadata
    });
    if (error) console.error("Activity log failed:", error);
};

export const fetchNotifications = async (userId: string) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const markNotificationRead = async (notificationId: string) => {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
    if (error) throw error;
};

/**
 * AUTHORITY & MODERATION
 */

export const syncBlockedUser = async (userId: string, blockedId: string) => {
    const { error } = await supabase.from('blocked_users').insert({
        user_id: userId,
        blocked_user_id: blockedId
    });
    if (error) throw error;
};

export const fetchBlockedUsers = async (userId: string) => {
    const { data, error } = await supabase.from('blocked_users').select('blocked_user_id').eq('user_id', userId);
    if (error) throw error;
    return data.map(b => b.blocked_user_id);
};

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
 * RPC ATOMIC HELPERS (STUBS FOR REUSABILITY)
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

export const syncRatingRpc = async (mediaId: number, mediaType: string, rating: number) => {
    const { data, error } = await supabase.rpc('set_media_rating', {
        p_media_id: mediaId,
        p_media_type: mediaType,
        p_rating: rating
    });
    if (error) throw error;
    return data;
};

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

// FIX: Added missing Trakt registry sync functions
/**
 * TRAKT REGISTRY SYNC
 */
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
        if (error.code === 'PGRST116') return null; // No rows
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

// FIX: Added missing custom media upload and deletion functions for registry enrichment
/**
 * MEDIA ASSET MANAGEMENT (CLOUD)
 */
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

    // Record in DB
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

// FIX: Added missing analytics retrieval for user statistics screen
/**
 * ANALYTICS ENGINE
 */
export const getUserAnalytics = async (userId: string) => {
    const { data, error } = await supabase.from('user_analytics').select('*').eq('user_id', userId).single();
    if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
    }
    return data;
};
