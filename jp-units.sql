-- ============================================================================
-- JP INTERNATIONAL UNITS DATA
-- Units for JP International courses
-- ============================================================================

-- ============================================================================
-- ENSURE COURSES EXIST (for foreign key constraint)
-- These course inserts ensure the courses exist before units are added
-- ============================================================================

-- Insert Departments
INSERT INTO departments (name) VALUES 
  ('Education'),
  ('Healthcare'),
  ('Business & Management'),
  ('Technology'),
  ('Creative Arts'),
  ('Social Sciences')
ON CONFLICT (name) DO NOTHING;

-- Teacher Training Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TT', 'Teacher Training', (SELECT id FROM departments WHERE name = 'Education' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-TT', 'diploma', true, 'C-', 'module', 18),
  ('JP-TT', 'certificate', true, 'D', 'module', 9),
  ('JP-TT', 'level4', true, 'D-', 'module', 6),
  ('JP-TT', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Teacher Training - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TT' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Caregivers Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CG', 'Caregivers', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CG', 'diploma', true, 'C-', 'module', 18),
  ('JP-CG', 'certificate', true, 'D', 'module', 9),
  ('JP-CG', 'level4', true, 'D-', 'module', 6),
  ('JP-CG', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Caregivers - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CG' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Community Health Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CH', 'Community Health', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CH', 'diploma', true, 'C-', 'module', 18),
  ('JP-CH', 'certificate', true, 'D', 'module', 9),
  ('JP-CH', 'level4', true, 'D-', 'module', 6),
  ('JP-CH', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Community Health - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CH' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Phlebotomy Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PH', 'Phlebotomy', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-PH', 'diploma', true, 'C-', 'module', 18),
  ('JP-PH', 'certificate', true, 'D', 'module', 9),
  ('JP-PH', 'level4', true, 'D-', 'module', 6),
  ('JP-PH', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Phlebotomy - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PH' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Journalism & Mass Communication Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-JM', 'Journalism & Mass Communication', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-JM', 'diploma', true, 'C-', 'module', 18),
  ('JP-JM', 'certificate', true, 'D', 'module', 9),
  ('JP-JM', 'level4', true, 'D-', 'module', 6),
  ('JP-JM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Journalism & Mass Communication - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-JM' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Web Development Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-WD', 'Web Development', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-WD', 'diploma', true, 'C-', 'module', 18),
  ('JP-WD', 'certificate', true, 'D', 'module', 9),
  ('JP-WD', 'level4', true, 'D-', 'module', 6),
  ('JP-WD', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Web Development - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-WD' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Mobile Technology Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-MT', 'Mobile Technology', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-MT', 'diploma', true, 'C-', 'module', 18),
  ('JP-MT', 'certificate', true, 'D', 'module', 9),
  ('JP-MT', 'level4', true, 'D-', 'module', 6),
  ('JP-MT', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Mobile Technology - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-MT' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Community Development Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CD', 'Community Development', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CD', 'diploma', true, 'C-', 'module', 18),
  ('JP-CD', 'certificate', true, 'D', 'module', 9),
  ('JP-CD', 'level4', true, 'D-', 'module', 6),
  ('JP-CD', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Community Development - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CD' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Purchasing & Supplies Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PS', 'Purchasing & Supplies', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-PS', 'diploma', true, 'C-', 'module', 18),
  ('JP-PS', 'certificate', true, 'D', 'module', 9),
  ('JP-PS', 'level4', true, 'D-', 'module', 6),
  ('JP-PS', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Purchasing & Supplies - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PS' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Sociology Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-SO', 'Sociology', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-SO', 'diploma', true, 'C-', 'module', 18),
  ('JP-SO', 'certificate', true, 'D', 'module', 9),
  ('JP-SO', 'level4', true, 'D-', 'module', 6),
  ('JP-SO', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Sociology - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SO' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Travel & Tourism Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TR', 'Travel & Tourism', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-TR', 'diploma', true, 'C-', 'module', 18),
  ('JP-TR', 'certificate', true, 'D', 'module', 9),
  ('JP-TR', 'level4', true, 'D-', 'module', 6),
  ('JP-TR', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Travel & Tourism - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-TR' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Sales & Marketing Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-SM', 'Sales & Marketing', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-SM', 'diploma', true, 'C-', 'module', 18),
  ('JP-SM', 'certificate', true, 'D', 'module', 9),
  ('JP-SM', 'level4', true, 'D-', 'module', 6),
  ('JP-SM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Sales & Marketing - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-SM' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- International Relations Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-IR', 'International Relations', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-IR', 'diploma', true, 'C-', 'module', 18),
  ('JP-IR', 'certificate', true, 'D', 'module', 9),
  ('JP-IR', 'level4', true, 'D-', 'module', 6),
  ('JP-IR', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- International Relations - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-IR' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- English Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-EN', 'English', (SELECT id FROM departments WHERE name = 'Education' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-EN', 'diploma', true, 'C-', 'module', 18),
  ('JP-EN', 'certificate', true, 'D', 'module', 9),
  ('JP-EN', 'level4', true, 'D-', 'module', 6),
  ('JP-EN', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- English - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-EN' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Disaster Management Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-DM', 'Disaster Management', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-DM', 'diploma', true, 'C-', 'module', 18),
  ('JP-DM', 'certificate', true, 'D', 'module', 9),
  ('JP-DM', 'level4', true, 'D-', 'module', 6),
  ('JP-DM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Disaster Management - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-DM' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Forensic Criminology Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-FC', 'Forensic Criminology', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-FC', 'diploma', true, 'C-', 'module', 18),
  ('JP-FC', 'certificate', true, 'D', 'module', 9),
  ('JP-FC', 'level4', true, 'D-', 'module', 6),
  ('JP-FC', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Forensic Criminology - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FC' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- CCTV Management Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CM', 'CCTV Management', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CM', 'diploma', true, 'C-', 'module', 18),
  ('JP-CM', 'certificate', true, 'D', 'module', 9),
  ('JP-CM', 'level4', true, 'D-', 'module', 6),
  ('JP-CM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- CCTV Management - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CM' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Project Management Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PM', 'Project Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-PM', 'diploma', true, 'C-', 'module', 18),
  ('JP-PM', 'certificate', true, 'D', 'module', 9),
  ('JP-PM', 'level4', true, 'D-', 'module', 6),
  ('JP-PM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Project Management - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-PM' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Clearing & Forwarding Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CF', 'Clearing & Forwarding', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CF', 'diploma', true, 'C-', 'module', 18),
  ('JP-CF', 'certificate', true, 'D', 'module', 9),
  ('JP-CF', 'level4', true, 'D-', 'module', 6),
  ('JP-CF', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Clearing & Forwarding - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-CF' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Hair & Beauty Therapy Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-HB', 'Hair & Beauty Therapy', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-HB', 'diploma', true, 'C-', 'module', 18),
  ('JP-HB', 'certificate', true, 'D', 'module', 9),
  ('JP-HB', 'level4', true, 'D-', 'module', 6),
  ('JP-HB', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Hair & Beauty Therapy - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-HB' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Fashion Design Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-FD', 'Fashion Design', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-FD', 'diploma', true, 'C-', 'module', 18),
  ('JP-FD', 'certificate', true, 'D', 'module', 9),
  ('JP-FD', 'level4', true, 'D-', 'module', 6),
  ('JP-FD', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Fashion Design - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-FD' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Graphic Design Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-GD', 'Graphic Design', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-GD', 'diploma', true, 'C-', 'module', 18),
  ('JP-GD', 'certificate', true, 'D', 'module', 9),
  ('JP-GD', 'level4', true, 'D-', 'module', 6),
  ('JP-GD', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Graphic Design - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-GD' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;

-- Barista Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-BC', 'Barista Course', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-BC', 'diploma', true, 'C-', 'module', 18),
  ('JP-BC', 'certificate', true, 'D', 'module', 9),
  ('JP-BC', 'level4', true, 'D-', 'module', 6),
  ('JP-BC', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- Barista Course - Modules and Semesters
INSERT INTO modules (course_type_id, module_index, exam_body) VALUES
  ((SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1), 3, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'certificate' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'certificate' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'level4' LIMIT 1), 1, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'level4' LIMIT 1), 2, 'JP'),
  ((SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'artisan' LIMIT 1), 1, 'JP')
ON CONFLICT (course_type_id, module_index) DO NOTHING;

INSERT INTO semesters (module_id, semester_index, duration_months, fee, practical_fee, internal_exams) VALUES
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1) AND module_index = 2 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'diploma' LIMIT 1) AND module_index = 3 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'certificate' LIMIT 1) AND module_index = 1 LIMIT 1), 2, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'certificate' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'level4' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'level4' LIMIT 1) AND module_index = 2 LIMIT 1), 1, 3, 0, 0, 2),
  ((SELECT id FROM modules WHERE course_type_id = (SELECT id FROM course_types WHERE course_id = 'JP-BC' AND level = 'artisan' LIMIT 1) AND module_index = 1 LIMIT 1), 1, 3, 0, 0, 2)
ON CONFLICT DO NOTHING;
