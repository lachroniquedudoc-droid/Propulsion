-- =============================================================================
-- Badges de certification membres + logs d'activité plateforme
-- =============================================================================

-- 1. Colonne badges sur members (tableau de texte, ex: ["Certifié","Expert"])
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS badges text[] NOT NULL DEFAULT '{}';

-- 2. Table de logs d'activité (pour analytics)
CREATE TABLE IF NOT EXISTS public.member_activity_logs (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id   uuid    REFERENCES public.members ON DELETE CASCADE NOT NULL,
  event_type  text    NOT NULL,
  metadata    jsonb   DEFAULT '{}',
  created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_member ON public.member_activity_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event  ON public.member_activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date   ON public.member_activity_logs(created_at DESC);

ALTER TABLE public.member_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins lisent tous les logs
DROP POLICY IF EXISTS "Admins lisent les logs." ON public.member_activity_logs;
CREATE POLICY "Admins lisent les logs."
  ON public.member_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = auth.uid() AND m.role IN ('Admin', 'Modérateur')
    )
  );

-- Membres insèrent leurs propres logs
DROP POLICY IF EXISTS "Membres créent leurs logs." ON public.member_activity_logs;
CREATE POLICY "Membres créent leurs logs."
  ON public.member_activity_logs FOR INSERT
  WITH CHECK (auth.uid() = member_id);
