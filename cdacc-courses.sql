-- ============================================================================
-- CDACC COURSES DATA
-- Complete course structure with basic course information
-- Fee structure for module-based courses to be configured in admin via semesters
-- ============================================================================

-- Insert Departments
INSERT INTO departments (name) VALUES 
  ('Engineering & Technology'),
  ('Building & Construction'),
  ('Business & Administration'),
  ('Health & Medical')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- AUTOMOTIVE ENGINEERING COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-454A-AE', 'Automotive Engineering', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-454A-AE', 'certificate', true, 'D+', 'module', 24)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-AT', 'Automotive Technician', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-554A-AT', 'diploma', true, 'C-', 'module', 36)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- PLUMBING COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254A-P3', 'Plumbing (Grade Test)', (SELECT id FROM departments WHERE name = 'Building & Construction' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-254A-P3', 'artisan', true, 'KCPE', 'module', 6)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254A-P4', 'Plumbing (Artisan)', (SELECT id FROM departments WHERE name = 'Building & Construction' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-254A-P4', 'artisan', true, 'D-', 'module', 12)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254A-P5', 'Plumbing (Certificate)', (SELECT id FROM departments WHERE name = 'Building & Construction' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-254A-P5', 'certificate', true, 'D+', 'module', 24)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- OFFICE ADMINISTRATION COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-OA4', 'Office Assistance (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Administration' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-554A-OA4', 'artisan', true, 'D-', 'module', 12)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-OA5', 'Office Administration (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Administration' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-554A-OA5', 'certificate', true, 'D+', 'module', 24)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-OA6', 'Office Administration (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Administration' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-554A-OA6', 'diploma', true, 'C-', 'module', 36)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- PUBLIC ADMINISTRATION COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-PA', 'Public Administration', (SELECT id FROM departments WHERE name = 'Business & Administration' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-554A-PA', 'diploma', true, 'C-', 'module', 36)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- COMMUNITY HEALTH COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-454A-CH5', 'Community Health (Certificate)', (SELECT id FROM departments WHERE name = 'Health & Medical' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-454A-CH5', 'certificate', true, 'D+', 'module', 24)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-554A-CH6', 'Community Health (Diploma)', (SELECT id FROM departments WHERE name = 'Health & Medical' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-554A-CH6', 'diploma', true, 'C-', 'module', 36)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- ELECTRICAL INSTALLATION/ENGINEERING COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-354A-EI4', 'Electrical Installation/Engineering (Artisan)', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-354A-EI4', 'artisan', true, 'D-', 'module', 12)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-354A-EI5', 'Electrical Installation/Engineering (Certificate)', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-354A-EI5', 'certificate', true, 'D+', 'module', 24)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-354A-EI6', 'Electrical Installation/Engineering (Diploma)', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-354A-EI6', 'diploma', true, 'C-', 'module', 36)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- ELECTRONICS TECHNOLOGY COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254B-ET3', 'Electronics Technology (Grade Test)', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-254B-ET3', 'artisan', true, 'KCPE', 'module', 6)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254B-ET4', 'Electronics Technology (Artisan)', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-254B-ET4', 'artisan', true, 'D-', 'module', 12)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254B-ET5', 'Electronics Technology (Certificate)', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-254B-ET5', 'certificate', true, 'D+', 'module', 24)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('CDACC-254B-ET6', 'Electronics Technology (Diploma)', (SELECT id FROM departments WHERE name = 'Engineering & Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('CDACC-254B-ET6', 'diploma', true, 'C-', 'module', 36)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- NOTE: This file adds the basic course structure for CDACC courses.
-- Fee structure for module-based courses (study_mode='module') should be configured
-- in the admin interface via the semesters table.
-- Units and modules can be configured in the admin course management interface.
-- Total: 15 CDACC courses with appropriate levels.
-- Course codes mapped: 254A/254B (Plumbing/Electronics), 354A (Electrical), 454A (Automotive/Community Health), 554A (Automotive/Office/Public/Community)
-- ============================================================================
