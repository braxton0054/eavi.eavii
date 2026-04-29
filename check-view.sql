-- Check if the view exists and how it works for KNEC-1801
SELECT 
  u.unit_code,
  u.name,
  u.module_index,
  u.semester_index as stored_semester,
  v.semester_index as view_semester
FROM units u
LEFT JOIN v_units_by_module_semester v ON u.unit_code = v.unit_code AND u.course_id = v.course_id
WHERE u.course_id = 'KNEC-1801'
ORDER BY u.unit_code, v.semester_index;

-- Check if view exists
SELECT EXISTS (
  SELECT 1 FROM pg_views WHERE viewname = 'v_units_by_module_semester'
) as view_exists;

-- Check what the view returns for KNEC-1801
SELECT * FROM v_units_by_module_semester WHERE course_id = 'KNEC-1801' ORDER BY unit_code, semester_index;
