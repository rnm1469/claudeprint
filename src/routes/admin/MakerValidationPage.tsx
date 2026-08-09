/**
 * @file src/routes/admin/MakerValidationPage.tsx
 * @description Page de validation des profils Makers pour les Administrateurs.
 * Permet d'approuver ou de rejeter les candidatures des Makers en attente.
 */

import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  Building2, 
  MapPin, 
  Mail, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabase-client';
import type { MakerProfile, MakerStatus } from '../../lib/types';

interface MakerProfileWithEmail extends MakerProfile {
  email?: string;
}

export default function MakerValidationPage() {
  const [profiles, setProfiles] = useState<MakerProfileWithEmail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'info'; message: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);
    setActionError(null);

    try {
      // 1. Récupération des profils maker
      const { data: profilesData, error: profilesError } = await (supabaseClient
        .from('maker_profiles' as any) as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // 2. Récupération des emails associés depuis la table users
      const { data: usersData, error: usersError } = await (supabaseClient
        .from('users' as any) as any)
        .select('id, email');

      if (usersError) {
        console.warn('⚡ [MakerValidationPage] Avertissement lors de la lecture des e-mails users:', usersError);
      }

      const emailMap = new Map<string, string>();
      if (usersData) {
        usersData.forEach((u: { id: string; email: string }) => {
          if (u.id && u.email) {
            emailMap.set(u.id, u.email);
          }
        });
      }

      const formatted: MakerProfileWithEmail[] = (profilesData || []).map((p: any) => ({
        id: p.id,
        business_name: p.business_name,
        bio: p.bio,
        city: p.city,
        status: (p.status as MakerStatus) || 'pending',
        created_at: p.created_at,
        email: emailMap.get(p.id) || 'Non disponible',
      }));

      setProfiles(formatted);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur chargement profils makers:', errorObj);
      setError(`Erreur de chargement : ${errorObj.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleUpdateStatus = async (profileId: string, newStatus: MakerStatus) => {
    setActionLoadingId(profileId);
    setActionError(null);
    setToastMsg(null);

    try {
      const { error: updateError } = await (supabaseClient
        .from('maker_profiles' as any) as any)
        .update({ status: newStatus })
        .eq('id', profileId);

      if (updateError) {
        throw new Error(`Échec de la mise à jour RLS/Supabase : ${updateError.message}`);
      }

      // Mise à jour immédiate dans le state local
      setProfiles((prev) =>
        prev.map((p) => (p.id === profileId ? { ...p, status: newStatus } : p))
      );

      const isApprove = newStatus === 'approved';
      setToastMsg({
        type: isApprove ? 'success' : 'info',
        message: isApprove
          ? 'Le profil Maker a été approuvé avec succès.'
          : 'Le profil Maker a été marqué comme rejeté.',
      });

      // Auto-dissipation du toast après 4 secondes
      setTimeout(() => {
        setToastMsg(null);
      }, 4000);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur mise à jour statut:', errorObj);
      setActionError(errorObj.message || 'Impossible de mettre à jour le statut du profil.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtrage par statut et terme de recherche
  const pendingProfiles = profiles.filter((p) => p.status === 'pending');
  const approvedProfiles = profiles.filter((p) => p.status === 'approved');
  const rejectedProfiles = profiles.filter((p) => p.status === 'rejected');

  const getFilteredProfiles = () => {
    let list = profiles;
    if (activeTab === 'pending') list = pendingProfiles;
    else if (activeTab === 'approved') list = approvedProfiles;
    else if (activeTab === 'rejected') list = rejectedProfiles;

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase();
    return list.filter(
      (p) =>
        p.business_name.toLowerCase().includes(term) ||
        (p.city && p.city.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.bio && p.bio.toLowerCase().includes(term))
    );
  };

  const filteredProfiles = getFilteredProfiles();

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-400" />
            <span>Validation des Profils Makers</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Modération et gestion du statut des demandes d'accès à l'espace Maker.
          </p>
        </div>

        <button
          onClick={fetchProfiles}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Rafraîchir</span>
        </button>
      </div>

      {/* Messages de Notification / Toast */}
      {toastMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
              : 'bg-blue-950/80 border-blue-800 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0" />
            )}
            <span>{toastMsg.message}</span>
          </div>
          <button
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white text-xs font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Message d'erreur action */}
      {actionError && (
        <div className="p-4 bg-red-950/80 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Onglets de statut et recherche */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-2 border border-slate-800 rounded-2xl">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En attente</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeTab === 'pending' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-amber-400'
            }`}>
              {pendingProfiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approuvés</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeTab === 'approved' ? 'bg-emerald-950 text-emerald-200' : 'bg-slate-800 text-emerald-400'
            }`}>
              {approvedProfiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rejected')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejetés</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeTab === 'rejected' ? 'bg-rose-950 text-rose-200' : 'bg-slate-800 text-rose-400'
            }`}>
              {rejectedProfiles.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>Tous</span>
            <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-bold ${
              activeTab === 'all' ? 'bg-purple-950 text-purple-200' : 'bg-slate-800 text-purple-300'
            }`}>
              {profiles.length}
            </span>
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher nom, ville, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-purple-500"
          />
        </div>
      </div>

      {/* Chargement global */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-sm text-slate-400">Chargement des demandes de profil Maker...</p>
        </div>
      )}

      {/* Message d'erreur de chargement */}
      {!loading && error && (
        <div className="p-6 bg-red-950/40 border border-red-800/80 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h3 className="text-sm font-semibold text-red-200">Erreur lors de la récupération des profils</h3>
          <p className="text-xs text-red-300/80 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchProfiles}
            className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Liste vide */}
      {!loading && !error && filteredProfiles.length === 0 && (
        <div className="py-12 px-4 bg-slate-900/30 border border-slate-800/60 rounded-2xl text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            {activeTab === 'pending'
              ? 'Aucune demande en attente'
              : activeTab === 'approved'
              ? 'Aucun profil approuvé'
              : activeTab === 'rejected'
              ? 'Aucun profil rejeté'
              : 'Aucun profil maker trouvé'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Aucun résultat ne correspond à votre critère de recherche.'
              : activeTab === 'pending'
              ? 'Toutes les candidatures Makers ont été traitées.'
              : 'Aucun profil ne correspond à cette catégorie.'}
          </p>
        </div>
      )}

      {/* Grille / Liste des Profils */}
      {!loading && !error && filteredProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProfiles.map((profile) => {
            const isLoadingThis = actionLoadingId === profile.id;

            return (
              <div
                key={profile.id}
                className={`bg-slate-900 border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all ${
                  profile.status === 'pending'
                    ? 'border-amber-500/40 hover:border-amber-500/70'
                    : profile.status === 'approved'
                    ? 'border-emerald-800/50'
                    : 'border-rose-900/50'
                }`}
              >
                {/* En-tête de la carte */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                        <Building2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm leading-snug">
                          {profile.business_name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[180px]">{profile.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badge de statut */}
                    {profile.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-700/80 text-[11px] font-mono font-semibold shrink-0">
                        <Clock className="w-3 h-3 animate-pulse text-amber-400" />
                        <span>En attente</span>
                      </span>
                    )}

                    {profile.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/80 text-[11px] font-mono font-semibold shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Approuvé</span>
                      </span>
                    )}

                    {profile.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/80 text-rose-300 border border-rose-700/80 text-[11px] font-mono font-semibold shrink-0">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>Rejeté</span>
                      </span>
                    )}
                  </div>

                  {/* Ville et Date */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                    {profile.city && (
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{profile.city}</span>
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500">
                      Soumis le : {new Date(profile.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  {/* Bio / Description */}
                  {profile.bio && (
                    <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 line-clamp-3 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}
                </div>

                {/* Actions de modération */}
                {profile.status === 'pending' ? (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleUpdateStatus(profile.id, 'rejected')}
                      disabled={isLoadingThis}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800/80 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                      <span>Rejeter</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(profile.id, 'approved')}
                      disabled={isLoadingThis}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isLoadingThis ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <span>Approuver</span>
                    </button>
                  </div>
                ) : (
                  /* Option de modification de statut pour les profils déjà traités */
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span className="italic">Profil déjà traité</span>
                    <div className="flex gap-2">
                      {profile.status !== 'approved' && (
                        <button
                          onClick={() => handleUpdateStatus(profile.id, 'approved')}
                          disabled={isLoadingThis}
                          className="text-emerald-400 hover:text-emerald-300 text-[11px] underline font-medium cursor-pointer"
                        >
                          Passer en approuvé
                        </button>
                      )}
                      {profile.status !== 'rejected' && (
                        <button
                          onClick={() => handleUpdateStatus(profile.id, 'rejected')}
                          disabled={isLoadingThis}
                          className="text-rose-400 hover:text-rose-300 text-[11px] underline font-medium cursor-pointer"
                        >
                          Passer en rejeté
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
