-- Migration: Ajouter la colonne photo_url à la table maker_articles
ALTER TABLE public.maker_articles ADD COLUMN photo_url text;
