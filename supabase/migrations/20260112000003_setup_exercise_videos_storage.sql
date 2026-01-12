-- ============================================
-- SETUP EXERCISE VIDEOS STORAGE
-- Run this in Supabase SQL Editor
-- ============================================
-- Creates storage bucket for exercise tutorial videos

-- Create exercise-videos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('exercise-videos', 'exercise-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for exercise-videos
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Group members can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Group members can update videos" ON storage.objects;
DROP POLICY IF EXISTS "Group admins can delete videos" ON storage.objects;

-- Anyone can view videos (public bucket)
CREATE POLICY "Anyone can view exercise videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'exercise-videos');

-- Group members can upload videos
CREATE POLICY "Group members can upload videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exercise-videos' AND
    auth.uid() IS NOT NULL
  );

-- Group members can update videos
CREATE POLICY "Group members can update videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'exercise-videos' AND
    auth.uid() IS NOT NULL
  );

-- Group admins can delete videos
CREATE POLICY "Group admins can delete videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exercise-videos' AND
    auth.uid() IS NOT NULL
  );
