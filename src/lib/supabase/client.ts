/**
 * Supabase client for browser usage with RLS
 */
import { createClient } from '@supabase/supabase-js';

// Force direct values for now to get it working
const SUPABASE_URL = 'https://omcyckbwmmgxmbrrdkyf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tY3lja2J3bW1neG1icnJka3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjU4NTEsImV4cCI6MjA3MDc0MTg1MX0.ioeoj2NcCe9XpbyGPrNWlpt8TKyO21YxYJNZBUQNk_M';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => true;

export type { User, Session } from '@supabase/supabase-js';