-- ============================================================================
-- JP INTERNATIONAL COURSES DATA
-- Internationally recognized courses awarded and examined by JP International
-- Qualifications are benchmarked to global standards
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
-- TEACHER TRAINING
-- ============================================================================

-- 1. Teacher Training - Diploma
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TT-DIP', 'Teacher Training (Diploma)', (SELECT id FROM departments WHERE name = 'Education' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-TT-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 2. Teacher Training - Certificate
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TT-CERT', 'Teacher Training (Certificate)', (SELECT id FROM departments WHERE name = 'Education' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-TT-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 3. Teacher Training - Craft Certificate
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TT-CRAFT', 'Teacher Training (Craft)', (SELECT id FROM departments WHERE name = 'Education' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-TT-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 4. Teacher Training - Artisan
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TT-ART', 'Teacher Training (Artisan)', (SELECT id FROM departments WHERE name = 'Education' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-TT-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- CAREGIVERS
-- ============================================================================

-- 5. Caregivers - Diploma
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CG-DIP', 'Caregivers (Diploma)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-CG-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 5000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 6. Caregivers - Certificate
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CG-CERT', 'Caregivers (Certificate)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-CG-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 7. Caregivers - Craft Certificate
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CG-CRAFT', 'Caregivers (Craft)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-CG-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 8. Caregivers - Artisan
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CG-ART', 'Caregivers (Artisan)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-CG-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- HEALTHCARE COURSES
-- ============================================================================

-- 9-12. Community Health
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CH-DIP', 'Community Health (Diploma)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1)),
  ('JP-CH-CERT', 'Community Health (Certificate)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1)),
  ('JP-CH-CRAFT', 'Community Health (Craft)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1)),
  ('JP-CH-ART', 'Community Health (Artisan)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-CH-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 5000, true),
  ('JP-CH-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true),
  ('JP-CH-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true),
  ('JP-CH-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 13-16. Phlebotomy
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PH-DIP', 'Phlebotomy (Diploma)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1)),
  ('JP-PH-CERT', 'Phlebotomy (Certificate)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1)),
  ('JP-PH-CRAFT', 'Phlebotomy (Craft)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1)),
  ('JP-PH-ART', 'Phlebotomy (Artisan)', (SELECT id FROM departments WHERE name = 'Healthcare' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-PH-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 5000, true),
  ('JP-PH-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true),
  ('JP-PH-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 3000, true),
  ('JP-PH-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- MEDIA & COMMUNICATION
-- ============================================================================

-- 17-20. Journalism & Mass Communication
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-JM-DIP', 'Journalism & Mass Communication (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-JM-CERT', 'Journalism & Mass Communication (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-JM-CRAFT', 'Journalism & Mass Communication (Craft)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-JM-ART', 'Journalism & Mass Communication (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-JM-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 3000, true),
  ('JP-JM-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 2000, true),
  ('JP-JM-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-JM-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- TECHNOLOGY COURSES
-- ============================================================================

-- 21-24. Web Development
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-WD-DIP', 'Web Development (Diploma)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-WD-CERT', 'Web Development (Certificate)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-WD-CRAFT', 'Web Development (Craft)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-WD-ART', 'Web Development (Artisan)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-WD-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 4000, true),
  ('JP-WD-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 3000, true),
  ('JP-WD-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true),
  ('JP-WD-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 25-28. Mobile Technology
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-MT-DIP', 'Mobile Technology (Diploma)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-MT-CERT', 'Mobile Technology (Certificate)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-MT-CRAFT', 'Mobile Technology (Craft)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-MT-ART', 'Mobile Technology (Artisan)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-MT-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 4000, true),
  ('JP-MT-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 3000, true),
  ('JP-MT-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true),
  ('JP-MT-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- BUSINESS & MANAGEMENT
-- ============================================================================

-- 29-32. Community Development
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CD-DIP', 'Community Development (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-CD-CERT', 'Community Development (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-CD-CRAFT', 'Community Development (Craft)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-CD-ART', 'Community Development (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-CD-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 3000, true),
  ('JP-CD-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 2000, true),
  ('JP-CD-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-CD-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 33-36. Purchasing & Supplies
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PS-DIP', 'Purchasing & Supplies (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-PS-CERT', 'Purchasing & Supplies (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-PS-CRAFT', 'Purchasing & Supplies (Craft)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-PS-ART', 'Purchasing & Supplies (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-PS-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 3000, true),
  ('JP-PS-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 2000, true),
  ('JP-PS-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-PS-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 37-40. Sales & Marketing
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-SM-DIP', 'Sales & Marketing (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-SM-CERT', 'Sales & Marketing (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-SM-CRAFT', 'Sales & Marketing (Craft)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-SM-ART', 'Sales & Marketing (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-SM-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 3000, true),
  ('JP-SM-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 2000, true),
  ('JP-SM-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-SM-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 41-44. International Relations
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-IR-DIP', 'International Relations (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-IR-CERT', 'International Relations (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-IR-CRAFT', 'International Relations (Craft)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-IR-ART', 'International Relations (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-IR-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 3000, true),
  ('JP-IR-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 2000, true),
  ('JP-IR-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-IR-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 45-48. Project Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-PM-DIP', 'Project Management (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-PM-CERT', 'Project Management (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-PM-CRAFT', 'Project Management (Craft)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-PM-ART', 'Project Management (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-PM-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 3000, true),
  ('JP-PM-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 2000, true),
  ('JP-PM-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-PM-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 49-52. Clearing & Forwarding
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CF-DIP', 'Clearing & Forwarding (Diploma)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-CF-CERT', 'Clearing & Forwarding (Certificate)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-CF-CRAFT', 'Clearing & Forwarding (Craft)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1)),
  ('JP-CF-ART', 'Clearing & Forwarding (Artisan)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-CF-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 3000, true),
  ('JP-CF-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 2000, true),
  ('JP-CF-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-CF-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- CREATIVE ARTS
-- ============================================================================

-- 53-56. Hair & Beauty Therapy
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-HB-DIP', 'Hair & Beauty Therapy (Diploma)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-HB-CERT', 'Hair & Beauty Therapy (Certificate)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-HB-CRAFT', 'Hair & Beauty Therapy (Craft)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-HB-ART', 'Hair & Beauty Therapy (Artisan)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-HB-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 4000, true),
  ('JP-HB-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 3000, true),
  ('JP-HB-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true),
  ('JP-HB-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 57-60. Fashion Design
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-FD-DIP', 'Fashion Design (Diploma)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-FD-CERT', 'Fashion Design (Certificate)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-FD-CRAFT', 'Fashion Design (Craft)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-FD-ART', 'Fashion Design (Artisan)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-FD-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 4000, true),
  ('JP-FD-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 3000, true),
  ('JP-FD-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true),
  ('JP-FD-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 61-64. Graphic Design
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-GD-DIP', 'Graphic Design (Diploma)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-GD-CERT', 'Graphic Design (Certificate)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-GD-CRAFT', 'Graphic Design (Craft)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-GD-ART', 'Graphic Design (Artisan)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-GD-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 3000, true),
  ('JP-GD-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 2000, true),
  ('JP-GD-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-GD-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 65-68. Barista Course
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-BAR-DIP', 'Barista Course (Diploma)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-BAR-CERT', 'Barista Course (Certificate)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-BAR-CRAFT', 'Barista Course (Craft)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1)),
  ('JP-BAR-ART', 'Barista Course (Artisan)', (SELECT id FROM departments WHERE name = 'Creative Arts' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-BAR-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6000, 18, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 4000, true),
  ('JP-BAR-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5000, 9, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 3000, true),
  ('JP-BAR-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 18000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true),
  ('JP-BAR-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 10000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- SOCIAL SCIENCES
-- ============================================================================

-- 69-72. Sociology
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-SOC-DIP', 'Sociology (Diploma)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-SOC-CERT', 'Sociology (Certificate)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-SOC-CRAFT', 'Sociology (Craft)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-SOC-ART', 'Sociology (Artisan)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-SOC-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6000, 18, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 2000, true),
  ('JP-SOC-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5000, 9, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 1500, true),
  ('JP-SOC-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 18000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true),
  ('JP-SOC-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 10000, 0, ARRAY[]::DECIMAL(10,2)[], 500, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 73-76. Travel & Tourism
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-TT-TRV-DIP', 'Travel & Tourism (Diploma)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-TT-TRV-CERT', 'Travel & Tourism (Certificate)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-TT-TRV-CRAFT', 'Travel & Tourism (Craft)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-TT-TRV-ART', 'Travel & Tourism (Artisan)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-TT-TRV-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 3000, true),
  ('JP-TT-TRV-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 2000, true),
  ('JP-TT-TRV-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-TT-TRV-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 77-80. English
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-ENG-DIP', 'English (Diploma)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-ENG-CERT', 'English (Certificate)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-ENG-CRAFT', 'English (Craft)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-ENG-ART', 'English (Artisan)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-ENG-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6000, 18, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 2000, true),
  ('JP-ENG-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5000, 9, ARRAY[5000,5000,5000,5000,5000,5000,5000,5000,5000]::DECIMAL(10,2)[], 1500, true),
  ('JP-ENG-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 18000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true),
  ('JP-ENG-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 10000, 0, ARRAY[]::DECIMAL(10,2)[], 500, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 81-84. Disaster Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-DM-DIP', 'Disaster Management (Diploma)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-DM-CERT', 'Disaster Management (Certificate)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-DM-CRAFT', 'Disaster Management (Craft)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-DM-ART', 'Disaster Management (Artisan)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-DM-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 6500, 18, ARRAY[6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500,6500]::DECIMAL(10,2)[], 3000, true),
  ('JP-DM-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 5500, 9, ARRAY[5500,5500,5500,5500,5500,5500,5500,5500,5500]::DECIMAL(10,2)[], 2000, true),
  ('JP-DM-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 20000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-DM-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 12000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 85-88. Forensic Criminology
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-FC-DIP', 'Forensic Criminology (Diploma)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-FC-CERT', 'Forensic Criminology (Certificate)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-FC-CRAFT', 'Forensic Criminology (Craft)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1)),
  ('JP-FC-ART', 'Forensic Criminology (Artisan)', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-FC-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 3000, true),
  ('JP-FC-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 2000, true),
  ('JP-FC-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 1500, true),
  ('JP-FC-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- 89-92. CCTV Management
INSERT INTO courses (id, name, department_id) VALUES 
  ('JP-CCTV-DIP', 'CCTV Management (Diploma)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-CCTV-CERT', 'CCTV Management (Certificate)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-CCTV-CRAFT', 'CCTV Management (Craft)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1)),
  ('JP-CCTV-ART', 'CCTV Management (Artisan)', (SELECT id FROM departments WHERE name = 'Technology' LIMIT 1))
ON CONFLICT (id) DO NOTHING;

INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months, payment_type, fee, number_of_months, monthly_fees, practical_fee, has_exams) VALUES 
  ('JP-CCTV-DIP', 'diploma', true, 'C-', 'module', 18, 'monthly', 7000, 18, ARRAY[7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000,7000]::DECIMAL(10,2)[], 4000, true),
  ('JP-CCTV-CERT', 'certificate', true, 'D', 'module', 9, 'monthly', 6000, 9, ARRAY[6000,6000,6000,6000,6000,6000,6000,6000,6000]::DECIMAL(10,2)[], 3000, true),
  ('JP-CCTV-CRAFT', 'artisan', true, 'D-', 'module', 6, 'one-time', 25000, 0, ARRAY[]::DECIMAL(10,2)[], 2000, true),
  ('JP-CCTV-ART', 'artisan', true, 'ID/Birth Cert', 'module', 3, 'one-time', 15000, 0, ARRAY[]::DECIMAL(10,2)[], 1000, true)
ON CONFLICT (course_id, level) DO NOTHING;

-- ============================================================================
-- NOTE: This file adds the basic course structure for JP International courses.
-- Details like fee structure can be edited in the admin course management interface.
-- All courses are internationally recognized and examined by JP International.
-- Exam body will be set to 'JP' when courses are configured in the system.
-- Total: 23 courses with 4 levels each = 92 course types
-- ============================================================================
