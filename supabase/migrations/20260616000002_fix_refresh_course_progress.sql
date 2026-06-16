-- refresh_course_progress était SECURITY DEFINER, accordée à 'authenticated',
-- sans (1) search_path fixé (risque de search_path hijacking) ni (2) vérification
-- que p_member_id correspond à l'appelant. Comme la fonction bypasse les RLS de
-- module_progress/content_progress, n'importe quel membre connecté pouvait altérer
-- la progression de masterclass d'un AUTRE membre via un simple appel RPC.

CREATE OR REPLACE FUNCTION public.refresh_course_progress(p_member_id uuid, p_masterclass_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_done  integer;
  v_secs  integer;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_member_id THEN
    RAISE EXCEPTION 'Sécurité : Vous ne pouvez recalculer que votre propre progression.';
  END IF;

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
