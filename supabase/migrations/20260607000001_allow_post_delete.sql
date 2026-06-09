-- =============================================================================
-- MIGRATION: ALLOW USERS TO DELETE THEIR OWN SOCIAL POSTS
-- Date: 2026-06-07
-- Description: Ajoute une politique RLS pour permettre aux auteurs de supprimer
--              leurs propres publications.
-- =============================================================================

DROP POLICY IF EXISTS "posts_delete_own" ON public.social_posts;
CREATE POLICY "posts_delete_own" ON public.social_posts
  FOR DELETE
  USING (auth.uid() = author_id);
