-- Audit de sécurité : corrige 3 failles RLS exploitables côté membre.
--
-- 1. members_update_own n'a pas de WITH CHECK — seul un trigger bloque
--    role/status/unique_id. subscription_expires_at, badges et
--    reputation_points restaient libres : un membre pouvait s'auto-attribuer
--    un abonnement à vie, des badges (Fondateur, Certifié...) et un score
--    de réputation arbitraire via un appel direct à l'API Supabase.
-- 2. submissions_insert_own n'a pas de WITH CHECK sur status/points_awarded —
--    un membre pouvait insérer une soumission déjà 'Validé' avec des points
--    arbitraires, crédités immédiatement via le trigger de réputation.
-- 3. offers_update_own n'a pas de WITH CHECK — un membre pouvait s'auto-
--    approuver une offre marché (status: 'Approuvé'), contournant la
--    modération admin.

-- ─── 1. Members : verrouiller subscription_expires_at / badges / reputation_points / referral_code ───
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
    IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
      RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier la date d''expiration de votre abonnement.';
    END IF;
    IF NEW.badges IS DISTINCT FROM OLD.badges THEN
      RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas vous attribuer de badges.';
    END IF;
    IF NEW.reputation_points IS DISTINCT FROM OLD.reputation_points THEN
      RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier vos points de réputation.';
    END IF;
    IF NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
      RAISE EXCEPTION 'Sécurité : Vous ne pouvez pas modifier votre code de parrainage.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
-- Trigger déjà attaché (tr_enforce_member_fields_protection) — CREATE OR REPLACE suffit.

-- ─── 2. Challenge submissions : interdire l'auto-validation à l'insertion ───
DROP POLICY IF EXISTS "submissions_insert_own" ON public.challenge_submissions;
CREATE POLICY "submissions_insert_own" ON public.challenge_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = member_id
    AND status = 'En cours'
    AND points_awarded = 0
  );

-- ─── 3. Market offers : verrouiller status / admin_note pour les non-admins ───
CREATE OR REPLACE FUNCTION public.enforce_offer_fields_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.get_my_role() NOT IN ('Admin','Modérateur') THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Sécurité : Seul un administrateur peut modifier le statut d''une offre.';
    END IF;
    IF NEW.admin_note IS DISTINCT FROM OLD.admin_note THEN
      RAISE EXCEPTION 'Sécurité : Seul un administrateur peut modifier la note admin.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_enforce_offer_fields_protection ON public.market_offers;
CREATE TRIGGER tr_enforce_offer_fields_protection
  BEFORE UPDATE ON public.market_offers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_offer_fields_protection();
