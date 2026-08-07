/**
 * @file src/lib/supabase-client.ts
 * @description Client Supabase public pour P2Print (utilisable côté navigateur / client Vite SPA).
 * Utilise la clé anonyme publique VITE_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const supabaseUrl: string = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  (typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '' : '');

export const supabaseAnonKey: string = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '' : '');

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
