-- Garantir l'unicité absolue des codes parrainage (même à 100K+ membres)

-- Corriger les doublons existants avant d'ajouter la contrainte
DO $$
DECLARE
  r RECORD;
  v_code text;
BEGIN
  FOR r IN
    SELECT id FROM public.members
    WHERE referral_code IN (
      SELECT referral_code FROM public.members
      WHERE referral_code IS NOT NULL
      GROUP BY referral_code HAVING COUNT(*) > 1
    )
    ORDER BY created_at DESC
  LOOP
    LOOP
      v_code := 'PROP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 10));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.members WHERE referral_code = v_code);
    END LOOP;
    UPDATE public.members SET referral_code = v_code WHERE id = r.id;
  END LOOP;
END $$;

-- Corriger les NULLs
DO $$
DECLARE
  r RECORD;
  v_code text;
BEGIN
  FOR r IN SELECT id FROM public.members WHERE referral_code IS NULL LOOP
    LOOP
      v_code := 'PROP-' || UPPER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 10));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.members WHERE referral_code = v_code);
    END LOOP;
    UPDATE public.members SET referral_code = v_code WHERE id = r.id;
  END LOOP;
END $$;

-- Contrainte UNIQUE (16^10 = 1.1 trillion combinaisons)
ALTER TABLE public.members
  ADD CONSTRAINT members_referral_code_unique UNIQUE (referral_code);

-- Trigger avec boucle de retry + 10 chars
CREATE OR REPLACE FUNCTION public.auto_referral_code()
RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_code text;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      v_code := 'PROP-' || UPPER(
        SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 10)
      );
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.members WHERE referral_code = v_code
      );
    END LOOP;
    NEW.referral_code := v_code;
  END IF;
  RETURN NEW;
END;
$$;
