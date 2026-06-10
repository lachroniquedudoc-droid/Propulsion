-- Supprimer l'ancien trigger referral (doublonne tr_process_referral_on_activation)
DROP TRIGGER IF EXISTS tr_handle_referral_on_member_activation ON public.members;

-- Corriger le trigger de log challenge : la colonne est deliverable_url, pas submission_url
CREATE OR REPLACE FUNCTION public.tr_fn_log_challenge_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.member_activity_logs (member_id, event_type, metadata)
  VALUES (NEW.member_id, 'challenge_submitted', jsonb_build_object(
    'challenge_id', NEW.challenge_id,
    'challenge_week', NEW.challenge_week,
    'url', NEW.deliverable_url
  ));
  RETURN NEW;
END;
$$;
