-- =================================================================
-- MIGRATION: Challenge Submissions Trigger for reputation points
-- Date: 2026-06-06
-- Description: Gère l'attribution automatique des points de réputation 
--              aux membres lors de la validation/mise à jour d'un challenge.
-- =================================================================

CREATE OR REPLACE FUNCTION public.handle_challenge_submission_validation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  points_diff integer := 0;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Cas 1 : Passage à Validé
    IF OLD.status IS DISTINCT FROM 'Validé' AND NEW.status = 'Validé' THEN
      points_diff := NEW.points_awarded;
    -- Cas 2 : Retrait de la validation
    ELSIF OLD.status = 'Validé' AND NEW.status IS DISTINCT FROM 'Validé' THEN
      points_diff := -OLD.points_awarded;
    -- Cas 3 : Déjà validé mais modification des points attribués
    ELSIF OLD.status = 'Validé' AND NEW.status = 'Validé' AND NEW.points_awarded IS DISTINCT FROM OLD.points_awarded THEN
      points_diff := NEW.points_awarded - OLD.points_awarded;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    IF NEW.status = 'Validé' THEN
      points_diff := NEW.points_awarded;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'Validé' THEN
      points_diff := -OLD.points_awarded;
    END IF;
  END IF;

  IF points_diff <> 0 THEN
    UPDATE public.members 
    SET reputation_points = reputation_points + points_diff
    WHERE id = COALESCE(NEW.member_id, OLD.member_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS tr_handle_challenge_submission_validation ON public.challenge_submissions;
CREATE TRIGGER tr_handle_challenge_submission_validation
  AFTER INSERT OR UPDATE OR DELETE ON public.challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_challenge_submission_validation();
