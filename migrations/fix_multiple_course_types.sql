-- Fix courses with multiple enabled course types
-- These were likely created with the old system allowing multiple levels

-- First, check which courses have multiple enabled course types
SELECT 
  c.id,
  c.name,
  COUNT(ct.id) as enabled_count,
  STRING_AGG(ct.level, ', ') as levels
FROM courses c
JOIN course_types ct ON ct.course_id = c.id AND ct.enabled = true
GROUP BY c.id, c.name
HAVING COUNT(ct.id) > 1
ORDER BY c.id;

-- To fix a specific course (e.g., 0801), you need to:
-- 1. Decide which level to keep
-- 2. Disable or delete the others

-- Example: For course 0801, keep only 'artisan' and disable 'diploma':
-- UPDATE course_types SET enabled = false 
-- WHERE course_id = 'KNEC-0801' AND level = 'diploma';

-- Or delete the unwanted level entirely:
-- DELETE FROM course_types 
-- WHERE course_id = 'KNEC-0801' AND level = 'diploma';

-- Generic fix: Keep only the first enabled level for each course and disable others
-- (Run this only if you want to automatically fix all courses)
/*
WITH ranked_types AS (
  SELECT 
    id,
    course_id,
    level,
    ROW_NUMBER() OVER (PARTITION BY course_id ORDER BY created_at) as rn
  FROM course_types
  WHERE enabled = true
)
UPDATE course_types ct
SET enabled = false
FROM ranked_types rt
WHERE ct.id = rt.id AND rt.rn > 1;
*/
