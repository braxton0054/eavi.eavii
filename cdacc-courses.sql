-- ============================================================
-- 1. CLEANUP & SCHEMA STABILIZATION
-- ============================================================
DROP VIEW IF EXISTS v_cdacc_prospectus;

-- Ensure columns exist for CBET (Competency Based Education & Training)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS exam_body TEXT DEFAULT 'KNEC';
ALTER TABLE module_subjects ADD COLUMN IF NOT EXISTS unit_type TEXT; -- Basic, Common, or Core

-- ============================================================
-- 2. CORE CDACC LOOKUP DATA
-- ============================================================
INSERT INTO kcse_grades (grade) VALUES ('D'), ('D-'), ('E') ON CONFLICT (grade) DO NOTHING;

INSERT INTO qualification_levels (name) VALUES 
  ('Level 3 (CDACC Certificate)'),
  ('Level 4 (CDACC Certificate)'),
  ('Level 5 (CDACC Diploma)'),
  ('Level 6 (CDACC Higher Diploma)')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 3. CDACC DATA ENTRY TEMPLATE
-- ============================================================
DO $$
DECLARE
    -- Variable definitions for easy data entry
    _dept_code    TEXT := 'ICT';
    _level_name   TEXT := 'Level 5 (CDACC Diploma)';
    _entry_grade  TEXT := 'D-';
    _course_name  TEXT := 'ICT Technician Level 5';
    _course_code  TEXT := 'CDACC-ICT-L5'; 
    _semester_fee DECIMAL := 15500.00;

    v_course_id   UUID;
    v_mod_id      UUID;
BEGIN
    -- 1. Create the Course Container
    INSERT INTO courses (name, knec_code, department_id, qualification_level_id, min_kcse_grade_id, exam_body, fee_per_semester)
    VALUES (
        _course_name, _course_code, 
        (SELECT id FROM departments WHERE code = _dept_code),
        (SELECT id FROM qualification_levels WHERE name = _level_name),
        (SELECT id FROM kcse_grades WHERE grade = _entry_grade),
        'CDACC', _semester_fee
    ) 
    ON CONFLICT (knec_code) DO UPDATE SET min_kcse_grade_id = EXCLUDED.min_kcse_grade_id
    RETURNING id INTO v_course_id;

    -- 2. ADD MODULE I (e.g., Computer Systems)
    INSERT INTO course_modules (course_id, module_number, label, duration_months, num_semesters)
    VALUES (v_course_id, 1, 'Module I: Computer Systems & Support', 6, 2)
    RETURNING id INTO v_mod_id;

    -- 3. ADD UNITS TO MODULE I
    INSERT INTO subjects (name) VALUES 
        ('Occupational Safety and Health'), 
        ('Digital Literacy'), 
        ('Computer Hardware Maintenance') 
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO module_subjects (module_id, subject_id, semester_number, unit_type)
    VALUES 
        (v_mod_id, (SELECT id FROM subjects WHERE name = 'Occupational Safety and Health'), 1, 'Basic'),
        (v_mod_id, (SELECT id FROM subjects WHERE name = 'Digital Literacy'), 1, 'Basic'),
        (v_mod_id, (SELECT id FROM subjects WHERE name = 'Computer Hardware Maintenance'), 1, 'Core');

    -- 4. ADD MODULE II (e.g., Networking)
    INSERT INTO course_modules (course_id, module_number, label, duration_months, num_semesters)
    VALUES (v_course_id, 2, 'Module II: Network & Software Dev', 6, 2)
    RETURNING id INTO v_mod_id;

    -- 5. ADD UNITS TO MODULE II
    INSERT INTO subjects (name) VALUES ('Computer Networking'), ('Database Management') ON CONFLICT DO NOTHING;

    INSERT INTO module_subjects (module_id, subject_id, semester_number, unit_type)
    VALUES 
        (v_mod_id, (SELECT id FROM subjects WHERE name = 'Computer Networking'), 2, 'Core'),
        (v_mod_id, (SELECT id FROM subjects WHERE name = 'Database Management'), 2, 'Core');

END $$;

-- ============================================================
-- 4. FINAL CDACC PROSPECTUS VIEW
-- ============================================================
CREATE VIEW v_cdacc_prospectus AS
SELECT
    c.exam_body,
    d.name AS department,
    c.name AS course_name,
    ql.name AS cdacc_level,
    kg.grade AS min_entry_grade,
    cm.label AS module_name,
    s.name AS unit_of_competency,
    ms.unit_type, -- Shows Basic, Common, or Core
    ms.semester_number,
    c.fee_per_semester
FROM courses c
JOIN departments d ON d.id = c.department_id
JOIN qualification_levels ql ON ql.id = c.qualification_level_id
LEFT JOIN kcse_grades kg ON kg.id = c.min_kcse_grade_id
JOIN course_modules cm ON cm.course_id = c.id
JOIN module_subjects ms ON ms.module_id = cm.id
JOIN subjects s ON s.id = ms.subject_id
WHERE c.exam_body = 'CDACC'
ORDER BY cdacc_level, cm.module_number, ms.semester_number;