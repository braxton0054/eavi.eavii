-- First, let's verify the Artisan courses and their exam_body
SELECT 
    c.id,
    c.name,
    c.exam_body,
    ct.level,
    ct.enabled
FROM courses c
JOIN course_types ct ON c.id = ct.course_id
WHERE ct.level = 'artisan';

-- Check units for these courses
SELECT 
    u.course_id,
    u.unit_code,
    u.name,
    u.module_index,
    u.semester_index,
    c.exam_body
FROM units u
JOIN courses c ON u.course_id = c.id
WHERE u.course_id IN (
    'b09fbcb8-4227-413e-b925-f6970ac6f5c5',
    '814301ff-3393-4b98-a417-18f6055e0094',
    '1a7a3d0c-18a0-4120-9459-e2543cdbe582'
)
ORDER BY u.course_id, u.unit_code;
