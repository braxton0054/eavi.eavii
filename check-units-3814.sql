-- Check units for KNEC-3814 (Higher Diploma)
SELECT 
    u.unit_code,
    u.name,
    u.module_index,
    u.semester_index,
    u.unit_type,
    u.course_id
FROM units u
WHERE u.course_id = '48535525-c5d9-4c04-a816-e909d4fd026f'
ORDER BY u.unit_code;

-- Check what the view returns
SELECT 
    v.unit_code,
    v.name,
    v.module_index,
    v.semester_index,
    v.id as row_id
FROM v_units_by_module_semester v
WHERE v.course_id = '48535525-c5d9-4c04-a816-e909d4fd026f'
ORDER BY v.unit_code, v.semester_index;
