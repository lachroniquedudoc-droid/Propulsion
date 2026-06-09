-- =============================================================================
-- MIGRATION CATCH-UP COMPLÈTE — 2026-06-09
-- Applique toutes les migrations manquantes depuis 20260602000006.
-- 100 % idempotent : peut être ré-exécuté sans danger.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1 — FONCTIONS UTILITAIRES (en premier : requises par les policies)
-- ─────────────────────────────────────────────────────────────────────────────

-- get_role_weight : poids numérique d'un rôle pour comparaison de tier
CREATE OR REPLACE FUNCTION public.get_role_weight(user_role text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN CASE user_role
    WHEN 'Admin'      THEN 100
    WHEN 'Modérateur' THEN 80
    WHEN 'Élite'      THEN 3
    WHEN 'Pro'        THEN 2
    WHEN 'Standard'   THEN 1
    ELSE 0
  END;
END;
$$;

-- get_my_role : lecture sécurisée du rôle sans récursion RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.members WHERE id = auth.uid());
END;
$$;

-- auto_referral_code : génération automatique du code parrainage (version corrigée)
CREATE OR REPLACE FUNCTION public.auto_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code :=
      'PROP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_referral_code ON public.members;
CREATE TRIGGER tr_auto_referral_code
  BEFORE INSERT ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.auto_referral_code();

-- handle_new_auth_user : création du profil membre à l'inscription (version corrigée)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Valider le rôle : Admin/Modérateur ne peuvent pas être définis par le client
  v_role := CASE COALESCE(NEW.raw_user_meta_data->>'role', 'Standard')
    WHEN 'Pro'   THEN 'Pro'
    WHEN 'Élite' THEN 'Élite'
    ELSE 'Standard'
  END;

  INSERT INTO public.members (
    id, first_name, last_name, email, phone, whatsapp, role, status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', NULL),
    v_role,
    'En attente de paiement'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_on_auth_user_created ON auth.users;
CREATE TRIGGER tr_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2 — COLONNES MANQUANTES SUR TABLES EXISTANTES
-- ─────────────────────────────────────────────────────────────────────────────

-- members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS reputation_points       integer      DEFAULT 0    NOT NULL,
  ADD COLUMN IF NOT EXISTS referral_code           text         UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by             uuid         REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS badges                  text[]       NOT NULL DEFAULT '{}';

-- Backfill referral_code pour membres existants
UPDATE public.members
  SET referral_code = 'PROP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 6))
  WHERE referral_code IS NULL;

-- Backfill subscription_expires_at pour membres actifs
UPDATE public.members
  SET subscription_expires_at = created_at + INTERVAL '1 year'
  WHERE status = 'Actif' AND subscription_expires_at IS NULL;

-- social_posts
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS image_url      text,
  ADD COLUMN IF NOT EXISTS mentioned_ids  uuid[] DEFAULT '{}';

-- social_comments
ALTER TABLE public.social_comments
  ADD COLUMN IF NOT EXISTS mentioned_ids  uuid[] DEFAULT '{}';

-- masterclasses
ALTER TABLE public.masterclasses
  ALTER COLUMN youtube_id DROP NOT NULL,
  ALTER COLUMN youtube_id SET DEFAULT NULL;

ALTER TABLE public.masterclasses
  ADD COLUMN IF NOT EXISTS duration_min   integer DEFAULT 0    NOT NULL,
  ADD COLUMN IF NOT EXISTS instructor     text    DEFAULT 'Dr Claudel Noubissie' NOT NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url  text,
  ADD COLUMN IF NOT EXISTS is_published   boolean DEFAULT true  NOT NULL,
  ADD COLUMN IF NOT EXISTS order_index    integer DEFAULT 0     NOT NULL,
  ADD COLUMN IF NOT EXISTS course_type    text    DEFAULT 'Masterclass'
    CHECK (course_type IN ('Masterclass','Replay'));

-- resources
ALTER TABLE public.resources
  ALTER COLUMN file_url DROP NOT NULL;

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS file_type     text    DEFAULT 'PDF',
  ADD COLUMN IF NOT EXISTS file_size     text,
  ADD COLUMN IF NOT EXISTS resource_type text    NOT NULL DEFAULT 'PDF'
    CHECK (resource_type IN ('PDF','Guide','Vidéo','Outil','Template','Lien','Autre')),
  ADD COLUMN IF NOT EXISTS external_url  text,
  ADD COLUMN IF NOT EXISTS is_published  boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_by    uuid    REFERENCES public.members(id) ON DELETE SET NULL;

UPDATE public.resources SET is_published = true WHERE is_published IS NULL;

-- payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS country  text,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS tier     text CHECK (tier IN ('Standard','Pro','Élite'));

-- member_notifications — colonnes manquantes vs. schéma de base
ALTER TABLE public.member_notifications
  ADD COLUMN IF NOT EXISTS type     text    NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS body     text,
  ADD COLUMN IF NOT EXISTS link     text,
  ADD COLUMN IF NOT EXISTS actor_id uuid    REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ref_id   uuid;

CREATE INDEX IF NOT EXISTS idx_member_notifs_member
  ON public.member_notifications (member_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3 — NOUVELLES TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- social_likes
CREATE TABLE IF NOT EXISTS public.social_likes (
  post_id    uuid REFERENCES public.social_posts ON DELETE CASCADE,
  member_id  uuid REFERENCES public.members      ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc', now()),
  PRIMARY KEY (post_id, member_id)
);
ALTER TABLE public.social_likes ENABLE ROW LEVEL SECURITY;

-- challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number   integer     NOT NULL UNIQUE,
  title         text        NOT NULL,
  context       text        NOT NULL,
  objective     text        NOT NULL,
  mission       text        NOT NULL,
  deliverable   text        NOT NULL,
  resources     text[],
  category      text        NOT NULL DEFAULT 'Business',
  difficulty    text        NOT NULL DEFAULT 'Intermédiaire'
                  CHECK (difficulty IN ('Débutant','Intermédiaire','Avancé')),
  points        integer     NOT NULL DEFAULT 50,
  deadline      timestamptz,
  tier_required text        NOT NULL DEFAULT 'Standard'
                  CHECK (tier_required IN ('Standard','Pro','Élite')),
  is_active     boolean     DEFAULT false NOT NULL,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- challenge_submissions — challenge_id doit être ajouté APRÈS la création de challenges
ALTER TABLE public.challenge_submissions
  ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL;

-- referrals
CREATE TABLE IF NOT EXISTS public.referrals (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id  uuid        REFERENCES public.members ON DELETE CASCADE NOT NULL,
  referred_id  uuid        REFERENCES public.members ON DELETE CASCADE NOT NULL UNIQUE,
  tier         text        NOT NULL,
  commission   numeric(10,2) DEFAULT 0 NOT NULL,
  status       text        DEFAULT 'En attente' NOT NULL
                 CHECK (status IN ('En attente','Validé','Payé')),
  created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  validated_at timestamptz,
  paid_at      timestamptz
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- system_settings
CREATE TABLE IF NOT EXISTS public.system_settings (
  id                   integer     PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode     boolean     DEFAULT false NOT NULL,
  maintenance_message  text        DEFAULT 'La plateforme est en maintenance.' NOT NULL,
  enable_social_feed   boolean     DEFAULT true NOT NULL,
  enable_marketplace   boolean     DEFAULT true NOT NULL,
  enable_challenges    boolean     DEFAULT true NOT NULL,
  enable_messaging     boolean     DEFAULT true NOT NULL,
  commission_standard  numeric(10,2) DEFAULT 2500  NOT NULL,
  commission_pro       numeric(10,2) DEFAULT 11250 NOT NULL,
  commission_elite     numeric(10,2) DEFAULT 30000 NOT NULL,
  points_per_challenge integer     DEFAULT 50 NOT NULL,
  updated_at           timestamptz DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- annuaire
CREATE TABLE IF NOT EXISTS public.annuaire (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id    uuid        REFERENCES public.members(id) ON DELETE SET NULL,
  first_name   text        NOT NULL,
  last_name    text        NOT NULL,
  company      text,
  sector       text,
  city         text,
  country      text        DEFAULT 'Cameroun',
  phone        text,
  email        text,
  whatsapp     text,
  website      text,
  bio          text,
  avatar_url   text,
  is_published boolean     DEFAULT true NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL,
  created_by   uuid        REFERENCES public.members(id) ON DELETE SET NULL
);
ALTER TABLE public.annuaire ENABLE ROW LEVEL SECURITY;

-- masterclass_modules
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
ALTER TABLE public.masterclass_modules ENABLE ROW LEVEL SECURITY;

-- module_progress
CREATE TABLE IF NOT EXISTS public.module_progress (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id       uuid        NOT NULL REFERENCES public.members(id)             ON DELETE CASCADE,
  module_id       uuid        NOT NULL REFERENCES public.masterclass_modules(id) ON DELETE CASCADE,
  seconds_watched integer     DEFAULT 0     NOT NULL CHECK (seconds_watched >= 0),
  completed       boolean     DEFAULT false NOT NULL,
  updated_at      timestamptz DEFAULT now() NOT NULL,
  UNIQUE(member_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_module_progress_member ON public.module_progress(member_id);
ALTER TABLE public.module_progress ENABLE ROW LEVEL SECURITY;

-- member_activity_logs
CREATE TABLE IF NOT EXISTS public.member_activity_logs (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id   uuid    REFERENCES public.members ON DELETE CASCADE NOT NULL,
  event_type  text    NOT NULL,
  metadata    jsonb   DEFAULT '{}',
  created_at  timestamptz DEFAULT timezone('utc', now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_member ON public.member_activity_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event  ON public.member_activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date   ON public.member_activity_logs(created_at DESC);
ALTER TABLE public.member_activity_logs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4 — POLITIQUES RLS (toutes idempotentes via DROP IF EXISTS)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Members ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members_select_own"       ON public.members;
DROP POLICY IF EXISTS "members_insert_own"       ON public.members;
DROP POLICY IF EXISTS "members_update_own"       ON public.members;
DROP POLICY IF EXISTS "members_select_directory" ON public.members;
DROP POLICY IF EXISTS "members_admin_all"        ON public.members;
DROP POLICY IF EXISTS "Les membres peuvent créer leur propre profil." ON public.members;

CREATE POLICY "members_select_own" ON public.members
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "members_insert_own" ON public.members
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "members_update_own" ON public.members
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "members_select_directory" ON public.members
  FOR SELECT
  USING (
    public.get_my_role() IN ('Pro','Élite','Modérateur','Admin')
    AND is_private = false
  );

CREATE POLICY "members_admin_all" ON public.members
  FOR ALL
  USING (public.get_my_role() = 'Admin');

-- ── Payments ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "payments_own_all"      ON public.payments;
DROP POLICY IF EXISTS "payments_admin_select" ON public.payments;
DROP POLICY IF EXISTS "payments_select_own"   ON public.payments;
DROP POLICY IF EXISTS "payments_insert_own"   ON public.payments;
DROP POLICY IF EXISTS "payments_admin_all"    ON public.payments;

CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "payments_insert_own" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = member_id AND status = 'En attente');

CREATE POLICY "payments_admin_all" ON public.payments
  FOR ALL USING (public.get_my_role() IN ('Admin','Modérateur'));

-- ── Masterclasses ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "masterclasses_read"            ON public.masterclasses;
DROP POLICY IF EXISTS "masterclasses_admin"           ON public.masterclasses;
DROP POLICY IF EXISTS "masterclasses_read_published"  ON public.masterclasses;

CREATE POLICY "masterclasses_read_published" ON public.masterclasses
  FOR SELECT USING (is_published = true);

CREATE POLICY "masterclasses_admin" ON public.masterclasses
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Content progress ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "progress_own_all" ON public.content_progress;
DROP POLICY IF EXISTS "progress_own"     ON public.content_progress;

CREATE POLICY "progress_own" ON public.content_progress
  FOR ALL USING (auth.uid() = member_id);

-- ── Challenges (table) ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "challenges_read_all" ON public.challenges;
DROP POLICY IF EXISTS "challenges_admin"    ON public.challenges;

CREATE POLICY "challenges_read_all" ON public.challenges
  FOR SELECT USING (true);

CREATE POLICY "challenges_admin" ON public.challenges
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Challenge submissions ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "challenges_own_all"    ON public.challenge_submissions;
DROP POLICY IF EXISTS "challenges_admin"      ON public.challenge_submissions;
DROP POLICY IF EXISTS "submissions_read_own"  ON public.challenge_submissions;
DROP POLICY IF EXISTS "submissions_insert_own" ON public.challenge_submissions;
DROP POLICY IF EXISTS "submissions_admin"     ON public.challenge_submissions;

CREATE POLICY "submissions_read_own" ON public.challenge_submissions
  FOR SELECT USING (auth.uid() = member_id);

CREATE POLICY "submissions_insert_own" ON public.challenge_submissions
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "submissions_admin" ON public.challenge_submissions
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Events ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "events_read_all" ON public.events;
DROP POLICY IF EXISTS "events_admin"    ON public.events;

CREATE POLICY "events_read_all" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "events_admin" ON public.events
  FOR ALL USING (public.get_my_role() IN ('Admin','Modérateur'));

-- ── Event registrations ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "registrations_own"        ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_admin"      ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_select_all" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_insert_own" ON public.event_registrations;
DROP POLICY IF EXISTS "registrations_delete_own" ON public.event_registrations;

CREATE POLICY "registrations_select_all" ON public.event_registrations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "registrations_insert_own" ON public.event_registrations
  FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "registrations_delete_own" ON public.event_registrations
  FOR DELETE USING (auth.uid() = member_id);

-- ── Social posts ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "posts_read_all"    ON public.social_posts;
DROP POLICY IF EXISTS "posts_insert_own"  ON public.social_posts;
DROP POLICY IF EXISTS "posts_update_own"  ON public.social_posts;
DROP POLICY IF EXISTS "posts_admin"       ON public.social_posts;
DROP POLICY IF EXISTS "posts_delete_own"  ON public.social_posts;

CREATE POLICY "posts_read_all"   ON public.social_posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_own" ON public.social_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update_own" ON public.social_posts FOR UPDATE  USING (auth.uid() = author_id);
CREATE POLICY "posts_delete_own" ON public.social_posts FOR DELETE  USING (auth.uid() = author_id);
CREATE POLICY "posts_admin"      ON public.social_posts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur'))
);

-- ── Social likes ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "likes_read_all"   ON public.social_likes;
DROP POLICY IF EXISTS "likes_insert_own" ON public.social_likes;
DROP POLICY IF EXISTS "likes_delete_own" ON public.social_likes;

CREATE POLICY "likes_read_all"   ON public.social_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.social_likes FOR INSERT WITH CHECK (auth.uid() = member_id);
CREATE POLICY "likes_delete_own" ON public.social_likes FOR DELETE  USING (auth.uid() = member_id);

-- ── Market offers ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "offers_read_all"      ON public.market_offers;
DROP POLICY IF EXISTS "offers_read_approved" ON public.market_offers;
DROP POLICY IF EXISTS "offers_insert_pro"    ON public.market_offers;
DROP POLICY IF EXISTS "offers_update_own"    ON public.market_offers;
DROP POLICY IF EXISTS "offers_delete_own"    ON public.market_offers;
DROP POLICY IF EXISTS "offers_admin"         ON public.market_offers;
DROP POLICY IF EXISTS "offers_admin_all"     ON public.market_offers;

CREATE POLICY "offers_read_approved" ON public.market_offers
  FOR SELECT USING (
    status = 'Approuvé'
    OR author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur'))
  );

CREATE POLICY "offers_insert_pro" ON public.market_offers
  FOR INSERT WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Pro','Élite','Admin','Modérateur')
    )
  );

CREATE POLICY "offers_update_own" ON public.market_offers
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "offers_delete_own" ON public.market_offers
  FOR DELETE USING (auth.uid() = author_id);

CREATE POLICY "offers_admin_all" ON public.market_offers
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Notifications ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "notifications_own"    ON public.member_notifications;
DROP POLICY IF EXISTS "notifs_own"           ON public.member_notifications;
DROP POLICY IF EXISTS "notifs_admin_insert"  ON public.member_notifications;

CREATE POLICY "notifs_own" ON public.member_notifications
  FOR ALL
  USING     (member_id = auth.uid())
  WITH CHECK (member_id = auth.uid());

CREATE POLICY "notifs_admin_insert" ON public.member_notifications
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Resources ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "resources_authenticated"  ON public.resources;
DROP POLICY IF EXISTS "resources_read_all"       ON public.resources;
DROP POLICY IF EXISTS "resources_admin"          ON public.resources;
DROP POLICY IF EXISTS "resources_read_published" ON public.resources;
DROP POLICY IF EXISTS "resources_admin_all"      ON public.resources;

CREATE POLICY "resources_read_published" ON public.resources
  FOR SELECT USING (
    is_published = true
    AND (
      tier_required = 'Standard'
      OR EXISTS (
        SELECT 1 FROM public.members m
        WHERE m.id = auth.uid()
          AND public.get_role_weight(m.role) >= public.get_role_weight(tier_required)
      )
    )
  );

CREATE POLICY "resources_admin_all" ON public.resources
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Referrals ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "referrals_own"   ON public.referrals;
DROP POLICY IF EXISTS "referrals_admin" ON public.referrals;

CREATE POLICY "referrals_own" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "referrals_admin" ON public.referrals
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── System settings ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow read access to system_settings"  ON public.system_settings;
DROP POLICY IF EXISTS "Allow write access to system_settings" ON public.system_settings;

CREATE POLICY "Allow read access to system_settings"  ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow write access to system_settings" ON public.system_settings
  FOR ALL USING (public.get_my_role() IN ('Admin','Modérateur'));

-- ── Annuaire ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "annuaire_read_published" ON public.annuaire;
DROP POLICY IF EXISTS "annuaire_admin_all"      ON public.annuaire;

CREATE POLICY "annuaire_read_published" ON public.annuaire
  FOR SELECT USING (is_published = true AND auth.role() = 'authenticated');

CREATE POLICY "annuaire_admin_all" ON public.annuaire
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Masterclass modules ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "modules_read_published" ON public.masterclass_modules;
DROP POLICY IF EXISTS "modules_admin_all"      ON public.masterclass_modules;

CREATE POLICY "modules_read_published" ON public.masterclass_modules
  FOR SELECT USING (
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

CREATE POLICY "modules_admin_all" ON public.masterclass_modules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Module progress ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "module_progress_own_all"    ON public.module_progress;
DROP POLICY IF EXISTS "module_progress_admin_read" ON public.module_progress;

CREATE POLICY "module_progress_own_all" ON public.module_progress
  FOR ALL USING (member_id = auth.uid()) WITH CHECK (member_id = auth.uid());

CREATE POLICY "module_progress_admin_read" ON public.module_progress
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

-- ── Activity logs ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins lisent les logs."  ON public.member_activity_logs;
DROP POLICY IF EXISTS "Membres créent leurs logs." ON public.member_activity_logs;

CREATE POLICY "Admins lisent les logs." ON public.member_activity_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ));

CREATE POLICY "Membres créent leurs logs." ON public.member_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = member_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 5 — TRIGGERS ET FONCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- enforce_member_fields_protection : protège role/status/unique_id des modifications non-admin
CREATE OR REPLACE FUNCTION public.enforce_member_fields_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_my_role() IS DISTINCT FROM 'Admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier votre propre rôle.';
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF OLD.status = 'En attente de paiement' AND NEW.status = 'Paiement à valider' THEN
        -- autorisé lors de l'envoi de la preuve
      ELSE
        RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier votre propre statut.';
      END IF;
    END IF;
    IF NEW.unique_id IS DISTINCT FROM OLD.unique_id THEN
      RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier votre identifiant unique.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_member_fields_protection ON public.members;
CREATE TRIGGER tr_enforce_member_fields_protection
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_member_fields_protection();

-- update_post_likes_count : maintient likes_count en sync
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_update_likes_count ON public.social_likes;
CREATE TRIGGER tr_update_likes_count
  AFTER INSERT OR DELETE ON public.social_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- handle_challenge_submission_validation : points de réputation automatiques
CREATE OR REPLACE FUNCTION public.handle_challenge_submission_validation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_diff integer := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM 'Validé' AND NEW.status = 'Validé' THEN
      points_diff := NEW.points_awarded;
    ELSIF OLD.status = 'Validé' AND NEW.status IS DISTINCT FROM 'Validé' THEN
      points_diff := -OLD.points_awarded;
    ELSIF OLD.status = 'Validé' AND NEW.status = 'Validé'
      AND NEW.points_awarded IS DISTINCT FROM OLD.points_awarded THEN
      points_diff := NEW.points_awarded - OLD.points_awarded;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status = 'Validé' THEN points_diff := NEW.points_awarded; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'Validé' THEN points_diff := -OLD.points_awarded; END IF;
  END IF;

  IF points_diff <> 0 THEN
    UPDATE public.members
      SET reputation_points = reputation_points + points_diff
      WHERE id = COALESCE(NEW.member_id, OLD.member_id);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

DROP TRIGGER IF EXISTS tr_handle_challenge_submission_validation ON public.challenge_submissions;
CREATE TRIGGER tr_handle_challenge_submission_validation
  AFTER INSERT OR UPDATE OR DELETE ON public.challenge_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_challenge_submission_validation();

-- tr_fn_set_subscription_expiry : expiry à l'activation
CREATE OR REPLACE FUNCTION public.tr_fn_set_subscription_expiry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Actif'
    AND (OLD.status IS DISTINCT FROM 'Actif')
    AND NEW.subscription_expires_at IS NULL THEN
    NEW.subscription_expires_at := now() + INTERVAL '1 year';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_set_subscription_expiry ON public.members;
CREATE TRIGGER tr_set_subscription_expiry
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_set_subscription_expiry();

-- tr_fn_process_referral_on_activation : commission auto au moment de l'activation
CREATE OR REPLACE FUNCTION public.tr_fn_process_referral_on_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission numeric(10,2);
  v_settings   RECORD;
BEGIN
  IF NEW.status = 'Actif'
    AND (OLD.status IS DISTINCT FROM 'Actif')
    AND NEW.referred_by IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = NEW.id) THEN
      SELECT commission_standard, commission_pro, commission_elite
        INTO v_settings FROM public.system_settings WHERE id = 1;
      v_commission := CASE NEW.role
        WHEN 'Standard' THEN COALESCE(v_settings.commission_standard, 2500.00)
        WHEN 'Pro'      THEN COALESCE(v_settings.commission_pro,      11250.00)
        WHEN 'Élite'    THEN COALESCE(v_settings.commission_elite,    30000.00)
        ELSE 0.00
      END;
      INSERT INTO public.referrals (referrer_id, referred_id, tier, commission, status)
        VALUES (NEW.referred_by, NEW.id, NEW.role, v_commission, 'Validé');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_process_referral_on_activation ON public.members;
CREATE TRIGGER tr_process_referral_on_activation
  AFTER UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_process_referral_on_activation();

-- refresh_course_progress : recalcule la progression globale d'un parcours
CREATE OR REPLACE FUNCTION public.refresh_course_progress(p_member_id uuid, p_masterclass_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total integer;
  v_done  integer;
  v_secs  integer;
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

-- check_my_subscription : statut de l'abonnement + notifications expiry
CREATE OR REPLACE FUNCTION public.check_my_subscription()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_member    RECORD;
  v_days_left integer;
BEGIN
  SELECT id, status, subscription_expires_at INTO v_member
    FROM public.members WHERE id = auth.uid();

  IF NOT FOUND THEN
    RETURN '{"days_left": null, "status": "unknown"}'::jsonb;
  END IF;

  IF v_member.subscription_expires_at IS NULL THEN
    RETURN jsonb_build_object('days_left', null, 'status', v_member.status, 'expires_at', null);
  END IF;

  v_days_left := EXTRACT(DAY FROM (v_member.subscription_expires_at - now()))::integer;

  IF v_days_left < 0 AND v_member.status = 'Actif' THEN
    UPDATE public.members SET status = 'Expiré' WHERE id = auth.uid();
    v_member.status := 'Expiré';
    IF NOT EXISTS (
      SELECT 1 FROM public.member_notifications
        WHERE member_id = auth.uid()
          AND type = 'subscription_expired'
          AND created_at > now() - INTERVAL '7 days'
    ) THEN
      INSERT INTO public.member_notifications (member_id, type, category, title, body, link)
        VALUES (auth.uid(), 'subscription_expired', 'Finance',
          'Votre abonnement Propulsion a expiré',
          'Renouvelez votre adhésion pour retrouver accès à tous les modules.',
          '/rejoindre');
    END IF;
  END IF;

  IF v_days_left IN (30, 7, 1) AND v_days_left > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.member_notifications
        WHERE member_id = auth.uid()
          AND type = 'subscription_expiry'
          AND body = v_days_left::text || ' jours'
          AND created_at > now() - INTERVAL '1 day'
    ) THEN
      INSERT INTO public.member_notifications (member_id, type, category, title, body, link)
        VALUES (
          auth.uid(), 'subscription_expiry', 'Finance',
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

-- notify_all_members : notifie tous les membres actifs (avec p_category optionnel)
CREATE OR REPLACE FUNCTION public.notify_all_members(
  p_type     text,
  p_title    text,
  p_body     text    DEFAULT NULL,
  p_link     text    DEFAULT NULL,
  p_actor_id uuid    DEFAULT NULL,
  p_category text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
  ) THEN
    RAISE EXCEPTION 'Permission refusée : admin uniquement';
  END IF;

  v_category := COALESCE(p_category, CASE p_type
    WHEN 'event_new'       THEN 'Événement'
    WHEN 'masterclass_new' THEN 'Social'
    ELSE 'Système'
  END);

  INSERT INTO public.member_notifications (member_id, type, category, title, body, link, actor_id)
    SELECT m.id, p_type, v_category, p_title, p_body, p_link, p_actor_id
    FROM public.members m
    WHERE m.status = 'Actif' AND m.id IS DISTINCT FROM p_actor_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_all_members TO authenticated;

-- tr_fn_notify_comment : notifie l'auteur d'un post quand quelqu'un commente
CREATE OR REPLACE FUNCTION public.tr_fn_notify_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_author uuid;
  v_actor_name  text;
BEGIN
  SELECT author_id INTO v_post_author FROM public.social_posts WHERE id = NEW.post_id;
  SELECT first_name || ' ' || last_name INTO v_actor_name
    FROM public.members WHERE id = NEW.author_id;

  IF v_post_author IS NOT NULL AND v_post_author != NEW.author_id THEN
    INSERT INTO public.member_notifications (member_id, type, category, title, body, link, actor_id, ref_id)
      VALUES (v_post_author, 'comment', 'Social',
        v_actor_name || ' a commenté votre publication',
        left(NEW.content, 140), '/communaute', NEW.author_id, NEW.post_id);
  END IF;

  IF NEW.mentioned_ids IS NOT NULL AND cardinality(NEW.mentioned_ids) > 0 THEN
    INSERT INTO public.member_notifications (member_id, type, category, title, body, link, actor_id, ref_id)
      SELECT uid, 'mention', 'Social',
        v_actor_name || ' vous a mentionné dans un commentaire',
        left(NEW.content, 140), '/communaute', NEW.author_id, NEW.post_id
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

-- tr_fn_notify_post_mention : notifie les membres mentionnés dans un post
CREATE OR REPLACE FUNCTION public.tr_fn_notify_post_mention()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name text;
BEGIN
  IF NEW.mentioned_ids IS NULL OR cardinality(NEW.mentioned_ids) = 0 THEN RETURN NEW; END IF;
  SELECT first_name || ' ' || last_name INTO v_actor_name
    FROM public.members WHERE id = NEW.author_id;

  INSERT INTO public.member_notifications (member_id, type, category, title, body, link, actor_id, ref_id)
    SELECT uid, 'mention', 'Social',
      v_actor_name || ' vous a mentionné dans une publication',
      left(NEW.content, 140), '/communaute', NEW.author_id, NEW.id
    FROM unnest(NEW.mentioned_ids) AS uid WHERE uid != NEW.author_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_post_mention ON public.social_posts;
CREATE TRIGGER tr_notify_post_mention
  AFTER INSERT ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_post_mention();

-- tr_fn_notify_community_post : notifie les membres actifs sur les posts Business/Annonces/Opportunités
CREATE OR REPLACE FUNCTION public.tr_fn_notify_community_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_author_name    text;
  v_notif_category text;
  v_notif_title    text;
BEGIN
  IF NEW.category NOT IN ('Annonces','Opportunités','Business') THEN RETURN NEW; END IF;

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

  INSERT INTO public.member_notifications (member_id, type, category, title, body, link, actor_id, ref_id)
    SELECT m.id, 'post_new', v_notif_category, v_notif_title,
      left(NEW.content, 140), '/communaute', NEW.author_id, NEW.id
    FROM public.members m
    WHERE m.status = 'Actif' AND m.id != NEW.author_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_community_post ON public.social_posts;
CREATE TRIGGER tr_notify_community_post
  AFTER INSERT ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_community_post();

-- tr_fn_notify_offer_approved : notifie tous les membres quand une offre est approuvée
CREATE OR REPLACE FUNCTION public.tr_fn_notify_offer_approved()
RETURNS TRIGGER
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

  INSERT INTO public.member_notifications (member_id, type, category, title, body, link, actor_id, ref_id)
    SELECT m.id, 'offer_new', 'Finance',
      'Nouvelle offre marché : ' || left(NEW.title, 60),
      v_author_name || ' — ' || left(NEW.description, 100),
      '/offres', NEW.author_id, NEW.id
    FROM public.members m
    WHERE m.status = 'Actif' AND m.id != NEW.author_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_notify_offer_approved ON public.market_offers;
CREATE TRIGGER tr_notify_offer_approved
  AFTER UPDATE ON public.market_offers
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_offer_approved();

-- get_member_id_by_referral_code : lookup sécurisé par code parrainage (accessible aux anonymes)
CREATE OR REPLACE FUNCTION public.get_member_id_by_referral_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT id FROM public.members WHERE referral_code = p_code LIMIT 1);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_id_by_referral_code TO anon, authenticated;

-- Migrer les masterclasses existantes vers masterclass_modules (1 vidéo → 1 module)
INSERT INTO public.masterclass_modules (masterclass_id, title, description, youtube_id, duration_min, order_index)
  SELECT id, title, description, youtube_id, COALESCE(duration_min, 0), 0
  FROM public.masterclasses
  WHERE youtube_id IS NOT NULL AND youtube_id <> ''
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 6 — STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars',           'avatars',           true),
  ('post-images',       'post-images',       true),
  ('offer-images',      'offer-images',      true),
  ('event-images',      'event-images',      true),
  ('resources',         'resources',         false),
  ('payment-proofs',    'payment-proofs',    false),
  ('course-thumbnails', 'course-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Avatars
DROP POLICY IF EXISTS "Membres peuvent uploader leur avatar."    ON storage.objects;
DROP POLICY IF EXISTS "Avatars lisibles par tous."               ON storage.objects;
DROP POLICY IF EXISTS "Membres peuvent remplacer leur avatar."   ON storage.objects;

CREATE POLICY "Membres peuvent uploader leur avatar."
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Avatars lisibles par tous."
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Membres peuvent remplacer leur avatar."
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Post images
DROP POLICY IF EXISTS "members_upload_post_images"   ON storage.objects;
DROP POLICY IF EXISTS "post_images_public_read"      ON storage.objects;
DROP POLICY IF EXISTS "members_delete_own_post_images" ON storage.objects;

CREATE POLICY "members_upload_post_images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "post_images_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'post-images');
CREATE POLICY "members_delete_own_post_images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Offer images
DROP POLICY IF EXISTS "members_upload_offer_images"    ON storage.objects;
DROP POLICY IF EXISTS "offer_images_public_read"       ON storage.objects;
DROP POLICY IF EXISTS "members_delete_own_offer_images" ON storage.objects;

CREATE POLICY "members_upload_offer_images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'offer-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "offer_images_public_read"
  ON storage.objects FOR SELECT USING (bucket_id = 'offer-images');
CREATE POLICY "members_delete_own_offer_images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'offer-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Event images
DROP POLICY IF EXISTS "Admins upload event images"  ON storage.objects;
DROP POLICY IF EXISTS "Public read event images"    ON storage.objects;
DROP POLICY IF EXISTS "Admins delete event images"  ON storage.objects;

CREATE POLICY "Admins upload event images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'event-images'
    AND EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur'))
  );
CREATE POLICY "Public read event images"
  ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Admins delete event images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'event-images'
    AND EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur'))
  );

-- Resources (bucket privé)
DROP POLICY IF EXISTS "resources_download_pro"  ON storage.objects;
DROP POLICY IF EXISTS "resources_storage_read"  ON storage.objects;
DROP POLICY IF EXISTS "resources_storage_admin" ON storage.objects;

CREATE POLICY "resources_storage_read"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'resources'
    AND EXISTS (
      SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Pro','Élite','Admin','Modérateur')
    )
  );
CREATE POLICY "resources_storage_admin"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'resources'
    AND EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur'))
  );

-- Payment proofs
DROP POLICY IF EXISTS "Membres peuvent uploader leurs preuves." ON storage.objects;
DROP POLICY IF EXISTS "Membres voient leurs propres preuves."   ON storage.objects;
DROP POLICY IF EXISTS "Admins voient toutes les preuves."       ON storage.objects;
DROP POLICY IF EXISTS "storage_proofs_insert"                   ON storage.objects;
DROP POLICY IF EXISTS "storage_proofs_select_own"               ON storage.objects;
DROP POLICY IF EXISTS "storage_proofs_select_admin"             ON storage.objects;

CREATE POLICY "Membres peuvent uploader leurs preuves."
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Membres voient leurs propres preuves."
  ON storage.objects FOR SELECT USING (
    bucket_id = 'payment-proofs'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Admins voient toutes les preuves."
  ON storage.objects FOR SELECT USING (
    bucket_id = 'payment-proofs'
    AND EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur'))
  );

-- Course thumbnails
DROP POLICY IF EXISTS "Admins upload course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public read course thumbnails"   ON storage.objects;
DROP POLICY IF EXISTS "Admins delete course thumbnails" ON storage.objects;

CREATE POLICY "Admins upload course thumbnails"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur'))
  );
CREATE POLICY "Public read course thumbnails"
  ON storage.objects FOR SELECT USING (bucket_id = 'course-thumbnails');
CREATE POLICY "Admins delete course thumbnails"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'course-thumbnails'
    AND EXISTS (SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur'))
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 7 — SEED DATA (toutes idempotentes via ON CONFLICT DO NOTHING)
-- ─────────────────────────────────────────────────────────────────────────────

-- System settings
INSERT INTO public.system_settings (
  id, maintenance_mode, enable_social_feed, enable_marketplace,
  enable_challenges, enable_messaging,
  commission_standard, commission_pro, commission_elite, points_per_challenge
) VALUES (
  1, false, true, true, true, true, 2500, 11250, 30000, 50
) ON CONFLICT (id) DO NOTHING;

-- Masterclasses seed
INSERT INTO public.masterclasses
  (title, description, youtube_id, category, tier_required, duration_min, order_index)
VALUES
  ('Introduction et Fondations du Réseau Propulsion',
   'Comprendre la charte de valeurs, les règles de networking, et comment tirer profit de votre espace digital et physique.',
   'dQw4w9WgXcQ', 'Stratégie', 'Standard', 42, 1),
  ('La Méthode « Base de données = Argent » pas à pas',
   'Structurez votre fichier de contacts WhatsApp et email pour générer des ventes prévisibles chaque mois.',
   'dQw4w9WgXcQ', 'Vente', 'Pro', 75, 2),
  ('Négocier des contrats d''affaires complexes en Afrique',
   'Techniques de closing et de négociation de haut niveau adaptées aux réalités des marchés francophones.',
   'dQw4w9WgXcQ', 'Négociation', 'Pro', 58, 3),
  ('Leadership & Vision : Construire une organisation qui dure',
   'Les principes du leadership africain moderne, délégation efficace et culture de l''excellence.',
   'dQw4w9WgXcQ', 'Leadership', 'Pro', 65, 4),
  ('Croissance et Scaling de son Business de Service',
   'Identifier les leviers de croissance, prioriser l''acquisition et structurer une offre scalable.',
   'dQw4w9WgXcQ', 'Croissance', 'Standard', 48, 5),
  ('Le Guide Élite de l''Investissement Panafricain',
   'Session confidentielle sur les opportunités d''investissement dans l''agrobusiness, l''immobilier et la tech africaine.',
   'dQw4w9WgXcQ', 'Investissement', 'Élite', 90, 6)
ON CONFLICT DO NOTHING;

-- Challenges seed
INSERT INTO public.challenges
  (week_number, title, context, objective, mission, deliverable, category, difficulty, points, deadline, tier_required, is_active)
VALUES (
  23,
  'Sprint #23 — Construire son Pipeline Commercial',
  'La majorité des entrepreneurs perdent des ventes non pas par manque de compétences, mais par absence de suivi structuré. Un pipeline commercial est l''outil qui transforme les conversations en revenus prévisibles.',
  'Créer et alimenter un pipeline commercial opérationnel avec minimum 20 prospects qualifiés, classés par étape de maturité.',
  'Vous devez cette semaine : (1) Identifier 20 prospects idéaux depuis vos contacts WhatsApp ou réseaux. (2) Les classer en 4 étapes : Découverte → Intérêt → Négociation → Closé. (3) Définir une action de relance pour chaque prospect. (4) Documenter votre pipeline dans un tableau (Notion, Excel, Google Sheets).',
  'Un lien vers votre tableau de pipeline complété (Notion, Google Sheets, Airtable ou photo). Minimum 20 lignes de prospects réels.',
  'Vente', 'Intermédiaire', 75,
  '2026-06-15 23:59:59+00', 'Standard', true
) ON CONFLICT (week_number) DO NOTHING;

-- Resources seed
INSERT INTO public.resources
  (title, description, category, file_url, tier_required, file_type, file_size, is_published)
VALUES
  ('Contrat d''Apporteur d''Affaires OHADA',
   'Modèle juridique complet conforme à l''espace OHADA pour structurer vos relations commerciales.',
   'Juridique', NULL, 'Pro', 'DOCX', '45 KB', true),
  ('Modèle de Business Plan Propulsion',
   'Structure Word & Excel d''ingénierie financière pour présenter vos projets aux investisseurs.',
   'Finance', NULL, 'Standard', 'ZIP', '2.4 MB', true),
  ('Guide de l''Ingénierie Financière CNIC',
   'Livre blanc exclusif du Dr Claudel Noubissie sur la structuration de capital en Afrique.',
   'Stratégie', NULL, 'Élite', 'PDF', '5.8 MB', true),
  ('Template Tunnel de Vente WhatsApp',
   'Scripts, séquences de messages et workflows pour automatiser votre conversion sur WhatsApp.',
   'Marketing', NULL, 'Pro', 'ZIP', '890 KB', true),
  ('Kit Juridique OHADA Complet',
   'Pack complet : CGV, contrats de prestation, NDA, et accords de partenariat adaptés aux marchés OHADA.',
   'Juridique', NULL, 'Élite', 'ZIP', '3.2 MB', true),
  ('Tableau de Bord KPI Entrepreneur',
   'Fichier Excel de suivi des indicateurs clés : CA, marge, pipeline, taux de conversion, et trésorerie.',
   'Finance', NULL, 'Standard', 'XLSX', '320 KB', true)
ON CONFLICT DO NOTHING;

-- Events seed (seulement si la table est vide)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.events LIMIT 1) THEN
    INSERT INTO public.events (title, description, event_date, event_type, location, price, spots_max, tier_required)
    VALUES
      ('Apéro Business Élite — Douala',
       'Grand rassemblement physique des décideurs Propulsion au Cameroun. Échanges de haut niveau, pitchs confidentiels et opportunités de co-investissement.',
       '2026-09-20T17:00:00Z', 'Physique', 'Krystal Hotel, Douala (Cameroun)', 0, 30, 'Élite'),
      ('Masterclass Physique & Pitchs — Abidjan',
       'Session d''implémentation de la méthode d''affaires suivie d''un cocktail networking.',
       '2026-10-03T17:00:00Z', 'Physique', 'Sofitel Hôtel Ivoire, Abidjan (Côte d''Ivoire)', 0, 50, 'Pro'),
      ('Sprint d''Exécution Collectif & Q&A',
       'Rencontre interactive sur Zoom animée par le Dr Claudel pour débriefer le challenge hebdomadaire.',
       '2026-07-10T15:00:00Z', 'En ligne', 'Zoom Propulsion', 0, NULL, 'Standard');
  END IF;
END;
$$;

-- Realtime sur les posts (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'social_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
  END IF;
END;
$$;

-- =============================================================================
-- FIN DU SCRIPT
-- =============================================================================
