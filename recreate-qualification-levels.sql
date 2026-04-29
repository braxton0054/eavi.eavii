-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Update qualification level names
UPDATE qualification_levels
SET name = 'Artisan Certificate'
WHERE name = 'Artisan';

UPDATE qualification_levels
SET name = 'Craft Certificate'
WHERE name = 'Craft';

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Verify the update
SELECT id, name, exam_body FROM qualification_levels ORDER BY name;
