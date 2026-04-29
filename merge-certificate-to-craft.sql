-- Merge Certificate into Craft Certificate
-- 1. Move courses to Craft Certificate
-- 2. Update course_types level
-- 3. Delete Certificate qualification level

BEGIN;

DO $$
DECLARE
    cert_id UUID;
    craft_id UUID;
    cert_count INTEGER;
    type_count INTEGER;
BEGIN
    -- Get IDs
    SELECT id INTO cert_id FROM qualification_levels WHERE name = 'Certificate' LIMIT 1;
    SELECT id INTO craft_id FROM qualification_levels WHERE name = 'Craft Certificate' LIMIT 1;
    
    IF cert_id IS NULL THEN
        RAISE NOTICE 'Certificate not found, nothing to merge';
    ELSIF craft_id IS NULL THEN
        RAISE EXCEPTION 'Craft Certificate not found - cannot merge';
    ELSE
        -- Update courses: Certificate -> Craft Certificate
        UPDATE courses
        SET qualification_level_id = craft_id
        WHERE qualification_level_id = cert_id;
        
        GET DIAGNOSTICS cert_count = ROW_COUNT;
        RAISE NOTICE 'Updated % courses from Certificate to Craft Certificate', cert_count;
        
        -- Update course_types: 'certificate' -> 'craft'
        UPDATE course_types
        SET level = 'craft'
        WHERE level = 'certificate';
        
        GET DIAGNOSTICS type_count = ROW_COUNT;
        RAISE NOTICE 'Updated % course_types from certificate to craft', type_count;
        
        -- Delete Certificate qualification level
        DELETE FROM qualification_levels WHERE id = cert_id;
        
        RAISE NOTICE 'Deleted Certificate qualification level';
    END IF;
END $$;

COMMIT;

-- Verify
SELECT id, name, exam_body FROM qualification_levels WHERE exam_body = 'KNEC' ORDER BY name;
