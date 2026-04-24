-- ============================================================================
-- KNEC COURSES DATA
-- Complete course structure with units and paper codes
-- ============================================================================

-- Insert Departments
INSERT INTO departments (name) VALUES 
  ('Business & Management'),
  ('Information Technology'),
  ('Library & Information Studies'),
  ('Hospitality & Creative Arts')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ARTISAN LEVEL COURSES (0801-0803)
-- 5 units each, no modules
-- ============================================================================

-- 1. Artisan Certificate in Clerk-Typist
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-0801', 'Artisan Certificate in Clerk-Typist', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-0801', 'artisan', true, 'D', 'module', 6, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 2. Artisan Certificate in Salesmanship
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-0802', 'Artisan Certificate in Salesmanship', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-0802', 'artisan', true, 'D', 'module', 6, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 3. Artisan Certificate in Storekeeping
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-0803', 'Artisan Certificate in Storekeeping', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-0803', 'artisan', true, 'D', 'module', 6, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- CRAFT LEVEL COURSES (1801-1813)
-- 6 units each, no modules
-- ============================================================================

-- 4. Craft Certificate in Secretarial Studies
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1801', 'Craft Certificate in Secretarial Studies', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1801', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 5. Craft Certificate in Marketing
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1802', 'Craft Certificate in Marketing', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1802', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 6. Craft Certificate in Supplies Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1803', 'Craft Certificate in Supplies Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1803', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 7. Craft Certificate in Accounting
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1804', 'Craft Certificate in Accounting', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1804', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 8. Craft Certificate in Banking & Finance
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1805', 'Craft Certificate in Banking & Finance', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1805', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 9. Craft Certificate in Business Administration
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1806', 'Craft Certificate in Business Administration', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1806', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 10. Craft Certificate in Co-operative Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1807', 'Craft Certificate in Co-operative Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1807', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 11. Craft Certificate in Personnel Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1808', 'Craft Certificate in Personnel Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1808', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 12. Craft Certificate in Transport Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1809', 'Craft Certificate in Transport Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1809', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 13. Craft Certificate in Library, Archives & Information Studies
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1813', 'Craft Certificate in Library, Archives & Information Studies', (SELECT id FROM departments WHERE name = 'Library & Information Studies' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1813', 'certificate', true, 'D', 'module', 12, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- CRAFT LEVEL MODULAR COURSES (1901-1922)
-- Module I and II
-- ============================================================================

-- 14. Craft Certificate in Secretarial Studies (Module I)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1901', 'Craft Certificate in Secretarial Studies (Modular)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1901', 'certificate', true, 'D', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 15. Craft Certificate in Sales & Marketing (Modular)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1902', 'Craft Certificate in Sales & Marketing (Modular)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1902', 'certificate', true, 'D', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 16. Craft Certificate in Supply Chain Management (Modular)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1903', 'Craft Certificate in Supply Chain Management (Modular)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1903', 'certificate', true, 'D', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 17. Craft Certificate in Business Management (Modular)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1906', 'Craft Certificate in Business Management (Modular)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1906', 'certificate', true, 'D', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 18. Craft Certificate in Human Resource Management (Modular)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1908', 'Craft Certificate in Human Resource Management (Modular)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1908', 'certificate', true, 'D', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 19. Craft Certificate in Information Studies (Modular)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1913', 'Craft Certificate in Information Studies (Modular)', (SELECT id FROM departments WHERE name = 'Library & Information Studies' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1913', 'certificate', true, 'D', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 20. Craft Certificate in Information Technology (Modular)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1920', 'Craft Certificate in Information Technology (Modular)', (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1920', 'certificate', true, 'D', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 21. Craft Certificate in Project Management (Modular)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-1922', 'Craft Certificate in Project Management (Modular)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-1922', 'certificate', true, 'D', 'module', 12, 'monthly', 5000, 12, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 22. Craft Certificate in Fashion Design and Garment Making Technology (Modular)
INSERT INTO courses (id, name, department_id) VALUES 
  ('CFDG-2500', 'Craft Certificate in Fashion Design and Garment Making Technology', (SELECT id FROM departments WHERE name = 'Hospitality & Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('CFDG-2500', 'certificate', true, 'D', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- DIPLOMA LEVEL COURSES (2801-2814)
-- 7 units each, no modules
-- ============================================================================

-- 30. Diploma in Secretarial Studies
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2801', 'Diploma in Secretarial Studies', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2801', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 31. Diploma in Marketing
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2802', 'Diploma in Marketing', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2802', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 32. Diploma in Supplies Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2803', 'Diploma in Supplies Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2803', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 33. Diploma in Accountancy
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2804', 'Diploma in Accountancy', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2804', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 34. Diploma in Banking & Finance
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2805', 'Diploma in Banking & Finance', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2805', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 35. Diploma in Business Administration
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2806', 'Diploma in Business Administration', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2806', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 36. Diploma in Co-operative Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2807', 'Diploma in Co-operative Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2807', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 37. Diploma in Personnel Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2808', 'Diploma in Personnel Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2808', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 38. Diploma in Information Studies
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2813', 'Diploma in Information Studies', (SELECT id FROM departments WHERE name = 'Library & Information Studies' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2813', 'diploma', true, 'C-', 'module', 18, 'one-time', 45000, 0, ARRAY[]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 39-41. Diploma in Entrepreneurship Development (3 Modules)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2814', 'Diploma in Entrepreneurship Development', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2814', 'diploma', true, 'C-', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- DIPLOMA LEVEL MODULAR COURSES (2901-2920)
-- Module I, II, and III
-- ============================================================================

-- 42-44. Diploma in Secretarial Duties (3 Modules)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2901', 'Diploma in Secretarial Duties', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2901', 'diploma', true, 'C-', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 45-47. Diploma in Sales & Marketing (3 Modules)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2902', 'Diploma in Sales & Marketing', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2902', 'diploma', true, 'C-', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 48-50. Diploma in Supply Chain Management (3 Modules)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2903', 'Diploma in Supply Chain Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2903', 'diploma', true, 'C-', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 51-53. Diploma in Business Management (3 Modules)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2906', 'Diploma in Business Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2906', 'diploma', true, 'C-', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 54-56. Diploma in Human Resource Management (3 Modules)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2908', 'Diploma in Human Resource Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2908', 'diploma', true, 'C-', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 57-59. Diploma in Information Communication Technology (3 Modules)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-2920', 'Diploma in Information Communication Technology', (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-2920', 'diploma', true, 'C-', 'module', 24, 'monthly', 6000, 24, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 5000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- HIGHER DIPLOMA COURSES (3806-3814)
-- Module I and II or no modules
-- ============================================================================

-- 60-61. Higher Diploma in Business Management (2 Modules)
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-3806', 'Higher Diploma in Business Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-3806', 'level6', true, 'C', 'module', 12, 'monthly', 8000, 12, ARRAY[8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000,8000]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 62. Higher Diploma in Human Resource Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-3808', 'Higher Diploma in Human Resource Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-3808', 'level6', true, 'C', 'module', 12, 'one-time', 60000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 63. Higher Diploma in Entrepreneurship Development
INSERT INTO courses (id, name, department_id) VALUES 
  ('KNEC-3814', 'Higher Diploma in Entrepreneurship Development', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('KNEC-3814', 'level6', true, 'C', 'module', 12, 'one-time', 60000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- NOTE: This file adds the basic course structure. 
-- Units will be added through the admin interface for better management.
-- The course data includes 63 KNEC courses with proper codes and exam body.
-- ============================================================================
