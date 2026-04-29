-- Check units for Higher Diploma course
-- Find the course by name
SELECT c.id, c.name, c.exam_body
FROM courses c
WHERE c.name LIKE '%Entrepreneurship Development%';

-- Check raw units table (replace the UUID with the actual course_id from above)
-- SELECT * FROM units WHERE course_id = '48535525-c5d9-4c04-a816-e909d4fd026f';

-- Check what the view returns
-- SELECT * FROM v_units_by_module_semester WHERE course_id = '48535525-c5d9-4c04-a816-e909d4fd026f';
