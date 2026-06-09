-- =============================================================================
-- RLS POLICIES — table subscriptions
-- La table a RLS activé depuis le schéma initial mais aucune policy n'était
-- définie, rendant la table inaccessible à tout le monde (deny-all implicite).
-- =============================================================================

DROP POLICY IF EXISTS "subscriptions_select_own"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_insert_own"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_update_own"  ON public.subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_all"   ON public.subscriptions;

-- Membres : lecture de leur propre abonnement
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = member_id);

-- Membres : création (statut initial = 'En attente' uniquement)
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = member_id
    AND status = 'En attente'
  );

-- Admins : accès complet (validation, modification de statut, etc.)
CREATE POLICY "subscriptions_admin_all" ON public.subscriptions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid() AND role IN ('Admin', 'Modérateur')
    )
  );
