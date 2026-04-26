-- Add missing columns to course_types table
-- These columns are expected by the application but may be missing from the database

DO $$
BEGIN
  -- Add min_kcse_grade column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_types'
    AND column_name = 'min_kcse_grade'
  ) THEN
    ALTER TABLE public.course_types
    ADD COLUMN min_kcse_grade text NOT NULL DEFAULT 'C-';
  END IF;

  -- Add study_mode column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_types'
    AND column_name = 'study_mode'
  ) THEN
    ALTER TABLE public.course_types
    ADD COLUMN study_mode text NOT NULL DEFAULT 'module' CHECK (study_mode = ANY (ARRAY['module'::text, 'short-course'::text]));
  END IF;

  -- Add duration_months column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'course_types'
    AND column_name = 'duration_months'
  ) THEN
    ALTER TABLE public.course_types
    ADD COLUMN duration_months integer DEFAULT 0;
  END IF;
END $$;
