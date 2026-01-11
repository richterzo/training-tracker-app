-- Add latitude and longitude columns to planned_workouts for Google Maps integration
ALTER TABLE planned_workouts
ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_planned_workouts_location ON planned_workouts(location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
