-- Add practical_fee column to semesters table if it doesn't exist
-- This is needed for courses that have separate practical fees

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'semesters'
    AND column_name = 'practical_fee'
  ) THEN
    ALTER TABLE public.semesters
    ADD COLUMN practical_fee numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
