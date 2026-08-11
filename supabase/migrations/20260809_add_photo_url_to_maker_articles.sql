-- =====================================================================
-- MIGRATION SUPABASE - PHOTO URL ARTICLES MAKER & STORAGE BUCKET RLS
-- Description : Ajoute la colonne photo_url à maker_articles
-- et configure le bucket storage "maker-articles-photos" avec ses RLS.
-- =====================================================================

-- 1. Ajout de la colonne photo_url à la table maker_articles
ALTER TABLE public.maker_articles ADD COLUMN IF NOT EXISTS photo_url text;

-- 2. Création / vérification du bucket Supabase Storage "maker-articles-photos"
INSERT INTO storage.buckets (id, name, public)
VALUES ('maker-articles-photos', 'maker-articles-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Nettoyage des politiques existantes si présentement configurées
DROP POLICY IF EXISTS "Lecture publique maker-articles-photos" ON storage.objects;
DROP POLICY IF EXISTS "Upload photos maker-articles-photos" ON storage.objects;
DROP POLICY IF EXISTS "Update photos maker-articles-photos" ON storage.objects;
DROP POLICY IF EXISTS "Delete photos maker-articles-photos" ON storage.objects;

-- 4. Politique RLS - Lecture publique pour tout le monde
CREATE POLICY "Lecture publique maker-articles-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'maker-articles-photos');

-- 5. Politique RLS - Upload réservé à l'utilisateur authentifié dans son dossier {auth.uid()}
CREATE POLICY "Upload photos maker-articles-photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'maker-articles-photos'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- 6. Politique RLS - Modification réservée à l'utilisateur authentifié pour ses fichiers
CREATE POLICY "Update photos maker-articles-photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'maker-articles-photos'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);

-- 7. Politique RLS - Suppression réservée à l'utilisateur authentifié pour ses fichiers
CREATE POLICY "Delete photos maker-articles-photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'maker-articles-photos'
  AND (storage.foldername(name))[1] = (select auth.uid())::text
);
