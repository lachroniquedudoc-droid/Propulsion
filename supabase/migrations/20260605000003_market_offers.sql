-- =============================================================================
-- Marché Business — Colonnes supplémentaires, policies DELETE, stockage images
-- =============================================================================

-- 1. Colonnes manquantes
ALTER TABLE public.market_offers
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS location  text,
  ADD COLUMN IF NOT EXISTS verified  boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS status    text    DEFAULT 'active' NOT NULL
    CHECK (status IN ('active', 'inactive'));

-- 2. Policy DELETE manquante (le membre peut supprimer sa propre offre)
DROP POLICY IF EXISTS "offers_delete_own" ON public.market_offers;
CREATE POLICY "offers_delete_own"
  ON public.market_offers FOR DELETE
  USING (auth.uid() = author_id);

-- 3. L'admin peut tout faire (UPDATE verified, changer le statut, supprimer)
DROP POLICY IF EXISTS "offers_admin" ON public.market_offers;
CREATE POLICY "offers_admin"
  ON public.market_offers FOR ALL
  USING (
    exists (
      select 1 from public.members m
      where m.id = auth.uid()
      and m.role in ('Admin', 'Modérateur')
    )
  );

-- 4. Bucket public pour les images des offres
INSERT INTO storage.buckets (id, name, public)
  VALUES ('offer-images', 'offer-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "members_upload_offer_images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'offer-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "offer_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'offer-images');

CREATE POLICY "members_delete_own_offer_images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'offer-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
