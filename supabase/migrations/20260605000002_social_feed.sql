-- =============================================================================
-- Espace Kpaka — Fil social : photos, likes individuels, realtime
-- =============================================================================

-- 1. Colonne image sur les publications
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Table des likes (clé primaire composite = 1 like par membre par post)
CREATE TABLE IF NOT EXISTS public.social_likes (
  post_id    uuid references public.social_posts on delete cascade,
  member_id  uuid references public.members      on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  PRIMARY KEY (post_id, member_id)
);

ALTER TABLE public.social_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_read_all"   ON public.social_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.social_likes FOR INSERT WITH CHECK (auth.uid() = member_id);
CREATE POLICY "likes_delete_own" ON public.social_likes FOR DELETE  USING (auth.uid() = member_id);

-- 3. Trigger : maintient likes_count en sync automatiquement
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.social_posts
      SET likes_count = likes_count + 1
      WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.social_posts
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.post_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS tr_update_likes_count ON public.social_likes;
CREATE TRIGGER tr_update_likes_count
  AFTER INSERT OR DELETE ON public.social_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- 4. Bucket public pour les images des publications
INSERT INTO storage.buckets (id, name, public)
  VALUES ('post-images', 'post-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "members_upload_post_images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "post_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "members_delete_own_post_images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5. Activer le realtime sur les posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;
