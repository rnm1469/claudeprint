/**
 * @file src/routes/maker/MakerPage.tsx
 * @description Espace Maker / Imprimeur 3D P2Print (Page interactive)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Printer, Package, ArrowRight, Layers } from 'lucide-react';

export default function MakerPage() {
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

        <Link
          to="/maker/articles"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Package className="w-4 h-4" />
          <span>Gérer mon catalogue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Banner Catalogue d'articles */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Catalogue d'articles & Pièces 3D</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Créez et gérez la liste des objets que vous proposez (figurines, pièces de rechange, pièces sur mesure). Définissez vos prix et activez ou désactivez leur visibilité.
          </p>
        </div>

        <Link
          to="/maker/articles"
          className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Accéder au catalogue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="min-h-[250px] flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center shadow-xs">
        <div className="w-14 h-14 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-2xl flex items-center justify-center mb-3 text-xl font-bold">
          🖨️
        </div>
        <h2 className="text-lg font-bold text-slate-100 mb-2">Service d'Impression & Devis</h2>
        <p className="text-slate-400 max-w-md mb-4 text-xs">
          Cet espace permettra prochainement de recevoir les demandes de devis personnalisés, gérer vos imprimantes 3D et le suivi de vos commandes.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>Demandes de devis bientôt disponibles</span>
        </div>
      </div>
    </div>
  );
}
