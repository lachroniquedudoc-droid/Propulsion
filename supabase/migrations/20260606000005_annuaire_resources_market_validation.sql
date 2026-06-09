-- =================================================================
-- MIGRATION : Annuaire + Ressources améliorées + Validation marché
-- =================================================================

-- ─── 1. Annuaire (répertoire de contacts) ────────────────────────
CREATE TABLE IF NOT EXISTS public.annuaire (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id    uuid        REFERENCES public.members(id) ON DELETE SET NULL,
  first_name   text        NOT NULL,
  last_name    text        NOT NULL,
  company      text,
  sector       text,
  city         text,
  country      text        DEFAULT 'Cameroun',
  phone        text,
  email        text,
  whatsapp     text,
  website      text,
  bio          text,
  avatar_url   text,
  is_published boolean     DEFAULT true NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL,
  created_by   uuid        REFERENCES public.members(id) ON DELETE SET NULL
);

ALTER TABLE public.annuaire ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "annuaire_read_published" ON public.annuaire;
CREATE POLICY "annuaire_read_published"
  ON public.annuaire FOR SELECT
  USING (is_published = true AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "annuaire_admin_all" ON public.annuaire;
CREATE POLICY "annuaire_admin_all"
  ON public.annuaire FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ─── 2. Ressources — colonnes supplémentaires ─────────────────────
ALTER TABLE public.resources
  ALTER COLUMN file_url DROP NOT NULL;

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS resource_type text NOT NULL DEFAULT 'PDF'
    CHECK (resource_type IN ('PDF','Guide','Vidéo','Outil','Template','Lien','Autre')),
  ADD COLUMN IF NOT EXISTS external_url  text,
  ADD COLUMN IF NOT EXISTS is_published  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by    uuid REFERENCES public.members(id) ON DELETE SET NULL;

-- Toutes les ressources existantes sont publiées
UPDATE public.resources SET is_published = true WHERE is_published IS NULL;

-- Mettre à jour la politique de lecture : tier + published
DROP POLICY IF EXISTS "resources_authenticated"  ON public.resources;
DROP POLICY IF EXISTS "resources_read_published" ON public.resources;
DROP POLICY IF EXISTS "resources_admin_all"       ON public.resources;

CREATE POLICY "resources_read_published"
  ON public.resources FOR SELECT
  USING (
    is_published = true
    AND (
      tier_required = 'Standard'
      OR EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
          AND public.get_role_weight(m.role) >= public.get_role_weight(tier_required)
      )
    )
  );

CREATE POLICY "resources_admin_all"
  ON public.resources FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ─── 3. Marché — validation admin ────────────────────────────────
ALTER TABLE public.market_offers
  ADD COLUMN IF NOT EXISTS status     text NOT NULL DEFAULT 'En attente'
    CHECK (status IN ('En attente','Approuvé','Rejeté')),
  ADD COLUMN IF NOT EXISTS admin_note text;

-- Offres existantes → approuvées automatiquement (déjà visibles)
UPDATE public.market_offers
SET status = 'Approuvé'
WHERE status = 'En attente';

-- Nouvelle politique de lecture : seulement les offres approuvées
-- (+ les siennes en attente, + admins voient tout)
DROP POLICY IF EXISTS "offers_read_all"      ON public.market_offers;
DROP POLICY IF EXISTS "offers_read_approved" ON public.market_offers;
DROP POLICY IF EXISTS "offers_admin_all"     ON public.market_offers;

CREATE POLICY "offers_read_approved"
  ON public.market_offers FOR SELECT
  USING (
    status = 'Approuvé'
    OR author_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
    )
  );

-- Admins peuvent modifier le statut de toutes les offres
CREATE POLICY "offers_admin_all"
  ON public.market_offers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ─── 4. Bucket Storage pour les ressources ───────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resources', 'resources', false, 52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg','image/png','image/gif','image/webp',
    'video/mp4','video/webm',
    'application/zip','application/x-zip-compressed'
  ]
) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "resources_storage_read"  ON storage.objects;
DROP POLICY IF EXISTS "resources_storage_admin" ON storage.objects;

CREATE POLICY "resources_storage_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'resources' AND auth.role() = 'authenticated');

CREATE POLICY "resources_storage_admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resources'
    AND EXISTS (
      SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
    )
  );

-- ─── 5. Commentaires ─────────────────────────────────────────────
COMMENT ON TABLE public.annuaire  IS 'Répertoire de contacts de la communauté Propulsion, géré par l''admin.';
COMMENT ON TABLE public.resources IS 'Ressources pédagogiques (PDF, guides, outils) publiées par l''admin.';
