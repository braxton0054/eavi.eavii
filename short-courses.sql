-- ============================================================================
-- SHORT COURSES DATA
-- Basic course structure for quick enrollment courses
-- Details (duration, fees, etc.) can be edited in the admin interface
-- ============================================================================

-- Insert Departments
INSERT INTO departments (name) VALUES 
  ('Technical & Trades'),
  ('Business & Professional'),
  ('Creative & Hospitality')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- TECHNICAL & TRADES COURSES
-- ============================================================================

-- 1. CCTV Installation
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-CCTV-001', 'CCTV Installation', (SELECT id FROM departments WHERE name = 'Technical & Trades' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-CCTV-001', 'certificate', true, 'Open', 'short-course', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- 2. Solar Installation
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-SOLAR-001', 'Solar Installation', (SELECT id FROM departments WHERE name = 'Technical & Trades' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-SOLAR-001', 'certificate', true, 'Open', 'short-course', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- 3. Electronics Repair and Maintenance
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-ELEC-001', 'Electronics Repair and Maintenance', (SELECT id FROM departments WHERE name = 'Technical & Trades' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-ELEC-001', 'certificate', true, 'Open', 'short-course', 2)
ON CONFLICT (course_id, level) DO NOTHING;

-- 4. Electrical Installation
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-ELEC-002', 'Electrical Installation', (SELECT id FROM departments WHERE name = 'Technical & Trades' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-ELEC-002', 'certificate', true, 'Open', 'short-course', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- 5. Tailoring
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-TAIL-001', 'Tailoring', (SELECT id FROM departments WHERE name = 'Creative & Hospitality' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-TAIL-001', 'certificate', true, 'Open', 'short-course', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- BUSINESS & PROFESSIONAL COURSES
-- ============================================================================

-- 6. Digital Marketing
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-DIGM-001', 'Digital Marketing', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-DIGM-001', 'certificate', true, 'Open', 'short-course', 2)
ON CONFLICT (course_id, level) DO NOTHING;

-- 7. Computer Packages / ICDL / Web Design / Graphic Design / AutoCAD
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-COMP-001', 'Computer Packages / ICDL / Web Design / Graphic Design / AutoCAD', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-COMP-001', 'certificate', true, 'Open', 'short-course', 2)
ON CONFLICT (course_id, level) DO NOTHING;

-- 8. QuickBooks / Advanced Excel
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-ACCT-001', 'QuickBooks / Advanced Excel', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-ACCT-001', 'certificate', true, 'Open', 'short-course', 1)
ON CONFLICT (course_id, level) DO NOTHING;

-- 9. Front Office Operations
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-OFFC-001', 'Front Office Operations', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-OFFC-001', 'certificate', true, 'Open', 'short-course', 2)
ON CONFLICT (course_id, level) DO NOTHING;

-- 10. Customer Care
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-CUST-001', 'Customer Care', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-CUST-001', 'certificate', true, 'Open', 'short-course', 1)
ON CONFLICT (course_id, level) DO NOTHING;

-- 11. Business Startup Skills
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-BIZ-001', 'Business Startup Skills', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-BIZ-001', 'certificate', true, 'Open', 'short-course', 1)
ON CONFLICT (course_id, level) DO NOTHING;

-- 12. First Aid and Emergency Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-FAID-001', 'First Aid and Emergency Management', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-FAID-001', 'certificate', true, 'Open', 'short-course', 1)
ON CONFLICT (course_id, level) DO NOTHING;

-- 13. Peace, Conflict and Management Skills
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-PEACE-001', 'Peace, Conflict and Management Skills', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-PEACE-001', 'certificate', true, 'Open', 'short-course', 1)
ON CONFLICT (course_id, level) DO NOTHING;

-- 14. Guidance and Counselling
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-GUID-001', 'Guidance and Counselling', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-GUID-001', 'certificate', true, 'Open', 'short-course', 2)
ON CONFLICT (course_id, level) DO NOTHING;

-- 15. Effective Leadership and Development
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-LEAD-001', 'Effective Leadership and Development', (SELECT id FROM departments WHERE name = 'Business & Professional' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-LEAD-001', 'certificate', true, 'Open', 'short-course', 1)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- CREATIVE & HOSPITALITY COURSES
-- ============================================================================

-- 16. Photography, Videography and Editing
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-PHOT-001', 'Photography, Videography and Editing', (SELECT id FROM departments WHERE name = 'Creative & Hospitality' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-PHOT-001', 'certificate', true, 'Open', 'short-course', 2)
ON CONFLICT (course_id, level) DO NOTHING;

-- 17. Baking Technology
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-BAKE-001', 'Baking Technology', (SELECT id FROM departments WHERE name = 'Creative & Hospitality' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-BAKE-001', 'certificate', true, 'Open', 'short-course', 2)
ON CONFLICT (course_id, level) DO NOTHING;

-- 18. Barista
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-BARI-001', 'Barista', (SELECT id FROM departments WHERE name = 'Creative & Hospitality' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-BARI-001', 'certificate', true, 'Open', 'short-course', 1)
ON CONFLICT (course_id, level) DO NOTHING;

-- 19. Mixology
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-MIXO-001', 'Mixology', (SELECT id FROM departments WHERE name = 'Creative & Hospitality' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-MIXO-001', 'certificate', true, 'Open', 'short-course', 1)
ON CONFLICT (course_id, level) DO NOTHING;

-- 20. Cosmetology (Hairdressing & Beauty Therapy)
INSERT INTO courses (id, name, department_id) VALUES 
  ('SC-COSM-001', 'Cosmetology (Hairdressing & Beauty Therapy)', (SELECT id FROM departments WHERE name = 'Creative & Hospitality' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES 
  ('SC-COSM-001', 'certificate', true, 'Open', 'short-course', 3)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- NOTE: This file adds the basic course structure for short courses.
-- Details like fee structure, payment type, and exact duration can be edited
-- in the admin course management interface for each course.
-- All courses are set to 'short-course' study mode and 'Open' entry requirement.
-- ============================================================================
