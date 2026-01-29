import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.1';

/**
 * SCENEIT REGISTRY SYNC
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
console.debug('SceneIt Supabase Sync:', {
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