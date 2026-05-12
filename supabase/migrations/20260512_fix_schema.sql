-- ============================================================
-- EAVI Schema Fixes — 2026-05-12
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add `id` column to `units` table (needed for FK joins from exam_marks)
ALTER TABLE units ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() NOT NULL;
UPDATE units SET id = gen_random_uuid() WHERE id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_id ON units(id);

-- 2. Add `unit_id` FK column to `exam_marks`
ALTER TABLE exam_marks ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
UPDATE exam_marks e SET unit_id = u.id FROM units u 
WHERE e.unit_code = u.unit_code AND e.course_id = u.course_id;
CREATE INDEX IF NOT EXISTS idx_exam_marks_unit_id ON exam_marks(unit_id);

-- 3. Add missing `total_fee_due` and `fee_paid` computed columns on applications
-- (for the reports page that queries them)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS total_fee_due NUMERIC DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS fee_paid NUMERIC DEFAULT 0;

-- Update computed values from fee_payments and fee structure
UPDATE applications a SET 
  total_fee_due = COALESCE((
    SELECT SUM(s.fee + COALESCE(s.practical_fee, 0))
    FROM modules m
    JOIN semesters s ON s.module_id = m.id
    WHERE m.course_type_id = a.course_type_id
  ), 0),
  fee_paid = COALESCE((
    SELECT SUM(fp.amount)
    FROM fee_payments fp
    WHERE fp.application_id = a.id AND fp.status = 'completed'
  ), 0);

-- 4. Fix v_students_per_course view to include campus
CREATE OR REPLACE VIEW v_students_per_course AS
SELECT 
  c.id AS course_id,
  c.name AS course_name,
  c.exam_body,
  d.name AS department,
  ct.id AS course_type_id,
  ct.level AS course_level,
  ct.study_mode,
  a.campus,
  a.intake,
  COUNT(*) FILTER (WHERE a.status IS NOT NULL) AS total_students,
  COUNT(*) FILTER (WHERE a.status = 'enrolled') AS enrolled_students,
  COUNT(*) FILTER (WHERE a.status = 'pending') AS pending_students,
  COUNT(*) FILTER (WHERE a.status = 'rejected') AS rejected_students
FROM courses c
JOIN departments d ON d.id = c.department_id
JOIN course_types ct ON ct.course_id = c.id
LEFT JOIN applications a ON a.course_id = c.id AND a.course_type_id = ct.id
GROUP BY c.id, c.name, c.exam_body, d.name, ct.id, ct.level, ct.study_mode, a.campus, a.intake;

-- 5. Fix infinite recursion in ai_user_registry RLS policy
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON ai_user_registry;
CREATE POLICY "Enable read access for authenticated users" ON ai_user_registry
  FOR SELECT USING (auth.role() = 'authenticated');

-- 6. Add unit_id FK to lecturer_unit_assignments
ALTER TABLE lecturer_unit_assignments ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES units(id);
UPDATE lecturer_unit_assignments l SET unit_id = u.id FROM units u 
WHERE l.unit_code = u.unit_code AND l.course_id = u.course_id;
CREATE INDEX IF NOT EXISTS idx_lua_unit_id ON lecturer_unit_assignments(unit_id);
