-- Add Artisan Certificate qualification level
SET session_replication_role = 'replica';

INSERT INTO qualification_levels (name, exam_body)
VALUES ('Artisan Certificate', 'KNEC')
ON CONFLICT (name) DO NOTHING;

SET session_replication_role = 'origin';

-- Verify
SELECT id, name, exam_body FROM qualification_levels ORDER BY name;
