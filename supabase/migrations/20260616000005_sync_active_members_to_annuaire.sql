-- Synchronise automatiquement l'annuaire avec les membres validés (status = 'Actif').
-- Dès qu'un paiement est approuvé (status passe à 'Actif'), le membre apparaît dans
-- l'annuaire avec ses informations. Si son profil change pendant qu'il est actif
-- (ville, secteur, bio...), l'annuaire reste synchronisé. S'il quitte le statut
-- 'Actif' (suspendu, expiré...), son entrée est dépubliée sans être supprimée.

-- 1. Dédoublonner les entrées annuaire existantes par member_id avant la contrainte
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT member_id
    FROM public.annuaire
    WHERE member_id IS NOT NULL
    GROUP BY member_id HAVING COUNT(*) > 1
  LOOP
    DELETE FROM public.annuaire
    WHERE member_id = r.member_id
      AND id NOT IN (
        SELECT id FROM public.annuaire
        WHERE member_id = r.member_id
        ORDER BY is_published DESC, created_at DESC
        LIMIT 1
      );
  END LOOP;
END $$;

-- 2. Un seul enregistrement annuaire par membre
CREATE UNIQUE INDEX IF NOT EXISTS annuaire_member_id_unique
  ON public.annuaire (member_id) WHERE member_id IS NOT NULL;

-- 3. Fonction de synchronisation
CREATE OR REPLACE FUNCTION public.sync_member_to_annuaire()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Actif' THEN
    INSERT INTO public.annuaire (
      member_id, first_name, last_name, company, sector, city,
      phone, email, whatsapp, bio, avatar_url, is_published
    ) VALUES (
      NEW.id, NEW.first_name, NEW.last_name, NEW.company, NEW.sector, NEW.city,
      NEW.phone, NEW.email, NEW.whatsapp, NEW.bio, NEW.avatar_url, true
    )
    ON CONFLICT (member_id) DO UPDATE SET
      first_name   = EXCLUDED.first_name,
      last_name    = EXCLUDED.last_name,
      company      = EXCLUDED.company,
      sector       = EXCLUDED.sector,
      city         = EXCLUDED.city,
      phone        = EXCLUDED.phone,
      email        = EXCLUDED.email,
      whatsapp     = EXCLUDED.whatsapp,
      bio          = EXCLUDED.bio,
      avatar_url   = EXCLUDED.avatar_url,
      is_published = true;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'Actif' AND NEW.status IS DISTINCT FROM 'Actif' THEN
    UPDATE public.annuaire SET is_published = false WHERE member_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Trigger à l'inscription (cas rare : membre créé déjà Actif)
DROP TRIGGER IF EXISTS tr_sync_member_to_annuaire_insert ON public.members;
CREATE TRIGGER tr_sync_member_to_annuaire_insert
  AFTER INSERT ON public.members
  FOR EACH ROW
  WHEN (NEW.status = 'Actif')
  EXECUTE FUNCTION public.sync_member_to_annuaire();

-- 5. Trigger à la validation / mise à jour de profil / désactivation
DROP TRIGGER IF EXISTS tr_sync_member_to_annuaire_update ON public.members;
CREATE TRIGGER tr_sync_member_to_annuaire_update
  AFTER UPDATE ON public.members
  FOR EACH ROW
  WHEN (
    (NEW.status = 'Actif' AND (
      OLD.status     IS DISTINCT FROM NEW.status OR
      OLD.first_name IS DISTINCT FROM NEW.first_name OR
      OLD.last_name  IS DISTINCT FROM NEW.last_name  OR
      OLD.company    IS DISTINCT FROM NEW.company    OR
      OLD.sector     IS DISTINCT FROM NEW.sector     OR
      OLD.city       IS DISTINCT FROM NEW.city       OR
      OLD.phone      IS DISTINCT FROM NEW.phone      OR
      OLD.email      IS DISTINCT FROM NEW.email      OR
      OLD.whatsapp   IS DISTINCT FROM NEW.whatsapp   OR
      OLD.bio        IS DISTINCT FROM NEW.bio        OR
      OLD.avatar_url IS DISTINCT FROM NEW.avatar_url
    ))
    OR (OLD.status = 'Actif' AND NEW.status IS DISTINCT FROM 'Actif')
  )
  EXECUTE FUNCTION public.sync_member_to_annuaire();

-- 6. Rattrapage : ajouter immédiatement les membres déjà Actifs non encore dans l'annuaire
INSERT INTO public.annuaire (
  member_id, first_name, last_name, company, sector, city,
  phone, email, whatsapp, bio, avatar_url, is_published
)
SELECT
  m.id, m.first_name, m.last_name, m.company, m.sector, m.city,
  m.phone, m.email, m.whatsapp, m.bio, m.avatar_url, true
FROM public.members m
WHERE m.status = 'Actif'
ON CONFLICT (member_id) DO UPDATE SET
  first_name   = EXCLUDED.first_name,
  last_name    = EXCLUDED.last_name,
  company      = EXCLUDED.company,
  sector       = EXCLUDED.sector,
  city         = EXCLUDED.city,
  phone        = EXCLUDED.phone,
  email        = EXCLUDED.email,
  whatsapp     = EXCLUDED.whatsapp,
  bio          = EXCLUDED.bio,
  avatar_url   = EXCLUDED.avatar_url,
  is_published = true;
