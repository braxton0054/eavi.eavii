-- Add exam_fee column to course_types table if it doesn't exist
-- This is needed for JP courses which have an exam fee at the end of the complete course

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_types'
    AND column_name = 'exam_fee'
  ) THEN
    ALTER TABLE public.course_types
    ADD COLUMN exam_fee numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
