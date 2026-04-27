-- Migration: Add exam_body column to departments table
-- This allows departments to be filtered by exam body (KNEC, CDACC, JP, internal)

-- Add exam_body column to departments table
ALTER TABLE departments
ADD COLUMN IF NOT EXISTS exam_body VARCHAR(20) DEFAULT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN departments.exam_body IS 'Filter departments by exam body: KNEC, CDACC, JP, internal (for INSTALL/short courses), or NULL for all';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_departments_exam_body ON departments(exam_body);

-- Update existing departments to have exam_body = NULL (available for all)
-- This maintains backward compatibility
UPDATE departments SET exam_body = NULL WHERE exam_body IS NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'departments' AND column_name = 'exam_body';
