-- =============================================================================
-- MIGRATION: Optimisations performance pour 20 000+ utilisateurs
-- Date: 2026-06-17
-- =============================================================================

-- ─── 1. get_my_role() : STABLE pour cache par requête ────────────────────────
-- Sans STABLE, PostgreSQL appelle cette fonction pour CHAQUE LIGNE évaluée
-- par une politique RLS. Avec STABLE, le résultat est mis en cache pendant
-- toute la durée d'une requête → appel unique au lieu de N fois par ligne.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.members WHERE id = auth.uid());
END;
$$;

-- ─── 2. get_role_weight() : STABLE pour même raison ─────────────────────────
CREATE OR REPLACE FUNCTION public.get_role_weight(user_role text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN CASE user_role
    WHEN 'Tous'        THEN 0
    WHEN 'Standard'    THEN 1
    WHEN 'Pro'         THEN 2
    WHEN 'Élite'       THEN 3
    WHEN 'Vendeur'     THEN 1
    WHEN 'Modérateur'  THEN 4
    WHEN 'Admin'       THEN 5
    ELSE 0
  END;
END;
$$;

-- ─── 3. Rate limiting : max 20 posts par membre par heure ────────────────────
-- Protège contre le spam API direct (contournement du frontend).
CREATE OR REPLACE FUNCTION public.check_post_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Admins et modérateurs exemptés
  IF public.get_my_role() IN ('Admin', 'Modérateur') THEN
    RETURN NEW;
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.social_posts
    WHERE author_id = NEW.author_id
      AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 20 THEN
    RAISE EXCEPTION 'Limite atteinte : maximum 20 publications par heure.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_post_rate_limit ON public.social_posts;
CREATE TRIGGER tr_post_rate_limit
  BEFORE INSERT ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.check_post_rate_limit();

-- ─── 4. Rate limiting commentaires : max 60 par heure ───────────────────────
CREATE OR REPLACE FUNCTION public.check_comment_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_my_role() IN ('Admin', 'Modérateur') THEN
    RETURN NEW;
  END IF;

  IF (
    SELECT COUNT(*)
    FROM public.social_comments
    WHERE author_id = NEW.author_id
      AND created_at > NOW() - INTERVAL '1 hour'
  ) >= 60 THEN
    RAISE EXCEPTION 'Limite atteinte : maximum 60 commentaires par heure.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_comment_rate_limit ON public.social_comments;
CREATE TRIGGER tr_comment_rate_limit
  BEFORE INSERT ON public.social_comments
  FOR EACH ROW EXECUTE FUNCTION public.check_comment_rate_limit();

-- ─── 5. Index manquants sur notifications (cloche) ───────────────────────────
-- La cloche de notifs filtre par member_id + is_read + created_at.
-- Sans index composite, chaque ouverture de la cloche fait un seq scan.
CREATE INDEX IF NOT EXISTS idx_member_notifs_unread
  ON public.member_notifications (member_id, is_read, created_at DESC)
  WHERE is_read = false;

-- ─── 6. Index sur payments pour le dashboard admin ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_status
  ON public.payments (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payments_member
  ON public.payments (member_id);

-- ─── 7. Index sur annuaire pour la recherche ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_annuaire_published
  ON public.annuaire (is_published, created_at DESC)
  WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_annuaire_member_id
  ON public.annuaire (member_id)
  WHERE member_id IS NOT NULL;

-- ─── 8. Nettoyage auto des vieilles notifications (>90 jours) ────────────────
-- Évite que la table member_notifications grossisse indéfiniment.
-- À 20K membres x N notifs = millions de lignes rapidement.
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.member_notifications
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND is_read = true;
END;
$$;
