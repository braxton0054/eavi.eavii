-- Add fee column to modules table if it doesn't exist
-- This is needed for CDACC once_per_stage courses which have module-level fees

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules'
    AND column_name = 'fee'
  ) THEN
    ALTER TABLE public.modules
    ADD COLUMN fee numeric NOT NULL DEFAULT 0;
  END IF;
END $$;
