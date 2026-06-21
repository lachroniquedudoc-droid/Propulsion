-- =============================================================================
-- PROPULSION — MIGRATION: COMMISSIONS FLEXIBLES
-- =============================================================================

-- Ajouter les colonnes de commission personnalisées à la table members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS custom_commission_standard numeric(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_commission_pro numeric(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_commission_elite numeric(10,2) DEFAULT NULL;

-- Mettre à jour la fonction de déclencheur pour les parrainages
CREATE OR REPLACE FUNCTION public.tr_fn_process_referral_on_activation()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings record;
  v_referrer record;
  v_commission numeric(10,2);
BEGIN
  -- Si le membre passe de 'En attente de paiement' à 'Actif'
  IF OLD.status != 'Actif' AND NEW.status = 'Actif' AND NEW.referred_by IS NOT NULL THEN
    
    -- Vérifier s'il y a déjà un enregistrement pour éviter les doublons
    IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    -- Récupérer les taux par défaut du système
    SELECT commission_standard, commission_pro, commission_elite INTO v_settings FROM public.system_settings WHERE id = 1;
    
    -- Récupérer les taux personnalisés du parrain s'ils existent
    SELECT custom_commission_standard, custom_commission_pro, custom_commission_elite INTO v_referrer FROM public.members WHERE id = NEW.referred_by;

    -- Déterminer la commission basée sur le rôle du membre référé
    v_commission := CASE NEW.role
      WHEN 'Standard' THEN COALESCE(v_referrer.custom_commission_standard, v_settings.commission_standard, 2500.00)
      WHEN 'Pro'      THEN COALESCE(v_referrer.custom_commission_pro, v_settings.commission_pro, 11250.00)
      WHEN 'Élite'    THEN COALESCE(v_referrer.custom_commission_elite, v_settings.commission_elite, 30000.00)
      ELSE 0
    END;

    IF v_commission > 0 THEN
      INSERT INTO public.referrals (referrer_id, referred_id, tier, commission, status)
      VALUES (NEW.referred_by, NEW.id, NEW.role, v_commission, 'Validé');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
