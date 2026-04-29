-- Check what the view returns for KNEC-1803 (using UUID from your display)
-- Replace '3c436a0a-f55d-481f-b800-1e042776db2a' with the actual course_id if different

-- First, find the actual course_id
SELECT id, name FROM courses WHERE name LIKE '%Supplies Management%';

-- Then check the view with that UUID (replace the ID below)
SELECT course_id, unit_code, name, module_index, semester_index, id as row_id
FROM v_units_by_module_semester 
WHERE course_id = '3c436a0a-f55d-481f-b800-1e042776db2a'
ORDER BY unit_code, semester_index;

-- Check raw units table
SELECT course_id, unit_code, name, module_index, semester_index
FROM units 
WHERE course_id = '3c436a0a-f55d-481f-b800-1e042776db2a';
