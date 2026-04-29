-- Update qualification level names in the qualification_levels table
BEGIN;

UPDATE qualification_levels
SET name = 'Artisan Certificate'
WHERE name = 'Artisan';

UPDATE qualification_levels
SET name = 'Craft Certificate'
WHERE name = 'Craft';

COMMIT;

-- Verify the update
SELECT id, name, exam_body FROM qualification_levels ORDER BY name;
