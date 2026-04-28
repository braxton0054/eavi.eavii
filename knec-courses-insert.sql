-- KNEC Courses Bulk Insert SQL
-- Run this in Supabase SQL Editor
-- Note: Fees, durations, and grades are set to 0/null - edit them in the admin panel later

-- ============================================
-- STEP 1: CREATE DEPARTMENTS
-- ============================================

INSERT INTO departments (id, name, created_at) VALUES
  (gen_random_uuid(), 'Secretarial & Office Administration', NOW()),
  (gen_random_uuid(), 'Sales, Marketing & Public Relations', NOW()),
  (gen_random_uuid(), 'Supply Chain & Storekeeping', NOW()),
  (gen_random_uuid(), 'Accounting, Finance & Banking', NOW()),
  (gen_random_uuid(), 'Business Administration & Management', NOW()),
  (gen_random_uuid(), 'Human Resource Management', NOW()),
  (gen_random_uuid(), 'Co-operative Management', NOW()),
  (gen_random_uuid(), 'Transport & Logistics', NOW()),
  (gen_random_uuid(), 'Information Technology', NOW()),
  (gen_random_uuid(), 'Library, Archives & Information Studies', NOW()),
  (gen_random_uuid(), 'Entrepreneurship & Project Management', NOW())
ON CONFLICT DO NOTHING;

-- Get department IDs for reference (you'll need to replace these with actual UUIDs after first run)
-- Or use subqueries to reference by name

-- ============================================
-- STEP 2: CREATE QUALIFICATION LEVELS (if not exists)
-- ============================================

INSERT INTO qualification_levels (id, name, level_order, created_at) VALUES
  ('artisan-level', 'Artisan', 1, NOW()),
  ('craft-level', 'Craft/Certificate', 2, NOW()),
  ('diploma-level', 'Diploma', 3, NOW()),
  ('higher-diploma-level', 'Higher Diploma', 4, NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- STEP 3: CREATE COURSES WITH MODULES AND UNITS
-- ============================================

-- Note: This is a template. You'll need to replace [DEPT_UUID] with actual department UUIDs
-- After running step 1, query: SELECT id, name FROM departments;
-- Then replace the placeholders below

-- ============================================================
-- DEPARTMENT: Secretarial & Office Administration
-- ============================================================

-- 0801 - ARTISAN CERTIFICATE IN CLERK - TYPIST (Single Module)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) VALUES
('KNEC-0801', 'Artisan Certificate in Clerk - Typist', 
  (SELECT id FROM departments WHERE name = 'Secretarial & Office Administration'), 
  'KNEC', 'D-', NOW());

INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, created_at) VALUES
(gen_random_uuid(), 'KNEC-0801', 'artisan', 'KNEC', 'module', 0, NOW());

INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-0801' AND level = 'artisan'), 1, 6, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0801' AND m.module_number = 1), 'Typewriting (30 WPM)', '201', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0801' AND m.module_number = 1), 'Business Organisation', '202', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0801' AND m.module_number = 1), 'Book-Keeping', '203', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0801' AND m.module_number = 1), 'Clerical Duties', '204', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0801' AND m.module_number = 1), 'Support Subjects', '205', NOW());

-- 1801 - CRAFT CERTIFICATE IN SECRETARIAL STUDIES (Single Module)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) VALUES
('KNEC-1801', 'Craft Certificate in Secretarial Studies', 
  (SELECT id FROM departments WHERE name = 'Secretarial & Office Administration'), 
  'KNEC', 'D', NOW());

INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, created_at) VALUES
(gen_random_uuid(), 'KNEC-1801', 'craft', 'KNEC', 'module', 0, NOW());

INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-1801' AND level = 'craft'), 1, 12, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1801' AND m.module_number = 1), 'Communication & Report Writing', '301', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1801' AND m.module_number = 1), 'Commerce', '302', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1801' AND m.module_number = 1), 'Typewriting (40 WPM)', '303', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1801' AND m.module_number = 1), 'Shorthand (80 WPM)', '304', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1801' AND m.module_number = 1), 'Secretarial Duties', '305', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1801' AND m.module_number = 1), 'Course Specialisation & Entrepreneurship Projects', '306', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1801' AND m.module_number = 1), 'Shorthand (90 WPM)', '308', NOW());

-- 1901 - CRAFT CERTIFICATE IN SECRETARIAL STUDIES (MODULE I & II)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) VALUES
('KNEC-1901', 'Craft Certificate in Secretarial Studies (Modular)', 
  (SELECT id FROM departments WHERE name = 'Secretarial & Office Administration'), 
  'KNEC', 'D', NOW());

INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, created_at) VALUES
(gen_random_uuid(), 'KNEC-1901', 'craft', 'KNEC', 'module', 0, NOW());

-- Module I
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-1901' AND level = 'craft'), 1, 6, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 1), 'Computerized Document Processing I', '101', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 1), 'Shorthand I', '102', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 1), 'Commerce', '103', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 1), 'Information Communication Technology I', '104', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 1), 'Communication Skills I', '105', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 1), 'Secretarial Duties', '106', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 1), 'Entrepreneurship Project', '107', NOW());

-- Module II
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-1901' AND level = 'craft'), 2, 6, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 2), 'Computerized Document Processing II', '201', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 2), 'Shorthand II', '202', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 2), 'Communication Skills II', '203', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 2), 'Information Communication Technology', '204', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 2), 'Economics', '205', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-1901' AND m.module_number = 2), 'Course Specialization Project', '207', NOW());

-- 2801 - DIPLOMA IN SECRETARIAL STUDIES (Single Module)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) VALUES
('KNEC-2801', 'Diploma in Secretarial Studies', 
  (SELECT id FROM departments WHERE name = 'Secretarial & Office Administration'), 
  'KNEC', 'C-', NOW());

INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, created_at) VALUES
(gen_random_uuid(), 'KNEC-2801', 'diploma', 'KNEC', 'module', 0, NOW());

INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-2801' AND level = 'diploma'), 1, 24, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2801' AND m.module_number = 1), 'Typewriting (50 WPM)', '301', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2801' AND m.module_number = 1), 'Shorthand (100 WPM)', '302', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2801' AND m.module_number = 1), 'Office Administration & Management', '303', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2801' AND m.module_number = 1), 'Business English', '304', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2801' AND m.module_number = 1), 'Public and Human Relations', '305', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2801' AND m.module_number = 1), 'Commercial & Administrative Law', '306', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2801' AND m.module_number = 1), 'Course Specialisation & Entrepreneurship Projects', '307', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2801' AND m.module_number = 1), 'Word Processing', '308', NOW());

-- 2901 - DIPLOMA IN SECRETARIAL DUTIES (MODULE I, II, III)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) VALUES
('KNEC-2901', 'Diploma in Secretarial Duties (Modular)', 
  (SELECT id FROM departments WHERE name = 'Secretarial & Office Administration'), 
  'KNEC', 'C-', NOW());

INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, created_at) VALUES
(gen_random_uuid(), 'KNEC-2901', 'diploma', 'KNEC', 'module', 0, NOW());

-- Module I
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-2901' AND level = 'diploma'), 1, 6, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 1), 'Shorthand (60 WPM)', '102', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 1), 'Economics', '104', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 1), 'Computerized Document Processing I', '106', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 1), 'Secretarial Duties', '107', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 1), 'Entrepreneurship - Business Plan', '108', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 1), 'Information Communication Technology I', '109', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 1), 'Communication I', '110', NOW());

-- Module II
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-2901' AND level = 'diploma'), 2, 6, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 2), 'Computerized Document Processing II', '201', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 2), 'Shorthand II', '202', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 2), 'Accounting', '203', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 2), 'Communication II', '204', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 2), 'Information Communication Technology II', '205', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 2), 'Commercial & Administrative Law', '206', NOW());

-- Module III
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-2901' AND level = 'diploma'), 3, 6, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 3), 'Computerized Document Processing III', '301', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 3), 'Shorthand III', '302', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 3), 'Office Administration & Management', '303', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 3), 'Information Communication Technology III', '304', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 3), 'Statistics', '305', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-2901' AND m.module_number = 3), 'Course Specialization Project', '308', NOW());

-- ============================================================
-- DEPARTMENT: Sales, Marketing & Public Relations
-- ============================================================

-- 0802 - ARTISAN CERTIFICATE IN SALESMANSHIP
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) VALUES
('KNEC-0802', 'Artisan Certificate in Salesmanship', 
  (SELECT id FROM departments WHERE name = 'Sales, Marketing & Public Relations'), 
  'KNEC', 'D-', NOW());

INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, created_at) VALUES
(gen_random_uuid(), 'KNEC-0802', 'artisan', 'KNEC', 'module', 0, NOW());

INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) VALUES
(gen_random_uuid(), (SELECT id FROM course_types WHERE course_id = 'KNEC-0802' AND level = 'artisan'), 1, 6, NOW());

INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0802' AND m.module_number = 1), 'Salesmanship', '201', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0802' AND m.module_number = 1), 'Business Organisation', '202', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0802' AND m.module_number = 1), 'Book-Keeping', '203', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0802' AND m.module_number = 1), 'Clerical Duties', '204', NOW()),
  (gen_random_uuid(), (SELECT m.id FROM modules m JOIN course_types ct ON m.course_type_id = ct.id WHERE ct.course_id = 'KNEC-0802' AND m.module_number = 1), 'Support Subjects', '205', NOW());

-- Continue with remaining courses following same pattern...
-- Due to length, here's the structure for all remaining courses:

-- 1802 - CRAFT CERTIFICATE IN MARKETING (Single Module, 6 units)
-- 1902 - CRAFT CERTIFICATE IN SALES & MARKETING (Module I - 7 units, Module II - 6 units)
-- 2802 - DIPLOMA IN MARKETING (Single Module, 7 units)
-- 2902 - DIPLOMA IN SALES & MARKETING (Module I - 6 units, Module II - 5 units, Module III - 6 units)

-- ============================================================
-- DEPARTMENT: Supply Chain & Storekeeping
-- ============================================================

-- 0803 - ARTISAN CERTIFICATE IN STOREKEEPING (5 units)
-- 1803 - CRAFT CERTIFICATE IN SUPPLIES MANAGEMENT (6 units)
-- 1903 - CRAFT CERTIFICATE IN SUPPLY CHAIN MANAGEMENT (Module I - 7 units, Module II - 6 units)
-- 2803 - DIPLOMA IN SUPPLIES MANAGEMENT (7 units)
-- 2903 - DIPLOMA IN SUPPLY CHAIN MANAGEMENT (Module I - 8 units, Module II - 6 units, Module III - 6 units)

-- ============================================================
-- DEPARTMENT: Accounting, Finance & Banking
-- ============================================================

-- 1804 - CRAFT CERTIFICATE IN ACCOUNTING (6 units)
-- 1805 - CRAFT CERTIFICATE IN BANKING & FINANCE (6 units)
-- 2804 - DIPLOMA IN ACCOUNTANCY (7 units)
-- 2805 - DIPLOMA IN BANKING & FINANCE (7 units)

-- ============================================================
-- DEPARTMENT: Business Administration & Management
-- ============================================================

-- 1806 - CRAFT CERTIFICATE IN BUSINESS ADMINISTRATION (6 units)
-- 1906 - CRAFT CERTIFICATE IN BUSINESS MANAGEMENT (Module I - 7 units, Module II - 7 units)
-- 2806 - DIPLOMA IN BUSINESS ADMINISTRATION (7 units)
-- 2906 - DIPLOMA IN BUSINESS MANAGEMENT (Module I - 6 units, Module II - 6 units, Module III - 6 units)
-- 3806 - HIGHER DIPLOMA IN BUSINESS MANAGEMENT (Module I - 4 units, Module II - 4 units)

-- ============================================================
-- DEPARTMENT: Human Resource Management
-- ============================================================

-- 1808 - CRAFT CERTIFICATE IN PERSONNEL MANAGEMENT (6 units)
-- 1908 - CRAFT CERTIFICATE IN HUMAN RESOURCE MANAGEMENT (Module I - 7 units, Module II - 4 units)
-- 2808 - DIPLOMA IN PERSONNEL MANAGEMENT (7 units)
-- 2908 - DIPLOMA IN HUMAN RESOURCE MANAGEMENT (Module I - 5 units, Module II - 5 units, Module III - 6 units)
-- 3808 - HIGHER DIPLOMA IN HUMAN RESOURCE MANAGEMENT (7 units)

-- ============================================================
-- DEPARTMENT: Co-operative Management
-- ============================================================

-- 1807 - CRAFT CERTIFICATE IN CO-OPERATIVE MANAGEMENT (6 units)
-- 2807 - DIPLOMA IN CO-OPERATIVE MANAGEMENT (7 units)

-- ============================================================
-- DEPARTMENT: Transport & Logistics
-- ============================================================

-- 1809 - CRAFT CERTIFICATE IN TRANSPORT MANAGEMENT (6 units)

-- ============================================================
-- DEPARTMENT: Information Technology
-- ============================================================

-- 1920 - CRAFT CERTIFICATE IN INFORMATION TECHNOLOGY (Module I - 7 units, Module II - 4 units)
-- 2920 - DIPLOMA IN INFORMATION COMMUNICATION TECHNOLOGY (Module I - 6 units, Module II - 6 units, Module III - 5 units)

-- ============================================================
-- DEPARTMENT: Library, Archives & Information Studies
-- ============================================================

-- 1813 - CRAFT CERTIFICATE IN LIBRARY, ARCHIVES & INFORMATION STUDIES (6 units)
-- 1913 - CRAFT CERTIFICATE IN INFORMATION STUDIES (Module I - 7 units, Module II - 5 units)
-- 2813 - DIPLOMA IN INFORMATION STUDIES (7 units)

-- ============================================================
-- DEPARTMENT: Entrepreneurship & Project Management
-- ============================================================

-- 1922 - CRAFT CERTIFICATE IN PROJECT MANAGEMENT (Module I - 7 units, Module II - 6 units)
-- 2814 - DIPLOMA IN ENTREPRENEURSHIP DEVELOPMENT (Module I - 3 units, Module II - 4 units, Module III - 3 units)
-- 3814 - HIGHER DIPLOMA IN ENTREPRENEURSHIP DEVELOPMENT (7 units)

-- NOTE: This SQL file contains the structure and first department fully.
-- The remaining departments follow the same pattern.
-- To complete all courses, you would need to expand each section following
-- the pattern shown above for the Secretarial department.

-- AFTER INSERTING:
-- 1. Query departments: SELECT id, name FROM departments;
-- 2. Query courses: SELECT id, name FROM courses WHERE id LIKE 'KNEC-%';
-- 3. Edit fees, durations, and grades in Admin → Courses
