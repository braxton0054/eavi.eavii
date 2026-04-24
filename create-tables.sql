-- ============================================================================
-- EAVI College Management System — Clean Schema Reset
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CLEANUP (Ensures new columns like department_id are actually created)
DROP VIEW IF EXISTS v_semester_map;
DROP TABLE IF EXISTS 
    reporting_dates,
    payment_installments,
    fee_payments,
    fee_structure,
    bridge_exam_schedules,
    holiday_periods,
    bridge_groups,
    academic_calendar, 
    exam_marks, 
    lecturer_assignment_units, 
    lecturer_assignments, 
    lecturers, 
    applications, 
    short_course_config, 
    units, 
    semesters, 
    modules, 
    course_types, 
    courses, 
    departments 
CASCADE;

-- 3. TRIGGER HELPER
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. DEPARTMENTS
CREATE TABLE departments (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT        NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 5. COURSES
CREATE TABLE courses (
  id             TEXT        PRIMARY KEY,
  name           TEXT        NOT NULL,
  department_id  UUID        NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_department_id ON courses(department_id);
CREATE INDEX idx_courses_name           ON courses(name);

CREATE TRIGGER trg_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 6. COURSE TYPES
CREATE TABLE course_types (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id       TEXT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  level           TEXT        NOT NULL CHECK (level IN ('diploma', 'certificate', 'artisan', 'level6', 'level5', 'level4')),
  enabled         BOOLEAN     NOT NULL DEFAULT false,
  min_kcse_grade  TEXT        NOT NULL,
  study_mode      TEXT        NOT NULL CHECK (study_mode IN ('module', 'short-course')),
  duration_months INTEGER     DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, level)
);

-- 7. MODULES
CREATE TABLE modules (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  course_type_id  UUID        NOT NULL REFERENCES course_types(id) ON DELETE CASCADE,
  module_index    INTEGER     NOT NULL CHECK (module_index >= 1),
  exam_body       TEXT        DEFAULT 'internal' CHECK (exam_body IN ('internal', 'JP', 'CDACC', 'KNEC')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_type_id, module_index)
);

-- 8. SEMESTERS
CREATE TABLE IF NOT EXISTS semesters (
  id               UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id        UUID           NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  semester_index   INTEGER        NOT NULL CHECK (semester_index >= 1 AND semester_index <= 6),
  duration_months  INTEGER        NOT NULL DEFAULT 3,
  fee              DECIMAL(10,2)  NOT NULL DEFAULT 0,
  practical_fee    DECIMAL(10,2)  NOT NULL DEFAULT 0,
  internal_exams   INTEGER        NOT NULL DEFAULT 1,
  created_at       TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE(module_id, semester_index)
);

-- 9. UNITS
CREATE TABLE units (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id       TEXT        NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  semester_id     UUID        REFERENCES semesters(id) ON DELETE CASCADE,
  module_index    INTEGER     NOT NULL DEFAULT -1,
  semester_index  INTEGER     NOT NULL DEFAULT -1,
  name            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_id, module_index, semester_index, name)
);

-- 10. SHORT COURSE CONFIG
CREATE TABLE short_course_config (
  id                  UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  course_type_id      UUID           NOT NULL REFERENCES course_types(id) ON DELETE CASCADE UNIQUE,
  fee                 DECIMAL(10,2)  NOT NULL DEFAULT 0,
  payment_type        TEXT           NOT NULL CHECK (payment_type IN ('monthly', 'one-time')),
  number_of_months    INTEGER        DEFAULT 0,
  monthly_fees        DECIMAL(10,2)[],
  practical_fee       DECIMAL(10,2)  DEFAULT 0,
  has_exams           BOOLEAN        DEFAULT true,
  created_at          TIMESTAMPTZ    DEFAULT NOW()
);

-- 11. ACADEMIC CALENDAR & REPORTING
CREATE TABLE academic_calendar (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year         TEXT        NOT NULL,
  term                  INTEGER     NOT NULL CHECK (term IN (1, 2, 3)),
  semester              INTEGER     NOT NULL CHECK (semester >= 1 AND semester <= 6),
  term_name             TEXT        NOT NULL,
  term_start_date       DATE        NOT NULL,
  term_end_date         DATE        NOT NULL,
  intake_start_date     DATE        NOT NULL,
  intake_end_date       DATE        NOT NULL,
  bridge_trigger_day    INTEGER     DEFAULT 45,
  cat_opening_date      DATE        NOT NULL,
  cat_closing_date      DATE        NOT NULL,
  end_term_exam_date    DATE        NOT NULL,
  mock_exam_available   BOOLEAN     DEFAULT false,
  mock_exam_date        DATE,
  campus                TEXT        NOT NULL CHECK (campus IN ('main', 'west')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(academic_year, term, campus)
);

-- 12. BRIDGE GROUPS
CREATE TABLE bridge_groups (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name            TEXT        NOT NULL,
  intake                TEXT        NOT NULL,
  academic_calendar_id  UUID        REFERENCES academic_calendar(id) ON DELETE CASCADE,
  campus                TEXT        NOT NULL CHECK (campus IN ('main', 'west')),
  start_date            DATE        NOT NULL,
  sync_target_date      DATE        NOT NULL,
  acceleration_factor    DECIMAL(3,2) NOT NULL DEFAULT 1.5 CHECK (acceleration_factor >= 1.0),
  milestone_module      INTEGER     NOT NULL DEFAULT 1,
  milestone_semester    INTEGER     NOT NULL DEFAULT 1,
  holiday_bypass_enabled BOOLEAN     DEFAULT true,
  catch_up_hours_needed INTEGER     DEFAULT 0,
  catch_up_hours_completed INTEGER   DEFAULT 0,
  status                TEXT        DEFAULT 'active' CHECK (status IN ('active', 'merged', 'cancelled')),
  merged_date           DATE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 13. APPLICATIONS
CREATE TABLE applications (
  id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name                 TEXT        NOT NULL,
  phone                     TEXT        NOT NULL,
  email                     TEXT,
  gender                    TEXT        CHECK (gender IN ('male', 'female', 'other')),
  kcse_grade                TEXT        NOT NULL,
  exam_body                 TEXT        DEFAULT 'internal' CHECK (exam_body IN ('internal', 'JP', 'CDACC', 'KNEC')),
  intake                    TEXT        DEFAULT 'September',
  course_id                 TEXT        NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  course_type_id            UUID        NOT NULL REFERENCES course_types(id) ON DELETE RESTRICT,
  campus                    TEXT        NOT NULL CHECK (campus IN ('main', 'west')),
  admission_number          TEXT        UNIQUE,
  application_date          DATE        NOT NULL,
  status                    TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'enrolled', 'rejected')),
  stream_type               TEXT        DEFAULT 'main' CHECK (stream_type IN ('main', 'bridge')),
  bridge_group_id           UUID        REFERENCES bridge_groups(id) ON DELETE SET NULL,
  bridge_start_date         DATE,
  sync_target_date          DATE,
  acceleration_factor       DECIMAL(3,2) DEFAULT 1.0 CHECK (acceleration_factor >= 1.0),
  current_module            INTEGER     NOT NULL DEFAULT 1 CHECK (current_module >= 1),
  current_semester          INTEGER     NOT NULL DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 6),
  class_name                TEXT,
  financial_hold            BOOLEAN     DEFAULT false,
  total_balance             DECIMAL(10,2) DEFAULT 0,
  last_payment_date         DATE,
  transcript_unlocked       BOOLEAN     DEFAULT false,
  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 12. LECTURERS
CREATE TABLE lecturers (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_number  TEXT        NOT NULL UNIQUE,
  full_name        TEXT        NOT NULL,
  phone            TEXT        NOT NULL,
  email            TEXT        NOT NULL UNIQUE,
  gender           TEXT        CHECK (gender IN ('male', 'female', 'other')),
  campus           TEXT        NOT NULL CHECK (campus IN ('main', 'west')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 13. LECTURER ASSIGNMENTS & UNITS
CREATE TABLE lecturer_assignments (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  lecturer_id      UUID        NOT NULL REFERENCES lecturers(id) ON DELETE CASCADE,
  campus           TEXT        NOT NULL CHECK (campus IN ('main', 'west')),
  course_id        TEXT        NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  class_name       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lecturer_assignment_units (
  id             UUID  DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id  UUID  NOT NULL REFERENCES lecturer_assignments(id) ON DELETE CASCADE,
  unit_id        UUID  NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  UNIQUE(assignment_id, unit_id)
);

-- 14. EXAM MARKS
CREATE TABLE exam_marks (
  id               UUID           DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id   UUID           NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  campus           TEXT           NOT NULL CHECK (campus IN ('main', 'west')),
  course_id        TEXT           NOT NULL REFERENCES courses(id) ON DELETE RESTRICT,
  unit_id          UUID           NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  semester         INTEGER        NOT NULL CHECK (semester >= 1),
  exam_type        TEXT           NOT NULL CHECK (exam_type IN ('cat', 'end_term', 'mock', 'combined')),
  cat_marks        DECIMAL(5,2)   CHECK (cat_marks >= 0 AND cat_marks <= 30),
  end_term_marks   DECIMAL(5,2)   CHECK (end_term_marks >= 0 AND end_term_marks <= 70),
  marks            INTEGER        CHECK (marks >= 0 AND marks <= 100),
  created_at       TIMESTAMPTZ    DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    DEFAULT NOW(),
  UNIQUE(application_id, unit_id, semester, exam_type)
);

-- 15. HOLIDAY PERIODS
CREATE TABLE holiday_periods (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                  TEXT        NOT NULL,
  start_date            DATE        NOT NULL,
  end_date              DATE        NOT NULL,
  academic_calendar_id  UUID        REFERENCES academic_calendar(id) ON DELETE CASCADE,
  campus                TEXT        NOT NULL CHECK (campus IN ('main', 'west')),
  is_instructional_for_bridge BOOLEAN DEFAULT false,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 16. BRIDGE EXAM SCHEDULES
CREATE TABLE bridge_exam_schedules (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  bridge_group_id       UUID        REFERENCES bridge_groups(id) ON DELETE CASCADE,
  exam_name             TEXT        NOT NULL,
  exam_type             TEXT        NOT NULL CHECK (exam_type IN ('cat', 'end_term', 'mock', 'milestone')),
  scheduled_date        DATE        NOT NULL,
  main_group_exam_date  DATE,
  units                 TEXT[],
  status                TEXT        DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 17. FEE STRUCTURE
CREATE TABLE fee_structure (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  course_type_id        UUID        REFERENCES course_types(id) ON DELETE CASCADE,
  exam_body             TEXT        CHECK (exam_body IN ('internal', 'JP', 'CDACC', 'KNEC')),
  semester              INTEGER     CHECK (semester >= 1 AND semester <= 6),
  module                INTEGER     CHECK (module >= 1),
  tuition_fee           DECIMAL(10,2) NOT NULL DEFAULT 0,
  practical_fee         DECIMAL(10,2) NOT NULL DEFAULT 0,
  exam_fee              DECIMAL(10,2) NOT NULL DEFAULT 0,
  registration_fee      DECIMAL(10,2) NOT NULL DEFAULT 0,
  library_fee           DECIMAL(10,2) NOT NULL DEFAULT 0,
  lab_fee               DECIMAL(10,2) NOT NULL DEFAULT 0,
  campus                TEXT        NOT NULL CHECK (campus IN ('main', 'west')),
  academic_year         TEXT        NOT NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(course_type_id, exam_body, semester, module, campus, academic_year)
);

-- 18. FEE PAYMENTS
CREATE TABLE fee_payments (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id        UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  payment_type          TEXT        NOT NULL CHECK (payment_type IN ('tuition', 'practical', 'exam', 'registration', 'library', 'lab', 'other')),
  amount                DECIMAL(10,2) NOT NULL,
  payment_method        TEXT        NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'card', 'mpesa')),
  transaction_id        TEXT,
  payment_date          DATE        NOT NULL,
  semester              INTEGER     CHECK (semester >= 1 AND semester <= 6),
  module                INTEGER     CHECK (module >= 1),
  status                TEXT        NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  receipt_number        TEXT        UNIQUE,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 19. PAYMENT INSTALLMENTS
CREATE TABLE payment_installments (
  id                    UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id        UUID        NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  installment_number     INTEGER     NOT NULL,
  due_date              DATE        NOT NULL,
  amount                DECIMAL(10,2) NOT NULL,
  status                TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'waived')),
  paid_date             DATE,
  late_fee              DECIMAL(10,2) DEFAULT 0,
  waiver_reason         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(application_id, installment_number)
);

CREATE TABLE reporting_dates (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  month           INTEGER     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INTEGER     NOT NULL,
  reporting_date  DATE        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, year)
);

-- 16. VIEW FOR SEMESTER MAPPING
CREATE OR REPLACE VIEW v_semester_map AS
SELECT
  ct.id                                                 AS course_type_id,
  ct.course_id,
  ct.level,
  m.id                                                  AS module_id,
  m.module_index,
  s.id                                                  AS semester_id,
  s.semester_index,
  (m.module_index - 1) * 3 + s.semester_index            AS global_semester,
  s.fee,
  s.practical_fee,
  s.duration_months
FROM course_types ct
JOIN modules  m ON m.course_type_id = ct.id
JOIN semesters s ON s.module_id     = m.id;

-- 17. DISABLE RLS
ALTER TABLE departments             DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_types            DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE semesters               DISABLE ROW LEVEL SECURITY;
ALTER TABLE units                   DISABLE ROW LEVEL SECURITY;
ALTER TABLE short_course_config      DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications            DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecturers               DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecturer_assignments    DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecturer_assignment_units DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_marks              DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_calendar        DISABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_dates          DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INITIAL COURSE DATA
-- ============================================================================

-- ============================================================
-- 1. DEPARTMENT: HEALTH & MEDICAL SCIENCES
-- ============================================================
INSERT INTO departments (name) VALUES ('Health & Medical Sciences') ON CONFLICT (name) DO NOTHING;

-- 1. Peri-operative Theater Technology
INSERT INTO courses (id, name, department_id) VALUES ('MED-001', 'Peri-operative Theater Technology', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-001', 'diploma', true, 'C-', 'module', 18);

-- 2. Orthopaedic and Trauma Medicine
INSERT INTO courses (id, name, department_id) VALUES ('MED-002', 'Orthopaedic and Trauma Medicine', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-002', 'diploma', true, 'C-', 'module', 18);

-- 3. Dental Assistant
INSERT INTO courses (id, name, department_id) VALUES ('MED-003', 'Dental Assistant', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-003', 'certificate', true, 'D', 'short-course', 6);

-- 4. Phlebotomy
INSERT INTO courses (id, name, department_id) VALUES ('MED-004', 'Phlebotomy', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-004', 'certificate', true, 'D', 'short-course', 3);

-- 5. Certified Nurse Assistant (CNA)
INSERT INTO courses (id, name, department_id) VALUES ('MED-005', 'Certified Nurse Assistant (CNA)', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-005', 'certificate', true, 'D', 'short-course', 6);

-- 6. Morgue Attendant
INSERT INTO courses (id, name, department_id) VALUES ('MED-006', 'Morgue Attendant', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-006', 'certificate', true, 'D-', 'short-course', 3);

-- 7. Basic life Support (BLS)
INSERT INTO courses (id, name, department_id) VALUES ('MED-007', 'Basic life Support (BLS)', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-007', 'certificate', true, 'Open', 'short-course', 1);

-- 8. Mortuary Science
INSERT INTO courses (id, name, department_id) VALUES ('MED-008', 'Mortuary Science', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-008', 'certificate', true, 'D', 'module', 12);

-- 9. Home Care Nursing
INSERT INTO courses (id, name, department_id) VALUES ('MED-009', 'Home Care Nursing', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-009', 'certificate', true, 'D', 'short-course', 6);

-- 10. Health Services Support
INSERT INTO courses (id, name, department_id) VALUES ('MED-010', 'Health Services Support', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-010', 'certificate', true, 'D', 'module', 12);

-- 11. Midwifery
INSERT INTO courses (id, name, department_id) VALUES ('MED-011', 'Midwifery', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-011', 'diploma', true, 'C-', 'module', 24);

-- 12. Community Health Assistant / Public Health
INSERT INTO courses (id, name, department_id) VALUES ('MED-012', 'Community Health Assistant', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-012', 'certificate', true, 'D', 'module', 12);

-- 13. Nutrition and Dietetics
INSERT INTO courses (id, name, department_id) VALUES ('MED-013', 'Nutrition and Dietetics', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-013', 'diploma', true, 'C-', 'module', 18);

-- 14. Medical Engineering and Lab Tech
INSERT INTO courses (id, name, department_id) VALUES ('MED-014', 'Medical Engineering and Lab Tech', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-014', 'diploma', true, 'C-', 'module', 24);

-- 15. HIV/AIDS Management & HTC
INSERT INTO courses (id, name, department_id) VALUES ('MED-015', 'HIV/AIDS Testing & Counseling (HTC)', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-015', 'certificate', true, 'D', 'short-course', 3);

-- 16. First Aid
INSERT INTO courses (id, name, department_id) VALUES ('MED-016', 'First Aid', (SELECT id FROM departments WHERE name = 'Health & Medical Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('MED-016', 'certificate', true, 'Open', 'short-course', 1);

-- ============================================================
-- 2. DEPARTMENT: ENGINEERING & TECHNICAL STUDIES
-- ============================================================
INSERT INTO departments (name) VALUES ('Engineering & Technical') ON CONFLICT (name) DO NOTHING;

-- 17. Electrical Engineering
INSERT INTO courses (id, name, department_id) VALUES ('ENG-001', 'Electrical Engineering', (SELECT id FROM departments WHERE name = 'Engineering & Technical' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ENG-001', 'diploma', true, 'C-', 'module', 24);

-- 18. Civil/Building/Survey
INSERT INTO courses (id, name, department_id) VALUES ('ENG-002', 'Civil and Building Technology', (SELECT id FROM departments WHERE name = 'Engineering & Technical' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ENG-002', 'diploma', true, 'C-', 'module', 24);

-- 19. Water Engineering/Plumbing
INSERT INTO courses (id, name, department_id) VALUES ('ENG-003', 'Water Engineering and Plumbing', (SELECT id FROM departments WHERE name = 'Engineering & Technical' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ENG-003', 'certificate', true, 'D', 'module', 12);

-- 20. Mechanical/Automotive Engineering
INSERT INTO courses (id, name, department_id) VALUES ('ENG-004', 'Mechanical and Automotive Engineering', (SELECT id FROM departments WHERE name = 'Engineering & Technical' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ENG-004', 'diploma', true, 'C-', 'module', 24);

-- 21. Computer Packages/IT/ICT
INSERT INTO courses (id, name, department_id) VALUES ('ENG-005', 'Computer Packages and ICT', (SELECT id FROM departments WHERE name = 'Engineering & Technical' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ENG-005', 'certificate', true, 'Open', 'short-course', 3);

-- 22. Fire fighting and extinguisher
INSERT INTO courses (id, name, department_id) VALUES ('ENG-006', 'Fire Fighting and Extinguisher', (SELECT id FROM departments WHERE name = 'Engineering & Technical' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ENG-006', 'certificate', true, 'Open', 'short-course', 1);

-- ============================================================
-- 3. DEPARTMENT: BUSINESS & MANAGEMENT
-- ============================================================
INSERT INTO departments (name) VALUES ('Business & Management') ON CONFLICT (name) DO NOTHING;

-- 23. Human Resource Management (HRM)
INSERT INTO courses (id, name, department_id) VALUES ('BUS-001', 'Human Resource Management (HRM)', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('BUS-001', 'diploma', true, 'C-', 'module', 18);

-- 24. Purchasing & Supply Management
INSERT INTO courses (id, name, department_id) VALUES ('BUS-002', 'Purchasing and Supply Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('BUS-002', 'diploma', true, 'C-', 'module', 18);

-- 25. Logistics and Procurement Management
INSERT INTO courses (id, name, department_id) VALUES ('BUS-003', 'Logistics and Procurement Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('BUS-003', 'diploma', true, 'C-', 'module', 18);

-- 26. Business Administration and Management
INSERT INTO courses (id, name, department_id) VALUES ('BUS-004', 'Business Administration and Management', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('BUS-004', 'diploma', true, 'C-', 'module', 18);

-- 27. Store Keeping
INSERT INTO courses (id, name, department_id) VALUES ('BUS-005', 'Store Keeping', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('BUS-005', 'certificate', true, 'D', 'short-course', 6);

-- 28. Customer Care/ Front office Management
INSERT INTO courses (id, name, department_id) VALUES ('BUS-006', 'Customer Care and Front Office', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('BUS-006', 'certificate', true, 'D', 'short-course', 3);

-- 29. Public Administration and Relations
INSERT INTO courses (id, name, department_id) VALUES ('BUS-007', 'Public Administration and Relations', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('BUS-007', 'diploma', true, 'C-', 'module', 18);

-- 30. Secretarial
INSERT INTO courses (id, name, department_id) VALUES ('BUS-008', 'Secretarial Studies', (SELECT id FROM departments WHERE name = 'Business & Management' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('BUS-008', 'certificate', true, 'D', 'module', 12);

-- ============================================================
-- 4. DEPARTMENT: SOCIAL SCIENCES & COMMUNITY
-- ============================================================
INSERT INTO departments (name) VALUES ('Social Sciences') ON CONFLICT (name) DO NOTHING;

-- 31. Social work and nurse aide
INSERT INTO courses (id, name, department_id) VALUES ('SOC-001', 'Social Work and Nurse Aide', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('SOC-001', 'certificate', true, 'D', 'module', 12);

-- 32. Community Health and Social Work
INSERT INTO courses (id, name, department_id) VALUES ('SOC-002', 'Community Health and Social Work', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('SOC-002', 'diploma', true, 'C-', 'module', 18);

-- 33. Criminology
INSERT INTO courses (id, name, department_id) VALUES ('SOC-003', 'Criminology', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('SOC-003', 'diploma', true, 'C-', 'module', 18);

-- 34. NGO Management / Financial Management for NGO
INSERT INTO courses (id, name, department_id) VALUES ('SOC-004', 'NGO Management', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('SOC-004', 'certificate', true, 'D', 'short-course', 6);

-- 35. Conflict management and peace building
INSERT INTO courses (id, name, department_id) VALUES ('SOC-005', 'Conflict Management and Peace Building', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('SOC-005', 'certificate', true, 'D', 'short-course', 6);

-- 36. Gender and Development studies
INSERT INTO courses (id, name, department_id) VALUES ('SOC-006', 'Gender and Development Studies', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('SOC-006', 'diploma', true, 'C-', 'module', 18);

-- 37. Disaster management
INSERT INTO courses (id, name, department_id) VALUES ('SOC-007', 'Disaster Management', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('SOC-007', 'certificate', true, 'D', 'short-course', 4);

-- 38. Monitoring and Evaluation of Projects
INSERT INTO courses (id, name, department_id) VALUES ('SOC-008', 'Monitoring and Evaluation of Projects', (SELECT id FROM departments WHERE name = 'Social Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('SOC-008', 'certificate', true, 'D', 'short-course', 3);

-- ============================================================
-- 5. DEPARTMENT: EDUCATION & COUNSELING
-- ============================================================
INSERT INTO departments (name) VALUES ('Education & Counseling') ON CONFLICT (name) DO NOTHING;

-- 39. Teacher Education
INSERT INTO courses (id, name, department_id) VALUES ('EDU-001', 'Teacher Education', (SELECT id FROM departments WHERE name = 'Education & Counseling' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('EDU-001', 'diploma', true, 'C', 'module', 24);

-- 40. Counseling Psychology / Counseling
INSERT INTO courses (id, name, department_id) VALUES ('EDU-002', 'Counseling Psychology', (SELECT id FROM departments WHERE name = 'Education & Counseling' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('EDU-002', 'diploma', true, 'C-', 'module', 18);

-- 41. Guidance and Counseling skills Development
INSERT INTO courses (id, name, department_id) VALUES ('EDU-003', 'Guidance and Counseling Skills', (SELECT id FROM departments WHERE name = 'Education & Counseling' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('EDU-003', 'certificate', true, 'D', 'short-course', 6);

-- ============================================================
-- 6. DEPARTMENT: HOSPITALITY & CREATIVE ARTS
-- ============================================================
INSERT INTO departments (name) VALUES ('Hospitality & Creative Arts') ON CONFLICT (name) DO NOTHING;

-- 42. Hairdressing and Beauty Therapy
INSERT INTO courses (id, name, department_id) VALUES ('ART-001', 'Hairdressing and Beauty Therapy', (SELECT id FROM departments WHERE name = 'Hospitality & Creative Arts' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ART-001', 'artisan', true, 'E', 'module', 12);

-- 43. Fashion and Design / Garment making
INSERT INTO courses (id, name, department_id) VALUES ('ART-002', 'Fashion and Design', (SELECT id FROM departments WHERE name = 'Hospitality & Creative Arts' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ART-002', 'certificate', true, 'D', 'module', 12);

-- 44. Catering/ Food and Beverage / Culinary Arts
INSERT INTO courses (id, name, department_id) VALUES ('ART-003', 'Catering and Culinary Arts', (SELECT id FROM departments WHERE name = 'Hospitality & Creative Arts' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ART-003', 'certificate', true, 'D', 'module', 12);

-- 45. Tourism Management
INSERT INTO courses (id, name, department_id) VALUES ('ART-004', 'Tourism Management', (SELECT id FROM departments WHERE name = 'Hospitality & Creative Arts' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ART-004', 'diploma', true, 'C-', 'module', 18);

-- 46. Hotel and Hospitality Management
INSERT INTO courses (id, name, department_id) VALUES ('ART-005', 'Hotel and Hospitality Management', (SELECT id FROM departments WHERE name = 'Hospitality & Creative Arts' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('ART-005', 'diploma', true, 'C-', 'module', 18);

-- ============================================================
-- 7. DEPARTMENT: AGRICULTURE & SECURITY
-- ============================================================
INSERT INTO departments (name) VALUES ('Applied Sciences') ON CONFLICT (name) DO NOTHING;

-- 47. General Agriculture
INSERT INTO courses (id, name, department_id) VALUES ('APP-001', 'General Agriculture', (SELECT id FROM departments WHERE name = 'Applied Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('APP-001', 'certificate', true, 'D', 'module', 12);

-- 48. Security Management
INSERT INTO courses (id, name, department_id) VALUES ('APP-002', 'Security Management', (SELECT id FROM departments WHERE name = 'Applied Sciences' LIMIT 1));
INSERT INTO course_types (course_id, level, enabled, min_kcse_grade, study_mode, duration_months) VALUES ('APP-002', 'certificate', true, 'D', 'short-course', 6);