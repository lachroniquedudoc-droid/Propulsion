-- =============================================================================
-- MIGRATION: FIX AUTH TRIGGER — "Database error saving new user"
-- Date: 2026-06-06
-- Root cause: auto_referral_code() references extensions.gen_random_uuid()
--             which is not found when search_path = public only.
--             In PostgreSQL 13+, gen_random_uuid() lives in pg_catalog
--             (always searched), so no schema prefix is needed.
-- =============================================================================

-- 1. Fix auto_referral_code: drop the extensions. prefix
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

-- 2. Make handle_new_auth_user robust: EXCEPTION block prevents auth failures
--    from cascading (member insert error logs but never blocks auth signup)
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.members (id, first_name, last_name, whatsapp, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'Membre'),
    COALESCE(NEW.raw_user_meta_data->>'last_name',  ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp',   ''),
    COALESCE(NEW.raw_user_meta_data->>'role',        'Standard'),
    'En attente de paiement'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'handle_new_auth_user: member insert failed for % — %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
