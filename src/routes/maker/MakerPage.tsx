/**
 * @file src/routes/maker/MakerPage.tsx
 * @description Espace Maker / Imprimeur 3D P2Print (Page interactive)
 */

import React from 'react';

export default function MakerPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">🖨️</span> Espace Maker (Imprimeur)
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">Fichier source : /src/routes/maker/MakerPage.tsx</p>
      </div>

      <div className="min-h-[350px] flex flex-col items-center justify-center p-8 bg-slate-900/50 border border-slate-800 rounded-2xl text-center shadow-xs">
        <div className="w-16 h-16 bg-emerald-950 text-emerald-400 border border-emerald-800/60 rounded-2xl flex items-center justify-center mb-4 text-2xl font-bold">
          🖨️
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">Espace Maker (Imprimeur)</h2>
        <p className="text-slate-400 max-w-md mb-6 text-sm">
          Bienvenue dans le tableau de bord des makers. Cet espace permettra de gérer vos imprimantes 3D, répondre aux demandes de devis et gérer l'impression des pièces.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-950/60 text-amber-300 border border-amber-800/60 rounded-full text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          Page en construction
        </div>
      </div>
    </div>
  );
}
