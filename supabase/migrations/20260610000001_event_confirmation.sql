-- Champ de confirmation de présence sur les inscriptions événements
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz DEFAULT NULL;

-- Index pour les requêtes admin (filtre confirmés / inscrits)
CREATE INDEX IF NOT EXISTS idx_event_registrations_confirmed
  ON public.event_registrations (event_id, confirmed_at)
  WHERE confirmed_at IS NOT NULL;
