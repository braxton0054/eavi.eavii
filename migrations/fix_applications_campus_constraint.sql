-- Fix applications campus check constraint
-- Drop existing constraint and create new one accepting 'Main Campus' and 'West Campus'

DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'applications_campus_check'
    ) THEN
        ALTER TABLE applications DROP CONSTRAINT applications_campus_check;
    END IF;
END $$;

-- Add new check constraint accepting the full campus names
ALTER TABLE applications 
ADD CONSTRAINT applications_campus_check 
CHECK (campus IN ('Main Campus', 'West Campus'));

-- Update any existing records with old values
UPDATE applications 
SET campus = CASE 
    WHEN campus = 'main' OR campus = 'Main' THEN 'Main Campus'
    WHEN campus = 'west' OR campus = 'West' THEN 'West Campus'
    ELSE campus
END
WHERE campus NOT IN ('Main Campus', 'West Campus');
