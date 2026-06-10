-- Activity logging: DB triggers pour enregistrer automatiquement les actions membres

/* ── 1. Inscription événement ─────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.tr_fn_log_event_registration()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.member_activity_logs (member_id, event_type, metadata)
  VALUES (NEW.member_id, 'event_registered', jsonb_build_object('event_id', NEW.event_id));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_log_event_registration ON public.event_registrations;
CREATE TRIGGER tr_log_event_registration
  AFTER INSERT ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_log_event_registration();

/* ── 2. Soumission challenge ───────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.tr_fn_log_challenge_submission()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.member_activity_logs (member_id, event_type, metadata)
  VALUES (NEW.member_id, 'challenge_submitted', jsonb_build_object(
    'challenge_id', NEW.challenge_id,
    'url', NEW.submission_url
  ));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_log_challenge_submission ON public.challenge_submissions;
CREATE TRIGGER tr_log_challenge_submission
  AFTER INSERT ON public.challenge_submissions
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_log_challenge_submission();

/* ── 3. Publication sociale ────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.tr_fn_log_social_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.member_activity_logs (member_id, event_type, metadata)
  VALUES (NEW.author_id, 'post_created', jsonb_build_object(
    'post_id', NEW.id,
    'category', NEW.category
  ));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_log_social_post ON public.social_posts;
CREATE TRIGGER tr_log_social_post
  AFTER INSERT ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_log_social_post();

/* ── 4. Offre marché soumise ───────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.tr_fn_log_market_offer()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.member_activity_logs (member_id, event_type, metadata)
  VALUES (NEW.author_id, 'offer_submitted', jsonb_build_object(
    'offer_id', NEW.id,
    'title', left(NEW.title, 80)
  ));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_log_market_offer ON public.market_offers;
CREATE TRIGGER tr_log_market_offer
  AFTER INSERT ON public.market_offers
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_log_market_offer();

/* ── 5. Paiement soumis ───────────────────────────────────────── */
CREATE OR REPLACE FUNCTION public.tr_fn_log_payment_submitted()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.member_activity_logs (member_id, event_type, metadata)
  VALUES (NEW.member_id, 'payment_submitted', jsonb_build_object(
    'payment_id', NEW.id,
    'amount', NEW.amount,
    'method', NEW.method
  ));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_log_payment_submitted ON public.payments;
CREATE TRIGGER tr_log_payment_submitted
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.tr_fn_log_payment_submitted();

/* ── 6. RLS: membres voient leurs propres logs ────────────────── */
DROP POLICY IF EXISTS "Membres voient leurs logs." ON public.member_activity_logs;
CREATE POLICY "Membres voient leurs logs." ON public.member_activity_logs
  FOR SELECT USING (auth.uid() = member_id);

-- S'assurer que la politique d'insertion est bien présente
DROP POLICY IF EXISTS "Membres créent leurs logs." ON public.member_activity_logs;
CREATE POLICY "Membres créent leurs logs." ON public.member_activity_logs
  FOR INSERT WITH CHECK (auth.uid() = member_id);

DROP POLICY IF EXISTS "Admins lisent les logs." ON public.member_activity_logs;
CREATE POLICY "Admins lisent les logs." ON public.member_activity_logs
  FOR SELECT USING (public.get_my_role() IN ('Admin', 'Modérateur'));
