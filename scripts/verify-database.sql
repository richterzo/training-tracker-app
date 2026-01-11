-- Script di verifica per controllare che il database sia configurato correttamente
-- Esegui questo in Supabase SQL Editor per verificare

-- Verifica tabelle
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN (
    'groups',
    'user_profiles', 
    'exercises',
    'workout_templates',
    'template_exercises',
    'planned_workouts',
    'planned_workout_exercises',
    'workout_participants',
    'completed_workouts',
    'completed_sets'
  )
ORDER BY table_name;

-- Verifica RLS abilitato
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'groups',
    'user_profiles',
    'exercises',
    'workout_templates',
    'template_exercises',
    'planned_workouts',
    'planned_workout_exercises',
    'workout_participants',
    'completed_workouts',
    'completed_sets'
  )
ORDER BY tablename;

-- Verifica policies RLS
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Verifica funzioni helper
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'auth'
  AND routine_name IN ('user_group_id', 'user_is_admin');

-- Verifica funzione seed
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'seed_default_exercises';
