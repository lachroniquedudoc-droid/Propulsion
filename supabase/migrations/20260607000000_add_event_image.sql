-- =============================================================================
-- MIGRATION: ADD EVENT IMAGE URL & STORAGE BUCKET
-- Date: 2026-06-07
-- Description: Ajoute une colonne image_url à la table des événements, et crée
--              un bucket public 'event-images' pour héberger les affiches.
-- =============================================================================

-- 1. Ajouter la colonne image_url si elle n'existe pas
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Créer le bucket public 'event-images' pour les affiches des événements
INSERT INTO storage.buckets (id, name, public)
  VALUES ('event-images', 'event-images', true)
  ON CONFLICT (id) DO NOTHING;

-- 3. Politiques RLS pour le stockage 'event-images'
DROP POLICY IF EXISTS "Admins upload event images" ON storage.objects;
CREATE POLICY "Admins upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images'
    AND EXISTS (
      SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
    )
  );

DROP POLICY IF EXISTS "Public read event images" ON storage.objects;
CREATE POLICY "Public read event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Admins delete event images" ON storage.objects;
CREATE POLICY "Admins delete event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images'
    AND EXISTS (
      SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
    )
  );
