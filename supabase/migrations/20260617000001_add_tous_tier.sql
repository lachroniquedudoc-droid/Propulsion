-- =============================================================================
-- MIGRATION: Ajouter 'Tous' comme valeur de tier_required
-- Date: 2026-06-17
-- Description: Permet de marquer une masterclass / événement / challenge / 
--              ressource comme accessible à TOUS les membres, sans restriction
--              de niveau. Modifie les contraintes CHECK sur tier_required.
-- =============================================================================

-- 1. masterclasses : drop + recreate constraint
DO $$
BEGIN
  -- Drop existing constraint(s) on masterclasses.tier_required
  PERFORM 1 FROM pg_constraint 
    WHERE conrelid = 'public.masterclasses'::regclass 
    AND pg_get_constraintdef(oid) LIKE '%tier_required%';
  IF FOUND THEN
    EXECUTE (
      SELECT string_agg('ALTER TABLE public.masterclasses DROP CONSTRAINT ' || quote_ident(conname), '; ')
      FROM pg_constraint 
      WHERE conrelid = 'public.masterclasses'::regclass 
      AND pg_get_constraintdef(oid) LIKE '%tier_required%'
    );
  END IF;
END $$;

ALTER TABLE public.masterclasses
  ADD CONSTRAINT masterclasses_tier_required_check
  CHECK (tier_required IN ('Tous', 'Standard', 'Pro', 'Élite'));

-- 2. events : drop + recreate constraint
DO $$
BEGIN
  PERFORM 1 FROM pg_constraint 
    WHERE conrelid = 'public.events'::regclass 
    AND pg_get_constraintdef(oid) LIKE '%tier_required%';
  IF FOUND THEN
    EXECUTE (
      SELECT string_agg('ALTER TABLE public.events DROP CONSTRAINT ' || quote_ident(conname), '; ')
      FROM pg_constraint 
      WHERE conrelid = 'public.events'::regclass 
      AND pg_get_constraintdef(oid) LIKE '%tier_required%'
    );
  END IF;
END $$;

ALTER TABLE public.events
  ADD CONSTRAINT events_tier_required_check
  CHECK (tier_required IN ('Tous', 'Standard', 'Pro', 'Élite'));

-- 3. challenges : drop + recreate constraint
DO $$
BEGIN
  PERFORM 1 FROM pg_constraint 
    WHERE conrelid = 'public.challenges'::regclass 
    AND pg_get_constraintdef(oid) LIKE '%tier_required%';
  IF FOUND THEN
    EXECUTE (
      SELECT string_agg('ALTER TABLE public.challenges DROP CONSTRAINT ' || quote_ident(conname), '; ')
      FROM pg_constraint 
      WHERE conrelid = 'public.challenges'::regclass 
      AND pg_get_constraintdef(oid) LIKE '%tier_required%'
    );
  END IF;
END $$;

ALTER TABLE public.challenges
  ADD CONSTRAINT challenges_tier_required_check
  CHECK (tier_required IN ('Tous', 'Standard', 'Pro', 'Élite'));

-- 4. resources : drop + recreate constraint (if exists)
DO $$
BEGIN
  PERFORM 1 FROM pg_constraint 
    WHERE conrelid = 'public.resources'::regclass 
    AND pg_get_constraintdef(oid) LIKE '%tier_required%';
  IF FOUND THEN
    EXECUTE (
      SELECT string_agg('ALTER TABLE public.resources DROP CONSTRAINT ' || quote_ident(conname), '; ')
      FROM pg_constraint 
      WHERE conrelid = 'public.resources'::regclass 
      AND pg_get_constraintdef(oid) LIKE '%tier_required%'
    );
  END IF;
END $$;

ALTER TABLE public.resources
  ADD CONSTRAINT resources_tier_required_check
  CHECK (tier_required IN ('Tous', 'Standard', 'Pro', 'Élite'));

-- 5. Update get_role_weight to handle 'Tous' explicitly (weight 0 = accessible by everyone)
CREATE OR REPLACE FUNCTION public.get_role_weight(user_role text)
RETURNS integer AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
