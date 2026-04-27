-- Fix campus column to be array type
-- First, rename old column, then create new array column, migrate data, then drop old

DO $$
BEGIN
    -- Check if campus column exists and is text type (not array)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lecturers' 
        AND column_name = 'campus'
        AND data_type = 'text'
    ) THEN
        -- Rename old column
        ALTER TABLE lecturers RENAME COLUMN campus TO campus_old;
        
        -- Add new array column
        ALTER TABLE lecturers ADD COLUMN campus TEXT[] DEFAULT '{}';
        
        -- Migrate data from old to new
        UPDATE lecturers 
        SET campus = ARRAY[campus_old] 
        WHERE campus_old IS NOT NULL;
        
        -- Drop old column
        ALTER TABLE lecturers DROP COLUMN campus_old;
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lecturers' 
        AND column_name = 'campus'
    ) THEN
        -- Column doesn't exist at all, create it
        ALTER TABLE lecturers ADD COLUMN campus TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Add comment to explain the column
COMMENT ON COLUMN lecturers.campus IS 'Campus locations (main, west, town) where the lecturer is based. Array type supports multiple campuses.';

-- Set all existing lecturers to be available at both campuses
UPDATE lecturers 
SET campus = ARRAY['main', 'west'] 
WHERE campus IS NULL OR campus = '{}';
