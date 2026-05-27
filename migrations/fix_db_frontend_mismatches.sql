-- ============================================================
-- Migration: Fix database-frontend compatibility issues
-- Created: 2026-05-26
-- ============================================================

-- 1. Create missing reporting_dates table (referenced in AdmissionLetter.tsx:125)
CREATE TABLE IF NOT EXISTS public.reporting_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020 AND year <= 2100),
  reporting_date date NOT NULL,
  campus text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(month, year, campus)
);

ALTER TABLE public.reporting_dates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "reporting_dates_select" ON public.reporting_dates FOR SELECT USING (true);
CREATE POLICY "reporting_dates_insert" ON public.reporting_dates FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "reporting_dates_update" ON public.reporting_dates FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Default reporting dates for 2026
INSERT INTO public.reporting_dates (month, year, reporting_date) VALUES
  (1, 2026, '2026-01-15'), (2, 2026, '2026-02-15'), (3, 2026, '2026-03-15'),
  (4, 2026, '2026-04-15'), (5, 2026, '2026-05-15'), (6, 2026, '2026-06-15'),
  (7, 2026, '2026-07-15'), (8, 2026, '2026-08-15'), (9, 2026, '2026-09-15'),
  (10, 2026, '2026-10-15'), (11, 2026, '2026-11-15'), (12, 2026, '2026-12-15')
ON CONFLICT DO NOTHING;

-- 2. Add missing columns to semesters table (frontend expects course_id, module_index)
ALTER TABLE public.semesters
  ADD COLUMN IF NOT EXISTS course_id text,
  ADD COLUMN IF NOT EXISTS module_index integer;

-- Backfill from modules -> course_types
UPDATE public.semesters s
SET course_id = ct.course_id, module_index = m.module_index
FROM public.modules m
JOIN public.course_types ct ON ct.id = m.course_type_id
WHERE s.module_id = m.id AND s.course_id IS NULL;

-- Auto-maintain trigger for future inserts
CREATE OR REPLACE FUNCTION maintain_semester_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.course_id IS NULL OR NEW.module_index IS NULL THEN
    SELECT ct.course_id, m.module_index
    INTO NEW.course_id, NEW.module_index
    FROM public.modules m
    JOIN public.course_types ct ON ct.id = m.course_type_id
    WHERE m.id = NEW.module_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_maintain_semester_columns ON public.semesters;
CREATE TRIGGER trg_maintain_semester_columns
  BEFORE INSERT ON public.semesters
  FOR EACH ROW EXECUTE FUNCTION maintain_semester_columns();

-- 3. Add id column to units table (frontend references units.id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'units' AND column_name = 'id'
  ) THEN
    ALTER TABLE public.units ADD COLUMN id uuid DEFAULT gen_random_uuid();
    UPDATE public.units SET id = gen_random_uuid() WHERE id IS NULL;
  END IF;
END
$$;

-- 4. Add semester column to fee_payments (frontend uses fee_payments.semester)
ALTER TABLE public.fee_payments ADD COLUMN IF NOT EXISTS semester integer;

-- 5. Add course column to lecturer_assignments (frontend uses lecturer_assignments.course)
ALTER TABLE public.lecturer_assignments ADD COLUMN IF NOT EXISTS course text;
UPDATE public.lecturer_assignments la
SET course = c.name
FROM public.courses c
WHERE la.course_id = c.id AND la.course IS NULL;
