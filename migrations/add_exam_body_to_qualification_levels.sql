-- Migration: Add exam_body column to qualification_levels table
-- This allows qualification levels to be filtered by exam body (KNEC, CDACC, JP)

-- Add exam_body column to qualification_levels table
ALTER TABLE qualification_levels
ADD COLUMN IF NOT EXISTS exam_body VARCHAR(20) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN qualification_levels.exam_body IS 'Filter qualification levels by exam body: KNEC, CDACC, JP, or NULL for all';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_qualification_levels_exam_body ON qualification_levels(exam_body);

-- Update existing qualification levels based on their names
-- NOTE: You'll need to manually update levels after this to distinguish CDACC vs JP
-- Both use "Level" naming but are different exam bodies
UPDATE qualification_levels 
SET exam_body = CASE
    WHEN name ILIKE '%diploma%' OR name ILIKE '%certificate%' OR name ILIKE '%artisan%' THEN 'KNEC'
    -- For CDACC and JP, set to NULL initially so you can manually assign
    -- or use a default based on your data
    ELSE NULL
END
WHERE exam_body IS NULL;

-- If you have specific naming patterns, update them here:
-- Example: Update specific levels to JP
-- UPDATE qualification_levels SET exam_body = 'JP' WHERE name ILIKE '%JP%' OR id IN ('specific-uuid-1', 'specific-uuid-2');

-- Example: Update specific levels to CDACC  
-- UPDATE qualification_levels SET exam_body = 'CDACC' WHERE name ILIKE '%CDACC%' OR id IN ('specific-uuid-1', 'specific-uuid-2');

-- Verify the migration
SELECT id, name, exam_body FROM qualification_levels ORDER BY name;
