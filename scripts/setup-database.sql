-- ============================================
-- HUNTERONE - COMPLETE DATABASE SETUP
-- Run this single script in Supabase SQL Editor
-- ============================================

-- ============================================
-- STEP 1: Enable UUID extension
-- ============================================
-- Drop and recreate to ensure it's in the correct schema
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
CREATE EXTENSION "uuid-ossp" WITH SCHEMA public;

-- ============================================
-- STEP 2: Create all tables
-- ============================================

-- Groups table (multi-tenancy root)
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  display_name TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise library table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('push', 'pull', 'legs', 'core', 'cardio', 'skills')),
  description TEXT,
  video_url TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout templates table
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template exercises (exercises in a template)
CREATE TABLE IF NOT EXISTS template_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planned workouts (calendar entries)
CREATE TABLE IF NOT EXISTS planned_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  location TEXT,
  is_group_workout BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Planned workout exercises
CREATE TABLE IF NOT EXISTS planned_workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planned_workout_id UUID NOT NULL REFERENCES planned_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout participants (for group workouts)
CREATE TABLE IF NOT EXISTS workout_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planned_workout_id UUID NOT NULL REFERENCES planned_workouts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(planned_workout_id, user_id)
);

-- Completed workouts (workout history)
CREATE TABLE IF NOT EXISTS completed_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  planned_workout_id UUID REFERENCES planned_workouts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Completed sets (detailed workout tracking)
CREATE TABLE IF NOT EXISTS completed_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  completed_workout_id UUID NOT NULL REFERENCES completed_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL,
  duration_seconds INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_group_id ON user_profiles(group_id);
CREATE INDEX IF NOT EXISTS idx_exercises_group_id ON exercises(group_id);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_workout_templates_group_id ON workout_templates(group_id);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_user_date ON planned_workouts(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_planned_workouts_group_id ON planned_workouts(group_id);
CREATE INDEX IF NOT EXISTS idx_completed_workouts_user_id ON completed_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_workouts_group_id ON completed_workouts(group_id);
CREATE INDEX IF NOT EXISTS idx_workout_participants_workout ON workout_participants(planned_workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_participants_user ON workout_participants(user_id);

-- ============================================
-- STEP 4: Create seed function for default exercises
-- ============================================
CREATE OR REPLACE FUNCTION seed_default_exercises(target_group_id UUID, creator_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Push exercises
  INSERT INTO exercises (group_id, name, category, description, created_by) VALUES
  (target_group_id, 'Push-ups', 'push', 'Basic push-up exercise', creator_user_id),
  (target_group_id, 'Diamond Push-ups', 'push', 'Close-grip push-up variation', creator_user_id),
  (target_group_id, 'Wide Push-ups', 'push', 'Wide-grip push-up variation', creator_user_id),
  (target_group_id, 'Pike Push-ups', 'push', 'Shoulder-focused push-up', creator_user_id),
  (target_group_id, 'Dips', 'push', 'Parallel bar or bench dips', creator_user_id),
  (target_group_id, 'Handstand Push-ups', 'push', 'Advanced shoulder exercise', creator_user_id),
  
  -- Pull exercises
  (target_group_id, 'Pull-ups', 'pull', 'Overhand grip pull-up', creator_user_id),
  (target_group_id, 'Chin-ups', 'pull', 'Underhand grip pull-up', creator_user_id),
  (target_group_id, 'Australian Pull-ups', 'pull', 'Horizontal row variation', creator_user_id),
  (target_group_id, 'Negative Pull-ups', 'pull', 'Eccentric pull-up training', creator_user_id),
  (target_group_id, 'L-sit Pull-ups', 'pull', 'Advanced pull-up with core engagement', creator_user_id),
  
  -- Legs exercises
  (target_group_id, 'Squats', 'legs', 'Basic bodyweight squat', creator_user_id),
  (target_group_id, 'Pistol Squats', 'legs', 'Single-leg squat', creator_user_id),
  (target_group_id, 'Jump Squats', 'legs', 'Explosive squat variation', creator_user_id),
  (target_group_id, 'Lunges', 'legs', 'Forward or reverse lunges', creator_user_id),
  (target_group_id, 'Bulgarian Split Squats', 'legs', 'Elevated rear-foot split squat', creator_user_id),
  (target_group_id, 'Calf Raises', 'legs', 'Standing calf raise', creator_user_id),
  
  -- Core exercises
  (target_group_id, 'Plank', 'core', 'Front plank hold', creator_user_id),
  (target_group_id, 'Side Plank', 'core', 'Lateral core stability', creator_user_id),
  (target_group_id, 'Hollow Body Hold', 'core', 'Gymnastics core position', creator_user_id),
  (target_group_id, 'L-sit', 'core', 'Advanced core hold', creator_user_id),
  (target_group_id, 'Leg Raises', 'core', 'Hanging or lying leg raises', creator_user_id),
  (target_group_id, 'Dragon Flag', 'core', 'Advanced core exercise', creator_user_id),
  
  -- Cardio
  (target_group_id, 'Burpees', 'cardio', 'Full-body conditioning', creator_user_id),
  (target_group_id, 'Mountain Climbers', 'cardio', 'Dynamic core and cardio', creator_user_id),
  (target_group_id, 'Jumping Jacks', 'cardio', 'Basic cardio exercise', creator_user_id),
  (target_group_id, 'High Knees', 'cardio', 'Running in place with high knees', creator_user_id),
  
  -- Skills
  (target_group_id, 'Handstand', 'skills', 'Freestanding or wall-assisted handstand', creator_user_id),
  (target_group_id, 'Front Lever', 'skills', 'Advanced pull skill', creator_user_id),
  (target_group_id, 'Back Lever', 'skills', 'Advanced push skill', creator_user_id),
  (target_group_id, 'Muscle-up', 'skills', 'Pull-to-dip transition', creator_user_id),
  (target_group_id, 'Planche', 'skills', 'Advanced push hold', creator_user_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 5: Enable Row Level Security
-- ============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE completed_sets ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Drop existing policies and functions (if any)
-- ============================================
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Drop existing helper functions (in public schema)
DROP FUNCTION IF EXISTS public.user_group_id();
DROP FUNCTION IF EXISTS public.user_is_admin();

-- ============================================
-- STEP 7: Create helper functions (bypass RLS)
-- ============================================
CREATE OR REPLACE FUNCTION public.user_group_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT group_id FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.user_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role = 'admin' FROM public.user_profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_group_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_admin() TO authenticated;

-- ============================================
-- STEP 8: Create RLS Policies
-- ============================================

-- USER_PROFILES policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view profiles in their group"
  ON user_profiles FOR SELECT
  USING (group_id = public.user_group_id());

-- GROUPS policies
-- Allow authenticated users to view groups (needed for onboarding)
CREATE POLICY "Users can view groups"
  ON groups FOR SELECT
  USING (
    -- User is authenticated
    auth.uid() IS NOT NULL AND (
      -- User belongs to this group
      id = public.user_group_id() OR
      -- User doesn't have a group yet (onboarding flow)
      public.user_group_id() IS NULL
    )
  );

CREATE POLICY "Users can insert groups"
  ON groups FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update their group"
  ON groups FOR UPDATE
  USING (id = public.user_group_id() AND public.user_is_admin());

-- EXERCISES policies
CREATE POLICY "Users can view exercises in their group"
  ON exercises FOR SELECT
  USING (group_id = public.user_group_id());

CREATE POLICY "Users can create exercises in their group"
  ON exercises FOR INSERT
  WITH CHECK (group_id = public.user_group_id());

CREATE POLICY "Users can update exercises in their group"
  ON exercises FOR UPDATE
  USING (group_id = public.user_group_id());

CREATE POLICY "Admins can delete exercises"
  ON exercises FOR DELETE
  USING (group_id = public.user_group_id() AND public.user_is_admin());

-- WORKOUT_TEMPLATES policies
CREATE POLICY "Users can view templates in their group"
  ON workout_templates FOR SELECT
  USING (group_id = public.user_group_id());

CREATE POLICY "Users can create templates"
  ON workout_templates FOR INSERT
  WITH CHECK (group_id = public.user_group_id());

CREATE POLICY "Users can update their own templates"
  ON workout_templates FOR UPDATE
  USING (group_id = public.user_group_id() AND created_by = auth.uid());

CREATE POLICY "Users can delete their own templates"
  ON workout_templates FOR DELETE
  USING (group_id = public.user_group_id() AND created_by = auth.uid());

-- TEMPLATE_EXERCISES policies
CREATE POLICY "Users can view template exercises in their group"
  ON template_exercises FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM workout_templates WHERE group_id = public.user_group_id()
    )
  );

CREATE POLICY "Users can manage template exercises"
  ON template_exercises FOR ALL
  USING (
    template_id IN (
      SELECT id FROM workout_templates WHERE group_id = public.user_group_id()
    )
  );

-- PLANNED_WORKOUTS policies
CREATE POLICY "Users can view planned workouts in their group"
  ON planned_workouts FOR SELECT
  USING (group_id = public.user_group_id());

CREATE POLICY "Users can create planned workouts"
  ON planned_workouts FOR INSERT
  WITH CHECK (group_id = public.user_group_id());

CREATE POLICY "Users can update planned workouts"
  ON planned_workouts FOR UPDATE
  USING (group_id = public.user_group_id());

CREATE POLICY "Users can delete planned workouts"
  ON planned_workouts FOR DELETE
  USING (group_id = public.user_group_id());

-- PLANNED_WORKOUT_EXERCISES policies
CREATE POLICY "Users can view planned workout exercises in their group"
  ON planned_workout_exercises FOR SELECT
  USING (
    planned_workout_id IN (
      SELECT id FROM planned_workouts WHERE group_id = public.user_group_id()
    )
  );

CREATE POLICY "Users can manage planned workout exercises"
  ON planned_workout_exercises FOR ALL
  USING (
    planned_workout_id IN (
      SELECT id FROM planned_workouts WHERE group_id = public.user_group_id()
    )
  );

-- WORKOUT_PARTICIPANTS policies
CREATE POLICY "Users can view participants in their group"
  ON workout_participants FOR SELECT
  USING (
    planned_workout_id IN (
      SELECT id FROM planned_workouts WHERE group_id = public.user_group_id()
    )
  );

CREATE POLICY "Users can manage participants"
  ON workout_participants FOR ALL
  USING (
    planned_workout_id IN (
      SELECT id FROM planned_workouts WHERE group_id = public.user_group_id()
    )
  );

-- COMPLETED_WORKOUTS policies
CREATE POLICY "Users can view completed workouts in their group"
  ON completed_workouts FOR SELECT
  USING (group_id = public.user_group_id());

CREATE POLICY "Users can create completed workouts"
  ON completed_workouts FOR INSERT
  WITH CHECK (group_id = public.user_group_id() AND user_id = auth.uid());

CREATE POLICY "Users can update their own completed workouts"
  ON completed_workouts FOR UPDATE
  USING (user_id = auth.uid() AND group_id = public.user_group_id());

CREATE POLICY "Users can delete their own completed workouts"
  ON completed_workouts FOR DELETE
  USING (user_id = auth.uid() AND group_id = public.user_group_id());

-- COMPLETED_SETS policies
CREATE POLICY "Users can view completed sets in their group"
  ON completed_sets FOR SELECT
  USING (
    completed_workout_id IN (
      SELECT id FROM completed_workouts WHERE group_id = public.user_group_id()
    )
  );

CREATE POLICY "Users can manage their own completed sets"
  ON completed_sets FOR ALL
  USING (
    completed_workout_id IN (
      SELECT id FROM completed_workouts WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- All tables, indexes, functions, and RLS policies are now in place.
-- You can now use the application!
-- ============================================
