-- =============================================================================
-- Migration: Create get_member_id_by_referral_code secure RPC function
-- Date: 2026-06-08
-- Description: Bypasses RLS to allow anonymous/new users to check if a referral 
--              code exists and map it to its owner's member ID without exposing 
--              other sensitive member columns.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_member_id_by_referral_code(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT id FROM public.members WHERE referral_code = p_code LIMIT 1);
END;
$$;

-- Grant execution permissions to public and authenticated users
GRANT EXECUTE ON FUNCTION public.get_member_id_by_referral_code TO anon, authenticated;
