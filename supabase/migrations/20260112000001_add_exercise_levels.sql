-- Add exercise level/progression system
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS progression_group INTEGER,
ADD COLUMN IF NOT EXISTS progression_level INTEGER,
ADD COLUMN IF NOT EXISTS exercise_code TEXT;

-- Add index for progression lookups
CREATE INDEX IF NOT EXISTS idx_exercises_progression ON exercises(progression_group, progression_level);

-- Add notes field to template_exercises for level selection
ALTER TABLE template_exercises
ADD COLUMN IF NOT EXISTS progression_range TEXT;
