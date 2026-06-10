-- Fonction RPC: stats vendeur pour le dashboard membre
CREATE OR REPLACE FUNCTION public.get_my_referrals()
RETURNS TABLE (
  referral_id   uuid,
  referred_name text,
  tier          text,
  commission    numeric,
  status        text,
  paid_at       timestamptz,
  created_at    timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    m.first_name || ' ' || left(m.last_name, 1) || '.' AS referred_name,
    r.tier,
    r.commission,
    r.status,
    r.paid_at,
    r.created_at
  FROM public.referrals r
  JOIN public.members m ON m.id = r.referred_id
  WHERE r.referrer_id = auth.uid()
  ORDER BY r.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_referrals TO authenticated;

-- Fonction RPC: stats équipe complète (admin only)
DROP FUNCTION IF EXISTS public.get_team_stats();
CREATE FUNCTION public.get_team_stats()
RETURNS TABLE (
  member_id         uuid,
  first_name        text,
  last_name         text,
  referral_code     text,
  avatar_url        text,
  created_at        timestamptz,
  total_referrals   bigint,
  conversions       bigint,
  total_commission  numeric,
  pending_payment   numeric,
  paid_commission   numeric
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.get_my_role() NOT IN ('Admin', 'Modérateur') THEN
    RAISE EXCEPTION 'Accès refusé';
  END IF;
  RETURN QUERY
  SELECT
    m.id,
    m.first_name,
    m.last_name,
    m.referral_code,
    m.avatar_url,
    m.created_at,
    COUNT(r.id)                                                           AS total_referrals,
    COUNT(r.id) FILTER (WHERE r.status = 'Validé')                       AS conversions,
    COALESCE(SUM(r.commission) FILTER (WHERE r.status = 'Validé'), 0)    AS total_commission,
    COALESCE(SUM(r.commission) FILTER (WHERE r.status = 'Validé' AND r.paid_at IS NULL), 0) AS pending_payment,
    COALESCE(SUM(r.commission) FILTER (WHERE r.paid_at IS NOT NULL), 0)  AS paid_commission
  FROM public.members m
  LEFT JOIN public.referrals r ON r.referrer_id = m.id
  WHERE m.role = 'Vendeur'
  GROUP BY m.id, m.first_name, m.last_name, m.referral_code, m.avatar_url, m.created_at
  ORDER BY conversions DESC, total_commission DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_team_stats TO authenticated;

-- Admin peut marquer les commissions comme payées
DROP POLICY IF EXISTS "referrals_mark_paid" ON public.referrals;
CREATE POLICY "referrals_mark_paid" ON public.referrals
  FOR UPDATE
  USING (public.get_my_role() IN ('Admin', 'Modérateur'))
  WITH CHECK (public.get_my_role() IN ('Admin', 'Modérateur'));
