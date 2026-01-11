-- Add profile fields for weight and body measurements
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL,
ADD COLUMN IF NOT EXISTS height_cm INTEGER,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create body measurements tracking table
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  weight_kg DECIMAL,
  body_fat_percentage DECIMAL,
  chest_cm DECIMAL,
  waist_cm DECIMAL,
  hips_cm DECIMAL,
  bicep_left_cm DECIMAL,
  bicep_right_cm DECIMAL,
  thigh_left_cm DECIMAL,
  thigh_right_cm DECIMAL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recorded_at)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, recorded_at DESC);

-- Enable RLS
ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for body_measurements
CREATE POLICY "Users can view their own measurements"
  ON body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own measurements"
  ON body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own measurements"
  ON body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own measurements"
  ON body_measurements FOR DELETE
  USING (auth.uid() = user_id);
