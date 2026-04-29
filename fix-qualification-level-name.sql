-- Update qualification level name from 'Craft/Certificate' to 'Craft'
-- Run this in Supabase SQL Editor

UPDATE qualification_levels
SET name = 'Craft'
WHERE name = 'Craft/Certificate';

-- Verify the update
SELECT id, name, level_order FROM qualification_levels WHERE name LIKE '%Craft%';
