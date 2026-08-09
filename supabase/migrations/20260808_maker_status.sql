-- =============================================================================
-- MIGRATION : VALIDATION DES PROFILS MAKERS (STATUT ET SÉCURITÉ RLS)
-- Fichier : supabase/migrations/20260808_maker_status.sql
-- =============================================================================

-- 1. CRÉATION DU TYPE ENUM MAKER_STATUS
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maker_status') THEN
        CREATE TYPE public.maker_status AS ENUM ('pending', 'approved', 'rejected');
    END IF;
END
$$;

-- 2. AJOUT DE LA COLONNE STATUS DANS PUBLIC.MAKER_PROFILES
ALTER TABLE public.maker_profiles
ADD COLUMN IF NOT EXISTS status public.maker_status NOT NULL DEFAULT 'pending';

-- 3. ATTRIBUTION DES DROITS DE BASE (GRANTS)
GRANT USAGE ON TYPE public.maker_status TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maker_profiles TO authenticated;

-- 4. MISE À JOUR DE LA POLICY RLS D'UPDATE POUR LES MAKERS
-- Garantit qu'un utilisateur non-admin ne peut pas modifier la colonne 'status' (le statut doit rester identique à sa valeur actuelle en base).
DROP POLICY IF EXISTS "Makers can update own profile" ON public.maker_profiles;
CREATE POLICY "Makers can update own profile"
ON public.maker_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND (
        public.is_admin()
        OR status = (SELECT mp.status FROM public.maker_profiles mp WHERE mp.id = auth.uid())
    )
);
