-- ============================================================
-- EAVI: Split full_name into first_name, middle_name, last_name
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. APPLICATIONS
ALTER TABLE applications ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_name TEXT;

UPDATE applications SET
  first_name = SPLIT_PART(COALESCE(full_name, ''), ' ', 1),
  middle_name = CASE 
    WHEN LENGTH(TRIM(COALESCE(full_name, ''))) - LENGTH(REPLACE(TRIM(COALESCE(full_name, '')), ' ', '')) >= 2 
    THEN SPLIT_PART(SUBSTRING(TRIM(COALESCE(full_name, '')) FROM POSITION(' ' IN TRIM(COALESCE(full_name, ''))) + 1), ' ', 1)
    ELSE NULL 
  END,
  last_name = CASE
    WHEN LENGTH(TRIM(COALESCE(full_name, ''))) - LENGTH(REPLACE(TRIM(COALESCE(full_name, '')), ' ', '')) >= 2
    THEN SUBSTRING(TRIM(COALESCE(full_name, '')) FROM LENGTH(TRIM(COALESCE(full_name, ''))) - POSITION(' ' IN REVERSE(TRIM(COALESCE(full_name, '')))) + 2)
    ELSE SPLIT_PART(COALESCE(full_name, ''), ' ', 2)
  END;

-- 2. LECTURERS
ALTER TABLE lecturers ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE lecturers ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE lecturers ADD COLUMN IF NOT EXISTS last_name TEXT;

UPDATE lecturers SET
  first_name = SPLIT_PART(COALESCE(full_name, ''), ' ', 1),
  middle_name = CASE 
    WHEN LENGTH(TRIM(COALESCE(full_name, ''))) - LENGTH(REPLACE(TRIM(COALESCE(full_name, '')), ' ', '')) >= 2 
    THEN SPLIT_PART(SUBSTRING(TRIM(COALESCE(full_name, '')) FROM POSITION(' ' IN TRIM(COALESCE(full_name, ''))) + 1), ' ', 1)
    ELSE NULL 
  END,
  last_name = CASE
    WHEN LENGTH(TRIM(COALESCE(full_name, ''))) - LENGTH(REPLACE(TRIM(COALESCE(full_name, '')), ' ', '')) >= 2
    THEN SUBSTRING(TRIM(COALESCE(full_name, '')) FROM LENGTH(TRIM(COALESCE(full_name, ''))) - POSITION(' ' IN REVERSE(TRIM(COALESCE(full_name, '')))) + 2)
    ELSE SPLIT_PART(COALESCE(full_name, ''), ' ', 2)
  END;

-- 3. GUARDIANS (check if table has name field)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='guardians' AND column_name='full_name') THEN
    ALTER TABLE guardians ADD COLUMN IF NOT EXISTS first_name TEXT;
    ALTER TABLE guardians ADD COLUMN IF NOT EXISTS middle_name TEXT;
    ALTER TABLE guardians ADD COLUMN IF NOT EXISTS last_name TEXT;
    
    UPDATE guardians SET
      first_name = SPLIT_PART(COALESCE(full_name, ''), ' ', 1),
      middle_name = CASE 
        WHEN LENGTH(TRIM(COALESCE(full_name, ''))) - LENGTH(REPLACE(TRIM(COALESCE(full_name, '')), ' ', '')) >= 2 
        THEN SPLIT_PART(SUBSTRING(TRIM(COALESCE(full_name, '')) FROM POSITION(' ' IN TRIM(COALESCE(full_name, ''))) + 1), ' ', 1)
        ELSE NULL 
      END,
      last_name = CASE
        WHEN LENGTH(TRIM(COALESCE(full_name, ''))) - LENGTH(REPLACE(TRIM(COALESCE(full_name, '')), ' ', '')) >= 2
        THEN SUBSTRING(TRIM(COALESCE(full_name, '')) FROM LENGTH(TRIM(COALESCE(full_name, ''))) - POSITION(' ' IN REVERSE(TRIM(COALESCE(full_name, '')))) + 2)
        ELSE SPLIT_PART(COALESCE(full_name, ''), ' ', 2)
      END;
  END IF;
END $$;
