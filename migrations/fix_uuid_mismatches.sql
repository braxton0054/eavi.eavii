-- ============================================================
-- MIGRATION: Fix UUID Mismatches and Database Integrity
-- ============================================================
-- This migration fixes critical issues with ID type mismatches,
-- missing foreign keys, and data type inconsistencies.
-- ============================================================

-- ============================================================
-- 1. FIX LECTURER ASSIGNMENTS TABLES
-- ============================================================

-- Drop existing foreign key constraints if they exist
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lecturer_assignments_course_id_fkey'
    ) THEN
        ALTER TABLE lecturer_assignments DROP CONSTRAINT lecturer_assignments_course_id_fkey;
    END IF;
END $$;

-- Convert course_id from text to uuid in lecturer_assignments
ALTER TABLE lecturer_assignments 
  ALTER COLUMN course_id TYPE uuid USING course_id::uuid;

-- Add proper foreign key constraint
ALTER TABLE lecturer_assignments 
  ADD CONSTRAINT lecturer_assignments_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Do the same for lecturer_assignment_units
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'lecturer_assignment_units_course_id_fkey'
    ) THEN
        ALTER TABLE lecturer_assignment_units DROP CONSTRAINT lecturer_assignment_units_course_id_fkey;
    END IF;
END $$;

ALTER TABLE lecturer_assignment_units 
  ALTER COLUMN course_id TYPE uuid USING course_id::uuid;

ALTER TABLE lecturer_assignment_units 
  ADD CONSTRAINT lecturer_assignment_units_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- ============================================================
-- 2. FIX APPLICATIONS TABLE
-- ============================================================

-- Drop existing foreign key if exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'applications_course_id_fkey'
    ) THEN
        ALTER TABLE applications DROP CONSTRAINT applications_course_id_fkey;
    END IF;
END $$;

-- Convert course_id from text to uuid
ALTER TABLE applications 
  ALTER COLUMN course_id TYPE uuid USING course_id::uuid;

-- Add foreign key constraint
ALTER TABLE applications 
  ADD CONSTRAINT applications_course_id_fkey 
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT;

-- ============================================================
-- SAFETY CHECK: Verify KCSE grades exist before conversion
-- ============================================================

-- First, check if there are any grades in applications that don't exist in kcse_grades
DO $$
DECLARE
    missing_grades TEXT[];
    missing_count INTEGER;
BEGIN
    -- Find grades in applications that don't exist in kcse_grades
    SELECT ARRAY_AGG(DISTINCT kcse_grade) INTO missing_grades
    FROM applications
    WHERE kcse_grade IS NOT NULL
      AND kcse_grade NOT IN (SELECT grade FROM kcse_grades WHERE grade IS NOT NULL);
    
    -- Get count
    SELECT COUNT(DISTINCT kcse_grade) INTO missing_count
    FROM applications
    WHERE kcse_grade IS NOT NULL
      AND kcse_grade NOT IN (SELECT grade FROM kcse_grades WHERE grade IS NOT NULL);
    
    -- If there are missing grades, insert them into kcse_grades first
    IF missing_count > 0 THEN
        RAISE NOTICE 'Found % missing KCSE grades in kcse_grades table. Adding them now...', missing_count;
        RAISE NOTICE 'Missing grades: %', missing_grades;
        
        -- Insert missing grades
        INSERT INTO kcse_grades (grade)
        SELECT DISTINCT kcse_grade
        FROM applications
        WHERE kcse_grade IS NOT NULL
          AND kcse_grade NOT IN (SELECT grade FROM kcse_grades WHERE grade IS NOT NULL)
        ON CONFLICT (grade) DO NOTHING;
    ELSE
        RAISE NOTICE 'All KCSE grades in applications table exist in kcse_grades table. Safe to proceed.';
    END IF;
END $$;

-- Now convert kcse_grade from text to uuid
ALTER TABLE applications 
  ALTER COLUMN kcse_grade TYPE uuid USING (
    (SELECT id FROM kcse_grades WHERE grade = applications.kcse_grade LIMIT 1)
  );

-- Add foreign key for kcse_grade
ALTER TABLE applications 
  ADD CONSTRAINT applications_kcse_grade_fkey 
  FOREIGN KEY (kcse_grade) REFERENCES kcse_grades(id) ON DELETE RESTRICT;

-- ============================================================
-- 3. HANDLE COURSE_TYPE_ID IN APPLICATIONS
-- ============================================================

-- Option A: Remove the column if it's redundant (recommended)
-- Since courses table already has exam_body, course_type_id may be redundant
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'course_type_id'
    ) THEN
        -- First drop any foreign key
        IF EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'applications_course_type_id_fkey'
        ) THEN
            ALTER TABLE applications DROP CONSTRAINT applications_course_type_id_fkey;
        END IF;
        
        -- Then drop the column
        ALTER TABLE applications DROP COLUMN course_type_id;
    END IF;
END $$;

-- Option B: If you want to keep it, uncomment below to create a course_types table
-- CREATE TABLE IF NOT EXISTS course_types (
--     id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     name TEXT NOT NULL UNIQUE
-- );
-- 
-- INSERT INTO course_types (name) VALUES 
--     ('Modular'),
--     ('Short Course'),
--     ('Regular')
-- ON CONFLICT (name) DO NOTHING;
-- 
-- ALTER TABLE applications 
--   ALTER COLUMN course_type_id TYPE uuid USING course_type_id::uuid;
-- 
-- ALTER TABLE applications 
--   ADD CONSTRAINT applications_course_type_id_fkey 
--   FOREIGN KEY (course_type_id) REFERENCES course_types(id);

-- ============================================================
-- 4. FIX BRIDGE GROUPS MILESTONE COLUMNS
-- ============================================================

-- Make milestone_module and milestone_semester nullable
-- This allows short courses without modules to work properly
ALTER TABLE bridge_groups 
  ALTER COLUMN milestone_module DROP NOT NULL,
  ALTER COLUMN milestone_module SET DEFAULT NULL;

ALTER TABLE bridge_groups 
  ALTER COLUMN milestone_semester DROP NOT NULL,
  ALTER COLUMN milestone_semester SET DEFAULT NULL;

-- ============================================================
-- 5. STANDARDIZE FEE COLUMNS TO NUMERIC(10,2)
-- ============================================================

-- Standardize courses table fee columns (fee_per_semester)
DO $$ 
BEGIN
    -- Check if column exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'courses' AND column_name = 'fee_per_semester'
    ) THEN
        ALTER TABLE courses 
          ALTER COLUMN fee_per_semester TYPE numeric(10,2) USING fee_per_semester::numeric(10,2);
    END IF;
END $$;

-- Standardize short_courses table fee columns (first_installment, subsequent_installment)
DO $$ 
BEGIN
    -- Check and update first_installment
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'short_courses' AND column_name = 'first_installment'
    ) THEN
        ALTER TABLE short_courses 
          ALTER COLUMN first_installment TYPE numeric(10,2) USING first_installment::numeric(10,2);
    END IF;
    
    -- Check and update subsequent_installment
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'short_courses' AND column_name = 'subsequent_installment'
    ) THEN
        ALTER TABLE short_courses 
          ALTER COLUMN subsequent_installment TYPE numeric(10,2) USING subsequent_installment::numeric(10,2);
    END IF;
END $$;

-- Standardize fee_payments table (amount)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'fee_payments' AND column_name = 'amount'
    ) THEN
        ALTER TABLE fee_payments 
          ALTER COLUMN amount TYPE numeric(10,2) USING amount::numeric(10,2);
    END IF;
END $$;

-- Standardize any other fee-related columns in relevant tables
-- Add more as needed for your specific schema

-- ============================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================

-- Index on applications.course_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_applications_course_id ON applications(course_id);

-- Index on applications.kcse_grade for filtering
CREATE INDEX IF NOT EXISTS idx_applications_kcse_grade ON applications(kcse_grade);

-- Index on lecturer_assignments.course_id
CREATE INDEX IF NOT EXISTS idx_lecturer_assignments_course_id ON lecturer_assignments(course_id);

-- Index on lecturer_assignment_units.course_id
CREATE INDEX IF NOT EXISTS idx_lecturer_assignment_units_course_id ON lecturer_assignment_units(course_id);

-- ============================================================
-- 7. VERIFICATION QUERIES
-- ============================================================

-- Verify foreign keys are in place
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('applications', 'lecturer_assignments', 'lecturer_assignment_units')
ORDER BY tc.table_name, tc.constraint_name;

-- Verify data types
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_name IN ('applications', 'lecturer_assignments', 'lecturer_assignment_units', 'bridge_groups')
  AND column_name IN ('course_id', 'kcse_grade', 'milestone_module', 'milestone_semester')
ORDER BY table_name, column_name;
