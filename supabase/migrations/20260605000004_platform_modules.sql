-- =============================================================================
-- Modules Plateforme — Masterclasses, Annuaire, Challenges, Parrainage, Ressources
-- =============================================================================


-- ── 1. MASTERCLASSES — colonnes supplémentaires ─────────────────────────────

ALTER TABLE public.masterclasses
  ADD COLUMN IF NOT EXISTS duration_min  integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS instructor    text DEFAULT 'Dr Claudel Noubissie' NOT NULL,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS is_published  boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS order_index   integer DEFAULT 0 NOT NULL;

ALTER TABLE public.masterclasses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "masterclasses_read_published" ON public.masterclasses;
CREATE POLICY "masterclasses_read_published"
  ON public.masterclasses FOR SELECT USING (is_published = true);

-- Seed: bibliothèque initiale
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
   'Les principes du leadership africain moderne, délégation efficace et culture de l''excellence au sein de votre équipe.',
   'dQw4w9WgXcQ', 'Leadership', 'Pro', 65, 4),

  ('Croissance et Scaling de son Business de Service',
   'Identifier les leviers de croissance, prioriser l''acquisition et structurer une offre scalable.',
   'dQw4w9WgXcQ', 'Croissance', 'Standard', 48, 5),

  ('Le Guide Élite de l''Investissement Panafricain',
   'Session confidentielle sur les opportunités de capital et d''investissement dans l''agrobusiness, l''immobilier et la tech africaine.',
   'dQw4w9WgXcQ', 'Investissement', 'Élite', 90, 6)
ON CONFLICT DO NOTHING;

-- Policies content_progress
ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "progress_own" ON public.content_progress;
CREATE POLICY "progress_own" ON public.content_progress FOR ALL USING (auth.uid() = member_id);


-- ── 2. CHALLENGES — table dédiée + extensions ────────────────────────────────

CREATE TABLE IF NOT EXISTS public.challenges (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number   integer NOT NULL UNIQUE,
  title         text NOT NULL,
  context       text NOT NULL,
  objective     text NOT NULL,
  mission       text NOT NULL,
  deliverable   text NOT NULL,
  resources     text[],
  category      text NOT NULL DEFAULT 'Business',
  difficulty    text NOT NULL DEFAULT 'Intermédiaire'
                  CHECK (difficulty IN ('Débutant','Intermédiaire','Avancé')),
  points        integer NOT NULL DEFAULT 50,
  deadline      timestamptz,
  tier_required text NOT NULL DEFAULT 'Standard'
                  CHECK (tier_required IN ('Standard','Pro','Élite')),
  is_active     boolean DEFAULT false NOT NULL,
  created_at    timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "challenges_read_all" ON public.challenges;
CREATE POLICY "challenges_read_all" ON public.challenges FOR SELECT USING (true);
DROP POLICY IF EXISTS "challenges_admin" ON public.challenges;
CREATE POLICY "challenges_admin"
  ON public.challenges FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid() AND m.role IN ('Admin','Modérateur')));

-- Lier les soumissions à la table challenges
ALTER TABLE public.challenge_submissions
  ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES public.challenges ON DELETE SET NULL;

ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "submissions_read_own" ON public.challenge_submissions;
CREATE POLICY "submissions_read_own"   ON public.challenge_submissions FOR SELECT USING (auth.uid() = member_id);
DROP POLICY IF EXISTS "submissions_insert_own" ON public.challenge_submissions;
CREATE POLICY "submissions_insert_own" ON public.challenge_submissions FOR INSERT WITH CHECK (auth.uid() = member_id);
DROP POLICY IF EXISTS "submissions_admin" ON public.challenge_submissions;
CREATE POLICY "submissions_admin"
  ON public.challenge_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid() AND m.role IN ('Admin','Modérateur')));

-- Reputation points sur members
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS reputation_points integer DEFAULT 0 NOT NULL;

-- Seed: sprint actuel (semaine 23, 2026)
INSERT INTO public.challenges
  (week_number, title, context, objective, mission, deliverable, category, difficulty, points, deadline, tier_required, is_active)
VALUES (
  23,
  'Sprint #23 — Construire son Pipeline Commercial',
  'La majorité des entrepreneurs perdent des ventes non pas par manque de compétences, mais par absence de suivi structuré. Un pipeline commercial est l''outil qui transforme les conversations en revenus prévisibles.',
  'Créer et alimenter un pipeline commercial opérationnel avec minimum 20 prospects qualifiés, classés par étape de maturité.',
  'Vous devez cette semaine : (1) Identifier 20 prospects idéaux depuis vos contacts WhatsApp ou réseaux. (2) Les classer en 4 étapes : Découverte → Intérêt → Négociation → Closé. (3) Définir une action de relance pour chaque prospect. (4) Documenter votre pipeline dans un tableau (Notion, Excel, Google Sheets).',
  'Un lien vers votre tableau de pipeline complété (Notion, Google Sheets, Airtable ou photo). Minimum 20 lignes de prospects réels.',
  'Vente',
  'Intermédiaire',
  75,
  '2026-06-15 23:59:59+00',
  'Standard',
  true
) ON CONFLICT (week_number) DO NOTHING;


-- ── 3. PARRAINAGE — système de référencement ─────────────────────────────────

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by   uuid REFERENCES public.members ON DELETE SET NULL;

-- Auto-génération du code parrainage à l'insertion
CREATE OR REPLACE FUNCTION public.auto_referral_code()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := 'PROP-' || UPPER(SUBSTRING(REPLACE(extensions.gen_random_uuid()::text, '-', '') FROM 1 FOR 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_referral_code ON public.members;
CREATE TRIGGER tr_auto_referral_code
  BEFORE INSERT ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.auto_referral_code();

-- Remplir les codes pour les membres existants
UPDATE public.members
  SET referral_code = 'PROP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 6))
  WHERE referral_code IS NULL;

CREATE TABLE IF NOT EXISTS public.referrals (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id  uuid REFERENCES public.members ON DELETE CASCADE NOT NULL,
  referred_id  uuid REFERENCES public.members ON DELETE CASCADE NOT NULL UNIQUE,
  tier         text NOT NULL,
  commission   numeric(10,2) DEFAULT 0 NOT NULL,
  status       text DEFAULT 'En attente' NOT NULL
                 CHECK (status IN ('En attente','Validé','Payé')),
  created_at   timestamptz DEFAULT timezone('utc', now()) NOT NULL,
  validated_at timestamptz,
  paid_at      timestamptz
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "referrals_own" ON public.referrals;
CREATE POLICY "referrals_own"
  ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);
DROP POLICY IF EXISTS "referrals_admin" ON public.referrals;
CREATE POLICY "referrals_admin"
  ON public.referrals FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid() AND m.role IN ('Admin','Modérateur')));


-- ── 4. RESSOURCES — colonnes supplémentaires ─────────────────────────────────

ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'PDF',
  ADD COLUMN IF NOT EXISTS file_size text;

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "resources_read_all" ON public.resources;
CREATE POLICY "resources_read_all" ON public.resources FOR SELECT USING (true);
DROP POLICY IF EXISTS "resources_admin" ON public.resources;
CREATE POLICY "resources_admin"
  ON public.resources FOR ALL
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid() AND m.role IN ('Admin','Modérateur')));

-- Seed: bibliothèque initiale
INSERT INTO public.resources
  (title, description, category, file_url, tier_required, file_type, file_size)
VALUES
  ('Contrat d''Apporteur d''Affaires OHADA',
   'Modèle juridique complet conforme à l''espace OHADA pour structurer vos relations commerciales avec des apporteurs d''affaires.',
   'Juridique', '#', 'Pro', 'DOCX', '45 KB'),

  ('Modèle de Business Plan Propulsion',
   'Structure Word & Excel d''ingénierie financière pour présenter vos projets aux investisseurs et banques panafricaines.',
   'Finance', '#', 'Standard', 'ZIP', '2.4 MB'),

  ('Guide de l''Ingénierie Financière CNIC',
   'Livre blanc exclusif du Dr Claudel Noubissie sur la structuration de capital et la levée de fonds en Afrique.',
   'Stratégie', '#', 'Élite', 'PDF', '5.8 MB'),

  ('Template Tunnel de Vente WhatsApp',
   'Scripts, séquences de messages et workflows pour automatiser votre conversion de prospects sur WhatsApp.',
   'Marketing', '#', 'Pro', 'ZIP', '890 KB'),

  ('Kit Juridique OHADA Complet',
   'Pack complet : CGV, contrats de prestation, NDA, et accords de partenariat adaptés aux marchés OHADA.',
   'Juridique', '#', 'Élite', 'ZIP', '3.2 MB'),

  ('Tableau de Bord KPI Entrepreneur',
   'Fichier Excel de suivi des indicateurs clés : CA, marge, pipeline, taux de conversion, et trésorerie.',
   'Finance', '#', 'Standard', 'XLSX', '320 KB')
ON CONFLICT DO NOTHING;

-- Bucket pour les ressources (upload admin)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('resources', 'resources', false)
  ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "resources_download_pro" ON storage.objects;
CREATE POLICY "resources_download_pro"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resources'
    AND EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = auth.uid()
      AND m.role IN ('Pro','Élite','Admin','Modérateur')
    )
  );


-- ── 5. SYSTEM SETTINGS — table de configuration globale ──────────────────────

CREATE TABLE IF NOT EXISTS public.system_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  maintenance_mode boolean DEFAULT false NOT NULL,
  maintenance_message text DEFAULT 'La plateforme Propulsion est en cours de maintenance temporaire. Nous revenons très vite !' NOT NULL,
  enable_social_feed boolean DEFAULT true NOT NULL,
  enable_marketplace boolean DEFAULT true NOT NULL,
  enable_challenges boolean DEFAULT true NOT NULL,
  enable_messaging boolean DEFAULT true NOT NULL,
  commission_standard numeric(10, 2) DEFAULT 2500 NOT NULL,
  commission_pro numeric(10, 2) DEFAULT 11250 NOT NULL,
  commission_elite numeric(10, 2) DEFAULT 30000 NOT NULL,
  points_per_challenge integer DEFAULT 50 NOT NULL,
  updated_at timestamptz DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous les visiteurs/membres
DROP POLICY IF EXISTS "Allow read access to system_settings" ON public.system_settings;
CREATE POLICY "Allow read access to system_settings" 
  ON public.system_settings FOR SELECT USING (true);

-- Modification réservée aux Administrateurs et Modérateurs
DROP POLICY IF EXISTS "Allow write access to system_settings" ON public.system_settings;
CREATE POLICY "Allow write access to system_settings" 
  ON public.system_settings FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.members m WHERE m.id = auth.uid() AND m.role IN ('Admin','Modérateur')));

-- Seed configuration initiale
INSERT INTO public.system_settings (
  id, maintenance_mode, maintenance_message, enable_social_feed, 
  enable_marketplace, enable_challenges, enable_messaging, 
  commission_standard, commission_pro, commission_elite, points_per_challenge
)
VALUES (
  1, false, 'La plateforme Propulsion est en cours de maintenance temporaire. Nous revenons très vite !', true,
  true, true, true,
  2500, 11250, 30000, 50
)
ON CONFLICT (id) DO NOTHING;

