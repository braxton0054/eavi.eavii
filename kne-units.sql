-- ============================================================================
-- KNEC UNITS DATA
-- Complete units structure for all KNEC courses
-- ============================================================================

-- ============================================================================
-- ARTISAN LEVEL COURSES (0801-0803) - Module 1, Semester 1
-- ============================================================================

-- 1. Artisan Certificate in Clerk-Typist (KNEC-0801)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-0801', '201', 'Typewriting (30 WPM)', 1, 1),
  ('KNEC-0801', '202', 'Business Organisation', 1, 1),
  ('KNEC-0801', '203', 'Book-keeping', 1, 1),
  ('KNEC-0801', '204', 'Clerical Duties', 1, 1),
  ('KNEC-0801', '205', 'Support Subjects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 2. Artisan Certificate in Salesmanship (KNEC-0802)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-0802', '201', 'Salesmanship', 1, 1),
  ('KNEC-0802', '202', 'Business Organisation', 1, 1),
  ('KNEC-0802', '203', 'Book-keeping', 1, 1),
  ('KNEC-0802', '204', 'Clerical Duties', 1, 1),
  ('KNEC-0802', '205', 'Support Subjects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 3. Artisan Certificate in Storekeeping (KNEC-0803)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-0803', '201', 'Storekeeping', 1, 1),
  ('KNEC-0803', '202', 'Business Organisation', 1, 1),
  ('KNEC-0803', '203', 'Book-keeping', 1, 1),
  ('KNEC-0803', '204', 'Clerical Duties', 1, 1),
  ('KNEC-0803', '205', 'Support Subjects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- ============================================================================
-- CRAFT LEVEL COURSES (1801-1813) - Module 1, Semester 1
-- ============================================================================

-- 4. Craft Certificate in Secretarial Studies (KNEC-1801)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1801', '301', 'Communication & Report Writing', 1, 1),
  ('KNEC-1801', '302', 'Commerce', 1, 1),
  ('KNEC-1801', '303', 'Typewriting (40 WPM)', 1, 1),
  ('KNEC-1801', '304', 'Shorthand (80 WPM)', 1, 1),
  ('KNEC-1801', '305', 'Secretarial Duties', 1, 1),
  ('KNEC-1801', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1),
  ('KNEC-1801', '308', 'Shorthand (90 WPM)', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 5. Craft Certificate in Marketing (KNEC-1802)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1802', '301', 'Principles & Practice of Marketing', 1, 1),
  ('KNEC-1802', '302', 'Marketing Communication', 1, 1),
  ('KNEC-1802', '303', 'Sales Organisation & Practice', 1, 1),
  ('KNEC-1802', '304', 'Consumer Behaviour', 1, 1),
  ('KNEC-1802', '305', 'Communication & Report Writing', 1, 1),
  ('KNEC-1802', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 6. Craft Certificate in Supplies Management (KNEC-1803)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1803', '301', 'Financial Accounting', 1, 1),
  ('KNEC-1803', '302', 'Principles of Procurement & Distribution', 1, 1),
  ('KNEC-1803', '303', 'Cost Accounting', 1, 1),
  ('KNEC-1803', '304', 'Commerce', 1, 1),
  ('KNEC-1803', '305', 'Principles of Warehousing & Stock Control', 1, 1),
  ('KNEC-1803', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 7. Craft Certificate in Accounting (KNEC-1804)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1804', '301', 'Financial Accounting', 1, 1),
  ('KNEC-1804', '302', 'Business Finance', 1, 1),
  ('KNEC-1804', '303', 'Cost Accounting', 1, 1),
  ('KNEC-1804', '304', 'Auditing', 1, 1),
  ('KNEC-1804', '305', 'Taxation', 1, 1),
  ('KNEC-1804', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 8. Craft Certificate in Banking & Finance (KNEC-1805)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1805', '301', 'Financial Accounting', 1, 1),
  ('KNEC-1805', '302', 'Business Finance', 1, 1),
  ('KNEC-1805', '303', 'Elements of Banking', 1, 1),
  ('KNEC-1805', '304', 'Foreign Exchange & Exchange Control', 1, 1),
  ('KNEC-1805', '305', 'Communication & Report Writing', 1, 1),
  ('KNEC-1805', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 9. Craft Certificate in Business Administration (KNEC-1806)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1806', '301', 'Financial Accounting', 1, 1),
  ('KNEC-1806', '302', 'Business Finance', 1, 1),
  ('KNEC-1806', '303', 'Cost Accounting', 1, 1),
  ('KNEC-1806', '304', 'Business Administration & Environment', 1, 1),
  ('KNEC-1806', '305', 'Communication & Report Writing', 1, 1),
  ('KNEC-1806', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 10. Craft Certificate in Co-operative Management (KNEC-1807)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1807', '301', 'Co-operative & Financial Accounting', 1, 1),
  ('KNEC-1807', '302', 'Merchandise & Transport Management', 1, 1),
  ('KNEC-1807', '303', 'Co-operative Banking', 1, 1),
  ('KNEC-1807', '304', 'Co-operative Law', 1, 1),
  ('KNEC-1807', '305', 'Business Administration & Environment', 1, 1),
  ('KNEC-1807', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 11. Craft Certificate in Personnel Management (KNEC-1808)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1808', '301', 'Communication & Report Writing', 1, 1),
  ('KNEC-1808', '302', 'Personnel Management', 1, 1),
  ('KNEC-1808', '303', 'Commerce', 1, 1),
  ('KNEC-1808', '304', 'Industrial & Labour Law', 1, 1),
  ('KNEC-1808', '305', 'Business Administration & Environment', 1, 1),
  ('KNEC-1808', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 12. Craft Certificate in Transport Management (KNEC-1809)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1809', '301', 'Financial Accounting', 1, 1),
  ('KNEC-1809', '302', 'Transport', 1, 1),
  ('KNEC-1809', '303', 'Elements of Clearing & Forwarding', 1, 1),
  ('KNEC-1809', '304', 'Commerce', 1, 1),
  ('KNEC-1809', '305', 'Communication & Report Writing', 1, 1),
  ('KNEC-1809', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 13. Craft Certificate in Library, Archives & Information Studies (KNEC-1813)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1813', '301', 'Information Technology', 1, 1),
  ('KNEC-1813', '302', 'Information Resources', 1, 1),
  ('KNEC-1813', '303', 'Reader''s Services', 1, 1),
  ('KNEC-1813', '304', 'Library Operations', 1, 1),
  ('KNEC-1813', '305', 'Archival Operations', 1, 1),
  ('KNEC-1813', '306', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- ============================================================================
-- CRAFT LEVEL MODULAR COURSES (1901-1922) - Modules I & II
-- ============================================================================

-- 14. Craft Certificate in Secretarial Studies - Module I (KNEC-1901)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1901', '101', 'Computerized Document Processing I', 1, 1),
  ('KNEC-1901', '102', 'Shorthand I', 1, 1),
  ('KNEC-1901', '103', 'Commerce', 1, 1),
  ('KNEC-1901', '104', 'Information Communication Technology I', 1, 1),
  ('KNEC-1901', '105', 'Communication Skills I', 1, 1),
  ('KNEC-1901', '106', 'Secretarial Duties', 1, 1),
  ('KNEC-1901', '107', 'Entrepreneurship Project', 1, 1),
  ('KNEC-1901', '201', 'Computerized Document Processing II', 2, 1),
  ('KNEC-1901', '202', 'Shorthand II', 2, 1),
  ('KNEC-1901', '203', 'Communication Skills II', 2, 1),
  ('KNEC-1901', '204', 'Information Communication Technology', 2, 1),
  ('KNEC-1901', '205', 'Economics', 2, 1),
  ('KNEC-1901', '207', 'Course Specialization Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 15. Craft Certificate in Sales & Marketing - Module I (KNEC-1902)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1902', '101', 'Principles & Practice of Selling', 1, 1),
  ('KNEC-1902', '102', 'Principles & Practice of Marketing', 1, 1),
  ('KNEC-1902', '104', 'Information Communication Technology', 1, 1),
  ('KNEC-1902', '105', 'Communication', 1, 1),
  ('KNEC-1902', '107', 'Entrepreneurship Project', 1, 1),
  ('KNEC-1902', '201', 'Consumer Behaviour', 2, 1),
  ('KNEC-1902', '202', 'Marketing Communication', 2, 1),
  ('KNEC-1902', '203', 'Bookkeeping & Accounting', 2, 1),
  ('KNEC-1902', '204', 'Introduction to Law', 2, 1),
  ('KNEC-1902', '205', 'Economics', 2, 1),
  ('KNEC-1902', '207', 'Course Specialization Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 16. Craft Certificate in Supply Chain Management - Module I (KNEC-1903)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1903', '101', 'Warehousing Operations and Stock Control', 1, 1),
  ('KNEC-1903', '102', 'Business Calculations and Statistics', 1, 1),
  ('KNEC-1903', '103', 'Commerce', 1, 1),
  ('KNEC-1903', '104', 'Information Communication Technology Practical', 1, 1),
  ('KNEC-1903', '105', 'Communication Skills', 1, 1),
  ('KNEC-1903', '106', 'Financial Accounting', 1, 1),
  ('KNEC-1903', '107', 'Entrepreneurship Business Plan', 1, 1),
  ('KNEC-1903', '201', 'Office Organization', 2, 1),
  ('KNEC-1903', '202', 'Supply Chain Management and Purchasing Principles', 2, 1),
  ('KNEC-1903', '203', 'Business Finance', 2, 1),
  ('KNEC-1903', '204', 'Business Law', 2, 1),
  ('KNEC-1903', '205', 'Economics', 2, 1),
  ('KNEC-1903', '207', 'Course Specialization Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 17. Craft Certificate in Business Management - Module I (KNEC-1906)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1906', '101', 'Fundamentals of Management and Environment', 1, 1),
  ('KNEC-1906', '102', 'Business Calculations and Statistics', 1, 1),
  ('KNEC-1906', '103', 'Commerce', 1, 1),
  ('KNEC-1906', '104', 'Information Communication Technology - Theory', 1, 1),
  ('KNEC-1906', '105', 'Communication Skills', 1, 1),
  ('KNEC-1906', '106', 'Financial Accounting', 1, 1),
  ('KNEC-1906', '107', 'Entrepreneurship - Business Plan', 1, 1),
  ('KNEC-1906', '201', 'Office Organization', 2, 1),
  ('KNEC-1906', '202', 'Human and Public Relations', 2, 1),
  ('KNEC-1906', '203', 'Business Finance', 2, 1),
  ('KNEC-1906', '204', 'Business Law', 2, 1),
  ('KNEC-1906', '205', 'Economics', 2, 1),
  ('KNEC-1906', '206', 'Sales and Marketing', 2, 1),
  ('KNEC-1906', '207', 'Course Specialization Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 18. Craft Certificate in Human Resource Management - Module I (KNEC-1908)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1908', '101', 'Elements of Human Resource Management', 1, 1),
  ('KNEC-1908', '102', 'Office Administration & Management', 1, 1),
  ('KNEC-1908', '103', 'Commerce', 1, 1),
  ('KNEC-1908', '104', 'Information Communication Technology', 1, 1),
  ('KNEC-1908', '105', 'Communication', 1, 1),
  ('KNEC-1908', '107', 'Entrepreneurship Project', 1, 1),
  ('KNEC-1908', '201', 'Practice of Human Resource Management', 2, 1),
  ('KNEC-1908', '202', 'Elements of Labour Law & Industrial Relations', 2, 1),
  ('KNEC-1908', '203', 'Bookkeeping & Accounts', 2, 1),
  ('KNEC-1908', '207', 'Course Specialization Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 19. Craft Certificate in Information Studies - Module I (KNEC-1913)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1913', '101', 'Library & Information Centre Operations', 1, 1),
  ('KNEC-1913', '102', 'Information Resources', 1, 1),
  ('KNEC-1913', '103', 'Computer Application in Information', 1, 1),
  ('KNEC-1913', '104', 'Information Communication Technology', 1, 1),
  ('KNEC-1913', '105', 'Communication', 1, 1),
  ('KNEC-1913', '106', 'Quantitative Methods', 1, 1),
  ('KNEC-1913', '107', 'Entrepreneurship Project', 1, 1),
  ('KNEC-1913', '201', 'Records Management', 2, 1),
  ('KNEC-1913', '202', 'Archives Operations', 2, 1),
  ('KNEC-1913', '203', 'Preservation & Conservation of Information', 2, 1),
  ('KNEC-1913', '204', 'Mail Courier Service', 2, 1),
  ('KNEC-1913', '205', 'Professional Ethics', 2, 1),
  ('KNEC-1913', '207', 'Course Specialization Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 20. Craft Certificate in Information Technology - Module I (KNEC-1920)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1920', '101', 'Introduction to Information Communication Technology', 1, 1),
  ('KNEC-1920', '102', 'Computer Applications I- Paper 2 (Practical)', 1, 1),
  ('KNEC-1920', '103', 'Basic Electronics', 1, 1),
  ('KNEC-1920', '104', 'Mathematics', 1, 1),
  ('KNEC-1920', '105', 'Communication', 1, 1),
  ('KNEC-1920', '106', 'Operating Systems', 1, 1),
  ('KNEC-1920', '107', 'Entrepreneurship Project- Business Plan', 1, 1),
  ('KNEC-1920', '201', 'Computer Maintenance & Support', 2, 1),
  ('KNEC-1920', '202', 'Computer Applications II- Paper 2 (Practical)', 2, 1),
  ('KNEC-1920', '203', 'Structured Programming', 2, 1),
  ('KNEC-1920', '207', 'Course Specialization Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 21. Craft Certificate in Project Management - Module I (KNEC-1922)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-1922', '101', 'Fundamentals of Management', 1, 1),
  ('KNEC-1922', '102', 'Business Calculations & Statistics', 1, 1),
  ('KNEC-1922', '103', 'Fundamentals of Project Management', 1, 1),
  ('KNEC-1922', '104', 'Information Communication Technology- Paper 1(Practical)', 1, 1),
  ('KNEC-1922', '105', 'Communication', 1, 1),
  ('KNEC-1922', '107', 'Entrepreneurship Project- Business Plan', 1, 1),
  ('KNEC-1922', '201', 'Principles of Accounting', 2, 1),
  ('KNEC-1922', '202', 'Purchasing & Supplies Management', 2, 1),
  ('KNEC-1922', '203', 'Project Financing', 2, 1),
  ('KNEC-1922', '204', 'Business Law', 2, 1),
  ('KNEC-1922', '205', 'Resource Mobilization', 2, 1),
  ('KNEC-1922', '207', 'Course Specialization Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 22. Craft Certificate in Fashion Design and Garment Making Technology (CFDG-2500)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CFDG-2500', '301', 'Pattern Drafting', 1, 1),
  ('CFDG-2500', '302', 'Garment Construction', 1, 1),
  ('CFDG-2500', '303', 'Fashion Design', 1, 1),
  ('CFDG-2500', '304', 'Textile Science', 1, 1),
  ('CFDG-2500', '305', 'Entrepreneurship', 1, 1),
  ('CFDG-2500', '306', 'Course Specialization Project', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- ============================================================================
-- DIPLOMA LEVEL COURSES (2801-2814) - Module 1, Semester 1
-- ============================================================================

-- 30. Diploma in Secretarial Studies (KNEC-2801)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2801', '301', 'Typewriting (50 WPM)', 1, 1),
  ('KNEC-2801', '302', 'Shorthand (100 WPM)', 1, 1),
  ('KNEC-2801', '303', 'Office Administration & Management', 1, 1),
  ('KNEC-2801', '304', 'Business English', 1, 1),
  ('KNEC-2801', '305', 'Public and Human Relations', 1, 1),
  ('KNEC-2801', '306', 'Commercial & Administrative Law', 1, 1),
  ('KNEC-2801', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1),
  ('KNEC-2801', '308', 'Word Processing', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 31. Diploma in Marketing (KNEC-2802)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2802', '301', 'Marketing Management', 1, 1),
  ('KNEC-2802', '302', 'Marketing Planning & Control', 1, 1),
  ('KNEC-2802', '303', 'Marketing Information Systems & Marketing Research', 1, 1),
  ('KNEC-2802', '304', 'International Marketing', 1, 1),
  ('KNEC-2802', '305', 'Marketing of Services & Agricultural Products', 1, 1),
  ('KNEC-2802', '306', 'Commercial Law', 1, 1),
  ('KNEC-2802', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 32. Diploma in Supplies Management (KNEC-2803)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2803', '301', 'Purchasing Principles & Techniques', 1, 1),
  ('KNEC-2803', '302', 'Purchasing & Supplies Logistics', 1, 1),
  ('KNEC-2803', '303', 'Purchasing & Supplies Provisioning', 1, 1),
  ('KNEC-2803', '304', 'Materials & Production Management', 1, 1),
  ('KNEC-2803', '305', 'Public Procurement', 1, 1),
  ('KNEC-2803', '306', 'Purchasing & Supplies Planning Policy & Organisation', 1, 1),
  ('KNEC-2803', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 33. Diploma in Accountancy (KNEC-2804)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2804', '301', 'Managerial Accounting', 1, 1),
  ('KNEC-2804', '302', 'Financial Accounting', 1, 1),
  ('KNEC-2804', '303', 'Business Finance', 1, 1),
  ('KNEC-2804', '304', 'Auditing', 1, 1),
  ('KNEC-2804', '305', 'Taxation', 1, 1),
  ('KNEC-2804', '306', 'Company Law', 1, 1),
  ('KNEC-2804', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 34. Diploma in Banking & Finance (KNEC-2805)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2805', '301', 'Monetary & Financial Systems', 1, 1),
  ('KNEC-2805', '302', 'Lending', 1, 1),
  ('KNEC-2805', '303', 'Investment', 1, 1),
  ('KNEC-2805', '304', 'Accountancy', 1, 1),
  ('KNEC-2805', '305', 'Branch Banking (Law & Practice)', 1, 1),
  ('KNEC-2805', '306', 'Finance of International Trade (Payments & Services)', 1, 1),
  ('KNEC-2805', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 35. Diploma in Business Administration (KNEC-2806)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2806', '301', 'Managerial Accounting', 1, 1),
  ('KNEC-2806', '302', 'Organisation Theory & Behaviour', 1, 1),
  ('KNEC-2806', '303', 'Office Administration & Management', 1, 1),
  ('KNEC-2806', '304', 'Theory & Practice of Management', 1, 1),
  ('KNEC-2806', '305', 'Human Resource Management & Industrial Relations', 1, 1),
  ('KNEC-2806', '306', 'Commercial & Administrative Law', 1, 1),
  ('KNEC-2806', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 36. Diploma in Co-operative Management (KNEC-2807)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2807', '301', 'Co-operative Accounting', 1, 1),
  ('KNEC-2807', '302', 'Financial Accounting', 1, 1),
  ('KNEC-2807', '303', 'Principles & Practice of Marketing', 1, 1),
  ('KNEC-2807', '304', 'Co-operative Banking', 1, 1),
  ('KNEC-2807', '305', 'Co-operative Law', 1, 1),
  ('KNEC-2807', '306', 'Nature of Co-operative Movement', 1, 1),
  ('KNEC-2807', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 37. Diploma in Personnel Management (KNEC-2808)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2808', '301', 'Accounting & Control', 1, 1),
  ('KNEC-2808', '302', 'Labour & Industrial Relations', 1, 1),
  ('KNEC-2808', '303', 'Office Administration & Management', 1, 1),
  ('KNEC-2808', '304', 'Labour & Industrial Law', 1, 1),
  ('KNEC-2808', '305', 'Human Resource Management', 1, 1),
  ('KNEC-2808', '306', 'Organisation Theory & Behaviour', 1, 1),
  ('KNEC-2808', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 38. Diploma in Information Studies (KNEC-2813)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2813', '301', 'Information Resources', 1, 1),
  ('KNEC-2813', '302', 'Conservation & Restoration of Information Materials', 1, 1),
  ('KNEC-2813', '303', 'Organisation & Retrieval of Information', 1, 1),
  ('KNEC-2813', '304', 'Management of Libraries, Archives & Other Information Centres', 1, 1),
  ('KNEC-2813', '305', 'Dissemination of Information', 1, 1),
  ('KNEC-2813', '306', 'Archival Studies', 1, 1),
  ('KNEC-2813', '307', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 39-41. Diploma in Entrepreneurship Development (KNEC-2814) - Modules I, II, III
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2814', '101', 'Commercial Practice and Record Keeping', 1, 1),
  ('KNEC-2814', '102', 'Entrepreneurship Opportunities & Business Environment', 1, 1),
  ('KNEC-2814', '103', 'Entrepreneurial Behaviour & Start-up Procedures of Small Enterprises', 1, 1),
  ('KNEC-2814', '201', 'Marketing & Research in Small Enterprises', 2, 1),
  ('KNEC-2814', '202', 'Managing Small Business Enterprises', 2, 1),
  ('KNEC-2814', '203', 'Communication & Information Technology (Theory)', 2, 1),
  ('KNEC-2814', '204', 'Communication & Information Technology (Practical)', 2, 1),
  ('KNEC-2814', '301', 'Sectoral Based Operation', 3, 1),
  ('KNEC-2814', '302', 'Production Management and Quantitative Methods', 3, 1),
  ('KNEC-2814', '303', 'Legal Aspects of Small Business Practice', 3, 1),
  ('KNEC-2814', '307', 'Project - Trade Specialization', 3, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- ============================================================================
-- DIPLOMA LEVEL MODULAR COURSES (2901-2920) - Modules I, II, III
-- ============================================================================

-- 42-44. Diploma in Secretarial Duties (KNEC-2901)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2901', '102', 'Shorthand (60 WPM)', 1, 1),
  ('KNEC-2901', '104', 'Economics', 1, 1),
  ('KNEC-2901', '106', 'Computerized Document Processing 1', 1, 1),
  ('KNEC-2901', '107', 'Secretarial Duties', 1, 1),
  ('KNEC-2901', '108', 'Entrepreneurship - Business Plan', 1, 1),
  ('KNEC-2901', '109', 'Information Communication Technology 1', 1, 1),
  ('KNEC-2901', '110', 'Communication 1', 1, 1),
  ('KNEC-2901', '201', 'Computerized Document Processing II', 2, 1),
  ('KNEC-2901', '202', 'Shorthand II', 2, 1),
  ('KNEC-2901', '203', 'Accounting', 2, 1),
  ('KNEC-2901', '204', 'Communication II', 2, 1),
  ('KNEC-2901', '205', 'Information Communication Technology II', 2, 1),
  ('KNEC-2901', '206', 'Commercial & Administrative Law', 2, 1),
  ('KNEC-2901', '301', 'Computerized Document Processing III', 3, 1),
  ('KNEC-2901', '302', 'Shorthand III', 3, 1),
  ('KNEC-2901', '303', 'Office Administration & Management', 3, 1),
  ('KNEC-2901', '304', 'Information Communication Technology III', 3, 1),
  ('KNEC-2901', '305', 'Statistics', 3, 1),
  ('KNEC-2901', '308', 'Course Specialization Project', 3, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 45-47. Diploma in Sales & Marketing (KNEC-2902)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2902', '101', 'Principles and Practice of Selling', 1, 1),
  ('KNEC-2902', '102', 'Principles and Practice of Marketing', 1, 1),
  ('KNEC-2902', '103', 'Information Communication Technology', 1, 1),
  ('KNEC-2902', '104', 'Communication', 1, 1),
  ('KNEC-2902', '105', 'Economics', 1, 1),
  ('KNEC-2902', '108', 'Project', 1, 1),
  ('KNEC-2902', '201', 'Sales Management', 2, 1),
  ('KNEC-2902', '202', 'Marketing Management', 2, 1),
  ('KNEC-2902', '203', 'Legal Aspects in Sales & Marketing', 2, 1),
  ('KNEC-2902', '204', 'Quantitative Methods', 2, 1),
  ('KNEC-2902', '205', 'Public Relations', 2, 1),
  ('KNEC-2902', '301', 'International Marketing', 3, 1),
  ('KNEC-2902', '302', 'Marketing Planning', 3, 1),
  ('KNEC-2902', '303', 'Principles and Practice of Management', 3, 1),
  ('KNEC-2902', '304', 'Financial Aspects of Marketing', 3, 1),
  ('KNEC-2902', '305', 'Strategic Planning in Sales and Marketing', 3, 1),
  ('KNEC-2902', '306', 'Marketing Research', 3, 1),
  ('KNEC-2902', '308', 'Project', 3, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 48-50. Diploma in Supply Chain Management (KNEC-2903)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2903', '107', 'Warehousing Operations and Stock Control', 1, 1),
  ('KNEC-2903', '101', 'Supply Chain Management and Purchasing Principles', 1, 1),
  ('KNEC-2903', '103', 'Information Communication Technology Paper', 1, 1),
  ('KNEC-2903', '102', 'Financial Accounting', 1, 1),
  ('KNEC-2903', '104', 'Communication Skills', 1, 1),
  ('KNEC-2903', '105', 'Economics', 1, 1),
  ('KNEC-2903', '106', 'Business Law', 1, 1),
  ('KNEC-2903', '108', 'Entrepreneurship - Business Plan', 1, 1),
  ('KNEC-2903', '201', 'Purchasing Management', 2, 1),
  ('KNEC-2903', '202', 'Public Procurement and Finance', 2, 1),
  ('KNEC-2903', '203', 'Supply Management', 2, 1),
  ('KNEC-2903', '204', 'Quantitative Methods', 2, 1),
  ('KNEC-2903', '205', 'Principles and Practice of Marketing', 2, 1),
  ('KNEC-2903', '206', 'Cost Accounting', 2, 1),
  ('KNEC-2903', '301', 'Purchasing and Supply Strategy', 3, 1),
  ('KNEC-2903', '302', 'Operations Management', 3, 1),
  ('KNEC-2903', '303', 'Principles and Practice of Management', 3, 1),
  ('KNEC-2903', '304', 'International Purchasing', 3, 1),
  ('KNEC-2903', '305', 'Management Accounting', 3, 1),
  ('KNEC-2903', '306', 'Project and Contract Management', 3, 1),
  ('KNEC-2903', '308', 'Course Specialization Project', 3, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 51-53. Diploma in Business Management (KNEC-2906)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2906', '102', 'Financial Accounting', 1, 1),
  ('KNEC-2906', '103', 'Information Communication Technology Paper', 1, 1),
  ('KNEC-2906', '104', 'Communication Skills', 1, 1),
  ('KNEC-2906', '105', 'Economics', 1, 1),
  ('KNEC-2906', '106', 'Business Law', 1, 1),
  ('KNEC-2906', '108', 'Entrepreneurship - Business Plan', 1, 1),
  ('KNEC-2906', '201', 'Office Administration and Management', 2, 1),
  ('KNEC-2906', '202', 'Marketing Management', 2, 1),
  ('KNEC-2906', '203', 'Supply and Transport Management', 2, 1),
  ('KNEC-2906', '204', 'Quantitative Techniques', 2, 1),
  ('KNEC-2906', '205', 'Commercial and Administrative Law', 2, 1),
  ('KNEC-2906', '206', 'Cost Accounting', 2, 1),
  ('KNEC-2906', '301', 'Organization Theory and Behaviour', 3, 1),
  ('KNEC-2906', '302', 'Labour and Industrial Relations', 3, 1),
  ('KNEC-2906', '303', 'Principles and Practice of Management', 3, 1),
  ('KNEC-2906', '304', 'Managerial Accounting', 3, 1),
  ('KNEC-2906', '305', 'Financial Management', 3, 1),
  ('KNEC-2906', '306', 'Course Specialization Project', 3, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 54-56. Diploma in Human Resource Management (KNEC-2908)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2908', '101', 'Foundation of Human Resource Management', 1, 1),
  ('KNEC-2908', '102', 'Office Administration and Management', 1, 1),
  ('KNEC-2908', '103', 'Information Communication Technology', 1, 1),
  ('KNEC-2908', '104', 'Communication Skills', 1, 1),
  ('KNEC-2908', '108', 'Entrepreneurship - Business Plan', 1, 1),
  ('KNEC-2908', '201', 'Theory & Practice of Human Resource Management', 2, 1),
  ('KNEC-2908', '202', 'Labour & Industrial Law', 2, 1),
  ('KNEC-2908', '204', 'Quantitative Methods', 2, 1),
  ('KNEC-2908', '205', 'Public Relations', 2, 1),
  ('KNEC-2908', '301', 'Organization Theory and Behaviour', 3, 1),
  ('KNEC-2908', '302', 'Labour and Industrial Relations', 3, 1),
  ('KNEC-2908', '303', 'Principles and Practice of Management', 3, 1),
  ('KNEC-2908', '304', 'Accounting and Control', 3, 1),
  ('KNEC-2908', '305', 'Economics', 3, 1),
  ('KNEC-2908', '308', 'Project', 3, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 57-59. Diploma in Information Communication Technology (KNEC-2920)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-2920', '101', 'Introduction to Information Communication Technology & Ethics', 1, 1),
  ('KNEC-2920', '102', 'Computer Application', 1, 1),
  ('KNEC-2920', '103', 'Structured Programming', 1, 1),
  ('KNEC-2920', '104', 'Communication', 1, 1),
  ('KNEC-2920', '105', 'Operating Systems', 1, 1),
  ('KNEC-2920', '106', 'Computational Mathematics', 1, 1),
  ('KNEC-2920', '108', 'Project', 1, 1),
  ('KNEC-2920', '201', 'Systems Analysis and Design', 2, 1),
  ('KNEC-2920', '202', 'Computer Application', 2, 1),
  ('KNEC-2920', '203', 'Object Oriented Programming', 2, 1),
  ('KNEC-2920', '204', 'Quantitative Methods', 2, 1),
  ('KNEC-2920', '205', 'Visual Programming', 2, 1),
  ('KNEC-2920', '206', 'Database Management Systems', 2, 1),
  ('KNEC-2920', '301', 'Data Communication and Networking', 3, 1),
  ('KNEC-2920', '302', 'Management Information Systems', 3, 1),
  ('KNEC-2920', '303', 'Principles and Practice of Management', 3, 1),
  ('KNEC-2920', '307', 'Internet Based Programming', 3, 1),
  ('KNEC-2920', '308', 'Project', 3, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- ============================================================================
-- HIGHER DIPLOMA COURSES (3806-3814) - Modules I & II
-- ============================================================================

-- 60-61. Higher Diploma in Business Management (KNEC-3806)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-3806', '101', 'Business Environment & Strategic Management', 1, 1),
  ('KNEC-3806', '102', 'Management Consultancy & Research Methodology', 1, 1),
  ('KNEC-3806', '103', 'Information Communication Technology', 1, 1),
  ('KNEC-3806', '104', 'Legal Aspects of Business Management', 1, 1),
  ('KNEC-3806', '201', 'Human Resource Management & Organizational Development', 2, 1),
  ('KNEC-3806', '202', 'Operations Research', 2, 1),
  ('KNEC-3806', '203', 'Strategic Marketing Management', 2, 1),
  ('KNEC-3806', '204', 'Management Accounting', 2, 1),
  ('KNEC-3806', '207', 'Project', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 62. Higher Diploma in Human Resource Management (KNEC-3808)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-3808', '201', 'Fundamentals of Human Resources Management', 1, 1),
  ('KNEC-3808', '202', 'Employee Resourcing', 1, 1),
  ('KNEC-3808', '203', 'Training & Development', 1, 1),
  ('KNEC-3808', '204', 'Reward Management', 1, 1),
  ('KNEC-3808', '205', 'Employee Relations', 1, 1),
  ('KNEC-3808', '206', 'Personnel Administration', 1, 1),
  ('KNEC-3808', '207', 'Course Specialisation & Entrepreneurship Projects', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 63. Higher Diploma in Entrepreneurship Development (KNEC-3814)
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('KNEC-3814', '201', 'Entrepreneurial Behaviour', 1, 1),
  ('KNEC-3814', '202', 'Production Management', 1, 1),
  ('KNEC-3814', '203', 'Marketing', 1, 1),
  ('KNEC-3814', '204', 'Human Resources Management', 1, 1),
  ('KNEC-3814', '205', 'Consultancy & Counselling', 1, 1),
  ('KNEC-3814', '206', 'Project Implementation & Evaluation', 1, 1),
  ('KNEC-3814', '207', 'Project Work (Business Plan & Research Projects)', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- ============================================================================
-- NOTE: This file adds all units for KNEC courses.
-- Units are linked to courses via course_id.
-- Module index and semester index are set based on unit code patterns:
-- - 101-107: Module 1, Semester 1
-- - 201-207: Module 2, Semester 1
-- - 301-307: Module 3, Semester 1 (or Module 1 for non-modular courses)
-- Total: All units for 24 KNEC courses with proper unit codes and names.
-- ============================================================================
