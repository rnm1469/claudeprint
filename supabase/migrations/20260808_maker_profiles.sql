-- =============================================================================
-- MIGRATION : PARCOURS "DEVENIR MAKER" - BASE DE DONNÉES ET SÉCURITÉ RLS
-- Fichier : supabase/migrations/20260808_maker_profiles.sql
-- =============================================================================

-- 1. CRÉATION DE LA TABLE MAKER_PROFILES
CREATE TABLE IF NOT EXISTS public.maker_profiles (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    bio TEXT,
    city VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ACTIVATION DU ROW LEVEL SECURITY (RLS) SUR MAKER_PROFILES
ALTER TABLE public.maker_profiles ENABLE ROW LEVEL SECURITY;

-- 2.1 Policy : Lecture de son propre profil maker
DROP POLICY IF EXISTS "Makers can view own profile" ON public.maker_profiles;
CREATE POLICY "Makers can view own profile"
ON public.maker_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2.2 Policy : Création de son propre profil maker
DROP POLICY IF EXISTS "Makers can create own profile" ON public.maker_profiles;
CREATE POLICY "Makers can create own profile"
ON public.maker_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2.3 Policy : Modification de son propre profil maker
DROP POLICY IF EXISTS "Makers can update own profile" ON public.maker_profiles;
CREATE POLICY "Makers can update own profile"
ON public.maker_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2.4 Policy : Accès complet administrateurs
DROP POLICY IF EXISTS "Admins have full access on maker_profiles" ON public.maker_profiles;
CREATE POLICY "Admins have full access on maker_profiles"
ON public.maker_profiles
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());


-- 3. NOUVELLE POLICY SUR PUBLIC.USERS : CHANGEMENT DE RÔLE AUTONOMIE (CLIENT -> MAKER)
-- Permet à l'utilisateur authentifié de modifier son propre rôle vers 'client' ou 'maker'
-- mais interdit strictement la promotion vers 'admin'.
DROP POLICY IF EXISTS "Changement de rôle limité (auto-service)" ON public.users;
CREATE POLICY "Changement de rôle limité (auto-service)"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role IN ('client', 'maker')
    AND role != 'admin'
);
