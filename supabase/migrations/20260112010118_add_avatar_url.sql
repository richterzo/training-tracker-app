-- ============================================
-- ADD AVATAR_URL COLUMN - Run this in Supabase SQL Editor
-- ============================================
-- Quick fix to add avatar_url column if missing

DO $$
BEGIN
  -- Add avatar_url if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url TEXT;
    RAISE NOTICE '✅ avatar_url column added successfully!';
  ELSE
    RAISE NOTICE 'ℹ️ avatar_url column already exists';
  END IF;
END $$;
