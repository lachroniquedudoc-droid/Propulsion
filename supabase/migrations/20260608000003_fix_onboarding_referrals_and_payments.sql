-- =============================================================================
-- Migration: Add country, currency, and tier to payments + auto-referral trigger
-- Date: 2026-06-08
-- =============================================================================

-- 1. Alter payments table to add missing fields for country, currency, and tier
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS currency text,
  ADD COLUMN IF NOT EXISTS tier text CHECK (tier IN ('Standard', 'Pro', 'Élite'));

-- 2. Create DB trigger function to automatically process referrals and commissions
CREATE OR REPLACE FUNCTION public.tr_fn_process_referral_on_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_commission numeric(10,2);
  v_settings record;
BEGIN
  -- Only trigger when member status goes to 'Actif' and they have a referred_by record
  IF NEW.status = 'Actif' AND (OLD.status IS DISTINCT FROM 'Actif') AND NEW.referred_by IS NOT NULL THEN
    -- Check if referral record already exists for this referred member to avoid duplicate commission
    IF NOT EXISTS (
      SELECT 1 FROM public.referrals WHERE referred_id = NEW.id
    ) THEN
      -- Get system settings commissions (defaulting to standard CNIC defaults if not set)
      SELECT commission_standard, commission_pro, commission_elite INTO v_settings FROM public.system_settings WHERE id = 1;
      
      -- Determine commission based on referred member's role (tier of adhésion)
      v_commission := CASE NEW.role
        WHEN 'Standard' THEN coalesce(v_settings.commission_standard, 2500.00)
        WHEN 'Pro'      THEN coalesce(v_settings.commission_pro, 11250.00)
        WHEN 'Élite'    THEN coalesce(v_settings.commission_elite, 30000.00)
        ELSE 0.00
      END;

      -- Insert referral record with status 'Validé' since payment validation was successful
      INSERT INTO public.referrals (referrer_id, referred_id, tier, commission, status)
      VALUES (NEW.referred_by, NEW.id, NEW.role, v_commission, 'Validé');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Bind the trigger to public.members table
DROP TRIGGER IF EXISTS tr_process_referral_on_activation ON public.members;
CREATE TRIGGER tr_process_referral_on_activation
  AFTER UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.tr_fn_process_referral_on_activation();
