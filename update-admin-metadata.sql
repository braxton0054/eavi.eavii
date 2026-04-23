-- Update admin metadata for EAVI College
-- Run this in Supabase SQL Editor AFTER creating users in Dashboard

-- Update Main Campus Admin metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'campus', 'main',
  'full_name', 'Main Campus Admin'
)
WHERE email = 'maincampus0054@gmail.com';

-- Update West Campus Admin metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'campus', 'west',
  'full_name', 'West Campus Admin'
)
WHERE email = 'wcampus2@gmail.com';

-- Verify the accounts were updated
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'campus' as campus,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE email IN ('maincampus0054@gmail.com', 'wcampus2@gmail.com');
