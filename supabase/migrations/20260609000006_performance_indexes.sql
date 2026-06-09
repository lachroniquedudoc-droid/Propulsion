-- =============================================================================
-- MIGRATION: Performance indexes for 10 000+ users
-- Every index targets a WHERE, JOIN, or ORDER BY that appears in frontend queries.
-- =============================================================================

-- ── members ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_members_status       ON public.members(status);
CREATE INDEX IF NOT EXISTS idx_members_role         ON public.members(role);
CREATE INDEX IF NOT EXISTS idx_members_created_at   ON public.members(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_members_referral_code ON public.members(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_members_referred_by  ON public.members(referred_by)   WHERE referred_by IS NOT NULL;

-- ── subscriptions ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_subscriptions_member  ON public.subscriptions(member_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status  ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires ON public.subscriptions(expires_at) WHERE status = 'Actif';

-- ── social_posts ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_posts_author     ON public.social_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_created_at ON public.social_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_posts_category   ON public.social_posts(category);

-- ── post_comments ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_post_comments_post   ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_author ON public.post_comments(author_id);

-- ── post_likes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_post_likes_post   ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_member ON public.post_likes(member_id);

-- ── events ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_events_date         ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type         ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_tier         ON public.events(tier_required);

-- ── event_registrations ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_event_reg_member ON public.event_registrations(member_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_event  ON public.event_registrations(event_id);

-- ── challenge_submissions ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_challenge_subs_member    ON public.challenge_submissions(member_id);
CREATE INDEX IF NOT EXISTS idx_challenge_subs_challenge ON public.challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_subs_status    ON public.challenge_submissions(status);

-- ── market_offers ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_market_offers_author    ON public.market_offers(author_id);
CREATE INDEX IF NOT EXISTS idx_market_offers_status    ON public.market_offers(status);
CREATE INDEX IF NOT EXISTS idx_market_offers_category  ON public.market_offers(category);
CREATE INDEX IF NOT EXISTS idx_market_offers_created   ON public.market_offers(created_at DESC);

-- ── referrals ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);

-- ── masterclasses ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_masterclasses_published ON public.masterclasses(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_masterclasses_tier      ON public.masterclasses(tier_required);
CREATE INDEX IF NOT EXISTS idx_masterclasses_order     ON public.masterclasses(order_index);

-- ── content_progress / module_progress ───────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_content_progress_member ON public.content_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_member_module ON public.module_progress(member_id, module_id);

-- ── member_notifications ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_member_notifs_unread ON public.member_notifications(member_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_member_notifs_created ON public.member_notifications(created_at DESC);

-- ── payments ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_member ON public.payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- ── annuaire ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_annuaire_country ON public.annuaire(country) WHERE country IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_annuaire_sector  ON public.annuaire(sector)  WHERE sector  IS NOT NULL;
