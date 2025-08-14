'use client';

import { useEffect } from 'react';
import { getClientConfig } from '@/lib/config';
import { isSupabaseAvailable } from '@/lib/supabase/client';

export function DebugSupabase() {
  useEffect(() => {
    const config = getClientConfig();
    console.log('=== SUPABASE DEBUG ===');
    console.log('URL:', config.supabase.url);
    console.log('Anon key (first 20 chars):', config.supabase.anonKey?.substring(0, 20));
    console.log('Anon key starts with eyJ:', config.supabase.anonKey?.startsWith('eyJ'));
    console.log('Is Supabase available:', isSupabaseAvailable());
    console.log('Full anon key:', config.supabase.anonKey);
  }, []);

  return null;
}