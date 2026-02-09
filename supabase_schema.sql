-- CineMontauge: Advanced Registry Schema v2.0
-- Copy and paste these blocks into your Supabase SQL Editor.

-- 1. SOCIAL & COMMUNITY GROWTH --

-- Tracks unlocked visual badges/icons for user profiles
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

-- Cache for social activity to ensure fast dashboard rendering
CREATE TABLE IF NOT EXISTS public.social_feed_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- The viewer
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- The person who did the action
    activity_type TEXT NOT NULL,
    tmdb_id INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_social_feed_user ON public.social_feed_cache(user_id);

-- Community moderation ledger
CREATE TABLE IF NOT EXISTS public.user_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_id UUID NOT NULL, -- User ID or Comment ID
    target_type TEXT NOT NULL, -- 'user', 'comment'
    reason TEXT NOT NULL,
    comments TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'resolved', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DEEP PERSONALIZATION --

-- Calculated interest scores based on user behavior
CREATE TABLE IF NOT EXISTS public.user_affinities (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    affinity_type TEXT NOT NULL, -- 'genre', 'actor', 'director'
    target_id TEXT NOT NULL, -- TMDB ID or Genre ID
    score FLOAT DEFAULT 0,
    last_calculated TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, affinity_type, target_id)
);

-- Custom user-defined tags across the library
CREATE TABLE IF NOT EXISTS public.global_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag_name TEXT NOT NULL,
    color_hex TEXT DEFAULT '#4DA3FF',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, tag_name)
);

CREATE TABLE IF NOT EXISTS public.media_tags (
    tag_id UUID REFERENCES public.global_tags(id) ON DELETE CASCADE,
    tmdb_id INT NOT NULL,
    media_type TEXT NOT NULL,
    PRIMARY KEY (tag_id, tmdb_id)
);

-- 3. DATA INTEGRITY --

-- Local cache for 'Where to Watch' data to save API calls
CREATE TABLE IF NOT EXISTS public.provider_registry_cache (
    tmdb_id INT PRIMARY KEY,
    media_type TEXT NOT NULL,
    provider_data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT now()
);

-- Audit log for external registry syncs
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL, -- 'trakt', 'json', 'csv'
    status TEXT NOT NULL, -- 'success', 'failed', 'partial'
    items_added INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grouping movies into collections (e.g., Avengers, Star Wars)
CREATE TABLE IF NOT EXISTS public.collection_registry (
    collection_id INT PRIMARY KEY,
    name TEXT NOT NULL,
    movie_ids INT[] DEFAULT '{}',
    last_synced TIMESTAMPTZ DEFAULT now()
);

-- 4. ADMIN & BROADCAST --

-- System-wide announcements
CREATE TABLE IF NOT EXISTS public.system_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT DEFAULT 'info', -- 'info', 'update', 'event', 'alert'
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ DEFAULT now(),
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) Stubs --
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all badges" ON public.user_badges FOR SELECT TO authenticated USING (true);

ALTER TABLE public.social_feed_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own feed" ON public.social_feed_cache FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.global_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tags" ON public.global_tags FOR ALL TO authenticated USING (auth.uid() = user_id);
