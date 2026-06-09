-- =============================================================================
-- MIGRATION: EVENTS SEED + RLS POLICIES
-- Date: 2026-06-05
-- Description: Insertion des 3 événements initiaux de la plateforme.
--              Politiques RLS : lecture publique pour tous les membres,
--              comptage des inscriptions visible par tous (pour spotsLeft).
-- =============================================================================

-- 1. Politiques RLS sur public.events (SELECT public, write Admin only)
DROP POLICY IF EXISTS "events_read_all"  ON public.events;
DROP POLICY IF EXISTS "events_admin"     ON public.events;

CREATE POLICY "events_read_all" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_admin" ON public.events
  FOR ALL USING (public.get_my_role() IN ('Admin', 'Modérateur'));

-- 2. Politiques RLS sur public.event_registrations
--    SELECT : tous les membres authentifiés (pour calculer spotsLeft côté client)
--    INSERT / DELETE : uniquement l'utilisateur concerné
DROP POLICY IF EXISTS "registrations_own"   ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_admin" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_select_all" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_insert_own" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_delete_own" ON public.event_registrations;

CREATE POLICY "registrations_select_all" ON public.event_registrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "registrations_insert_own" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "registrations_delete_own" ON public.event_registrations
  FOR DELETE USING (auth.uid() = member_id);

-- 3. Seed : 3 événements initiaux (idempotent — insère seulement si la table est vide)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.events LIMIT 1) THEN
    INSERT INTO public.events (title, description, event_date, event_type, location, price, spots_max, tier_required)
    VALUES
      (
        'Apéro Business Élite — Douala',
        'Grand rassemblement physique des décideurs Propulsion au Cameroun. Échanges de haut niveau, pitchs confidentiels et opportunités de co-investissement.',
        '2026-06-20T17:00:00Z',   -- 18h00 WAT (UTC+1)
        'Physique',
        'Krystal Hotel, Douala (Cameroun)',
        0,
        30,
        'Élite'
      ),
      (
        'Masterclass Physique & Pitchs — Abidjan',
        'Session d''implémentation de la méthode d''affaires suivie d''un cocktail networking.',
        '2026-07-03T17:00:00Z',   -- 17h00 GMT
        'Physique',
        'Sofitel Hôtel Ivoire, Abidjan (Côte d''Ivoire)',
        0,
        50,
        'Pro'
      ),
      (
        'Sprint d''Exécution Collectif & Q&A',
        'Rencontre interactive sur Zoom animée par le Dr Claudel pour débriefer le challenge hebdomadaire.',
        '2026-06-10T15:00:00Z',   -- 15h00 GMT
        'En ligne',
        'Zoom Propulsion',
        0,
        NULL,
        'Standard'
      );
  END IF;
END;
$$;
