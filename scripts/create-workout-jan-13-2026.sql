-- ============================================
-- CREATE WORKOUT FOR JANUARY 13, 2026
-- Run this in Supabase SQL Editor
-- ============================================
-- Creates a planned workout "Push + Pull (1)" for January 13, 2026
-- with all exercises and details

DO $$
DECLARE
  target_email TEXT := 'riccardo.terzaghi1@gmail.com';
  target_user_id UUID;
  target_group_id UUID;
  workout_id UUID;
  exercise_ids UUID[] := ARRAY[]::UUID[];
  exercise_names TEXT[] := ARRAY[
    'Pike Push-ups',
    'Wide Push-ups',
    'Diamond Push-ups',
    'Push-ups',
    'Australian Pull-ups',
    'Pull-ups',
    'Chin-ups'
  ];
  exercise_categories TEXT[] := ARRAY['push', 'push', 'push', 'push', 'pull', 'pull', 'pull'];
  exercise_reps INTEGER[] := ARRAY[10, 15, 15, 10, 15, 12, 10];
  exercise_rest INTEGER[] := ARRAY[90, 90, 90, 90, 90, 120, 120];
  i INTEGER;
  ex_id UUID;
BEGIN
  -- Get user ID and group ID
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;

  SELECT group_id INTO target_group_id
  FROM user_profiles
  WHERE id = target_user_id;

  IF target_group_id IS NULL THEN
    RAISE EXCEPTION 'User has no group_id';
  END IF;

  RAISE NOTICE 'Found user ID: %, Group ID: %', target_user_id, target_group_id;

  -- Create or get exercises
  FOR i IN 1..array_length(exercise_names, 1) LOOP
    -- Check if exercise exists
    SELECT id INTO ex_id
    FROM exercises
    WHERE group_id = target_group_id
      AND name = exercise_names[i]
      AND category = exercise_categories[i]
    LIMIT 1;

    -- If not exists, create it
    IF ex_id IS NULL THEN
      INSERT INTO exercises (group_id, name, category, created_by)
      VALUES (target_group_id, exercise_names[i], exercise_categories[i], target_user_id)
      RETURNING id INTO ex_id;
      RAISE NOTICE 'Created exercise: %', exercise_names[i];
    ELSE
      RAISE NOTICE 'Found existing exercise: %', exercise_names[i];
    END IF;

    exercise_ids := array_append(exercise_ids, ex_id);
  END LOOP;

  -- Create planned workout
  INSERT INTO planned_workouts (
    group_id,
    user_id,
    name,
    scheduled_date,
    is_group_workout,
    location_name,
    notes,
    created_at
  )
  VALUES (
    target_group_id,
    target_user_id,
    'Push + Pull (1)',
    '2026-01-13',
    true,
    'Killua''s home',
    '- il quarto esercizio sono "triceps extencions push ups" - il penultimo sono trazioni larghe - l''ultimo sono chin ups con retraction',
    NOW()
  )
  RETURNING id INTO workout_id;

  RAISE NOTICE 'Created workout: %', workout_id;

  -- Create planned workout exercises
  FOR i IN 1..array_length(exercise_ids, 1) LOOP
    INSERT INTO planned_workout_exercises (
      planned_workout_id,
      exercise_id,
      order_index,
      sets,
      reps,
      rest_seconds
    )
    VALUES (
      workout_id,
      exercise_ids[i],
      i,
      3,
      exercise_reps[i],
      exercise_rest[i]
    );
  END LOOP;

  RAISE NOTICE '✅ Workout created successfully with % exercises', array_length(exercise_ids, 1);
END $$;
