-- =============================================================================
-- FIX: market_offers status column conflict + events image_url safety
--
-- Problème : 20260605000003 a créé status CHECK ('active','inactive').
-- 20260606000005 a tenté ADD COLUMN IF NOT EXISTS (NO-OP). Résultat : les
-- offres s'enregistrent avec status='active' et n'apparaissent jamais
-- dans la liste publique (filtrée sur 'Approuvé').
-- =============================================================================

-- 1. Supprimer l'ancienne contrainte CHECK sur status
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.market_offers'::regclass
      AND contype = 'c'
      AND conname ILIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.market_offers DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 2. Migrer les données existantes vers les nouveaux statuts
UPDATE public.market_offers SET status = 'Approuvé'   WHERE status IN ('active');
UPDATE public.market_offers SET status = 'En attente' WHERE status IN ('inactive');
-- Toute valeur inconnue → Approuvé par défaut
UPDATE public.market_offers
  SET status = 'Approuvé'
  WHERE status NOT IN ('En attente','Approuvé','Rejeté');

-- 3. Changer le DEFAULT et ajouter la nouvelle contrainte
ALTER TABLE public.market_offers
  ALTER COLUMN status SET DEFAULT 'En attente';

ALTER TABLE public.market_offers
  ADD CONSTRAINT market_offers_status_check
  CHECK (status IN ('En attente','Approuvé','Rejeté'));

-- 4. S'assurer que image_url, location, verified, admin_note existent
ALTER TABLE public.market_offers
  ADD COLUMN IF NOT EXISTS image_url   text,
  ADD COLUMN IF NOT EXISTS location    text,
  ADD COLUMN IF NOT EXISTS verified    boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS admin_note  text;

-- 5. S'assurer que la colonne image_url existe dans events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS image_url text;

-- 6. Bucket event-images (idempotent)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('event-images', 'event-images', true)
  ON CONFLICT (id) DO NOTHING;

-- 7. Bucket offer-images (idempotent)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('offer-images', 'offer-images', true)
  ON CONFLICT (id) DO NOTHING;
