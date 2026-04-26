-- Add attachment-related columns to modules table if they don't exist
-- These are needed for attachment stages in the course structure

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules'
    AND column_name = 'has_attachment'
  ) THEN
    ALTER TABLE public.modules
    ADD COLUMN has_attachment boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules'
    AND column_name = 'attachment_after_semester'
  ) THEN
    ALTER TABLE public.modules
    ADD COLUMN attachment_after_semester integer CHECK (attachment_after_semester >= 1 AND attachment_after_semester <= 6);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules'
    AND column_name = 'attachment_duration_months'
  ) THEN
    ALTER TABLE public.modules
    ADD COLUMN attachment_duration_months integer DEFAULT 3;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'modules'
    AND column_name = 'is_attachment_stage'
  ) THEN
    ALTER TABLE public.modules
    ADD COLUMN is_attachment_stage boolean DEFAULT false;
  END IF;
END $$;
