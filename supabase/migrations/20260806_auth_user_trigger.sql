-- =====================================================================
-- MIGRATION SUPABASE - TRIGGER AUTOMATIQUE DE PROFIL UTILISATEUR
-- Description : Crée automatiquement un enregistrement dans `public.users`
-- avec le rôle 'client' lors d'une nouvelle inscription dans `auth.users`.
-- =====================================================================

-- 1. Création de la fonction déclenchée lors de l'inscription dans auth.users
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

-- 2. Attachement du trigger sur la table auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
