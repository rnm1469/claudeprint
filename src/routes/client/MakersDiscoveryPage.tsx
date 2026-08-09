/**
 * @file src/routes/client/MakersDiscoveryPage.tsx
 * @description Page de découverte des Makers approuvés.
 * Permet aux clients de consulter et rechercher tous les Makers validés par la plateforme.
 */

import React, { useEffect, useState } from 'react';
import { 
  Printer, 
  Search, 
  MapPin, 
  Building2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Users,
  Sparkles
} from 'lucide-react';
import { supabaseClient } from '../../lib/supabase-client';
import type { MakerProfile } from '../../lib/types';

export default function MakersDiscoveryPage() {
  const [makers, setMakers] = useState<MakerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchApprovedMakers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Requête Supabase avec filtre strict sur status = 'approved'
      const { data, error: queryError } = await (supabaseClient
        .from('maker_profiles' as any) as any)
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      setMakers((data as MakerProfile[]) || []);
    } catch (err: unknown) {
      const errorObj = err as Error;
      console.error('Erreur lors de la récupération des Makers approuvés:', errorObj);
      setError(errorObj.message || 'Impossible de charger la liste des Makers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedMakers();
  }, []);

  // Filtrage côté client par nom ou ville
  const filteredMakers = makers.filter((maker) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchesName = maker.business_name?.toLowerCase().includes(term);
    const matchesCity = maker.city?.toLowerCase().includes(term);
    const matchesBio = maker.bio?.toLowerCase().includes(term);
    return matchesName || matchesCity || matchesBio;
  });

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <span>Découvrir les Makers</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Trouvez un imprimeur 3D partenaire qualifié et vérifié près de chez vous.
          </p>
        </div>

        <button
          onClick={fetchApprovedMakers}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Rafraîchir</span>
        </button>
      </div>

      {/* Barre de recherche & Filtres */}
      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom de service, ville..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>
            {loading
              ? 'Chargement...'
              : `${filteredMakers.length} Maker${filteredMakers.length > 1 ? 's' : ''} vérifié${filteredMakers.length > 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Recherche des ateliers Makers approuvés...</p>
        </div>
      )}

      {/* Message d'erreur */}
      {!loading && error && (
        <div className="p-6 bg-red-950/40 border border-red-800/80 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <h3 className="text-sm font-semibold text-red-200">Erreur lors de la récupération des Makers</h3>
          <p className="text-xs text-red-300/80 max-w-md mx-auto">{error}</p>
          <button
            onClick={fetchApprovedMakers}
            className="px-4 py-2 bg-red-900/80 hover:bg-red-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Liste vide */}
      {!loading && !error && filteredMakers.length === 0 && (
        <div className="py-16 px-4 bg-slate-900/40 border border-slate-800 rounded-2xl text-center space-y-3">
          <Printer className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">
            {searchTerm ? 'Aucun Maker ne correspond à votre recherche' : 'Aucun Maker approuvé disponible'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? 'Essayez de modifier vos termes de recherche ou de réinitialiser le filtre.'
              : 'Les ateliers d\'impression 3D apparaîtront ici dès leur validation par l\'équipe P2Print.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium cursor-pointer"
            >
              Effacer la recherche
            </button>
          )}
        </div>
      )}

      {/* Grille des Makers */}
      {!loading && !error && filteredMakers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMakers.map((maker) => (
            <div
              key={maker.id}
              className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all hover:shadow-lg hover:shadow-emerald-950/20 group"
            >
              <div className="space-y-3">
                {/* En-tête de la carte */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 text-sm group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {maker.business_name}
                      </h3>
                      {maker.city && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{maker.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 text-[10px] font-mono font-semibold shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Vérifié</span>
                  </span>
                </div>

                {/* Description / Bio */}
                {maker.bio ? (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/60">
                    {maker.bio}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                    Aucune description fournie par cet atelier.
                  </p>
                )}
              </div>

              {/* Pied de carte */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Atelier Partenaire</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Inscrit le {new Date(maker.created_at).toLocaleDateString('fr-FR', {
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
