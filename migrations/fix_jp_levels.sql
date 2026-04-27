-- Fix: Correctly tag JP levels that were wrongly assigned to CDACC
-- JP levels have "(JP" in their names

-- First, reset all Level 3-6 to NULL (they were all tagged as CDACC)
UPDATE qualification_levels 
SET exam_body = NULL 
WHERE name LIKE '%Level%';

-- Tag CDACC levels (they have "(CDACC" in name)
UPDATE qualification_levels 
SET exam_body = 'CDACC'
WHERE name ILIKE '%(CDACC%';

-- Tag JP levels (they have "(JP" in name)
UPDATE qualification_levels 
SET exam_body = 'JP'
WHERE name ILIKE '%(JP%';

-- Tag KNEC levels (diploma, certificate, artisan without "Level")
UPDATE qualification_levels 
SET exam_body = 'KNEC'
WHERE (name ILIKE '%diploma%' OR name ILIKE '%certificate%' OR name ILIKE '%artisan%')
  AND name NOT ILIKE '%level%';

-- Verify the fix
SELECT id, name, exam_body 
FROM qualification_levels 
ORDER BY exam_body, name;
