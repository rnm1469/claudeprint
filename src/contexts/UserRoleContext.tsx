/**
 * @file src/contexts/UserRoleContext.tsx
 * @description Contexte React pour centraliser et partager en temps réel
 * la session Supabase et le rôle de l'utilisateur à travers toute l'application.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabaseClient } from '../lib/supabase-client';
import type { UserRole } from '../lib/types';

export interface UserRoleContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  loading: boolean;
  lastError: string | null;
  refreshRole: () => Promise<UserRole | null>;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshRole = async (): Promise<UserRole | null> => {
    try {
      const { data: sessionData } = await supabaseClient.auth.getSession();
      const currentSession = sessionData.session;
      const currentUser = currentSession?.user ?? user;

      if (!currentUser) {
        setRole(null);
        return null;
      }

      const metadataRole = (currentUser.user_metadata?.role || currentUser.app_metadata?.role) as UserRole | undefined;

      const { data, error } = await supabaseClient
        .from('users')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      const fetchedRole = (data as { role?: string } | null)?.role;

      if (error) {
        const errStr = `Error code ${error.code}: ${error.message} | details: ${error.details || 'none'} | hint: ${error.hint || 'none'}`;
        console.warn('⚡ [UserRoleContext] Erreur RLS/Permission lors de la lecture de public.users:', errStr);
        setLastError(errStr);
        const fallback = metadataRole || 'client';
        setRole(fallback);
        return fallback;
      } else if (fetchedRole) {
        setLastError(null);
        const resolvedRole = fetchedRole as UserRole;
        setRole(resolvedRole);
        return resolvedRole;
      } else {
        setLastError('No row found in public.users for this user ID');
        const fallback = metadataRole || 'client';
        setRole(fallback);
        return fallback;
      }
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur lors de la récupération du rôle:', errorObj);
      setLastError(`Catch error: ${errorObj?.message || String(err)}`);
      setRole('client');
      return 'client';
    }
  };

  useEffect(() => {
    let mounted = true;

    async function fetchUserRole(currentUser: User) {
      try {
        const metadataRole = (currentUser.user_metadata?.role || currentUser.app_metadata?.role) as UserRole | undefined;

        const { data, error } = await supabaseClient
          .from('users')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        const fetchedRole = (data as { role?: string } | null)?.role;

        if (error) {
          const errStr = `Error code ${error.code}: ${error.message} | details: ${error.details || 'none'} | hint: ${error.hint || 'none'}`;
          console.warn('⚡ [UserRoleContext] Erreur RLS/Permission lors de la lecture de public.users:', errStr);
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
        console.error('Erreur initAuth UserRoleContext:', err);
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

  return (
    <UserRoleContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        lastError,
        refreshRole,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole(): UserRoleContextType {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole doit être utilisé à l\'intérieur d\'un UserRoleProvider');
  }
  return context;
}
