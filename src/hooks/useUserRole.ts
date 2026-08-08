/**
 * @file src/hooks/useUserRole.ts
 * @description Hook React personnalisé pour récupérer la session Supabase active 
 * et interroger la table public.users afin de déterminer le rôle de l'utilisateur.
 */

import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabaseClient } from '../lib/supabase-client';
import type { UserRole } from '../lib/types';

export interface UseUserRoleReturn {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  lastError: string | null;
}

export function useUserRole(): UseUserRoleReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchUserRole(currentUser: User) {
      try {
        // Fallback métadonnées Supabase Auth si renseignées
        const metadataRole = (currentUser.user_metadata?.role || currentUser.app_metadata?.role) as UserRole | undefined;

        const { data, error } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        const fetchedRole = (data as { role?: string } | null)?.role;

        if (error) {
          const errStr = `Error code ${error.code}: ${error.message} | details: ${error.details || 'none'} | hint: ${error.hint || 'none'}`;
          console.warn('⚡ [useUserRole] Erreur RLS/Permission lors de la lecture de public.users:', errStr);
          if (mounted) {
            setLastError(errStr);
            setRole(metadataRole || 'client');
          }
        } else if (fetchedRole) {
          if (mounted) {
            setLastError(null);
            setRole(fetchedRole as UserRole);
          }
        } else {
          if (mounted) {
            setLastError('No row found in public.users for this user ID');
            setRole(metadataRole || 'client');
          }
        }
      } catch (err: unknown) {
        const errorObj = err as Error;
        console.error('Erreur lors de la récupération du rôle:', errorObj);
        if (mounted) {
          setLastError(`Catch error: ${errorObj?.message || String(err)}`);
          setRole('client');
        }
      }
    }

    async function initAuth() {
      try {
        const { data } = await supabaseClient.auth.getSession();
        const currentSession = data.session;
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }

        if (currentSession?.user) {
          await fetchUserRole(currentSession.user);
        } else {
          if (mounted) setRole(null);
        }
      } catch (err) {
        console.error('Erreur initAuth useUserRole:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          setLoading(true);
          await fetchUserRole(currentSession.user);
          if (mounted) setLoading(false);
        } else {
          setRole(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, session, role, loading, lastError };
}

export default useUserRole;
