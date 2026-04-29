-- Move all courses from Certificate to Craft Certificate
-- This updates both the courses qualification_level_id and course_types level

BEGIN;

-- Get the IDs for Certificate and Craft Certificate
DO $$
DECLARE
    cert_id UUID;
    craft_id UUID;
BEGIN
    SELECT id INTO cert_id FROM qualification_levels WHERE name = 'Certificate' LIMIT 1;
    SELECT id INTO craft_id FROM qualification_levels WHERE name = 'Craft Certificate' LIMIT 1;
    
    IF cert_id IS NULL THEN
        RAISE NOTICE 'Certificate qualification level not found';
    ELSIF craft_id IS NULL THEN
        RAISE NOTICE 'Craft Certificate qualification level not found';
    ELSE
        -- Update courses to use Craft Certificate qualification level
        UPDATE courses
        SET qualification_level_id = craft_id
        WHERE qualification_level_id = cert_id;
        
        RAISE NOTICE 'Updated % courses from Certificate to Craft Certificate', ROW_COUNT;
        
        -- Update course_types level from 'certificate' to 'craft'
        UPDATE course_types
        SET level = 'craft'
        WHERE level = 'certificate';
        
        RAISE NOTICE 'Updated % course_types from certificate to craft', ROW_COUNT;
    END IF;
END $$;

COMMIT;

-- Verify the changes
SELECT 
    c.id,
    c.name,
    ql.name as qualification_level,
    ct.level as course_type_level
FROM courses c
LEFT JOIN qualification_levels ql ON c.qualification_level_id = ql.id
LEFT JOIN course_types ct ON c.id = ct.course_id
WHERE ql.name IN ('Certificate', 'Craft Certificate')
ORDER BY ql.name, c.name;
