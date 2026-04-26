-- Add course_id column to short_courses table if it doesn't exist
-- Then add foreign key constraint to courses table

DO $$
BEGIN
  -- First, add course_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'short_courses'
    AND column_name = 'course_id'
  ) THEN
    ALTER TABLE public.short_courses
    ADD COLUMN course_id text;
  END IF;

  -- Then, add the foreign key constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'short_courses_course_id_fkey'
  ) THEN
    ALTER TABLE public.short_courses
    ADD CONSTRAINT short_courses_course_id_fkey
    FOREIGN KEY (course_id)
    REFERENCES public.courses(id)
    ON DELETE CASCADE;
  END IF;
END $$;
