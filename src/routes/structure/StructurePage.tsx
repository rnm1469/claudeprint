/**
 * @file src/routes/structure/StructurePage.tsx
 * @description Page présentant l'arborescence standardisée Vite + React (SPA).
 */

import React from 'react';
import { FolderTree, Server } from 'lucide-react';

export default function StructurePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-cyan-400" />
          Arborescence P2Print (100% Vite + React SPA Clean)
        </h1>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 font-mono text-xs space-y-3">
        <div className="text-slate-400 font-semibold text-sm font-sans mb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          Structure Vite + React standard (SPA)
        </div>
        <div className="pl-2 border-l border-slate-800 space-y-2 text-slate-300">
          <div className="text-amber-400">📄 index.html <span className="text-slate-500 font-sans text-[11px]">(Point d'entrée HTML racine avec div#root)</span></div>
          <div className="text-amber-400 pt-2">📁 src/</div>
          <div className="pl-4 text-emerald-300">├── 📄 main.tsx <span className="text-slate-500 font-sans text-[11px]">(Point d'entrée React - ReactDOM.createRoot & BrowserRouter)</span></div>
          <div className="pl-4 text-emerald-300">├── 📄 App.tsx <span className="text-slate-500 font-sans text-[11px]">(Composant racine avec Navbar & React Router Routes)</span></div>
          <div className="pl-4 text-purple-400">├── 📁 components/</div>
          <div className="pl-8 text-purple-300">└── 📄 Navbar.tsx <span className="text-slate-500 font-sans text-[11px]">(Barre de navigation, session Auth & liens React Router)</span></div>
          
          <div className="pl-4 text-cyan-400">├── 📁 routes/</div>
          <div className="pl-8 text-cyan-300">├── 📁 auth/</div>
          <div className="pl-12 text-slate-400">├── 📄 LoginPage.tsx <span className="text-slate-500 font-sans text-[11px]">(Connexion email/password)</span></div>
          <div className="pl-12 text-slate-400">└── 📄 SignupPage.tsx <span className="text-slate-500 font-sans text-[11px]">(Inscription email/password)</span></div>

          <div className="pl-8 text-blue-400">├── 📁 client/</div>
          <div className="pl-12 text-slate-400">└── 📄 ClientPage.tsx</div>
          <div className="pl-8 text-emerald-400">├── 📁 maker/</div>
          <div className="pl-12 text-slate-400">└── 📄 MakerPage.tsx</div>
          <div className="pl-8 text-purple-400">├── 📁 admin/</div>
          <div className="pl-12 text-slate-400">└── 📄 AdminPage.tsx</div>
          <div className="pl-8 text-amber-400">├── 📁 db/</div>
          <div className="pl-12 text-slate-400">└── 📄 DatabasePage.tsx</div>
          <div className="pl-8 text-cyan-400">└── 📁 structure/</div>
          <div className="pl-12 text-slate-400">└── 📄 StructurePage.tsx</div>

          <div className="pl-4 text-amber-400 pt-2">📁 lib/</div>
          <div className="pl-8 text-cyan-300">├── 📄 supabase-client.ts <span className="text-slate-500 font-sans text-[11px]">(Client navigateur - VITE_SUPABASE_ANON_KEY)</span></div>
          <div className="pl-8 text-cyan-300">├── 📄 supabase.ts</div>
          <div className="pl-8 text-cyan-300">└── 📄 types.ts</div>

          <div className="text-amber-400 pt-2">📁 supabase/migrations/</div>
          <div className="pl-4 text-cyan-300">├── 📄 20260806_init_users.sql</div>
          <div className="pl-4 text-cyan-300">└── 📄 20260806_auth_user_trigger.sql</div>
        </div>
      </div>
    </div>
  );
}
