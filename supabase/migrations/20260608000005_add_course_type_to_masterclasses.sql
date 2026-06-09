-- Migration: Add course_type and course-thumbnails storage bucket
ALTER TABLE public.masterclasses
  ADD COLUMN IF NOT EXISTS course_type text DEFAULT 'Masterclass' CHECK (course_type IN ('Masterclass', 'Replay'));

-- Create public storage bucket for course thumbnails
INSERT INTO storage.buckets (id, name, public)
  VALUES ('course-thumbnails', 'course-thumbnails', true)
  ON CONFLICT (id) DO NOTHING;

-- RLS Policies for course-thumbnails
DROP POLICY IF EXISTS "Admins upload course thumbnails" ON storage.objects;
CREATE POLICY "Admins upload course thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
    )
  );

DROP POLICY IF EXISTS "Public read course thumbnails" ON storage.objects;
CREATE POLICY "Public read course thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-thumbnails');

DROP POLICY IF EXISTS "Admins delete course thumbnails" ON storage.objects;
CREATE POLICY "Admins delete course thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-thumbnails'
    AND EXISTS (
      SELECT 1 FROM public.members WHERE id = auth.uid() AND role IN ('Admin','Modérateur')
    )
  );
