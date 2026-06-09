-- =================================================================
-- MIGRATION : Notifications temps réel + Mentions @
-- =================================================================

-- ─── 1. Table member_notifications ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_notifications (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id  uuid        NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  type       text        NOT NULL DEFAULT 'system',
  category   text        NOT NULL DEFAULT 'Système'
    CHECK (category IN ('Finance','Social','Système','Événement')),
  title      text        NOT NULL,
  body       text,
  link       text,
  is_read    boolean     NOT NULL DEFAULT false,
  actor_id   uuid        REFERENCES public.members(id) ON DELETE SET NULL,
  ref_id     uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_member_notifs_member
  ON public.member_notifications (member_id, created_at DESC);

ALTER TABLE public.member_notifications ENABLE ROW LEVEL SECURITY;

-- Chaque membre voit et gère uniquement ses propres notifications
DROP POLICY IF EXISTS "notifs_own"         ON public.member_notifications;
DROP POLICY IF EXISTS "notifs_admin_insert" ON public.member_notifications;

CREATE POLICY "notifs_own" ON public.member_notifications
  FOR ALL
  USING    (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

-- Les admins peuvent créer des notifications pour n'importe quel membre
CREATE POLICY "notifs_admin_insert" ON public.member_notifications
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ─── 2. Colonnes mentioned_ids dans posts et commentaires ─────────
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS mentioned_ids uuid[] DEFAULT '{}';

ALTER TABLE public.social_comments
  ADD COLUMN IF NOT EXISTS mentioned_ids uuid[] DEFAULT '{}';

-- ─── 3. Fonction RPC : notifier tous les membres actifs ──────────
CREATE OR REPLACE FUNCTION public.notify_all_members(
  p_type     text,
  p_title    text,
  p_body     text    DEFAULT NULL,
  p_link     text    DEFAULT NULL,
  p_actor_id uuid    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sécurité : seuls les admins peuvent appeler cette fonction
  IF NOT EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ) THEN
    RAISE EXCEPTION 'Permission refusée : admin uniquement';
  END IF;

  INSERT INTO public.member_notifications (member_id, type, category, title, body, link, actor_id)
  SELECT
    m.id,
    p_type,
    CASE p_type
      WHEN 'event_new'       THEN 'Événement'
      WHEN 'masterclass_new' THEN 'Social'
      ELSE 'Système'
    END,
    p_title,
    p_body,
    p_link,
    p_actor_id
  FROM public.members m
  WHERE m.status = 'Actif'
    AND m.id IS DISTINCT FROM p_actor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_all_members TO authenticated;

-- ─── 4. Trigger : commentaire → notifier l'auteur du post ────────
CREATE OR REPLACE FUNCTION public.tr_fn_notify_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_author uuid;
  v_actor_name  text;
BEGIN
  -- Auteur du post
  SELECT author_id INTO v_post_author FROM public.social_posts WHERE id = NEW.post_id;

  -- Nom du commentateur
  SELECT first_name || ' ' || last_name INTO v_actor_name
    FROM public.members WHERE id = NEW.author_id;

  -- Notifier l'auteur du post (pas soi-même)
  IF v_post_author IS NOT NULL AND v_post_author != NEW.author_id THEN
    INSERT INTO public.member_notifications
      (member_id, type, category, title, body, link, actor_id, ref_id)
    VALUES (
      v_post_author, 'comment', 'Social',
      v_actor_name || ' a commenté votre publication',
      left(NEW.content, 140),
      '/communaute',
      NEW.author_id,
      NEW.post_id
    );
  END IF;

  -- Notifier les personnes mentionnées dans le commentaire
  IF NEW.mentioned_ids IS NOT NULL AND cardinality(NEW.mentioned_ids) > 0 THEN
    INSERT INTO public.member_notifications
      (member_id, type, category, title, body, link, actor_id, ref_id)
    SELECT
      uid, 'mention', 'Social',
      v_actor_name || ' vous a mentionné dans un commentaire',
      left(NEW.content, 140),
      '/communaute',
      NEW.author_id,
      NEW.post_id
    FROM unnest(NEW.mentioned_ids) AS uid
    WHERE uid != NEW.author_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_comment ON public.social_comments;
CREATE TRIGGER tr_notify_comment
  AFTER INSERT ON public.social_comments
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_comment();

-- ─── 5. Trigger : post avec mentions → notifier les membres cités ─
CREATE OR REPLACE FUNCTION public.tr_fn_notify_post_mention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
BEGIN
  IF NEW.mentioned_ids IS NULL OR cardinality(NEW.mentioned_ids) = 0 THEN
    RETURN NEW;
  END IF;

  SELECT first_name || ' ' || last_name INTO v_actor_name
    FROM public.members WHERE id = NEW.author_id;

  INSERT INTO public.member_notifications
    (member_id, type, category, title, body, link, actor_id, ref_id)
  SELECT
    uid, 'mention', 'Social',
    v_actor_name || ' vous a mentionné dans une publication',
    left(NEW.content, 140),
    '/communaute',
    NEW.author_id,
    NEW.id
  FROM unnest(NEW.mentioned_ids) AS uid
  WHERE uid != NEW.author_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_post_mention ON public.social_posts;
CREATE TRIGGER tr_notify_post_mention
  AFTER INSERT ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_post_mention();

-- ─── 6. Commentaires ─────────────────────────────────────────────
COMMENT ON TABLE public.member_notifications IS
  'Notifications temps réel pour chaque membre : mentions, commentaires, événements, offres marché.';
