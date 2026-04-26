-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.academic_calendar (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  academic_year text NOT NULL,
  term integer NOT NULL CHECK (term = ANY (ARRAY[1, 2, 3])),
  semester integer NOT NULL CHECK (semester >= 1 AND semester <= 6),
  term_name text NOT NULL,
  term_start_date date NOT NULL,
  term_end_date date NOT NULL,
  intake_start_date date NOT NULL,
  intake_end_date date NOT NULL,
  bridge_trigger_day integer DEFAULT 45,
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
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])),
  kcse_grade text NOT NULL,
  exam_body text DEFAULT 'internal'::text CHECK (exam_body = ANY (ARRAY['internal'::text, 'JP'::text, 'CDACC'::text, 'KNEC'::text])),
  intake text DEFAULT 'September'::text,
  course_id text NOT NULL,
  course_type_id uuid NOT NULL,
  campus text NOT NULL CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  admission_number text UNIQUE,
  application_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'enrolled'::text, 'rejected'::text])),
  stream_type text DEFAULT 'main'::text CHECK (stream_type = ANY (ARRAY['main'::text, 'bridge'::text])),
  bridge_group_id uuid,
  bridge_start_date date,
  sync_target_date date,
  acceleration_factor numeric DEFAULT 1.0 CHECK (acceleration_factor >= 1.0),
  current_module integer NOT NULL DEFAULT 1 CHECK (current_module >= 1),
  current_semester integer NOT NULL DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 6),
  class_name text,
  financial_hold boolean DEFAULT false,
  total_balance numeric DEFAULT 0,
  last_payment_date date,
  transcript_unlocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT applications_course_type_id_fkey FOREIGN KEY (course_type_id) REFERENCES public.course_types(id),
  CONSTRAINT applications_bridge_group_id_fkey FOREIGN KEY (bridge_group_id) REFERENCES public.bridge_groups(id)
);
CREATE TABLE public.bridge_exam_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bridge_group_id uuid NOT NULL,
  exam_name text NOT NULL,
  exam_type text NOT NULL CHECK (exam_type = ANY (ARRAY['cat'::text, 'end_term'::text, 'mock'::text, 'milestone'::text])),
  scheduled_date date NOT NULL,
  main_group_exam_date date,
  units ARRAY,
  status text DEFAULT 'scheduled'::text CHECK (status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bridge_exam_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT bridge_exam_schedules_bridge_group_id_fkey FOREIGN KEY (bridge_group_id) REFERENCES public.bridge_groups(id)
);
CREATE TABLE public.bridge_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  group_name text NOT NULL,
  intake text NOT NULL,
  academic_calendar_id uuid NOT NULL,
  campus text NOT NULL CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  start_date date NOT NULL,
  sync_target_date date NOT NULL,
  acceleration_factor numeric NOT NULL DEFAULT 1.5 CHECK (acceleration_factor >= 1.0),
  milestone_module integer NOT NULL DEFAULT 1,
  milestone_semester integer NOT NULL DEFAULT 1,
  holiday_bypass_enabled boolean DEFAULT true,
  catch_up_hours_needed integer DEFAULT 0,
  catch_up_hours_completed integer DEFAULT 0,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'merged'::text, 'cancelled'::text])),
  merged_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bridge_groups_pkey PRIMARY KEY (id),
  CONSTRAINT bridge_groups_academic_calendar_id_fkey FOREIGN KEY (academic_calendar_id) REFERENCES public.academic_calendar(id)
);
CREATE TABLE public.course_types (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  level text NOT NULL CHECK (level = ANY (ARRAY['diploma'::text, 'certificate'::text, 'artisan'::text, 'level6'::text, 'level5'::text, 'level4'::text, 'level3'::text])),
  enabled boolean NOT NULL DEFAULT false,
  study_mode text NOT NULL CHECK (study_mode = ANY (ARRAY['module'::text, 'short-course'::text])),
  duration_months integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  exam_fee numeric NOT NULL DEFAULT 0,
  CONSTRAINT course_types_pkey PRIMARY KEY (id),
  CONSTRAINT course_types_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.courses (
  id text NOT NULL,
  name text NOT NULL,
  department_id uuid NOT NULL,
  qualification_level_id uuid,
  min_kcse_grade text NOT NULL DEFAULT 'C-'::text,
  exam_body text NOT NULL DEFAULT 'KNEC'::text CHECK (exam_body = ANY (ARRAY['internal'::text, 'JP'::text, 'CDACC'::text, 'KNEC'::text])),
  fee_per_semester numeric DEFAULT 0.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT courses_qualification_level_id_fkey FOREIGN KEY (qualification_level_id) REFERENCES public.qualification_levels(id)
);
CREATE TABLE public.departments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text NOT NULL UNIQUE,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT departments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.exam_marks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  campus text NOT NULL CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  course_id text NOT NULL,
  unit_code text NOT NULL,
  semester integer NOT NULL CHECK (semester >= 1),
  exam_type text NOT NULL CHECK (exam_type = ANY (ARRAY['cat'::text, 'end_term'::text, 'mock'::text, 'combined'::text])),
  cat_marks numeric CHECK (cat_marks >= 0::numeric AND cat_marks <= 30::numeric),
  end_term_marks numeric CHECK (end_term_marks >= 0::numeric AND end_term_marks <= 70::numeric),
  marks integer CHECK (marks >= 0 AND marks <= 100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exam_marks_pkey PRIMARY KEY (id),
  CONSTRAINT exam_marks_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT exam_marks_unit_fkey FOREIGN KEY (course_id) REFERENCES public.units(course_id),
  CONSTRAINT exam_marks_unit_fkey FOREIGN KEY (unit_code) REFERENCES public.units(course_id),
  CONSTRAINT exam_marks_unit_fkey FOREIGN KEY (course_id) REFERENCES public.units(unit_code),
  CONSTRAINT exam_marks_unit_fkey FOREIGN KEY (unit_code) REFERENCES public.units(unit_code)
);
CREATE TABLE public.fee_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  payment_type text NOT NULL CHECK (payment_type = ANY (ARRAY['tuition'::text, 'practical'::text, 'exam'::text, 'other'::text])),
  amount numeric NOT NULL,
  payment_method text NOT NULL CHECK (payment_method = ANY (ARRAY['cash'::text, 'bank_transfer'::text, 'card'::text, 'mpesa'::text])),
  transaction_id text,
  payment_date date NOT NULL,
  semester integer CHECK (semester >= 1 AND semester <= 6),
  module integer CHECK (module >= 1),
  status text NOT NULL DEFAULT 'completed'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  receipt_number text UNIQUE,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fee_payments_pkey PRIMARY KEY (id),
  CONSTRAINT fee_payments_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.fee_structure (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_type_id uuid NOT NULL,
  exam_body text CHECK (exam_body = ANY (ARRAY['internal'::text, 'JP'::text, 'CDACC'::text, 'KNEC'::text])),
  semester integer CHECK (semester >= 1 AND semester <= 6),
  module integer CHECK (module >= 1),
  tuition_fee numeric NOT NULL DEFAULT 0,
  practical_fee numeric NOT NULL DEFAULT 0,
  exam_fee numeric NOT NULL DEFAULT 0,
  registration_fee numeric NOT NULL DEFAULT 0,
  library_fee numeric NOT NULL DEFAULT 0,
  lab_fee numeric NOT NULL DEFAULT 0,
  campus text NOT NULL CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  academic_year text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fee_structure_pkey PRIMARY KEY (id),
  CONSTRAINT fee_structure_course_type_id_fkey FOREIGN KEY (course_type_id) REFERENCES public.course_types(id)
);
CREATE TABLE public.holiday_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  academic_calendar_id uuid NOT NULL,
  campus text NOT NULL CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  is_instructional_for_bridge boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT holiday_periods_pkey PRIMARY KEY (id),
  CONSTRAINT holiday_periods_academic_calendar_id_fkey FOREIGN KEY (academic_calendar_id) REFERENCES public.academic_calendar(id)
);
CREATE TABLE public.lecturer_assignment_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL,
  course_id text NOT NULL,
  unit_code text NOT NULL,
  CONSTRAINT lecturer_assignment_units_pkey PRIMARY KEY (id),
  CONSTRAINT lecturer_assignment_units_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.lecturer_assignments(id),
  CONSTRAINT lecturer_assignment_units_unit_fkey FOREIGN KEY (course_id) REFERENCES public.units(course_id),
  CONSTRAINT lecturer_assignment_units_unit_fkey FOREIGN KEY (unit_code) REFERENCES public.units(course_id),
  CONSTRAINT lecturer_assignment_units_unit_fkey FOREIGN KEY (course_id) REFERENCES public.units(unit_code),
  CONSTRAINT lecturer_assignment_units_unit_fkey FOREIGN KEY (unit_code) REFERENCES public.units(unit_code)
);
CREATE TABLE public.lecturer_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lecturer_id uuid NOT NULL,
  campus text NOT NULL CHECK (campus = ANY (ARRAY['main'::text, 'west'::text])),
  course_id text NOT NULL,
  class_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lecturer_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT lecturer_assignments_lecturer_id_fkey FOREIGN KEY (lecturer_id) REFERENCES public.lecturers(id),
  CONSTRAINT lecturer_assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.lecturers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  lecturer_number text NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL UNIQUE,
  gender text CHECK (gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lecturers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_type_id uuid NOT NULL,
  module_index integer NOT NULL CHECK (module_index >= 1),
  label text,
  exam_body text DEFAULT 'KNEC'::text CHECK (exam_body = ANY (ARRAY['internal'::text, 'JP'::text, 'CDACC'::text, 'KNEC'::text])),
  created_at timestamp with time zone DEFAULT now(),
  duration_months integer NOT NULL DEFAULT 12,
  exam_fee numeric NOT NULL DEFAULT 0,
  fee numeric NOT NULL DEFAULT 0,
  has_attachment boolean DEFAULT false,
  attachment_after_semester integer CHECK (attachment_after_semester >= 1 AND attachment_after_semester <= 6),
  attachment_duration_months integer DEFAULT 3,
  is_attachment_stage boolean DEFAULT false,
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_course_type_id_fkey FOREIGN KEY (course_type_id) REFERENCES public.course_types(id)
);
CREATE TABLE public.payment_installments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  installment_number integer NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'overdue'::text, 'waived'::text])),
  paid_date date,
  late_fee numeric DEFAULT 0,
  waiver_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_installments_pkey PRIMARY KEY (id),
  CONSTRAINT payment_installments_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id)
);
CREATE TABLE public.qualification_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  CONSTRAINT qualification_levels_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reporting_dates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL,
  reporting_date date NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reporting_dates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.semester_additional_fees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  semester_id uuid NOT NULL,
  fee_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT semester_additional_fees_pkey PRIMARY KEY (id),
  CONSTRAINT semester_additional_fees_semester_id_fkey FOREIGN KEY (semester_id) REFERENCES public.semesters(id)
);
CREATE TABLE public.semesters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  semester_index integer NOT NULL CHECK (semester_index >= 1 AND semester_index <= 6),
  duration_months integer NOT NULL DEFAULT 3,
  fee numeric NOT NULL DEFAULT 0,
  practical_fee numeric NOT NULL DEFAULT 0,
  internal_exams integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT semesters_pkey PRIMARY KEY (id),
  CONSTRAINT semesters_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id)
);
CREATE TABLE public.short_course_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  short_course_id uuid NOT NULL,
  unit_name text NOT NULL,
  CONSTRAINT short_course_units_pkey PRIMARY KEY (id),
  CONSTRAINT short_course_units_short_course_id_fkey FOREIGN KEY (short_course_id) REFERENCES public.short_courses(id)
);
CREATE TABLE public.short_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id text NOT NULL,
  department_id uuid NOT NULL,
  qualification_level_id uuid,
  name text NOT NULL,
  short_code text UNIQUE,
  duration_months integer DEFAULT 1 CHECK (duration_months > 0),
  payment_mode text CHECK (payment_mode = ANY (ARRAY['Once'::text, 'Monthly'::text, 'Per Semester'::text])),
  first_installment numeric DEFAULT 0.00,
  subsequent_installment numeric DEFAULT 0.00,
  has_exams boolean DEFAULT true,
  practical_fee numeric DEFAULT 0.00,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT short_courses_pkey PRIMARY KEY (id),
  CONSTRAINT short_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT short_courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id),
  CONSTRAINT short_courses_qualification_level_id_fkey FOREIGN KEY (qualification_level_id) REFERENCES public.qualification_levels(id)
);
CREATE TABLE public.units (
  course_id text NOT NULL,
  unit_code text NOT NULL,
  name text NOT NULL,
  module_index integer NOT NULL DEFAULT 1,
  semester_index integer NOT NULL DEFAULT 1,
  unit_type text CHECK (unit_type = ANY (ARRAY['Core'::text, 'Common'::text, 'Basic'::text, 'Elective'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT units_pkey PRIMARY KEY (course_id, unit_code),
  CONSTRAINT units_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);