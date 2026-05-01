-- Make academic_calendar_id nullable in classes table
-- Run this in Supabase SQL Editor

ALTER TABLE public.classes ALTER COLUMN academic_calendar_id DROP NOT NULL;
