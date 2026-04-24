-- ============================================================================
-- JP INTERNATIONAL COURSES DATA
-- Complete course structure with basic course information
-- Fee structure for module-based courses to be configured in admin via semesters
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

-- ============================================================================
-- TEACHER TRAINING COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TT', 'Teacher Training', (SELECT id FROM departments WHERE name = 'Education' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-TT', 'diploma', true, 'C-', 'module', 18),
  ('JP-TT', 'certificate', true, 'D', 'module', 9),
  ('JP-TT', 'level4', true, 'D-', 'module', 6),
  ('JP-TT', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- CAREGIVERS COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CG', 'Caregivers', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CG', 'diploma', true, 'C-', 'module', 18),
  ('JP-CG', 'certificate', true, 'D', 'module', 9),
  ('JP-CG', 'level4', true, 'D-', 'module', 6),
  ('JP-CG', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- HEALTH & CARE COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CH', 'Community Health', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CH', 'diploma', true, 'C-', 'module', 18),
  ('JP-CH', 'certificate', true, 'D', 'module', 9),
  ('JP-CH', 'level4', true, 'D-', 'module', 6),
  ('JP-CH', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PH', 'Phlebotomy', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-PH', 'diploma', true, 'C-', 'module', 18),
  ('JP-PH', 'certificate', true, 'D', 'module', 9),
  ('JP-PH', 'level4', true, 'D-', 'module', 6),
  ('JP-PH', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- JOURNALISM & MASS COMMUNICATION
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-JM', 'Journalism & Mass Communication', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-JM', 'diploma', true, 'C-', 'module', 18),
  ('JP-JM', 'certificate', true, 'D', 'module', 9),
  ('JP-JM', 'level4', true, 'D-', 'module', 6),
  ('JP-JM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- TECHNOLOGY COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-WD', 'Web Development', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-WD', 'diploma', true, 'C-', 'module', 18),
  ('JP-WD', 'certificate', true, 'D', 'module', 9),
  ('JP-WD', 'level4', true, 'D-', 'module', 6),
  ('JP-WD', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-MT', 'Mobile Technology', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-MT', 'diploma', true, 'C-', 'module', 18),
  ('JP-MT', 'certificate', true, 'D', 'module', 9),
  ('JP-MT', 'level4', true, 'D-', 'module', 6),
  ('JP-MT', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- SOCIAL SCIENCES COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CD', 'Community Development', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CD', 'diploma', true, 'C-', 'module', 18),
  ('JP-CD', 'certificate', true, 'D', 'module', 9),
  ('JP-CD', 'level4', true, 'D-', 'module', 6),
  ('JP-CD', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PS', 'Purchasing & Supplies', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-PS', 'diploma', true, 'C-', 'module', 18),
  ('JP-PS', 'certificate', true, 'D', 'module', 9),
  ('JP-PS', 'level4', true, 'D-', 'module', 6),
  ('JP-PS', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-SO', 'Sociology', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-SO', 'diploma', true, 'C-', 'module', 18),
  ('JP-SO', 'certificate', true, 'D', 'module', 9),
  ('JP-SO', 'level4', true, 'D-', 'module', 6),
  ('JP-SO', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TR', 'Travel & Tourism', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-TR', 'diploma', true, 'C-', 'module', 18),
  ('JP-TR', 'certificate', true, 'D', 'module', 9),
  ('JP-TR', 'level4', true, 'D-', 'module', 6),
  ('JP-TR', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-SM', 'Sales & Marketing', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-SM', 'diploma', true, 'C-', 'module', 18),
  ('JP-SM', 'certificate', true, 'D', 'module', 9),
  ('JP-SM', 'level4', true, 'D-', 'module', 6),
  ('JP-SM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-IR', 'International Relations', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-IR', 'diploma', true, 'C-', 'module', 18),
  ('JP-IR', 'certificate', true, 'D', 'module', 9),
  ('JP-IR', 'level4', true, 'D-', 'module', 6),
  ('JP-IR', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-EN', 'English', (SELECT id FROM departments WHERE name = 'Education' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-EN', 'diploma', true, 'C-', 'module', 18),
  ('JP-EN', 'certificate', true, 'D', 'module', 9),
  ('JP-EN', 'level4', true, 'D-', 'module', 6),
  ('JP-EN', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-DM', 'Disaster Management', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-DM', 'diploma', true, 'C-', 'module', 18),
  ('JP-DM', 'certificate', true, 'D', 'module', 9),
  ('JP-DM', 'level4', true, 'D-', 'module', 6),
  ('JP-DM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-FC', 'Forensic Criminology', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-FC', 'diploma', true, 'C-', 'module', 18),
  ('JP-FC', 'certificate', true, 'D', 'module', 9),
  ('JP-FC', 'level4', true, 'D-', 'module', 6),
  ('JP-FC', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CM', 'CCTV Management', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CM', 'diploma', true, 'C-', 'module', 18),
  ('JP-CM', 'certificate', true, 'D', 'module', 9),
  ('JP-CM', 'level4', true, 'D-', 'module', 6),
  ('JP-CM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PM', 'Project Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-PM', 'diploma', true, 'C-', 'module', 18),
  ('JP-PM', 'certificate', true, 'D', 'module', 9),
  ('JP-PM', 'level4', true, 'D-', 'module', 6),
  ('JP-PM', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CF', 'Clearing & Forwarding', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-CF', 'diploma', true, 'C-', 'module', 18),
  ('JP-CF', 'certificate', true, 'D', 'module', 9),
  ('JP-CF', 'level4', true, 'D-', 'module', 6),
  ('JP-CF', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- CREATIVE ARTS COURSES
-- Module-based courses - fees configured via semesters
-- ============================================================================

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-HB', 'Hair & Beauty Therapy', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-HB', 'diploma', true, 'C-', 'module', 18),
  ('JP-HB', 'certificate', true, 'D', 'module', 9),
  ('JP-HB', 'level4', true, 'D-', 'module', 6),
  ('JP-HB', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-FD', 'Fashion Design', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-FD', 'diploma', true, 'C-', 'module', 18),
  ('JP-FD', 'certificate', true, 'D', 'module', 9),
  ('JP-FD', 'level4', true, 'D-', 'module', 6),
  ('JP-FD', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-GD', 'Graphic Design', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-GD', 'diploma', true, 'C-', 'module', 18),
  ('JP-GD', 'certificate', true, 'D', 'module', 9),
  ('JP-GD', 'level4', true, 'D-', 'module', 6),
  ('JP-GD', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-BC', 'Barista Course', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('JP-BC', 'diploma', true, 'C-', 'module', 18),
  ('JP-BC', 'certificate', true, 'D', 'module', 9),
  ('JP-BC', 'level4', true, 'D-', 'module', 6),
  ('JP-BC', 'artisan', true, 'ID/Birth Cert', 'module', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- NOTE: This file adds the basic course structure for JP International courses.
-- Fee structure for module-based courses (study_mode='module') should be configured
-- in the admin interface via the semesters table.
-- Units and modules can be configured in the admin course management interface.
-- Total: 23 JP International courses with 4 levels each.
-- Artisan courses use 'ID/Birth Cert' as minimum KCSE grade requirement.
-- ============================================================================
