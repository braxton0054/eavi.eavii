-- Fix RLS policy violation for classes table
-- Run this in Supabase SQL Editor

-- Disable RLS on classes table to allow inserts
ALTER TABLE public.classes DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'classes';
