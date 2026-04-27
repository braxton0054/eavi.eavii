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
-- CDACC/JP levels typically contain "Level" in the name
UPDATE qualification_levels 
SET exam_body = CASE
    WHEN name ILIKE '%level 3%' OR name ILIKE '%level 4%' OR name ILIKE '%level 5%' OR name ILIKE '%level 6%' THEN 'CDACC'
    WHEN name ILIKE '%diploma%' OR name ILIKE '%certificate%' OR name ILIKE '%artisan%' THEN 'KNEC'
    ELSE NULL
END
WHERE exam_body IS NULL;

-- Verify the migration
SELECT id, name, exam_body FROM qualification_levels ORDER BY name;
