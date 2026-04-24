-- ============================================================================
-- CDACC COURSES DATA
-- Complete course structure with modules and units
-- ============================================================================

-- Insert Departments
INSERT INTO departments (name) VALUES 
  ('Engineering'),
  ('Health'),
  ('Business & Administration')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- AUTOMOTIVE ENGINEERING
-- ============================================================================

-- 1. Automotive Engineering Level 5 (Certificate) - 454A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-454A-AUTO-CERT', 'Automotive Engineering Level 5 (Certificate)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-454A-AUTO-CERT', 'certificate', true, 'D', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 5000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 2. Automotive Technician Level 6 (Diploma) - 554A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-AUTO-DIP', 'Automotive Technician Level 6 (Diploma)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-554A-AUTO-DIP', 'diploma', true, 'C-', 'module', 36, 'monthly', 7000, 36, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 6000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- PLUMBING
-- ============================================================================

-- 3. Plumbing Level 3 (Grade Test) - 254A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254A-PLUMB-GRADE', 'Plumbing Level 3 (Grade Test)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-254A-PLUMB-GRADE', 'artisan', true, 'E', 'module', 6, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 4. Plumbing Level 4 (Artisan) - 254A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254A-PLUMB-ARTISAN', 'Plumbing Level 4 (Artisan)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-254A-PLUMB-ARTISAN', 'artisan', true, 'D-', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 5. Plumbing Level 5 (Certificate) - 254A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254A-PLUMB-CERT', 'Plumbing Level 5 (Certificate)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-254A-PLUMB-CERT', 'certificate', true, 'D', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- OFFICE ADMINISTRATION
-- ============================================================================

-- 6. Office Assistance Level 4 (Artisan) - 554A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-OFFICE-ARTISAN', 'Office Assistance Level 4 (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Administration' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-554A-OFFICE-ARTISAN', 'artisan', true, 'D-', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 7. Office Administration Level 5 (Certificate) - 554A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-OFFICE-CERT', 'Office Administration Level 5 (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Administration' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-554A-OFFICE-CERT', 'certificate', true, 'D', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 8. Office Administration Level 6 (Diploma) - 554A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-OFFICE-DIP', 'Office Administration Level 6 (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Administration' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-554A-OFFICE-DIP', 'diploma', true, 'C-', 'module', 36, 'monthly', 7000, 36, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 9. Public Administration Level 6 (Diploma) - 554A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-PUBLIC-DIP', 'Public Administration Level 6 (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Administration' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-554A-PUBLIC-DIP', 'diploma', true, 'C-', 'module', 36, 'monthly', 7000, 36, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- COMMUNITY HEALTH
-- ============================================================================

-- 10. Community Health Level 5 (Certificate) - 454A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-454A-HEALTH-CERT', 'Community Health Level 5 (Certificate)', (SELECT id FROM departments WHERE name = 'Health' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-454A-HEALTH-CERT', 'certificate', true, 'D', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 11. Community Health Level 6 (Diploma) - 554A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-HEALTH-DIP', 'Community Health Level 6 (Diploma)', (SELECT id FROM departments WHERE name = 'Health' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-554A-HEALTH-DIP', 'diploma', true, 'C-', 'module', 36, 'monthly', 7000, 36, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 5000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- ELECTRICAL INSTALLATION/ENGINEERING
-- ============================================================================

-- 12. Electrical Installation/Engineering Level 4 (Artisan) - 354A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-354A-ELEC-ARTISAN', 'Electrical Installation/Engineering Level 4 (Artisan)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-354A-ELEC-ARTISAN', 'artisan', true, 'D-', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 13. Electrical Installation/Engineering Level 5 (Certificate) - 354A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-354A-ELEC-CERT', 'Electrical Installation/Engineering Level 5 (Certificate)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-354A-ELEC-CERT', 'certificate', true, 'D', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 5000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 14. Electrical Installation/Engineering Level 6 (Diploma) - 354A
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-354A-ELEC-DIP', 'Electrical Installation/Engineering Level 6 (Diploma)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-354A-ELEC-DIP', 'diploma', true, 'C-', 'module', 36, 'monthly', 7000, 36, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 6000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- ELECTRONICS TECHNOLOGY
-- ============================================================================

-- 15. Electronics Technology Level 3 (Grade Test) - 254B
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254B-ELEC-GRADE', 'Electronics Technology Level 3 (Grade Test)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-254B-ELEC-GRADE', 'artisan', true, 'E', 'module', 6, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 16. Electronics Technology Level 4 (Artisan) - 254B
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254B-ELEC-ARTISAN', 'Electronics Technology Level 4 (Artisan)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-254B-ELEC-ARTISAN', 'artisan', true, 'D-', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 17. Electronics Technology Level 5 (Certificate) - 254B
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254B-ELEC-CERT', 'Electronics Technology Level 5 (Certificate)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-254B-ELEC-CERT', 'certificate', true, 'D', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 18. Electronics Technology Level 6 (Diploma) - 254B
INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254B-ELEC-DIP', 'Electronics Technology Level 6 (Diploma)', (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CDACC-254B-ELEC-DIP', 'diploma', true, 'C-', 'module', 36, 'monthly', 7000, 36, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 5000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- NOTE: This file adds the basic course structure for CDACC courses.
-- Units can be added through the admin interface for better management.
-- The course data includes 18 CDACC courses with proper codes and exam body.
-- Exam body will be set to 'CDACC' when courses are configured in the system.
-- ============================================================================
