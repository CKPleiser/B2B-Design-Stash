/**
 * Supabase client for server usage (API routes, server actions)
 */
import { createClient } from '@supabase/supabase-js';
import { getConfig } from '../config';

const config = getConfig();

export const supabaseServer = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey || config.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Create a Supabase client for server-side usage with user context
 * Use this in API routes where you need to respect RLS policies
 */
export function createServerClient(accessToken?: string) {
  return createClient(
    config.supabase.url,
    config.supabase.anonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`,
        } : undefined,
      },
    }
  );
}