/**
 * @file src/routes/maker/MakerPage.tsx
 * @description Espace Maker / Imprimeur 3D P2Print (Tableau de bord de l'atelier).
 * Accès rapide au catalogue d'articles et aux demandes de devis sur mesure.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, Package, ArrowRight, Layers, FileText, Clock } from 'lucide-react';
import { supabaseClient } from '../../lib/supabase-client';

export default function MakerPage() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const { data: authData } = await supabaseClient.auth.getUser();
        const user = authData?.user;
        if (!user) return;

        const { count, error } = await (supabaseClient
          .from('quote_requests' as any) as any)
          .select('id', { count: 'exact', head: true })
          .eq('maker_id', user.id)
          .eq('status', 'pending');

        if (!error && count !== null) {
          setPendingCount(count);
        }
      } catch (err) {
        console.error('Erreur chargement nombre devis en attente:', err);
      }
    }

    fetchPendingCount();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Printer className="w-6 h-6 text-emerald-400" />
            <span>Espace Maker (Imprimeur)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tableau de bord de gestion de votre atelier d'impression 3D.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/maker/devis"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer relative"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Demandes de devis</span>
            {pendingCount !== null && pendingCount > 0 && (
              <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-full">
                {pendingCount}
              </span>
            )}
          </Link>

          <Link
            to="/maker/articles"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Gérer mon catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid des fonctionnalités de l'Atelier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banner 1 : Demandes de Devis */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 hover:border-amber-800/50 rounded-2xl flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Demandes de Devis</h3>
              </div>
              {pendingCount !== null && pendingCount > 0 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-800/80 rounded-full text-xs font-semibold">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{pendingCount} en attente</span>
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono">Sur mesure</span>
              )}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consultez les requêtes de devis personnalisées envoyées par vos clients. Téléchargez leurs fichiers 3D (.STL, .OBJ, .3MF), examinez leurs consignes et mettez à jour leur statut.
            </p>
          </div>

          <Link
            to="/maker/devis"
            className="self-start px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Consulter les demandes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Banner 2 : Catalogue d'articles */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 hover:border-emerald-800/50 rounded-2xl flex flex-col justify-between space-y-4 transition-all">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Catalogue & Pièces 3D</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Public</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Créez et gérez la liste des objets prêt-à-imprimer que vous proposez (figurines, accessoires, pièces de rechange). Fixez vos prix et ajoutez des photos d'illustration.
            </p>
          </div>

          <Link
            to="/maker/articles"
            className="self-start px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Accéder au catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
