-- ============================================================================
-- SCHEMA MIGRATION V2: Class-Based System
-- ============================================================================

-- 1. CREATE classes table (if not exists)
CREATE TABLE IF NOT EXISTS public.classes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    class_name text NOT NULL,
    course_id text NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    campus text NOT NULL CHECK (campus IN ('main', 'west')),
    semester integer NOT NULL CHECK (semester >= 1 AND semester <= 6),
    module_index integer NOT NULL DEFAULT 1,
    intake text, -- raw value e.g. "KNEC-0801 - Artisan Certificate September 2026"
    intake_month text, -- clean value e.g. "September"
    academic_calendar_id uuid REFERENCES academic_calendar(id),
    stream_type text DEFAULT 'main' CHECK (stream_type IN ('main', 'bridge')),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Unique constraint: course + campus + intake_month + semester + module
    CONSTRAINT unique_class_per_course_campus_intake UNIQUE (course_id, campus, intake_month, semester, module_index)
);

-- Disable RLS on classes (follow existing pattern)
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;

-- 2. CREATE lecturer_assignment_semesters table (if not exists)
CREATE TABLE IF NOT EXISTS public.lecturer_assignment_semesters (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id uuid NOT NULL REFERENCES lecturer_assignments(id) ON DELETE CASCADE,
    academic_calendar_id uuid REFERENCES academic_calendar(id),
    semester integer NOT NULL CHECK (semester >= 1 AND semester <= 6),
    module_index integer NOT NULL DEFAULT 1,
    exam_type_allowed text[] DEFAULT ARRAY['cat', 'end_term', 'mock'],
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE lecturer_assignment_semesters DISABLE ROW LEVEL SECURITY;

-- 3. UPDATE applications table - add class_id column
ALTER TABLE applications ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id);

-- 4. UPDATE lecturer_assignments - add class_id column
ALTER TABLE lecturer_assignments ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id);

-- 5. UPDATE exam_marks - add new columns
ALTER TABLE exam_marks ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES classes(id);
ALTER TABLE exam_marks ADD COLUMN IF NOT EXISTS semester_assignment_id uuid REFERENCES lecturer_assignment_semesters(id);

-- 6. Migrate existing data from applications.class_name to classes
-- First, create classes from existing unique class_name + course_id + campus combinations
INSERT INTO classes (class_name, course_id, campus, semester, module_index, intake_month)
SELECT DISTINCT 
    a.class_name,
    a.course_id,
    CASE 
        WHEN a.campus ILIKE '%west%' THEN 'west'
        ELSE 'main'
    END,
    COALESCE(a.current_semester, 1),
    COALESCE(a.current_module, 1),
    COALESCE(a.intake, 'September')
FROM applications a
WHERE a.class_name IS NOT NULL 
  AND a.class_name != ''
ON CONFLICT (course_id, campus, intake_month, semester, module_index) DO NOTHING;

-- 7. Link applications to classes
UPDATE applications a
SET class_id = c.id
FROM classes c
WHERE a.class_name = c.class_name
  AND a.course_id = c.course_id
  AND (
      (a.campus ILIKE '%west%' AND c.campus = 'west') OR
      (a.campus ILIKE '%main%' AND c.campus = 'main')
  )
  AND a.class_id IS NULL;

-- 8. Link lecturer_assignments to classes
UPDATE lecturer_assignments la
SET class_id = c.id
FROM classes c
WHERE la.course_id = c.course_id
  AND la.campus = c.campus
  AND la.class_id IS NULL;

-- 9. Create function to auto-create class when student enrolls with class_name
CREATE OR REPLACE FUNCTION ensure_class_exists()
RETURNS TRIGGER AS $$
DECLARE
    v_class_id uuid;
    v_campus text;
    v_intake_month text;
BEGIN
    -- Only process if class_name is provided
    IF NEW.class_name IS NULL OR NEW.class_name = '' THEN
        RETURN NEW;
    END IF;
    
    -- Normalize campus
    v_campus := CASE 
        WHEN NEW.campus ILIKE '%west%' THEN 'west'
        ELSE 'main'
    END;
    
    -- Extract intake month from intake or use default
    v_intake_month := COALESCE(NEW.intake, 'September');
    
    -- Try to find existing class
    SELECT id INTO v_class_id
    FROM classes
    WHERE class_name = NEW.class_name
        AND course_id = NEW.course_id
        AND campus = v_campus
        AND semester = COALESCE(NEW.current_semester, 1)
        AND module_index = COALESCE(NEW.current_module, 1);
    
    -- Create class if doesn't exist
    IF v_class_id IS NULL THEN
        INSERT INTO classes (
            class_name, 
            course_id, 
            campus, 
            semester, 
            module_index,
            intake_month
        )
        VALUES (
            NEW.class_name,
            NEW.course_id,
            v_campus,
            COALESCE(NEW.current_semester, 1),
            COALESCE(NEW.current_module, 1),
            v_intake_month
        )
        ON CONFLICT (course_id, campus, intake_month, semester, module_index) 
        DO UPDATE SET class_name = EXCLUDED.class_name
        RETURNING id INTO v_class_id;
    END IF;
    
    -- Link application to class
    NEW.class_id := v_class_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to auto-link applications to classes
DROP TRIGGER IF EXISTS link_application_to_class ON applications;
CREATE TRIGGER link_application_to_class
    BEFORE INSERT OR UPDATE OF class_name ON applications
    FOR EACH ROW
    EXECUTE FUNCTION ensure_class_exists();

-- 11. Create view for lecturer dashboard
CREATE OR REPLACE VIEW lecturer_class_view AS
SELECT 
    la.id AS assignment_id,
    la.lecturer_id,
    c.id AS class_id,
    c.class_name,
    c.intake_month AS intake,
    cr.name AS course_name,
    c.campus,
    c.semester,
    c.module_index,
    las.id AS semester_assignment_id,
    las.exam_type_allowed,
    las.is_active AS term_active,
    ac.term_name,
    ac.cat_opening_date,
    ac.cat_closing_date,
    ac.end_term_exam_date,
    COUNT(a.id) AS total_students
FROM lecturer_assignments la
JOIN classes c ON c.id = la.class_id
JOIN courses cr ON cr.id = c.course_id
LEFT JOIN lecturer_assignment_semesters las ON las.assignment_id = la.id
LEFT JOIN academic_calendar ac ON ac.id = las.academic_calendar_id
LEFT JOIN applications a ON a.class_id = c.id
    AND a.status = 'enrolled'
    AND a.financial_hold = false
GROUP BY la.id, la.lecturer_id, c.id, c.class_name, c.intake_month, cr.name,
    c.campus, c.semester, c.module_index, las.id,
    las.exam_type_allowed, las.is_active, ac.term_name,
    ac.cat_opening_date, ac.cat_closing_date, ac.end_term_exam_date;

-- 12. Verify the setup
SELECT 'Migration complete' as status,
    (SELECT COUNT(*) FROM classes) as total_classes,
    (SELECT COUNT(*) FROM applications WHERE class_id IS NOT NULL) as apps_linked,
    (SELECT COUNT(*) FROM lecturer_assignments WHERE class_id IS NOT NULL) as assignments_linked;
