-- =====================================================================
-- MIGRATION SUPABASE INITIALE - P2PRINT MARKETPLACE 3D
-- Description : Définition du type ENUM `user_role` et de la table `users`.
-- =====================================================================

-- 1. Création du type ENUM pour les rôles utilisateurs (client, maker, admin)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'maker', 'admin');
    END IF;
END $$;

-- 2. Création de la table `users`
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Activation de la sécurité Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 4. Polices RLS (Row Level Security) recommandées
-- Policy : Lecture du profil utilisateur par son propriétaire
CREATE POLICY "Lecture de son propre profil" 
ON users FOR SELECT 
USING (auth.uid() = id);

-- Policy : Accès complet pour le rôle Admin
CREATE POLICY "Accès complet administrateurs" 
ON users FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Index d'optimisation des requêtes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Commentaire de documentation
COMMENT ON TABLE users IS 'Table de base des utilisateurs P2Print avec rôles client, maker et admin.';
