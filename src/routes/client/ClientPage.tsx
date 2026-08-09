/**
 * @file src/routes/client/ClientPage.tsx
 * @description Espace Client P2Print (Page interactive)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Printer, ArrowRight, Sparkles, Users, Search } from 'lucide-react';

export default function ClientPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🛒</span> Espace Client
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">Fichier source : /src/routes/client/ClientPage.tsx</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Link
            to="/makers"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Découvrir les Makers</span>
          </Link>

          <Link
            to="/client/devenir-maker"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Devenir Maker</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </Link>
        </div>
      </div>

      {/* Banner Découverte des Makers */}
      <div className="p-6 bg-gradient-to-r from-blue-950/40 via-slate-900 to-teal-950/40 border border-blue-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white">Besoin d'un service d'impression 3D ?</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Parcourez le catalogue des Makers validés sur P2Print. Recherchez des ateliers par nom ou par ville pour réaliser vos projets.
          </p>
        </div>

        <Link
          to="/makers"
          className="shrink-0 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Explorer les Makers</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Banner Devenir Maker */}
      <div className="p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-800/50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Vous possédez une imprimante 3D ?</h3>
          </div>
          <p className="text-xs text-slate-300 max-w-xl">
            Proposez vos services d'impression aux autres clients P2Print. Créez votre profil maker en quelques clics et recevez des demandes de devis.
          </p>
        </div>

        <Link
          to="/client/devenir-maker"
          className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>Créer mon profil Maker</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="min-h-[280px] flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center shadow-xs">
        <div className="w-16 h-16 bg-blue-950 text-blue-400 border border-blue-800/60 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold">
          🛒
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Espace Client</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          Bienvenue dans l'espace réservé aux clients P2Print. Cet espace permettra de soumettre des fichiers 3D, demander des devis et suivre vos commandes.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Page en construction
        </div>
      </div>
    </div>
  );
}
