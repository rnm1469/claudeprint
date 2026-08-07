/**
 * @file src/lib/supabase.ts
 * @description Point d'entrée Supabase public re-exportant le client pour l'application Vite SPA P2Print.
 */

export { 
  supabaseClient as supabase, 
  supabaseClient, 
  supabaseUrl, 
  supabaseAnonKey, 
  isSupabaseConfigured 
} from './supabase-client';
