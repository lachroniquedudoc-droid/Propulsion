-- ==========================================================
-- MIGRATION : Modules Masterclass + Suivi par module
-- Permet plusieurs vidéos par parcours (cours multi-modules)
-- ==========================================================

-- 1. youtube_id devient optionnel sur masterclasses
--    (la vidéo est désormais portée par les modules)
ALTER TABLE public.masterclasses
  ALTER COLUMN youtube_id DROP NOT NULL,
  ALTER COLUMN youtube_id SET DEFAULT NULL;

ALTER TABLE public.masterclasses
  ADD COLUMN IF NOT EXISTS thumbnail_url text;

-- 2. Table des modules (vidéos) d'un parcours
CREATE TABLE IF NOT EXISTS public.masterclass_modules (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  masterclass_id uuid        NOT NULL REFERENCES public.masterclasses(id) ON DELETE CASCADE,
  title          text        NOT NULL,
  description    text,
  youtube_id     text        NOT NULL,
  duration_min   integer     DEFAULT 0   NOT NULL CHECK (duration_min >= 0),
  order_index    integer     DEFAULT 0   NOT NULL,
  is_published   boolean     DEFAULT true NOT NULL,
  created_at     timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_masterclass_modules_course
  ON public.masterclass_modules(masterclass_id, order_index);

-- 3. Migrer les masterclasses existantes (1 vidéo → 1 module automatique)
INSERT INTO public.masterclass_modules (masterclass_id, title, description, youtube_id, duration_min, order_index)
SELECT id, title, description, youtube_id, COALESCE(duration_min, 0), 0
FROM public.masterclasses
WHERE youtube_id IS NOT NULL
  AND youtube_id <> ''
ON CONFLICT DO NOTHING;

-- 4. Table de suivi de progression par module
CREATE TABLE IF NOT EXISTS public.module_progress (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id       uuid        NOT NULL REFERENCES public.members(id)            ON DELETE CASCADE,
  module_id       uuid        NOT NULL REFERENCES public.masterclass_modules(id) ON DELETE CASCADE,
  seconds_watched integer     DEFAULT 0     NOT NULL CHECK (seconds_watched >= 0),
  completed       boolean     DEFAULT false NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE(member_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_module_progress_member
  ON public.module_progress(member_id);

-- 5. RLS — masterclass_modules
ALTER TABLE public.masterclass_modules ENABLE ROW LEVEL SECURITY;

-- Membres : lecture des modules publiés des parcours auxquels ils ont accès
CREATE POLICY "modules_read_published"
  ON public.masterclass_modules FOR SELECT
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM public.masterclasses mc
      WHERE mc.id = masterclass_id
        AND mc.is_published = true
        AND (
          mc.tier_required = 'Standard'
          OR EXISTS (
            SELECT 1 FROM public.members m
            WHERE m.id = auth.uid()
              AND public.get_role_weight(m.role) >= public.get_role_weight(mc.tier_required)
          )
        )
    )
  );

-- Admins & Modérateurs : accès total
CREATE POLICY "modules_admin_all"
  ON public.masterclass_modules FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin', 'Modérateur'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin', 'Modérateur'))
  );

-- 6. RLS — module_progress
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "module_progress_own_all"
  ON public.module_progress FOR ALL
  USING (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- Admins peuvent lire la progression de tous les membres
CREATE POLICY "module_progress_admin_read"
  ON public.module_progress FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin', 'Modérateur'))
  );

-- 7. Fonction utilitaire : recalculer la progression globale d'un parcours
--    Appelée quand un module est marqué terminé
CREATE OR REPLACE FUNCTION public.refresh_course_progress(p_member_id uuid, p_masterclass_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total   integer;
  v_done    integer;
  v_secs    integer;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM public.masterclass_modules
  WHERE masterclass_id = p_masterclass_id AND is_published = true;

  SELECT COUNT(*), COALESCE(SUM(mp.seconds_watched), 0)
  INTO v_done, v_secs
  FROM public.module_progress mp
  JOIN public.masterclass_modules mm ON mm.id = mp.module_id
  WHERE mp.member_id = p_member_id
    AND mm.masterclass_id = p_masterclass_id
    AND mp.completed = true;

  INSERT INTO public.content_progress (member_id, masterclass_id, seconds_watched, completed, updated_at)
  VALUES (p_member_id, p_masterclass_id, v_secs, (v_total > 0 AND v_done >= v_total), now())
  ON CONFLICT (member_id, masterclass_id)
  DO UPDATE SET
    seconds_watched = EXCLUDED.seconds_watched,
    completed       = EXCLUDED.completed,
    updated_at      = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_course_progress TO authenticated;

COMMENT ON TABLE public.masterclass_modules IS 'Modules vidéo (YouTube non-répertorié) d''un parcours Masterclass.';
COMMENT ON TABLE public.module_progress     IS 'Progression d''un membre par module vidéo.';
