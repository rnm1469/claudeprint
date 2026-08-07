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
}

export function useUserRole(): UseUserRoleReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function fetchUserRole(userId: string) {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        const fetchedRole = (data as { role?: string } | null)?.role;

        if (error) {
          console.warn('Information rôle non trouvée dans public.users:', error.message);
          if (mounted) setRole('client');
        } else if (fetchedRole) {
          if (mounted) setRole(fetchedRole as UserRole);
        } else {
          if (mounted) setRole('client');
        }
      } catch (err) {
        console.error('Erreur lors de la récupération du rôle:', err);
        if (mounted) setRole('client');
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
          await fetchUserRole(currentSession.user.id);
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
          await fetchUserRole(currentSession.user.id);
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

  return { user, session, role, loading };
}

export default useUserRole;
