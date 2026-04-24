-- ============================================================================
-- CDACC UNITS DATA
-- Units for CDACC examined courses
-- ============================================================================

-- 1. Automotive Engineering (Certificate) - Modules I-IV
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-454A-AE', '101', 'Vehicle petrol engine maintenance', 1, 1),
  ('CDACC-454A-AE', '102', 'Vehicle braking system maintenance', 1, 1),
  ('CDACC-454A-AE', '201', 'Vehicle Diesel Engine maintenance', 2, 1),
  ('CDACC-454A-AE', '202', 'Vehicle Suspension and steering system Maintenance', 2, 1),
  ('CDACC-454A-AE', '301', 'Communication skills', 3, 1),
  ('CDACC-454A-AE', '302', 'Work ethics and practices', 3, 1),
  ('CDACC-454A-AE', '303', 'Applied mathematics', 3, 1),
  ('CDACC-454A-AE', '304', 'Technical drawing', 3, 1),
  ('CDACC-454A-AE', '305', 'Vehicle fuel system maintenance', 3, 1),
  ('CDACC-454A-AE', '306', 'Automotive electrical systems maintenance', 3, 1),
  ('CDACC-454A-AE', '307', 'Industrial training', 3, 1),
  ('CDACC-454A-AE', '401', 'Basic unit of learning', 4, 1),
  ('CDACC-454A-AE', '402', 'Digital literacy', 4, 1),
  ('CDACC-454A-AE', '403', 'Entrepreneurial skills', 4, 1),
  ('CDACC-454A-AE', '404', 'Workshop technology', 4, 1),
  ('CDACC-454A-AE', '405', 'Mechanical', 4, 1),
  ('CDACC-454A-AE', '406', 'Electrical and electronics principles', 4, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 2. Automotive Technician (Diploma) - Modules I-VIII
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-554A-AT', '101', 'Vehicle petrol engine maintenance', 1, 1),
  ('CDACC-554A-AT', '102', 'Vehicle braking system maintenance', 1, 1),
  ('CDACC-554A-AT', '201', 'Vehicle Diesel Engine maintenance', 2, 1),
  ('CDACC-554A-AT', '202', 'Vehicle Suspension and steering system Maintenance', 2, 1),
  ('CDACC-554A-AT', '301', 'Basic units of learning', 3, 1),
  ('CDACC-554A-AT', '302', 'Communication skills', 3, 1),
  ('CDACC-554A-AT', '303', 'Work ethics and practices', 3, 1),
  ('CDACC-554A-AT', '304', 'Applied mathematics', 3, 1),
  ('CDACC-554A-AT', '305', 'Technical drawing', 3, 1),
  ('CDACC-554A-AT', '401', 'Vehicle fuel system maintenance', 4, 1),
  ('CDACC-554A-AT', '402', 'Automotive electrical systems maintenance', 4, 1),
  ('CDACC-554A-AT', '403', 'Industrial training I', 4, 1),
  ('CDACC-554A-AT', '501', 'Digital literacy', 5, 1),
  ('CDACC-554A-AT', '502', 'Entrepreneurial skills', 5, 1),
  ('CDACC-554A-AT', '503', 'Workshop technology', 5, 1),
  ('CDACC-554A-AT', '504', 'Mechanical science', 5, 1),
  ('CDACC-554A-AT', '505', 'Electrical and electronics principles', 5, 1),
  ('CDACC-554A-AT', '506', 'Vehicle transmission system maintenance', 5, 1),
  ('CDACC-554A-AT', '601', 'Engineering mathematics', 6, 1),
  ('CDACC-554A-AT', '602', 'Computer aided drawing', 6, 1),
  ('CDACC-554A-AT', '603', 'Hybrid and electric vehicle maintenance', 6, 1),
  ('CDACC-554A-AT', '701', 'Engineering mechanics', 7, 1),
  ('CDACC-554A-AT', '702', 'Vehicle safety and security system maintenance', 7, 1),
  ('CDACC-554A-AT', '801', 'Thermodynamics and fluid mechanics', 8, 1),
  ('CDACC-554A-AT', '802', 'Vehicle comfort system maintenance', 8, 1),
  ('CDACC-554A-AT', '803', 'Industrial training II', 8, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 3. Plumbing (Grade Test) - Module I
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-254A-P3', '101', 'Water supply systems I', 1, 1),
  ('CDACC-254A-P3', '102', 'Sanitary appliances installation I', 1, 1),
  ('CDACC-254A-P3', '103', 'Drainage system installation I', 1, 1),
  ('CDACC-254A-P3', '104', 'Industrial training', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 4. Plumbing (Artisan) - Modules I-II
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-254A-P4', '101', 'Water supply system I', 1, 1),
  ('CDACC-254A-P4', '102', 'Sanitary appliances installation I', 1, 1),
  ('CDACC-254A-P4', '103', 'Drainage system installation I', 1, 1),
  ('CDACC-254A-P4', '201', 'Water supply system II', 2, 1),
  ('CDACC-254A-P4', '202', 'Rainwater harvesting system I', 2, 1),
  ('CDACC-254A-P4', '203', 'Drainage system installation II', 2, 1),
  ('CDACC-254A-P4', '204', 'Sanitary appliances II', 2, 1),
  ('CDACC-254A-P4', '205', 'Industrial training', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 5. Plumbing (Certificate) - Modules I-IV
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-254A-P5', '101', 'Water supply system I', 1, 1),
  ('CDACC-254A-P5', '102', 'Sanitary appliances installation I', 1, 1),
  ('CDACC-254A-P5', '103', 'Drainage system installation I', 1, 1),
  ('CDACC-254A-P5', '201', 'Water supply system II', 2, 1),
  ('CDACC-254A-P5', '202', 'Rainwater harvesting system I', 2, 1),
  ('CDACC-254A-P5', '203', 'Drainage system installation II', 2, 1),
  ('CDACC-254A-P5', '204', 'Sanitary appliances II', 2, 1),
  ('CDACC-254A-P5', '301', 'Digital literacy', 3, 1),
  ('CDACC-254A-P5', '302', 'Communication skills', 3, 1),
  ('CDACC-254A-P5', '303', 'Basic mathematics principles', 3, 1),
  ('CDACC-254A-P5', '304', 'Water supply system III', 3, 1),
  ('CDACC-254A-P5', '305', 'Water storage system', 3, 1),
  ('CDACC-254A-P5', '306', 'Industrial training', 3, 1),
  ('CDACC-254A-P5', '401', 'Work ethics and practices', 4, 1),
  ('CDACC-254A-P5', '402', 'Entrepreneurial skills', 4, 1),
  ('CDACC-254A-P5', '403', 'Technical drawing', 4, 1),
  ('CDACC-254A-P5', '404', 'Construction material science', 4, 1),
  ('CDACC-254A-P5', '405', 'Workshop technology skills', 4, 1),
  ('CDACC-254A-P5', '406', 'Fire control systems', 4, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 6. Office Assistance (Artisan) - Modules I-II
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-554A-OA4', '101', 'Office correspondence', 1, 1),
  ('CDACC-554A-OA4', '102', 'Office Customer care duties', 1, 1),
  ('CDACC-554A-OA4', '103', 'Introduction to shorthand skills 1', 1, 1),
  ('CDACC-554A-OA4', '104', 'Introduction to process office documents 1', 1, 1),
  ('CDACC-554A-OA4', '201', 'Office paper records', 2, 1),
  ('CDACC-554A-OA4', '202', 'Office facilities', 2, 1),
  ('CDACC-554A-OA4', '203', 'Business communication', 2, 1),
  ('CDACC-554A-OA4', '204', 'Telephone calls', 2, 1),
  ('CDACC-554A-OA4', '205', 'Industrial Training', 2, 1),
  ('CDACC-554A-OA4', '206', 'Introduction to shorthand skills II', 2, 1),
  ('CDACC-554A-OA4', '207', 'Introduction to process office documents II', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 7. Office Administration (Certificate) - Modules I-IV
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-554A-OA5', '101', 'Office Correspondence', 1, 1),
  ('CDACC-554A-OA5', '102', 'Office Errands', 1, 1),
  ('CDACC-554A-OA5', '103', 'Customer Care Duties', 1, 1),
  ('CDACC-554A-OA5', '104', 'Introduction to Shorthand Skills 1', 1, 1),
  ('CDACC-554A-OA5', '105', 'Introduction to Process Office Documents 1', 1, 1),
  ('CDACC-554A-OA5', '201', 'Office Paper Records', 2, 1),
  ('CDACC-554A-OA5', '202', 'Office Repairs and Maintenance', 2, 1),
  ('CDACC-554A-OA5', '203', 'Introduction to Shorthand Skills II', 2, 1),
  ('CDACC-554A-OA5', '204', 'Introduction to Process Office Documents II', 2, 1),
  ('CDACC-554A-OA5', '205', 'Business Communication', 2, 1),
  ('CDACC-554A-OA5', '206', 'Manage Telephone', 2, 1),
  ('CDACC-554A-OA5', '301', 'Work Ethics and Practices', 3, 1),
  ('CDACC-554A-OA5', '302', 'Intermediate Shorthand Skills', 3, 1),
  ('CDACC-554A-OA5', '303', 'Intermediate Office Documents Processing', 3, 1),
  ('CDACC-554A-OA5', '304', 'ICT skills', 3, 1),
  ('CDACC-554A-OA5', '305', 'Industrial training', 3, 1),
  ('CDACC-554A-OA5', '401', 'Commerce', 4, 1),
  ('CDACC-554A-OA5', '402', 'Entrepreneurial SKILLS', 4, 1),
  ('CDACC-554A-OA5', '403', 'Office Security', 4, 1),
  ('CDACC-554A-OA5', '404', 'Office Administration Duties Management', 4, 1),
  ('CDACC-554A-OA5', '405', 'Official Meetings Coordination', 4, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 8. Office Administration (Diploma) - Modules I-V
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-554A-OA6', '101', 'Office correspondence', 1, 1),
  ('CDACC-554A-OA6', '102', 'Office errands', 1, 1),
  ('CDACC-554A-OA6', '103', 'Customer care duties', 1, 1),
  ('CDACC-554A-OA6', '104', 'Introduction to shorthand skills I', 1, 1),
  ('CDACC-554A-OA6', '105', 'Introduction to process office documents 1', 1, 1),
  ('CDACC-554A-OA6', '201', 'Office paper records', 2, 1),
  ('CDACC-554A-OA6', '202', 'Office repairs and maintenance', 2, 1),
  ('CDACC-554A-OA6', '203', 'Introduction to shorthand skills II', 2, 1),
  ('CDACC-554A-OA6', '204', 'Introduction to process office documents II', 2, 1),
  ('CDACC-554A-OA6', '205', 'Undertake business communication', 2, 1),
  ('CDACC-554A-OA6', '206', 'Manage telephone calls', 2, 1),
  ('CDACC-554A-OA6', '301', 'Apply work ethics and practices', 3, 1),
  ('CDACC-554A-OA6', '302', 'Intermediate office documents processing', 3, 1),
  ('CDACC-554A-OA6', '303', 'Apply ICT skills', 3, 1),
  ('CDACC-554A-OA6', '401', 'Apply commerce principles', 4, 1),
  ('CDACC-554A-OA6', '402', 'Apply entrepreneurial skills', 4, 1),
  ('CDACC-554A-OA6', '403', 'Manage office security', 4, 1),
  ('CDACC-554A-OA6', '404', 'Office administration duties management', 4, 1),
  ('CDACC-554A-OA6', '405', 'Official meetings coordination', 4, 1),
  ('CDACC-554A-OA6', '406', 'Industrial training I', 4, 1),
  ('CDACC-554A-OA6', '501', 'Advanced shorthand skills', 5, 1),
  ('CDACC-554A-OA6', '502', 'Principles of commercial law', 5, 1),
  ('CDACC-554A-OA6', '503', 'Research project', 5, 1),
  ('CDACC-554A-OA6', '504', 'Economics skills application', 5, 1),
  ('CDACC-554A-OA6', '505', 'Advanced process office documents II', 5, 1),
  ('CDACC-554A-OA6', '506', 'Industrial training II', 5, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 9. Public Administration (Diploma) - Modules I-V
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-554A-PA', '101', 'Digital Literacy', 1, 1),
  ('CDACC-554A-PA', '102', 'Public Communication', 1, 1),
  ('CDACC-554A-PA', '103', 'Conflict resolution and management', 1, 1),
  ('CDACC-554A-PA', '104', 'Coordination of Government Policies and Programmes', 1, 1),
  ('CDACC-554A-PA', '201', 'Communication Skills', 2, 1),
  ('CDACC-554A-PA', '202', 'Public Security Management', 2, 1),
  ('CDACC-554A-PA', '301', 'Work Ethics and Practices', 3, 1),
  ('CDACC-554A-PA', '302', 'Crisis and Disaster Management', 3, 1),
  ('CDACC-554A-PA', '303', 'Immigration and Registrations', 3, 1),
  ('CDACC-554A-PA', '401', 'Entrepreneurial skills', 4, 1),
  ('CDACC-554A-PA', '402', 'Human Resources Management', 4, 1),
  ('CDACC-554A-PA', '403', 'Land Administration Services', 4, 1),
  ('CDACC-554A-PA', '501', 'Public Administration Research Work', 5, 1),
  ('CDACC-554A-PA', '502', 'Public Finances Management', 5, 1),
  ('CDACC-554A-PA', '503', 'Regional and International Cooperation', 5, 1),
  ('CDACC-554A-PA', '504', 'Industry training', 5, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 10. Community Health (Certificate) - Modules I-IV
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-454A-CH5', '101', 'Digital literacy', 1, 1),
  ('CDACC-454A-CH5', '102', 'Nutrition in community health', 1, 1),
  ('CDACC-454A-CH5', '103', 'Community health information system', 1, 1),
  ('CDACC-454A-CH5', '104', 'Maternal, newborn and child health care', 1, 1),
  ('CDACC-454A-CH5', '201', 'Communication Skills', 2, 1),
  ('CDACC-454A-CH5', '202', 'Microbiology and Parasitology', 2, 1),
  ('CDACC-454A-CH5', '203', 'Community Health Promotion Services', 2, 1),
  ('CDACC-454A-CH5', '204', 'Community Health Strategies', 2, 1),
  ('CDACC-454A-CH5', '301', 'Work Ethics and Practices', 3, 1),
  ('CDACC-454A-CH5', '302', 'Human anatomy and physiology', 3, 1),
  ('CDACC-454A-CH5', '303', 'Community health linkages', 3, 1),
  ('CDACC-454A-CH5', '304', 'Community-based health care', 3, 1),
  ('CDACC-454A-CH5', '401', 'Entrepreneurship education', 4, 1),
  ('CDACC-454A-CH5', '402', 'Epidemiology in community', 4, 1),
  ('CDACC-454A-CH5', '403', 'Gender, disability & Vulnerable Groups', 4, 1),
  ('CDACC-454A-CH5', '404', 'Community health Diagnosis and Partnership', 4, 1),
  ('CDACC-454A-CH5', '405', 'Industrial training', 4, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 11. Community Health (Diploma) - Modules I-VI
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-554A-CH6', '101', 'Digital Nutrition in Community Health', 1, 1),
  ('CDACC-554A-CH6', '102', 'Community Health Information System', 1, 1),
  ('CDACC-554A-CH6', '103', 'Maternal, Newborn and Child Health care', 1, 1),
  ('CDACC-554A-CH6', '201', 'Communication Skills', 2, 1),
  ('CDACC-554A-CH6', '202', 'Microbiology and Parasitology', 2, 1),
  ('CDACC-554A-CH6', '203', 'Community Health Education and Promotion', 2, 1),
  ('CDACC-554A-CH6', '204', 'Community Health Strategies', 2, 1),
  ('CDACC-554A-CH6', '301', 'Work Ethics and Practices', 3, 1),
  ('CDACC-554A-CH6', '302', 'Human Anatomy and Physiology', 3, 1),
  ('CDACC-554A-CH6', '303', 'Community Health Linkages', 3, 1),
  ('CDACC-554A-CH6', '304', 'Community-based Health Care', 3, 1),
  ('CDACC-554A-CH6', '401', 'Entrepreneurial Skills', 4, 1),
  ('CDACC-554A-CH6', '402', 'Epidemiology in Community', 4, 1),
  ('CDACC-554A-CH6', '403', 'Gender, Disability, and Vulnerable Groups', 4, 1),
  ('CDACC-554A-CH6', '404', 'Community Health Diagnosis and Partnership', 4, 1),
  ('CDACC-554A-CH6', '405', 'Industrial training I', 4, 1),
  ('CDACC-554A-CH6', '501', 'Manage Common Diseases and Ailments', 5, 1),
  ('CDACC-554A-CH6', '502', 'First Aid Services', 5, 1),
  ('CDACC-554A-CH6', '503', 'Community Health Care', 5, 1),
  ('CDACC-554A-CH6', '504', 'Health System Management', 5, 1),
  ('CDACC-554A-CH6', '505', 'Apply Basic Statistics in Community Health', 5, 1),
  ('CDACC-554A-CH6', '601', 'Community Health Research', 6, 1),
  ('CDACC-554A-CH6', '602', 'Community Health Programs Monitoring and Evaluation', 6, 1),
  ('CDACC-554A-CH6', '603', 'Environmental Health', 6, 1),
  ('CDACC-554A-CH6', '604', 'Fundamentals of Primary Health Care', 6, 1),
  ('CDACC-554A-CH6', '605', 'Geriatric care', 6, 1),
  ('CDACC-554A-CH6', '606', 'Industry Training II', 6, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 12. Electrical Installation/Engineering (Artisan) - Modules I-II
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-354A-EI4', '101', 'Pvc sheathed cable system installation', 1, 1),
  ('CDACC-354A-EI4', '102', 'Trunking system installation', 1, 1),
  ('CDACC-354A-EI4', '103', 'Conduit system installation', 1, 1),
  ('CDACC-354A-EI4', '104', 'Basic ICT', 1, 1),
  ('CDACC-354A-EI4', '105', 'Life Skills', 1, 1),
  ('CDACC-354A-EI4', '201', 'Stand-alone solar pv systems', 2, 1),
  ('CDACC-354A-EI4', '202', 'Bell and alarm installation', 2, 1),
  ('CDACC-354A-EI4', '203', 'Electrical machine winding', 2, 1),
  ('CDACC-354A-EI4', '204', 'Industrial training', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 13. Electrical Installation/Engineering (Certificate) - Modules I-V
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-354A-EI5', '101', 'Pvc sheathed cable system installation', 1, 1),
  ('CDACC-354A-EI5', '102', 'Trunking system installation', 1, 1),
  ('CDACC-354A-EI5', '103', 'Conduit system installation', 1, 1),
  ('CDACC-354A-EI5', '201', 'Stand-alone solar pv systems', 2, 1),
  ('CDACC-354A-EI5', '202', 'Bell and alarm installation', 2, 1),
  ('CDACC-354A-EI5', '203', 'Electrical machine winding', 2, 1),
  ('CDACC-354A-EI5', '301', 'Digital literacy', 3, 1),
  ('CDACC-354A-EI5', '302', 'Communication skills', 3, 1),
  ('CDACC-354A-EI5', '303', 'Basic electrical principles', 3, 1),
  ('CDACC-354A-EI5', '304', 'Technical drawing', 3, 1),
  ('CDACC-354A-EI5', '305', 'Electrical installation', 3, 1),
  ('CDACC-354A-EI5', '306', 'Industrial training', 3, 1),
  ('CDACC-354A-EI5', '401', 'Work ethics and practices', 4, 1),
  ('CDACC-354A-EI5', '402', 'Engineering technician mathematics I', 4, 1),
  ('CDACC-354A-EI5', '403', 'Analogue electronics I', 4, 1),
  ('CDACC-354A-EI5', '404', 'Digital electronics I', 4, 1),
  ('CDACC-354A-EI5', '405', 'Security system installation', 4, 1),
  ('CDACC-354A-EI5', '501', 'Entrepreneurial skills', 5, 1),
  ('CDACC-354A-EI5', '502', 'Engineering technician mathematics II', 5, 1),
  ('CDACC-354A-EI5', '503', 'Analogue electronics II', 5, 1),
  ('CDACC-354A-EI5', '504', 'Digital electronics II', 5, 1),
  ('CDACC-354A-EI5', '505', 'Electrical machines installation', 5, 1),
  ('CDACC-354A-EI5', '506', 'Solar pv systems installation', 5, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 14. Electrical Installation/Engineering (Diploma) - Modules I-VIII
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-354A-EI6', '101', 'Pvc sheathed cable system installation', 1, 1),
  ('CDACC-354A-EI6', '102', 'Trunking system installation', 1, 1),
  ('CDACC-354A-EI6', '103', 'Conduit system installation', 1, 1),
  ('CDACC-354A-EI6', '201', 'Stand-alone solar pv systems', 2, 1),
  ('CDACC-354A-EI6', '202', 'Bell and alarm installation', 2, 1),
  ('CDACC-354A-EI6', '203', 'Electrical machine winding', 2, 1),
  ('CDACC-354A-EI6', '301', 'Digital literacy', 3, 1),
  ('CDACC-354A-EI6', '302', 'Communication skills', 3, 1),
  ('CDACC-354A-EI6', '303', 'Basic electrical principles', 3, 1),
  ('CDACC-354A-EI6', '304', 'Technical drawing', 3, 1),
  ('CDACC-354A-EI6', '305', 'Electrical installation', 3, 1),
  ('CDACC-354A-EI6', '401', 'Work ethics and practices', 4, 1),
  ('CDACC-354A-EI6', '402', 'Engineering technician mathematics I', 4, 1),
  ('CDACC-354A-EI6', '403', 'Analogue electronics I', 4, 1),
  ('CDACC-354A-EI6', '404', 'Digital electronics I', 4, 1),
  ('CDACC-354A-EI6', '405', 'Security system installation', 4, 1),
  ('CDACC-354A-EI6', '406', 'Industrial training I', 4, 1),
  ('CDACC-354A-EI6', '501', 'Entrepreneurial skills', 5, 1),
  ('CDACC-354A-EI6', '502', 'Engineering technician mathematics II', 5, 1),
  ('CDACC-354A-EI6', '503', 'Analogue electronics II', 5, 1),
  ('CDACC-354A-EI6', '504', 'Digital electronics II', 5, 1),
  ('CDACC-354A-EI6', '505', 'Electrical machines installation', 5, 1),
  ('CDACC-354A-EI6', '506', 'Solar pv systems installation', 5, 1),
  ('CDACC-354A-EI6', '601', 'Engineering technician mathematics III', 6, 1),
  ('CDACC-354A-EI6', '602', 'Micro-control systems', 6, 1),
  ('CDACC-354A-EI6', '603', 'Electrical power lines installation', 6, 1),
  ('CDACC-354A-EI6', '701', 'Engineering technician mathematics IV', 7, 1),
  ('CDACC-354A-EI6', '702', 'Electrical principles II', 7, 1),
  ('CDACC-354A-EI6', '703', 'Control systems', 7, 1),
  ('CDACC-354A-EI6', '704', 'Electrical systems automation', 7, 1),
  ('CDACC-354A-EI6', '801', 'Research methods', 8, 1),
  ('CDACC-354A-EI6', '802', 'Electrical project supervision', 8, 1),
  ('CDACC-354A-EI6', '803', 'Electrical measurement and fault diagnosis', 8, 1),
  ('CDACC-354A-EI6', '804', 'Power electronic circuits fabrication', 8, 1),
  ('CDACC-354A-EI6', '805', 'Industrial training II', 8, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 15. Electronics Technology (Grade Test) - Module I
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-254B-ET3', '101', 'Electrical installation i', 1, 1),
  ('CDACC-254B-ET3', '102', 'Electrical and electronic equipment and appliance repairs', 1, 1),
  ('CDACC-254B-ET3', '103', 'Electrical instrumentation', 1, 1),
  ('CDACC-254B-ET3', '104', 'Basic ICT', 1, 1),
  ('CDACC-254B-ET3', '105', 'Life skills', 1, 1),
  ('CDACC-254B-ET3', '106', 'Industrial training', 1, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 16. Electronics Technology (Artisan) - Modules I-II
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-254B-ET4', '101', 'Electrical installation I', 1, 1),
  ('CDACC-254B-ET4', '102', 'Electrical and electronic equipment and appliance repairs', 1, 1),
  ('CDACC-254B-ET4', '103', 'Electrical instrumentation', 1, 1),
  ('CDACC-254B-ET4', '201', 'Electrical installation II', 2, 1),
  ('CDACC-254B-ET4', '202', 'Power supply systems', 2, 1),
  ('CDACC-254B-ET4', '203', 'Electrical and electronic equipment and appliances maintenance', 2, 1),
  ('CDACC-254B-ET4', '204', 'Industrial attachment', 2, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 17. Electronics Technology (Certificate) - Modules I-IV
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-254B-ET5', '101', 'Electrical installation I', 1, 1),
  ('CDACC-254B-ET5', '102', 'Electrical and electronic equipment and appliance repairs', 1, 1),
  ('CDACC-254B-ET5', '103', 'Electrical instrumentation', 1, 1),
  ('CDACC-254B-ET5', '201', 'Electrical installation II', 2, 1),
  ('CDACC-254B-ET5', '202', 'Power supply systems II', 2, 1),
  ('CDACC-254B-ET5', '203', 'Electrical and electronic equipment and appliances maintenance', 2, 1),
  ('CDACC-254B-ET5', '301', 'Digital literacy', 3, 1),
  ('CDACC-254B-ET5', '302', 'Communication skills', 3, 1),
  ('CDACC-254B-ET5', '303', 'Electrical principles I', 3, 1),
  ('CDACC-254B-ET5', '304', 'Technical drawing', 3, 1),
  ('CDACC-254B-ET5', '305', 'Engineering technician mathematics I', 3, 1),
  ('CDACC-254B-ET5', '306', 'Power supply systems II', 3, 1),
  ('CDACC-254B-ET5', '307', 'Industrial training', 3, 1),
  ('CDACC-254B-ET5', '401', 'Work ethics and practices', 4, 1),
  ('CDACC-254B-ET5', '402', 'Entrepreneurial skills', 4, 1),
  ('CDACC-254B-ET5', '403', 'Analogue electronics', 4, 1),
  ('CDACC-254B-ET5', '404', 'Digital electronics', 4, 1),
  ('CDACC-254B-ET5', '405', 'Electrical principles II', 4, 1),
  ('CDACC-254B-ET5', '406', 'Electrical instrumentation II', 4, 1),
  ('CDACC-254B-ET5', '407', 'Security systems installation', 4, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;

-- 18. Electronics Technology (Diploma) - Modules I-VI
INSERT INTO units (course_id, unit_code, name, module_index, semester_index) VALUES
  ('CDACC-254B-ET6', '101', 'Electrical installation I', 1, 1),
  ('CDACC-254B-ET6', '102', 'Electrical and electronic equipment and appliance repairs', 1, 1),
  ('CDACC-254B-ET6', '103', 'Electrical instrumentation', 1, 1),
  ('CDACC-254B-ET6', '201', 'Electrical installation II', 2, 1),
  ('CDACC-254B-ET6', '202', 'Power supply systems I', 2, 1),
  ('CDACC-254B-ET6', '203', 'Electrical, electronic equipment, appliances maintenance', 2, 1),
  ('CDACC-254B-ET6', '301', 'Digital literacy', 3, 1),
  ('CDACC-254B-ET6', '302', 'Communication skills', 3, 1),
  ('CDACC-254B-ET6', '303', 'Electrical principles I', 3, 1),
  ('CDACC-254B-ET6', '304', 'Technical drawing', 3, 1),
  ('CDACC-254B-ET6', '305', 'Electronics engineering mathematics I', 3, 1),
  ('CDACC-254B-ET6', '306', 'Power supply systems II', 3, 1),
  ('CDACC-254B-ET6', '401', 'Work ethics and practices', 4, 1),
  ('CDACC-254B-ET6', '402', 'Entrepreneurial skills', 4, 1),
  ('CDACC-254B-ET6', '403', 'Analogue electronics', 4, 1),
  ('CDACC-254B-ET6', '404', 'Digital electronics', 4, 1),
  ('CDACC-254B-ET6', '405', 'Electrical principles II', 4, 1),
  ('CDACC-254B-ET6', '406', 'Electrical instrumentation II', 4, 1),
  ('CDACC-254B-ET6', '407', 'Security systems installation', 4, 1),
  ('CDACC-254B-ET6', '408', 'Industrial training', 4, 1),
  ('CDACC-254B-ET6', '501', 'Electronics engineering mathematics II', 5, 1),
  ('CDACC-254B-ET6', '502', 'Electrical principles III', 5, 1),
  ('CDACC-254B-ET6', '503', 'Electrical installation III', 5, 1),
  ('CDACC-254B-ET6', '504', 'Electrical machine control systems', 5, 1),
  ('CDACC-254B-ET6', '601', 'Research methods', 6, 1),
  ('CDACC-254B-ET6', '602', 'Electrical project supervision', 6, 1),
  ('CDACC-254B-ET6', '603', 'Industrial automation', 6, 1),
  ('CDACC-254B-ET6', '604', 'Automation and radio frequency systems maintenance', 6, 1),
  ('CDACC-254B-ET6', '605', 'Industrial training II', 6, 1)
ON CONFLICT (course_id, unit_code) DO NOTHING;
