-- Notification vendeur : filleul validé
CREATE OR REPLACE FUNCTION public.tr_fn_notify_referral_converted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_referred_name text;
BEGIN
  SELECT first_name || ' ' || last_name INTO v_referred_name
  FROM public.members WHERE id = NEW.referred_id;

  INSERT INTO public.member_notifications (member_id, type, category, title, body, link)
  VALUES (
    NEW.referrer_id, 'referral_converted', 'Finance',
    '🎉 Nouvelle conversion !',
    v_referred_name || ' vient de rejoindre via votre lien — '
      || CASE NEW.tier
           WHEN 'Standard' THEN '2 500'
           WHEN 'Pro'      THEN '11 250'
           WHEN 'Élite'    THEN '30 000'
           ELSE NEW.commission::text
         END || ' FCFA de commission validée.',
    '/dashboard'
  );

  INSERT INTO public.member_activity_logs (member_id, event_type, metadata)
  VALUES (NEW.referrer_id, 'referral_converted', jsonb_build_object(
    'referred_name', v_referred_name, 'tier', NEW.tier, 'commission', NEW.commission
  ));

  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_notify_referral_converted ON public.referrals;
CREATE TRIGGER tr_notify_referral_converted
  AFTER INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_referral_converted();

-- Notification vendeur : commission payée
CREATE OR REPLACE FUNCTION public.tr_fn_notify_referral_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.paid_at IS NULL AND NEW.paid_at IS NOT NULL THEN
    INSERT INTO public.member_notifications (member_id, type, category, title, body, link)
    VALUES (
      NEW.referrer_id, 'commission_paid', 'Finance',
      '💳 Commission versée',
      'Votre commission de ' || NEW.commission::text || ' FCFA a été versée.',
      '/dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_notify_referral_paid ON public.referrals;
CREATE TRIGGER tr_notify_referral_paid
  AFTER UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_notify_referral_paid();
