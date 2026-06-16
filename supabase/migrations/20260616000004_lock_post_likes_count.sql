-- 1. BUG fonctionnel découvert pendant l'audit sécurité : update_post_likes_count()
--    n'est pas SECURITY DEFINER. Quand un membre A like le post d'un membre B, le
--    trigger tente UPDATE social_posts SET likes_count=... en s'exécutant avec les
--    privilèges de A — la policy posts_update_own (auth.uid() = author_id) filtre
--    alors la ligne (author_id = B ≠ A) et l'UPDATE ne touche silencieusement 0 ligne.
--    Résultat : liker le post de quelqu'un d'autre n'incrémente jamais son compteur.
--
-- 2. Faille sécurité : posts_update_own n'a pas de WITH CHECK — un membre pouvait
--    directement modifier likes_count sur son propre post pour gonfler sa popularité.
--
-- Fix : rendre update_post_likes_count() SECURITY DEFINER (corrige le bug #1), et
-- ajouter un trigger de protection qui bloque la modification directe de likes_count
-- par un non-admin, tout en laissant passer l'appel imbriqué légitime du trigger
-- ci-dessus (distingué via pg_trigger_depth()).

CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts
      SET likes_count = likes_count + 1
      WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_post_fields_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- pg_trigger_depth() <= 1 : on ne bloque que les UPDATE directs (top-level).
  -- L'appel imbriqué depuis update_post_likes_count() est à une profondeur >= 2.
  IF pg_trigger_depth() <= 1
     AND public.get_my_role() NOT IN ('Admin','Modérateur')
     AND NEW.likes_count IS DISTINCT FROM OLD.likes_count THEN
    RAISE EXCEPTION 'Sécurité : le nombre de likes ne peut pas être modifié directement.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_post_fields_protection ON public.social_posts;
CREATE TRIGGER tr_enforce_post_fields_protection
  BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_post_fields_protection();
