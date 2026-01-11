-- Fix: Ensure all profile fields exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL,
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
