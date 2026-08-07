/**
 * @file src/components/ProtectedRoute.tsx
 * @description Composant wrapper pour sécuriser les routes react-router-dom 
 * selon le rôle Supabase de l'utilisateur (client, maker, admin).
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserRole } from '../hooks/useUserRole';
import type { UserRole } from '../lib/types';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  guestOnly?: boolean;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  guestOnly = false,
}: ProtectedRouteProps) {
  const { user, role, loading } = useUserRole();

  // 1. État de chargement pendant la vérification de session / rôle
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-xs font-mono text-slate-400">Vérification de la session et des autorisations...</p>
      </div>
    );
  }

  // 2. Route réservée aux invités non connectés (/login, /signup)
  if (guestOnly) {
    if (user) {
      const homePath = role === 'admin' ? '/admin' : role === 'maker' ? '/maker' : '/client';
      return <Navigate to={homePath} replace />;
    }
    return <>{children}</>;
  }

  // 3. Utilisateur NON connecté tentant d'accéder à une route protégée
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 4. Utilisateur ADMIN -> accès autorisé à TOUTES les routes
  if (role === 'admin') {
    return <>{children}</>;
  }

  // 5. Vérification des rôles autorisés pour les utilisateurs non-admin
  if (allowedRoles && allowedRoles.length > 0) {
    if (role && allowedRoles.includes(role)) {
      return <>{children}</>;
    }

    // En cas de tentative d'accès non autorisé, redirection vers son propre espace
    const ownSpacePath = role === 'maker' ? '/maker' : '/client';
    return <Navigate to={ownSpacePath} replace />;
  }

  return <>{children}</>;
}
