-- Update KNEC Craft Certificate courses to use 'craft' level
-- Run this in Supabase SQL Editor

-- Update course_types for KNEC Craft Certificate courses (codes 1804, 1805, 1806, etc.)
UPDATE course_types
SET level = 'craft'
WHERE course_id IN (
  SELECT id FROM courses 
  WHERE id LIKE 'KNEC-18%' -- Craft Certificate courses (1800 series)
  OR id LIKE 'KNEC-190%' -- Craft Certificate Modular (1900 series)
)
AND level != 'craft';

-- Verify the update
SELECT 
  c.id as course_id,
  c.name as course_name,
  ct.level as course_level,
  ct.enabled
FROM courses c
JOIN course_types ct ON c.id = ct.course_id
WHERE c.id LIKE 'KNEC-18%' OR c.id LIKE 'KNEC-190%'
ORDER BY c.id;
