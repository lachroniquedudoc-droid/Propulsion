-- Ajout des champs de confidentialité pour WhatsApp et Email
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS whatsapp_visible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_visible boolean DEFAULT false;

ALTER TABLE public.annuaire 
ADD COLUMN IF NOT EXISTS whatsapp_visible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_visible boolean DEFAULT false;

-- Mettre à jour la fonction de synchronisation pour inclure ces champs
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
      phone, email, whatsapp, bio, avatar_url, is_published,
      whatsapp_visible, email_visible
    ) VALUES (
      NEW.id, NEW.first_name, NEW.last_name, NEW.company, NEW.sector, NEW.city,
      NEW.phone, NEW.email, NEW.whatsapp, NEW.bio, NEW.avatar_url, true,
      NEW.whatsapp_visible, NEW.email_visible
    )
    ON CONFLICT (member_id) WHERE member_id IS NOT NULL DO UPDATE SET
      first_name       = EXCLUDED.first_name,
      last_name        = EXCLUDED.last_name,
      company          = EXCLUDED.company,
      sector           = EXCLUDED.sector,
      city             = EXCLUDED.city,
      phone            = EXCLUDED.phone,
      email            = EXCLUDED.email,
      whatsapp         = EXCLUDED.whatsapp,
      bio              = EXCLUDED.bio,
      avatar_url       = EXCLUDED.avatar_url,
      whatsapp_visible = EXCLUDED.whatsapp_visible,
      email_visible    = EXCLUDED.email_visible,
      is_published     = true;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'Actif' AND NEW.status IS DISTINCT FROM 'Actif' THEN
    UPDATE public.annuaire SET is_published = false WHERE member_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- Mettre à jour le trigger d'update pour réagir aux changements de ces champs
DROP TRIGGER IF EXISTS tr_sync_member_to_annuaire_update ON public.members;
CREATE TRIGGER tr_sync_member_to_annuaire_update
  AFTER UPDATE ON public.members
  FOR EACH ROW
  WHEN (
    (NEW.status = 'Actif' AND (
      OLD.status           IS DISTINCT FROM NEW.status OR
      OLD.first_name       IS DISTINCT FROM NEW.first_name OR
      OLD.last_name        IS DISTINCT FROM NEW.last_name  OR
      OLD.company          IS DISTINCT FROM NEW.company    OR
      OLD.sector           IS DISTINCT FROM NEW.sector     OR
      OLD.city             IS DISTINCT FROM NEW.city       OR
      OLD.phone            IS DISTINCT FROM NEW.phone      OR
      OLD.email            IS DISTINCT FROM NEW.email      OR
      OLD.whatsapp         IS DISTINCT FROM NEW.whatsapp   OR
      OLD.bio              IS DISTINCT FROM NEW.bio        OR
      OLD.avatar_url       IS DISTINCT FROM NEW.avatar_url OR
      OLD.whatsapp_visible IS DISTINCT FROM NEW.whatsapp_visible OR
      OLD.email_visible    IS DISTINCT FROM NEW.email_visible
    ))
    OR (OLD.status = 'Actif' AND NEW.status IS DISTINCT FROM 'Actif')
  )
  EXECUTE FUNCTION public.sync_member_to_annuaire();

-- Synchroniser les données existantes
UPDATE public.annuaire a
SET 
  whatsapp_visible = m.whatsapp_visible,
  email_visible = m.email_visible
FROM public.members m
WHERE a.member_id = m.id;
