-- =============================================================================
-- MODÉRATION : Table des signalements de publications
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.social_reports (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id      uuid REFERENCES public.social_posts(id) ON DELETE CASCADE NOT NULL,
  reporter_id  uuid REFERENCES public.members(id) ON DELETE SET NULL,
  reason       text NOT NULL,
  status       text DEFAULT 'En attente'
               CHECK (status IN ('En attente', 'Traité', 'Ignoré')),
  admin_note   text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE public.social_reports ENABLE ROW LEVEL SECURITY;

-- Membres : insérer leur propre signalement
CREATE POLICY "members_can_report"
  ON public.social_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- Un membre ne peut pas signaler deux fois le même post
CREATE UNIQUE INDEX IF NOT EXISTS social_reports_unique_per_member
  ON public.social_reports (post_id, reporter_id);

-- Admin/Modérateur : accès complet
CREATE POLICY "admins_manage_reports"
  ON public.social_reports FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members
      WHERE id = auth.uid()
        AND role IN ('Admin', 'Modérateur')
    )
  );
