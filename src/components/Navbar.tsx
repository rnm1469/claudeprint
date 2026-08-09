/**
 * @file src/components/Navbar.tsx
 * @description Barre de navigation pour l'application Vite SPA.
 * Affiche dynamiquement les onglets et cache les outils système (/db, /structure) aux non-admins.
 */

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Printer, 
  Shield, 
  Database, 
  FolderTree, 
  CheckCircle2,
  AlertCircle,
  LogIn,
  UserPlus,
  LogOut,
  UserCheck,
  Users
} from 'lucide-react';
import { supabaseClient, isSupabaseConfigured } from '../lib/supabase-client';
import { useUserRole } from '../hooks/useUserRole';

export default function Navbar() {
  const { user, role } = useUserRole();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    navigate('/login');
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
              3D
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-xl bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  P2Print
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono font-medium">
                  Vite + React SPA
                </span>
              </div>
              <p className="text-xs text-slate-400">Marketplace d'impression 3D (Client • Maker • Admin)</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
              isConfigured 
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/60' 
                : 'bg-amber-950/50 text-amber-400 border-amber-800/60'
            }`}>
              {isConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase Connecté</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Supabase prêt (.env.example)</span>
                </>
              )}
            </div>

            {user ? (
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <div className="flex items-center gap-2 text-xs">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-200 font-medium truncate max-w-[130px]">{user.email}</span>
                    {role && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-bold border ${
                        role === 'admin' 
                          ? 'bg-purple-950 text-purple-300 border-purple-800' 
                          : role === 'maker' 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                          : 'bg-blue-950 text-blue-300 border-blue-800'
                      }`}>
                        {role}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/60 text-xs rounded-lg transition-colors font-medium cursor-pointer"
                  title="Se déconnecter de la session Supabase Auth"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/login"
                  className={({ isActive }) => `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Connexion
                </NavLink>
                <NavLink
                  to="/signup"
                  className={({ isActive }) => `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-cyan-600 text-white border-cyan-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Inscription
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2 flex flex-wrap gap-2">
        {!user && (
          <>
            <NavLink
              to="/login"
              className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>/login</span>
            </NavLink>

            <NavLink
              to="/signup"
              className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>/signup</span>
            </NavLink>

            <div className="w-px h-5 bg-slate-800 my-auto mx-1 hidden sm:block"></div>
          </>
        )}

        <NavLink
          to="/client"
          className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>/client</span>
        </NavLink>

        <NavLink
          to="/makers"
          className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>/makers</span>
        </NavLink>

        <NavLink
          to="/maker"
          className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>/maker</span>
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
            isActive
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>/admin</span>
        </NavLink>

        {/* Liens Réservés Strictement aux Administrateurs */}
        {role === 'admin' && (
          <>
            <div className="w-px h-5 bg-slate-800 my-auto mx-1 hidden sm:block"></div>

            <NavLink
              to="/db"
              className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Trigger & SQL</span>
            </NavLink>

            <NavLink
              to="/structure"
              className={({ isActive }) => `flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Arborescence</span>
            </NavLink>
          </>
        )}
      </nav>
    </div>
  );
}
