-- Migration to add new tables for academic calendar and classes
-- Run this in Supabase SQL Editor

-- Create academic_calendar table
CREATE TABLE IF NOT EXISTS academic_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  academic_year text NOT NULL,
  term integer NOT NULL CHECK (term = ANY (ARRAY[1, 2, 3])),
  semester integer NOT NULL CHECK (semester >= 1 AND semester <= 6),
  term_name text NOT NULL,
  term_start_date date NOT NULL,
  term_end_date date NOT NULL,
  intake_start_date date NOT NULL,
  intake_end_date date NOT NULL,
  cat_opening_date date NOT NULL,
  cat_closing_date date NOT NULL,
  end_term_exam_date date NOT NULL,
  mock_exam_available boolean DEFAULT false,
  mock_exam_date date,
  campus text NOT NULL CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT academic_calendar_pkey PRIMARY KEY (id)
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  class_name text NOT NULL UNIQUE,
  course_id text NOT NULL,
  campus text NOT NULL CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  semester integer NOT NULL CHECK (semester >= 1 AND semester <= 6),
  module_index integer NOT NULL DEFAULT 1,
  intake text NOT NULL,
  intake_month text NOT NULL,
  academic_calendar_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_academic_calendar_id_fkey FOREIGN KEY (academic_calendar_id) REFERENCES academic_calendar(id)
);

-- Add class_id column to applications table if it doesn't exist
ALTER TABLE applications ADD COLUMN IF NOT EXISTS class_id uuid;
