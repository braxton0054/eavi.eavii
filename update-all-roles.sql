-- Update user roles for all accounts in the system
-- Run this in Supabase SQL Editor to fix role-based access control

-- Update all admin users to have admin role
-- This updates users created through the admin login page
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'admin',
  'campus', COALESCE(raw_user_meta_data->>'campus', 'main'),
  'full_name', COALESCE(raw_user_meta_data->>'full_name', 'Admin')
)
WHERE email IN ('maincampus0054@gmail.com', 'wcampus2@gmail.com');

-- Update all lecturer users to have lecturer role
-- This updates users who registered through lecturer registration
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'lecturer',
  'lecturer_number', raw_user_meta_data->>'lecturer_number',
  'full_name', COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'full_name'),
  'phone_number', COALESCE(raw_user_meta_data->>'phone_number', raw_user_meta_data->>'phone_number')
)
WHERE raw_user_meta_data->>'lecturer_number' IS NOT NULL 
  AND raw_user_meta_data->>'role' IS NULL;

-- Update all student users to have student role
-- This updates users who registered through student registration
UPDATE auth.users
SET raw_user_meta_data = jsonb_build_object(
  'role', 'student',
  'admission_number', raw_user_meta_data->>'admission_number',
  'full_name', COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'full_name'),
  'campus', COALESCE(raw_user_meta_data->>'campus', 'main')
)
WHERE raw_user_meta_data->>'admission_number' IS NOT NULL 
  AND raw_user_meta_data->>'role' IS NULL;

-- Verify the updates
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'campus' as campus,
  raw_user_meta_data->>'lecturer_number' as lecturer_number,
  raw_user_meta_data->>'admission_number' as admission_number,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
ORDER BY created_at DESC;
