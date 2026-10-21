import { createClient } from '@supabase/supabase-js';

// Dedicated default credentials for Yazh Land Promoters database so app never throws unhandled "supabaseUrl is required" fatal error
const defaultUrl = 'https://gphhlkksrkzppxrihtnm.supabase.co';
const defaultKey = 'sb_publishable_yh2rwDeBD53jA2eoPeKJLg_QFx3kjP_';

const envUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : undefined;
const envAnonKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_ANON_KEY : undefined;
const envPubKey = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY : undefined;

export const supabaseUrl =
  typeof envUrl === 'string' && envUrl.trim().length > 0 ? envUrl.trim() : defaultUrl;

export const supabaseKey =
  typeof envAnonKey === 'string' && envAnonKey.trim().length > 0
    ? envAnonKey.trim()
    : typeof envPubKey === 'string' && envPubKey.trim().length > 0
    ? envPubKey.trim()
    : defaultKey;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseKey);
};
