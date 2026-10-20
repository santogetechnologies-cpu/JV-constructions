import { createClient } from '@supabase/supabase-js';

// Fallback to project defaults so app never throws unhandled "supabaseUrl is required" fatal error
const defaultUrl = 'https://gphhlkksrkzppxrihtnm.supabase.co';
const defaultKey = 'sb_publishable_yh2rwDeBD53jA2eoPeKJLg_QFx3kjP_';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  defaultKey;

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
  return Boolean(
    (import.meta.env.VITE_SUPABASE_URL || defaultUrl) &&
    (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || defaultKey)
  );
};
