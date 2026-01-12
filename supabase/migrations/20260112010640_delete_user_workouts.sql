-- ============================================
-- DELETE WORKOUTS FOR USER
-- Run this in Supabase SQL Editor
-- ============================================
-- This script deletes all workouts (planned and completed) for a specific user

-- Replace with the actual user email
DO $$
DECLARE
  target_email TEXT := 'riccardo.terzaghi1@gmail.com';
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;

  RAISE NOTICE 'Found user ID: %', target_user_id;

  -- Delete completed sets first (foreign key constraint)
  DELETE FROM completed_sets
  WHERE completed_workout_id IN (
    SELECT id FROM completed_workouts WHERE user_id = target_user_id
  );

  RAISE NOTICE 'Deleted completed sets';

  -- Delete completed workouts
  DELETE FROM completed_workouts
  WHERE user_id = target_user_id;

  RAISE NOTICE 'Deleted completed workouts';

  -- Delete workout participants (where user is participant)
  DELETE FROM workout_participants
  WHERE user_id = target_user_id;

  RAISE NOTICE 'Deleted workout participants';

  -- Delete planned workout exercises first (foreign key constraint)
  DELETE FROM planned_workout_exercises
  WHERE planned_workout_id IN (
    SELECT id FROM planned_workouts WHERE user_id = target_user_id
  );

  RAISE NOTICE 'Deleted planned workout exercises';

  -- Delete planned workouts
  DELETE FROM planned_workouts
  WHERE user_id = target_user_id;

  RAISE NOTICE 'Deleted planned workouts';

  RAISE NOTICE '✅ All workouts deleted for user: %', target_email;
END $$;
