-- Migration 007: Subscription expiry tracking + activity notifications
-- Adds subscription_expires_at to members, triggers for community/market activity,
-- and an RPC to check/notify the current user's subscription status.

/* ─── 1. Add subscription_expires_at column ─────────────────────────── */
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Backfill active members: best guess = created_at + 1 year
UPDATE public.members
SET subscription_expires_at = created_at + INTERVAL '1 year'
WHERE status = 'Actif' AND subscription_expires_at IS NULL;

/* ─── 2. check_my_subscription() — called on dashboard load ─────────── */
-- Returns { days_left, status, expires_at }
-- Sends expiry-warning notifications at 30, 7, 1 days before expiry.
-- Updates status to 'Expiré' and sends expired-notification when overdue.
CREATE OR REPLACE FUNCTION public.check_my_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member   RECORD;
  v_days_left integer;
BEGIN
  SELECT id, status, subscription_expires_at
  INTO v_member
  FROM public.members WHERE id = auth.uid();

  IF NOT FOUND THEN
    RETURN '{"days_left": null, "status": "unknown"}'::jsonb;
  END IF;

  IF v_member.subscription_expires_at IS NULL THEN
    RETURN jsonb_build_object('days_left', null, 'status', v_member.status, 'expires_at', null);
  END IF;

  v_days_left := EXTRACT(DAY FROM (v_member.subscription_expires_at - now()))::integer;

  -- Mark as expired if overdue and still active
  IF v_days_left < 0 AND v_member.status = 'Actif' THEN
    UPDATE public.members SET status = 'Expiré' WHERE id = auth.uid();
    v_member.status := 'Expiré';

    -- Send single expired notification (once per 7 days)
    IF NOT EXISTS (
      SELECT 1 FROM public.member_notifications
      WHERE member_id = auth.uid()
        AND type = 'subscription_expired'
        AND created_at > now() - INTERVAL '7 days'
    ) THEN
      INSERT INTO public.member_notifications
        (member_id, type, category, title, body, link)
      VALUES (
        auth.uid(), 'subscription_expired', 'Finance',
        'Votre abonnement Propulsion a expiré',
        'Renouvelez votre adhésion pour retrouver accès à tous les modules.',
        '/rejoindre'
      );
    END IF;
  END IF;

  -- Send expiry warning at exactly 30, 7, or 1 days remaining (once per day per threshold)
  IF v_days_left IN (30, 7, 1) AND v_days_left > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.member_notifications
      WHERE member_id = auth.uid()
        AND type = 'subscription_expiry'
        AND body = v_days_left::text || ' jours'
        AND created_at > now() - INTERVAL '1 day'
    ) THEN
      INSERT INTO public.member_notifications
        (member_id, type, category, title, body, link)
      VALUES (
        auth.uid(),
        'subscription_expiry',
        'Finance',
        CASE v_days_left
          WHEN 30 THEN 'Votre abonnement expire dans 30 jours'
          WHEN 7  THEN 'Votre abonnement expire dans 7 jours'
          WHEN 1  THEN 'Votre abonnement expire demain !'
        END,
        v_days_left::text || ' jours',
        '/rejoindre'
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'days_left', v_days_left,
    'status',    v_member.status,
    'expires_at', v_member.subscription_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_my_subscription TO authenticated;

/* ─── 3. Trigger: new community post → notify active members ─────────── */
-- Only for Annonces, Opportunités, Business categories (high-signal posts)
CREATE OR REPLACE FUNCTION public.tr_fn_notify_community_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name text;
  v_notif_category text;
  v_notif_title text;
BEGIN
  IF NEW.category NOT IN ('Annonces', 'Opportunités', 'Business') THEN
    RETURN NEW;
  END IF;

  SELECT first_name || ' ' || last_name INTO v_author_name
  FROM public.members WHERE id = NEW.author_id;

  v_notif_category := CASE NEW.category
    WHEN 'Annonces'     THEN 'Système'
    WHEN 'Opportunités' THEN 'Finance'
    WHEN 'Business'     THEN 'Finance'
    ELSE 'Social'
  END;

  v_notif_title := CASE NEW.category
    WHEN 'Annonces'     THEN 'Annonce : ' || left(NEW.content, 70)
    WHEN 'Opportunités' THEN 'Nouvelle opportunité partagée par ' || v_author_name
    WHEN 'Business'     THEN 'Nouveau business partagé par ' || v_author_name
    ELSE 'Nouvelle publication de ' || v_author_name
  END;

  INSERT INTO public.member_notifications
    (member_id, type, category, title, body, link, actor_id, ref_id)
  SELECT
    m.id,
    'post_new',
    v_notif_category,
    v_notif_title,
    left(NEW.content, 140),
    '/communaute',
    NEW.author_id,
    NEW.id
  FROM public.members m
  WHERE m.status = 'Actif' AND m.id != NEW.author_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_community_post ON public.social_posts;
CREATE TRIGGER tr_notify_community_post
  AFTER INSERT ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_community_post();

/* ─── 4. Trigger: market offer approved → notify all active members ──── */
CREATE OR REPLACE FUNCTION public.tr_fn_notify_offer_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name text;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.status != 'Approuvé' THEN RETURN NEW; END IF;

  SELECT first_name || ' ' || last_name INTO v_author_name
  FROM public.members WHERE id = NEW.author_id;

  INSERT INTO public.member_notifications
    (member_id, type, category, title, body, link, actor_id, ref_id)
  SELECT
    m.id,
    'offer_new',
    'Finance',
    'Nouvelle offre marché : ' || left(NEW.title, 60),
    v_author_name || ' — ' || left(NEW.description, 100),
    '/offres',
    NEW.author_id,
    NEW.id
  FROM public.members m
  WHERE m.status = 'Actif' AND m.id != NEW.author_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_offer_approved ON public.market_offers;
CREATE TRIGGER tr_notify_offer_approved
  AFTER UPDATE ON public.market_offers
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_offer_approved();

/* ─── 5. Trigger: set subscription expiry on member activation ───────── */
CREATE OR REPLACE FUNCTION public.tr_fn_set_subscription_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set 1-year expiry when member status changes to 'Actif' and expiry is not already set
  IF NEW.status = 'Actif' AND (OLD.status IS DISTINCT FROM 'Actif') AND NEW.subscription_expires_at IS NULL THEN
    NEW.subscription_expires_at := now() + INTERVAL '1 year';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_set_subscription_expiry ON public.members;
CREATE TRIGGER tr_set_subscription_expiry
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_set_subscription_expiry();
