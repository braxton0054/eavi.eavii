-- Add campus column to lecturers table (supports multiple campuses)
ALTER TABLE lecturers ADD COLUMN IF NOT EXISTS campus TEXT[] DEFAULT '{}';

-- Convert any existing text campus values to array format
-- Only update rows where campus is a string (not already an array)
UPDATE lecturers 
SET campus = ARRAY[campus] 
WHERE campus IS NOT NULL 
  AND pg_typeof(campus) = 'text';

-- Add comment to explain the column
COMMENT ON COLUMN lecturers.campus IS 'Campus locations (main, west, town) where the lecturer is based. Array type supports multiple campuses.';
