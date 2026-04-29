-- Update course_types level from 'artisan' to 'craft'
BEGIN;

UPDATE course_types
SET level = 'craft'
WHERE level = 'artisan';

COMMIT;

-- Verify the update
SELECT ct.id, ct.course_id, ct.level, c.name as course_name
FROM course_types ct
JOIN courses c ON ct.course_id = c.id
WHERE ct.level = 'craft';
