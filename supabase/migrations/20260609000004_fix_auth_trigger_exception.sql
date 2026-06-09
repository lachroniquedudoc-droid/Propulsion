-- =============================================================================
-- MIGRATION: Fix 500 on /auth/v1/signup
-- Root cause 1: catchup migration (20260609000002) handle_new_auth_user()
--               inserts into `email` and `phone` columns that don't exist on
--               public.members → column not found error → Supabase 500.
-- Root cause 2: same migration dropped the EXCEPTION WHEN OTHERS block,
--               so any INSERT error now propagates and blocks signup.
-- Fix: add missing columns + restore exception block.
-- =============================================================================

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Clients cannot self-assign elevated roles
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
    COALESCE(NEW.raw_user_meta_data->>'last_name',  ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone',      NULL),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp',   NULL),
    v_role,
    'En attente de paiement'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but never block auth signup
  RAISE LOG 'handle_new_auth_user: member insert failed for % — %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;
