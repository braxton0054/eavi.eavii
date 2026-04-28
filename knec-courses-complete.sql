-- KNEC Courses - COMPLETE INSERT SQL
-- All departments, courses, modules, and units included
-- Run in Supabase SQL Editor

-- ============================================
-- STEP 1: CREATE DEPARTMENTS
-- ============================================
INSERT INTO departments (id, name, created_at) VALUES
  ('dept-sec', 'Secretarial & Office Administration', NOW()),
  ('dept-sales', 'Sales, Marketing & Public Relations', NOW()),
  ('dept-supply', 'Supply Chain & Storekeeping', NOW()),
  ('dept-acct', 'Accounting, Finance & Banking', NOW()),
  ('dept-biz', 'Business Administration & Management', NOW()),
  ('dept-hr', 'Human Resource Management', NOW()),
  ('dept-coop', 'Co-operative Management', NOW()),
  ('dept-trans', 'Transport & Logistics', NOW()),
  ('dept-it', 'Information Technology', NOW()),
  ('dept-lib', 'Library, Archives & Information Studies', NOW()),
  ('dept-ent', 'Entrepreneurship & Project Management', NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- DEPARTMENT: Secretarial & Office Administration
-- ============================================

-- 0801 - ARTISAN CERTIFICATE IN CLERK - TYPIST (Single Module)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-0801', 'Artisan Certificate in Clerk - Typist', 'dept-sec', 'KNEC', 'D-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-0801', 'KNEC-0801', 'artisan', 'KNEC', 'module', 6, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-0801', 'ct-0801', 1, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-0801', 'Typewriting (30 WPM)', '201', NOW()),
  (gen_random_uuid(), 'mod-0801', 'Business Organisation', '202', NOW()),
  (gen_random_uuid(), 'mod-0801', 'Book-Keeping', '203', NOW()),
  (gen_random_uuid(), 'mod-0801', 'Clerical Duties', '204', NOW()),
  (gen_random_uuid(), 'mod-0801', 'Support Subjects', '205', NOW());

-- 1801 - CRAFT CERTIFICATE IN SECRETARIAL STUDIES (Single Module)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1801', 'Craft Certificate in Secretarial Studies', 'dept-sec', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1801', 'KNEC-1801', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1801', 'ct-1801', 1, 12, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-1801', 'Communication & Report Writing', '301', NOW()),
  (gen_random_uuid(), 'mod-1801', 'Commerce', '302', NOW()),
  (gen_random_uuid(), 'mod-1801', 'Typewriting (40 WPM)', '303', NOW()),
  (gen_random_uuid(), 'mod-1801', 'Shorthand (80 WPM)', '304', NOW()),
  (gen_random_uuid(), 'mod-1801', 'Secretarial Duties', '305', NOW()),
  (gen_random_uuid(), 'mod-1801', 'Course Specialisation & Entrepreneurship Projects', '306', NOW()),
  (gen_random_uuid(), 'mod-1801', 'Shorthand (90 WPM)', '308', NOW());

-- 1901 - CRAFT CERTIFICATE IN SECRETARIAL STUDIES MODULE I
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1901', 'Craft Certificate in Secretarial Studies (Modular)', 'dept-sec', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1901', 'KNEC-1901', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1901-1', 'ct-1901', 1, 6, NOW()),
       ('mod-1901-2', 'ct-1901', 2, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  -- Module I
  (gen_random_uuid(), 'mod-1901-1', 'Computerized Document Processing I', '101', NOW()),
  (gen_random_uuid(), 'mod-1901-1', 'Shorthand I', '102', NOW()),
  (gen_random_uuid(), 'mod-1901-1', 'Commerce', '103', NOW()),
  (gen_random_uuid(), 'mod-1901-1', 'Information Communication Technology I', '104', NOW()),
  (gen_random_uuid(), 'mod-1901-1', 'Communication Skills I', '105', NOW()),
  (gen_random_uuid(), 'mod-1901-1', 'Secretarial Duties', '106', NOW()),
  (gen_random_uuid(), 'mod-1901-1', 'Entrepreneurship Project', '107', NOW()),
  -- Module II
  (gen_random_uuid(), 'mod-1901-2', 'Computerized Document Processing II', '201', NOW()),
  (gen_random_uuid(), 'mod-1901-2', 'Shorthand II', '202', NOW()),
  (gen_random_uuid(), 'mod-1901-2', 'Communication Skills II', '203', NOW()),
  (gen_random_uuid(), 'mod-1901-2', 'Information Communication Technology', '204', NOW()),
  (gen_random_uuid(), 'mod-1901-2', 'Economics', '205', NOW()),
  (gen_random_uuid(), 'mod-1901-2', 'Course Specialization Project', '207', NOW());

-- 2801 - DIPLOMA IN SECRETARIAL STUDIES (Single Module)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2801', 'Diploma in Secretarial Studies', 'dept-sec', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2801', 'KNEC-2801', 'diploma', 'KNEC', 'module', 24, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2801', 'ct-2801', 1, 24, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-2801', 'Typewriting (50 WPM)', '301', NOW()),
  (gen_random_uuid(), 'mod-2801', 'Shorthand (100 WPM)', '302', NOW()),
  (gen_random_uuid(), 'mod-2801', 'Office Administration & Management', '303', NOW()),
  (gen_random_uuid(), 'mod-2801', 'Business English', '304', NOW()),
  (gen_random_uuid(), 'mod-2801', 'Public and Human Relations', '305', NOW()),
  (gen_random_uuid(), 'mod-2801', 'Commercial & Administrative Law', '306', NOW()),
  (gen_random_uuid(), 'mod-2801', 'Course Specialisation & Entrepreneurship Projects', '307', NOW()),
  (gen_random_uuid(), 'mod-2801', 'Word Processing', '308', NOW());

-- 2901 - DIPLOMA IN SECRETARIAL DUTIES (Modules I, II, III)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2901', 'Diploma in Secretarial Duties (Modular)', 'dept-sec', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2901', 'KNEC-2901', 'diploma', 'KNEC', 'module', 18, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2901-1', 'ct-2901', 1, 6, NOW()),
       ('mod-2901-2', 'ct-2901', 2, 6, NOW()),
       ('mod-2901-3', 'ct-2901', 3, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  -- Module I
  (gen_random_uuid(), 'mod-2901-1', 'Shorthand (60 WPM)', '102', NOW()),
  (gen_random_uuid(), 'mod-2901-1', 'Economics', '104', NOW()),
  (gen_random_uuid(), 'mod-2901-1', 'Computerized Document Processing I', '106', NOW()),
  (gen_random_uuid(), 'mod-2901-1', 'Secretarial Duties', '107', NOW()),
  (gen_random_uuid(), 'mod-2901-1', 'Entrepreneurship - Business Plan', '108', NOW()),
  (gen_random_uuid(), 'mod-2901-1', 'Information Communication Technology I', '109', NOW()),
  (gen_random_uuid(), 'mod-2901-1', 'Communication I', '110', NOW()),
  -- Module II
  (gen_random_uuid(), 'mod-2901-2', 'Computerized Document Processing II', '201', NOW()),
  (gen_random_uuid(), 'mod-2901-2', 'Shorthand II', '202', NOW()),
  (gen_random_uuid(), 'mod-2901-2', 'Accounting', '203', NOW()),
  (gen_random_uuid(), 'mod-2901-2', 'Communication II', '204', NOW()),
  (gen_random_uuid(), 'mod-2901-2', 'Information Communication Technology II', '205', NOW()),
  (gen_random_uuid(), 'mod-2901-2', 'Commercial & Administrative Law', '206', NOW()),
  -- Module III
  (gen_random_uuid(), 'mod-2901-3', 'Computerized Document Processing III', '301', NOW()),
  (gen_random_uuid(), 'mod-2901-3', 'Shorthand III', '302', NOW()),
  (gen_random_uuid(), 'mod-2901-3', 'Office Administration & Management', '303', NOW()),
  (gen_random_uuid(), 'mod-2901-3', 'Information Communication Technology III', '304', NOW()),
  (gen_random_uuid(), 'mod-2901-3', 'Statistics', '305', NOW()),
  (gen_random_uuid(), 'mod-2901-3', 'Course Specialization Project', '308', NOW());

-- ============================================
-- DEPARTMENT: Sales, Marketing & Public Relations
-- ============================================

-- 0802 - ARTISAN CERTIFICATE IN SALESMANSHIP
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-0802', 'Artisan Certificate in Salesmanship', 'dept-sales', 'KNEC', 'D-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-0802', 'KNEC-0802', 'artisan', 'KNEC', 'module', 6, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-0802', 'ct-0802', 1, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-0802', 'Salesmanship', '201', NOW()),
  (gen_random_uuid(), 'mod-0802', 'Business Organisation', '202', NOW()),
  (gen_random_uuid(), 'mod-0802', 'Book-Keeping', '203', NOW()),
  (gen_random_uuid(), 'mod-0802', 'Clerical Duties', '204', NOW()),
  (gen_random_uuid(), 'mod-0802', 'Support Subjects', '205', NOW());

-- 1802 - CRAFT CERTIFICATE IN MARKETING
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1802', 'Craft Certificate in Marketing', 'dept-sales', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1802', 'KNEC-1802', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1802', 'ct-1802', 1, 12, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-1802', 'Principles & Practice of Marketing', '301', NOW()),
  (gen_random_uuid(), 'mod-1802', 'Marketing Communication', '302', NOW()),
  (gen_random_uuid(), 'mod-1802', 'Sales Organisation & Practice', '303', NOW()),
  (gen_random_uuid(), 'mod-1802', 'Consumer Behaviour', '304', NOW()),
  (gen_random_uuid(), 'mod-1802', 'Communication & Report Writing', '305', NOW()),
  (gen_random_uuid(), 'mod-1802', 'Course Specialisation & Entrepreneurship Projects', '306', NOW());

-- 1902 - CRAFT CERTIFICATE IN SALES & MARKETING (Modular)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1902', 'Craft Certificate in Sales & Marketing (Modular)', 'dept-sales', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1902', 'KNEC-1902', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1902-1', 'ct-1902', 1, 6, NOW()),
       ('mod-1902-2', 'ct-1902', 2, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  -- Module I
  (gen_random_uuid(), 'mod-1902-1', 'Principles & Practice of Selling', '101', NOW()),
  (gen_random_uuid(), 'mod-1902-1', 'Principles & Practice of Marketing', '102', NOW()),
  (gen_random_uuid(), 'mod-1902-1', 'Information Communication Technology', '104', NOW()),
  (gen_random_uuid(), 'mod-1902-1', 'Communication', '105', NOW()),
  (gen_random_uuid(), 'mod-1902-1', 'Entrepreneurship Project', '107', NOW()),
  -- Module II
  (gen_random_uuid(), 'mod-1902-2', 'Consumer Behaviour', '201', NOW()),
  (gen_random_uuid(), 'mod-1902-2', 'Marketing Communication', '202', NOW()),
  (gen_random_uuid(), 'mod-1902-2', 'Bookkeeping & Accounting', '203', NOW()),
  (gen_random_uuid(), 'mod-1902-2', 'Introduction to Law', '204', NOW()),
  (gen_random_uuid(), 'mod-1902-2', 'Economics', '205', NOW()),
  (gen_random_uuid(), 'mod-1902-2', 'Course Specialization Project', '207', NOW());

-- 2802 - DIPLOMA IN MARKETING
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2802', 'Diploma in Marketing', 'dept-sales', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2802', 'KNEC-2802', 'diploma', 'KNEC', 'module', 24, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2802', 'ct-2802', 1, 24, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-2802', 'Marketing Management', '301', NOW()),
  (gen_random_uuid(), 'mod-2802', 'Marketing Planning & Control', '302', NOW()),
  (gen_random_uuid(), 'mod-2802', 'Marketing Information Systems & Marketing Research', '303', NOW()),
  (gen_random_uuid(), 'mod-2802', 'International Marketing', '304', NOW()),
  (gen_random_uuid(), 'mod-2802', 'Marketing of Services & Agricultural Products', '305', NOW()),
  (gen_random_uuid(), 'mod-2802', 'Commercial Law', '306', NOW()),
  (gen_random_uuid(), 'mod-2802', 'Course Specialisation & Entrepreneurship Projects', '307', NOW());

-- 2902 - DIPLOMA IN SALES & MARKETING (Modular)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2902', 'Diploma in Sales & Marketing (Modular)', 'dept-sales', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2902', 'KNEC-2902', 'diploma', 'KNEC', 'module', 18, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2902-1', 'ct-2902', 1, 6, NOW()),
       ('mod-2902-2', 'ct-2902', 2, 6, NOW()),
       ('mod-2902-3', 'ct-2902', 3, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  -- Module I
  (gen_random_uuid(), 'mod-2902-1', 'Principles and Practice of Selling', '101', NOW()),
  (gen_random_uuid(), 'mod-2902-1', 'Principles and Practice of Marketing', '102', NOW()),
  (gen_random_uuid(), 'mod-2902-1', 'Information Communication Technology', '103', NOW()),
  (gen_random_uuid(), 'mod-2902-1', 'Communication', '104', NOW()),
  (gen_random_uuid(), 'mod-2902-1', 'Economics', '105', NOW()),
  (gen_random_uuid(), 'mod-2902-1', 'Project', '108', NOW()),
  -- Module II
  (gen_random_uuid(), 'mod-2902-2', 'Sales Management', '201', NOW()),
  (gen_random_uuid(), 'mod-2902-2', 'Marketing Management', '202', NOW()),
  (gen_random_uuid(), 'mod-2902-2', 'Legal Aspects in Sales & Marketing', '203', NOW()),
  (gen_random_uuid(), 'mod-2902-2', 'Quantitative Methods', '204', NOW()),
  (gen_random_uuid(), 'mod-2902-2', 'Public Relations', '205', NOW()),
  -- Module III
  (gen_random_uuid(), 'mod-2902-3', 'International Marketing', '301', NOW()),
  (gen_random_uuid(), 'mod-2902-3', 'Marketing Planning', '302', NOW()),
  (gen_random_uuid(), 'mod-2902-3', 'Principles and Practice of Management', '303', NOW()),
  (gen_random_uuid(), 'mod-2902-3', 'Financial Aspects of Marketing', '304', NOW()),
  (gen_random_uuid(), 'mod-2902-3', 'Strategic Planning in Sales and Marketing', '305', NOW()),
  (gen_random_uuid(), 'mod-2902-3', 'Marketing Research', '306', NOW()),
  (gen_random_uuid(), 'mod-2902-3', 'Project', '308', NOW());

-- ============================================
-- DEPARTMENT: Supply Chain & Storekeeping
-- ============================================

-- 0803 - ARTISAN CERTIFICATE IN STOREKEEPING
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-0803', 'Artisan Certificate in Storekeeping', 'dept-supply', 'KNEC', 'D-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-0803', 'KNEC-0803', 'artisan', 'KNEC', 'module', 6, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-0803', 'ct-0803', 1, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-0803', 'Storekeeping', '201', NOW()),
  (gen_random_uuid(), 'mod-0803', 'Business Organisation', '202', NOW()),
  (gen_random_uuid(), 'mod-0803', 'Book-Keeping', '203', NOW()),
  (gen_random_uuid(), 'mod-0803', 'Clerical Duties', '204', NOW()),
  (gen_random_uuid(), 'mod-0803', 'Support Subjects', '205', NOW());

-- 1803 - CRAFT CERTIFICATE IN SUPPLIES MANAGEMENT
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1803', 'Craft Certificate in Supplies Management', 'dept-supply', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1803', 'KNEC-1803', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1803', 'ct-1803', 1, 12, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-1803', 'Financial Accounting', '301', NOW()),
  (gen_random_uuid(), 'mod-1803', 'Principles of Procurement & Distribution', '302', NOW()),
  (gen_random_uuid(), 'mod-1803', 'Cost Accounting', '303', NOW()),
  (gen_random_uuid(), 'mod-1803', 'Commerce', '304', NOW()),
  (gen_random_uuid(), 'mod-1803', 'Principles of Warehousing & Stock Control', '305', NOW()),
  (gen_random_uuid(), 'mod-1803', 'Course Specialisation & Entrepreneurship Projects', '306', NOW());

-- 1903 - CRAFT CERTIFICATE IN SUPPLY CHAIN MANAGEMENT (Modular)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1903', 'Craft Certificate in Supply Chain Management (Modular)', 'dept-supply', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1903', 'KNEC-1903', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1903-1', 'ct-1903', 1, 6, NOW()),
       ('mod-1903-2', 'ct-1903', 2, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  -- Module I
  (gen_random_uuid(), 'mod-1903-1', 'Warehousing Operations and Stock Control', '101', NOW()),
  (gen_random_uuid(), 'mod-1903-1', 'Business Calculations and Statistics', '102', NOW()),
  (gen_random_uuid(), 'mod-1903-1', 'Commerce', '103', NOW()),
  (gen_random_uuid(), 'mod-1903-1', 'Information Communication Technology Practical', '104', NOW()),
  (gen_random_uuid(), 'mod-1903-1', 'Communication Skills', '105', NOW()),
  (gen_random_uuid(), 'mod-1903-1', 'Financial Accounting', '106', NOW()),
  (gen_random_uuid(), 'mod-1903-1', 'Entrepreneurship Business Plan', '107', NOW()),
  -- Module II
  (gen_random_uuid(), 'mod-1903-2', 'Office Organization', '201', NOW()),
  (gen_random_uuid(), 'mod-1903-2', 'Supply Chain Management and Purchasing Principles', '202', NOW()),
  (gen_random_uuid(), 'mod-1903-2', 'Business Finance', '203', NOW()),
  (gen_random_uuid(), 'mod-1903-2', 'Business Law', '204', NOW()),
  (gen_random_uuid(), 'mod-1903-2', 'Economics', '205', NOW()),
  (gen_random_uuid(), 'mod-1903-2', 'Course Specialization Project', '207', NOW());

-- 2803 - DIPLOMA IN SUPPLIES MANAGEMENT
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2803', 'Diploma in Supplies Management', 'dept-supply', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2803', 'KNEC-2803', 'diploma', 'KNEC', 'module', 24, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2803', 'ct-2803', 1, 24, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-2803', 'Purchasing Principles & Techniques', '301', NOW()),
  (gen_random_uuid(), 'mod-2803', 'Purchasing & Supplies Logistics', '302', NOW()),
  (gen_random_uuid(), 'mod-2803', 'Purchasing & Supplies Provisioning', '303', NOW()),
  (gen_random_uuid(), 'mod-2803', 'Materials & Production Management', '304', NOW()),
  (gen_random_uuid(), 'mod-2803', 'Public Procurement', '305', NOW()),
  (gen_random_uuid(), 'mod-2803', 'Purchasing & Supplies Planning Policy & Organisation', '306', NOW()),
  (gen_random_uuid(), 'mod-2803', 'Course Specialisation & Entrepreneurship Projects', '307', NOW());

-- 2903 - DIPLOMA IN SUPPLY CHAIN MANAGEMENT (Modular)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2903', 'Diploma in Supply Chain Management (Modular)', 'dept-supply', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2903', 'KNEC-2903', 'diploma', 'KNEC', 'module', 18, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2903-1', 'ct-2903', 1, 6, NOW()),
       ('mod-2903-2', 'ct-2903', 2, 6, NOW()),
       ('mod-2903-3', 'ct-2903', 3, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  -- Module I
  (gen_random_uuid(), 'mod-2903-1', 'Warehousing Operations and Stock Control', '107', NOW()),
  (gen_random_uuid(), 'mod-2903-1', 'Supply Chain Management and Purchasing Principles', '101', NOW()),
  (gen_random_uuid(), 'mod-2903-1', 'Information Communication Technology Paper', '103', NOW()),
  (gen_random_uuid(), 'mod-2903-1', 'Financial Accounting', '102', NOW()),
  (gen_random_uuid(), 'mod-2903-1', 'Communication Skills', '104', NOW()),
  (gen_random_uuid(), 'mod-2903-1', 'Economics', '105', NOW()),
  (gen_random_uuid(), 'mod-2903-1', 'Business Law', '106', NOW()),
  (gen_random_uuid(), 'mod-2903-1', 'Entrepreneurship - Business Plan', '108', NOW()),
  -- Module II
  (gen_random_uuid(), 'mod-2903-2', 'Purchasing Management', '201', NOW()),
  (gen_random_uuid(), 'mod-2903-2', 'Public Procurement and Finance', '202', NOW()),
  (gen_random_uuid(), 'mod-2903-2', 'Supply Management', '203', NOW()),
  (gen_random_uuid(), 'mod-2903-2', 'Quantitative Methods', '204', NOW()),
  (gen_random_uuid(), 'mod-2903-2', 'Principles and Practice of Marketing', '205', NOW()),
  (gen_random_uuid(), 'mod-2903-2', 'Cost Accounting', '206', NOW()),
  -- Module III
  (gen_random_uuid(), 'mod-2903-3', 'Purchasing and Supply Strategy', '301', NOW()),
  (gen_random_uuid(), 'mod-2903-3', 'Operations Management', '302', NOW()),
  (gen_random_uuid(), 'mod-2903-3', 'Principles and Practice of Management', '303', NOW()),
  (gen_random_uuid(), 'mod-2903-3', 'International Purchasing', '304', NOW()),
  (gen_random_uuid(), 'mod-2903-3', 'Management Accounting', '305', NOW()),
  (gen_random_uuid(), 'mod-2903-3', 'Project and Contract Management', '306', NOW()),
  (gen_random_uuid(), 'mod-2903-3', 'Course Specialization Project', '308', NOW());

-- ============================================
-- DEPARTMENT: Accounting, Finance & Banking
-- ============================================

-- 1804 - CRAFT CERTIFICATE IN ACCOUNTING
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1804', 'Craft Certificate in Accounting', 'dept-acct', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1804', 'KNEC-1804', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1804', 'ct-1804', 1, 12, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-1804', 'Financial Accounting', '301', NOW()),
  (gen_random_uuid(), 'mod-1804', 'Business Finance', '302', NOW()),
  (gen_random_uuid(), 'mod-1804', 'Cost Accounting', '303', NOW()),
  (gen_random_uuid(), 'mod-1804', 'Auditing', '304', NOW()),
  (gen_random_uuid(), 'mod-1804', 'Taxation', '305', NOW()),
  (gen_random_uuid(), 'mod-1804', 'Course Specialisation & Entrepreneurship Projects', '306', NOW());

-- 1805 - CRAFT CERTIFICATE IN BANKING & FINANCE
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1805', 'Craft Certificate in Banking & Finance', 'dept-acct', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1805', 'KNEC-1805', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1805', 'ct-1805', 1, 12, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-1805', 'Financial Accounting', '301', NOW()),
  (gen_random_uuid(), 'mod-1805', 'Business Finance', '302', NOW()),
  (gen_random_uuid(), 'mod-1805', 'Elements of Banking', '303', NOW()),
  (gen_random_uuid(), 'mod-1805', 'Foreign Exchange & Exchange Control', '304', NOW()),
  (gen_random_uuid(), 'mod-1805', 'Communication & Report Writing', '305', NOW()),
  (gen_random_uuid(), 'mod-1805', 'Course Specialisation & Entrepreneurship Projects', '306', NOW());

-- 2804 - DIPLOMA IN ACCOUNTANCY
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2804', 'Diploma in Accountancy', 'dept-acct', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2804', 'KNEC-2804', 'diploma', 'KNEC', 'module', 24, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2804', 'ct-2804', 1, 24, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-2804', 'Managerial Accounting', '301', NOW()),
  (gen_random_uuid(), 'mod-2804', 'Financial Accounting', '302', NOW()),
  (gen_random_uuid(), 'mod-2804', 'Business Finance', '303', NOW()),
  (gen_random_uuid(), 'mod-2804', 'Auditing', '304', NOW()),
  (gen_random_uuid(), 'mod-2804', 'Taxation', '305', NOW()),
  (gen_random_uuid(), 'mod-2804', 'Company Law', '306', NOW()),
  (gen_random_uuid(), 'mod-2804', 'Course Specialisation & Entrepreneurship Projects', '307', NOW());

-- 2805 - DIPLOMA IN BANKING & FINANCE
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2805', 'Diploma in Banking & Finance', 'dept-acct', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2805', 'KNEC-2805', 'diploma', 'KNEC', 'module', 24, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2805', 'ct-2805', 1, 24, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-2805', 'Monetary & Financial Systems', '301', NOW()),
  (gen_random_uuid(), 'mod-2805', 'Lending', '302', NOW()),
  (gen_random_uuid(), 'mod-2805', 'Investment', '303', NOW()),
  (gen_random_uuid(), 'mod-2805', 'Accountancy', '304', NOW()),
  (gen_random_uuid(), 'mod-2805', 'Branch Banking (Law & Practice)', '305', NOW()),
  (gen_random_uuid(), 'mod-2805', 'Finance of International Trade (Payments & Services)', '306', NOW()),
  (gen_random_uuid(), 'mod-2805', 'Course Specialisation & Entrepreneurship Projects', '307', NOW());

-- ============================================
-- DEPARTMENT: Business Administration & Management
-- ============================================

-- 1806 - CRAFT CERTIFICATE IN BUSINESS ADMINISTRATION
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1806', 'Craft Certificate in Business Administration', 'dept-biz', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1806', 'KNEC-1806', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1806', 'ct-1806', 1, 12, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-1806', 'Financial Accounting', '301', NOW()),
  (gen_random_uuid(), 'mod-1806', 'Business Finance', '302', NOW()),
  (gen_random_uuid(), 'mod-1806', 'Cost Accounting', '303', NOW()),
  (gen_random_uuid(), 'mod-1806', 'Business Administration & Environment', '304', NOW()),
  (gen_random_uuid(), 'mod-1806', 'Communication & Report Writing', '305', NOW()),
  (gen_random_uuid(), 'mod-1806', 'Course Specialisation & Entrepreneurship Projects', '306', NOW());

-- 1906 - CRAFT CERTIFICATE IN BUSINESS MANAGEMENT (Modular)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-1906', 'Craft Certificate in Business Management (Modular)', 'dept-biz', 'KNEC', 'D', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-1906', 'KNEC-1906', 'craft', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-1906-1', 'ct-1906', 1, 6, NOW()),
       ('mod-1906-2', 'ct-1906', 2, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-1906-1', 'Fundamentals of Management and Environment', '101', NOW()),
  (gen_random_uuid(), 'mod-1906-1', 'Business Calculations and Statistics', '102', NOW()),
  (gen_random_uuid(), 'mod-1906-1', 'Commerce', '103', NOW()),
  (gen_random_uuid(), 'mod-1906-1', 'Information Communication Technology - Theory', '104', NOW()),
  (gen_random_uuid(), 'mod-1906-1', 'Communication Skills', '105', NOW()),
  (gen_random_uuid(), 'mod-1906-1', 'Financial Accounting', '106', NOW()),
  (gen_random_uuid(), 'mod-1906-1', 'Entrepreneurship - Business Plan', '107', NOW()),
  (gen_random_uuid(), 'mod-1906-2', 'Office Organization', '201', NOW()),
  (gen_random_uuid(), 'mod-1906-2', 'Human and Public Relations', '202', NOW()),
  (gen_random_uuid(), 'mod-1906-2', 'Business Finance', '203', NOW()),
  (gen_random_uuid(), 'mod-1906-2', 'Business Law', '204', NOW()),
  (gen_random_uuid(), 'mod-1906-2', 'Economics', '205', NOW()),
  (gen_random_uuid(), 'mod-1906-2', 'Sales and Marketing', '206', NOW()),
  (gen_random_uuid(), 'mod-1906-2', 'Course Specialization Project', '207', NOW());

-- 2806 - DIPLOMA IN BUSINESS ADMINISTRATION
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2806', 'Diploma in Business Administration', 'dept-biz', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2806', 'KNEC-2806', 'diploma', 'KNEC', 'module', 24, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2806', 'ct-2806', 1, 24, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-2806', 'Managerial Accounting', '301', NOW()),
  (gen_random_uuid(), 'mod-2806', 'Organisation Theory & Behaviour', '302', NOW()),
  (gen_random_uuid(), 'mod-2806', 'Office Administration & Management', '303', NOW()),
  (gen_random_uuid(), 'mod-2806', 'Theory & Practice of Management', '304', NOW()),
  (gen_random_uuid(), 'mod-2806', 'Human Resource Management & Industrial Relations', '305', NOW()),
  (gen_random_uuid(), 'mod-2806', 'Commercial & Administrative Law', '306', NOW()),
  (gen_random_uuid(), 'mod-2806', 'Course Specialisation & Entrepreneurship Projects', '307', NOW());

-- 2906 - DIPLOMA IN BUSINESS MANAGEMENT (Modular)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-2906', 'Diploma in Business Management (Modular)', 'dept-biz', 'KNEC', 'C-', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-2906', 'KNEC-2906', 'diploma', 'KNEC', 'module', 18, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-2906-1', 'ct-2906', 1, 6, NOW()),
       ('mod-2906-2', 'ct-2906', 2, 6, NOW()),
       ('mod-2906-3', 'ct-2906', 3, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-2906-1', 'Financial Accounting', '102', NOW()),
  (gen_random_uuid(), 'mod-2906-1', 'Information Communication Technology Paper', '103', NOW()),
  (gen_random_uuid(), 'mod-2906-1', 'Communication Skills', '104', NOW()),
  (gen_random_uuid(), 'mod-2906-1', 'Economics', '105', NOW()),
  (gen_random_uuid(), 'mod-2906-1', 'Business Law', '106', NOW()),
  (gen_random_uuid(), 'mod-2906-1', 'Entrepreneurship - Business Plan', '108', NOW()),
  (gen_random_uuid(), 'mod-2906-2', 'Office Administration and Management', '201', NOW()),
  (gen_random_uuid(), 'mod-2906-2', 'Marketing Management', '202', NOW()),
  (gen_random_uuid(), 'mod-2906-2', 'Supply and Transport Management', '203', NOW()),
  (gen_random_uuid(), 'mod-2906-2', 'Quantitative Techniques', '204', NOW()),
  (gen_random_uuid(), 'mod-2906-2', 'Commercial and Administrative Law', '205', NOW()),
  (gen_random_uuid(), 'mod-2906-2', 'Cost Accounting', '206', NOW()),
  (gen_random_uuid(), 'mod-2906-3', 'Organization Theory and Behaviour', '301', NOW()),
  (gen_random_uuid(), 'mod-2906-3', 'Labour and Industrial Relations', '302', NOW()),
  (gen_random_uuid(), 'mod-2906-3', 'Principles and Practice of Management', '303', NOW()),
  (gen_random_uuid(), 'mod-2906-3', 'Managerial Accounting', '304', NOW()),
  (gen_random_uuid(), 'mod-2906-3', 'Financial Management', '305', NOW()),
  (gen_random_uuid(), 'mod-2906-3', 'Course Specialization Project', '306', NOW());

-- 3806 - HIGHER DIPLOMA IN BUSINESS MANAGEMENT (Modular)
INSERT INTO courses (id, name, department_id, exam_body, min_kcse_grade, created_at) 
VALUES ('KNEC-3806', 'Higher Diploma in Business Management (Modular)', 'dept-biz', 'KNEC', 'C+', NOW());
INSERT INTO course_types (id, course_id, level, exam_body, study_mode, duration_months, enabled, created_at) 
VALUES ('ct-3806', 'KNEC-3806', 'higher_diploma', 'KNEC', 'module', 12, true, NOW());
INSERT INTO modules (id, course_type_id, module_number, duration_months, created_at) 
VALUES ('mod-3806-1', 'ct-3806', 1, 6, NOW()),
       ('mod-3806-2', 'ct-3806', 2, 6, NOW());
INSERT INTO units (id, module_id, name, code, created_at) VALUES
  (gen_random_uuid(), 'mod-3806-1', 'Business Environment & Strategic Management', '101', NOW()),
  (gen_random_uuid(), 'mod-3806-1', 'Management Consultancy & Research Methodology', '102', NOW()),
  (gen_random_uuid(), 'mod-3806-1', 'Information Communication Technology', '103', NOW()),
  (gen_random_uuid(), 'mod-3806-1', 'Legal Aspects of Business Management', '104', NOW()),
  (gen_random_uuid(), 'mod-3806-2', 'Human Resource Management & Organizational Development', '201', NOW()),
  (gen_random_uuid(), 'mod-3806-2', 'Operations Research', '202', NOW()),
  (gen_random_uuid(), 'mod-3806-2', 'Strategic Marketing Management', '203', NOW()),
  (gen_random_uuid(), 'mod-3806-2', 'Management Accounting', '204', NOW()),
  (gen_random_uuid(), 'mod-3806-2', 'Project', '207', NOW());
