-- ============================================================
-- 1. CLEANUP & VIEW RESET
-- ============================================================
DROP VIEW IF EXISTS v_jp_course_details;

-- ============================================================
-- 2. SCHEMA STABILIZATION
-- ============================================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS exam_body TEXT DEFAULT 'KNEC';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS fee_per_semester DECIMAL(10, 2) DEFAULT 0.00;

-- ============================================================
-- 3. CORE LOOKUP DATA (Run these once to prepare your system)
-- ============================================================
INSERT INTO qualification_levels (name) VALUES
  ('Level 3 (Foundation)'), ('Level 4 (Intermediate)'),
  ('Level 5 (Advanced)'), ('Level 6 (Graduate)')
ON CONFLICT (name) DO NOTHING;

INSERT INTO kcse_grades (grade) VALUES ('D'), ('D-'), ('E') 
ON CONFLICT (grade) DO NOTHING;

-- ============================================================
-- 4. CLEAN DATA ENTRY TEMPLATE (JP-IE)
-- ============================================================
DO $$
DECLARE
    -- Change these variables for each new course you add
    _dept_code    TEXT := 'ICT'; 
    _level_name   TEXT := 'Level 4 (Intermediate)';
    _entry_grade  TEXT := 'D';
    _course_name  TEXT := 'JP Level 4 Diploma in ICT';
    _course_code  TEXT := 'JP-ICT-L4'; -- Official JP Course ID
    _semester_fee DECIMAL := 15000.00;

    v_course_id   UUID;
    v_stage_id    UUID;
BEGIN
    -- 1. Create/Find the Course
    INSERT INTO courses (name, knec_code, department_id, qualification_level_id, min_kcse_grade_id, exam_body, fee_per_semester)
    VALUES (
        _course_name, _course_code, 
        (SELECT id FROM departments WHERE code = _dept_code),
        (SELECT id FROM qualification_levels WHERE name = _level_name),
        (SELECT id FROM kcse_grades WHERE grade = _entry_grade),
        'JP-IE', _semester_fee
    ) 
    ON CONFLICT (knec_code) DO UPDATE SET fee_per_semester = EXCLUDED.fee_per_semester
    RETURNING id INTO v_course_id;

    -- 2. ADD STAGE 1 (Module 1)
    INSERT INTO course_modules (course_id, module_number, label, duration_months, num_semesters)
    VALUES (v_course_id, 1, 'Stage 1', 6, 2)
    RETURNING id INTO v_stage_id;

    -- 3. ADD UNITS TO STAGE 1
    -- Repeat this block for every unit in this stage
    INSERT INTO subjects (name) VALUES ('Unit Name 1'), ('Unit Name 2') ON CONFLICT DO NOTHING;
    
    INSERT INTO module_subjects (module_id, subject_id, semester_number, paper_code, unit_type)
    VALUES 
    (v_stage_id, (SELECT id FROM subjects WHERE name = 'Unit Name 1'), 1, 'CODE001', 'Core'),
    (v_stage_id, (SELECT id FROM subjects WHERE name = 'Unit Name 2'), 1, 'CODE002', 'Core');

    -- 4. ADD STAGE 2 (Module 2)
    -- To add Stage 2, you simply repeat the logic above with a new v_stage_id
END $$;

-- ============================================================
-- 5. THE MASTER VIEW (Joins Department + Stage + Units)
-- ============================================================
CREATE VIEW v_jp_course_details AS
SELECT
    c.exam_body,
    d.name AS department,
    ql.name AS level_name,
    c.name AS course_name,
    kg.grade AS min_entry_grade,
    c.fee_per_semester,
    cm.label AS stage_label, -- This shows 'Stage 1', 'Stage 2', etc.
    s.name AS unit_name,
    mu.paper_code AS unit_code,
    mu.semester_number
FROM courses c
JOIN departments d ON c.department_id = d.id
JOIN qualification_levels ql ON c.qualification_level_id = ql.id
LEFT JOIN kcse_grades kg ON c.min_kcse_grade_id = kg.id
JOIN course_modules cm ON cm.course_id = c.id
JOIN module_subjects mu ON mu.module_id = cm.id
JOIN subjects s ON s.id = mu.subject_id
WHERE c.exam_body = 'JP-IE'
ORDER BY department, level_name, stage_label, mu.semester_number;