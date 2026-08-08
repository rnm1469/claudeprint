/**
 * @file src/routes/db/DatabasePage.tsx
 * @description Page présentant les migrations SQL et le Trigger Supabase Auth.
 */

import React, { useState } from 'react';
import { Database, Check, Copy } from 'lucide-react';

export default function DatabasePage() {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedTriggerSql, setCopiedTriggerSql] = useState(false);

  const sqlUsersTableMigration = `-- 1. SCHÉMA DE BASE DE DONNÉES POSTGRESQL (users & user_role)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'maker', 'admin');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. POLITIQUES DE SÉCURITÉ RLS (ROW LEVEL SECURITY)
GRANT SELECT ON public.users TO authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

`;

  const sqlTriggerMigration = `-- 2. TRIGGER AUTOMATIQUE DE PROFIL UTILISATEUR SUR SUPABASE AUTH
-- supabase/migrations/20260806_auth_user_trigger.sql

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'client'::public.user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-amber-400" />
          Migrations PostgreSQL & Trigger Supabase Auth
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Crée automatiquement le profil dans <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">public.users</code> avec <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">role = 'client'</code> lors du signup dans <code className="text-amber-300 bg-slate-900 px-1.5 py-0.5 rounded">auth.users</code>.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-amber-300 font-mono">
            supabase/migrations/20260806_auth_user_trigger.sql (TRIGGER AUTOMATIQUE)
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sqlTriggerMigration);
              setCopiedTriggerSql(true);
              setTimeout(() => setCopiedTriggerSql(false), 2000);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950 border border-amber-800 text-amber-300 rounded text-xs font-semibold hover:bg-amber-900 transition-colors cursor-pointer"
          >
            {copiedTriggerSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTriggerSql ? 'Copié !' : 'Copier Trigger SQL'}</span>
          </button>
        </div>
        <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
          {sqlTriggerMigration}
        </pre>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold text-slate-300 font-mono">
            supabase/migrations/20260806_init_users.sql (SCHÉMA USERS)
          </span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(sqlUsersTableMigration);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 2000);
            }}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? 'Copié' : 'Copier Schema SQL'}</span>
          </button>
        </div>
        <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
          {sqlUsersTableMigration}
        </pre>
      </div>
    </div>
  );
}
