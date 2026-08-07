/**
 * @file src/lib/supabase-client.ts
 * @description Client Supabase public pour P2Print (Vite SPA).
 * Utilise uniquement la clé anonyme publique VITE_SUPABASE_ANON_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const supabaseUrl: string = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseAnonKey: string = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== 'https://your-project-id.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your-anon-key-here'
  );
};

export const supabaseClient = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
