-- ============================================================
-- 1. UTILITY FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION _set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. CORE TABLES (Requirement for Departments)
-- ============================================================

-- Qualification Levels (Certificate, Diploma, etc.)
CREATE TABLE IF NOT EXISTS qualification_levels (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- KCSE Grades
CREATE TABLE IF NOT EXISTS kcse_grades (
    id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade TEXT NOT NULL UNIQUE
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT          NOT NULL UNIQUE,
    code        TEXT          NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id          UUID REFERENCES departments(id),
    qualification_level_id UUID REFERENCES qualification_levels(id),
    min_kcse_grade_id      UUID REFERENCES kcse_grades(id),
    knec_code              TEXT NOT NULL UNIQUE,
    name                   TEXT NOT NULL,
    is_modular             BOOLEAN DEFAULT TRUE,
    is_active              BOOLEAN DEFAULT TRUE,
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Course Modules
CREATE TABLE IF NOT EXISTS course_modules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id       UUID REFERENCES courses(id) ON DELETE CASCADE,
    module_number   INT NOT NULL,
    label           TEXT, -- e.g., 'Module I'
    duration_months INT DEFAULT 6,
    num_semesters   INT DEFAULT 1
);

-- Subjects (Units)
CREATE TABLE IF NOT EXISTS subjects (
    id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- Junction Table: Module Subjects
CREATE TABLE IF NOT EXISTS module_subjects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id       UUID REFERENCES course_modules(id) ON DELETE CASCADE,
    subject_id      UUID REFERENCES subjects(id),
    semester_number INT NOT NULL,
    paper_code      TEXT,
    unit_type       TEXT -- e.g., 'Core', 'Common'
);

-- ============================================================
-- 3. TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS departments_updated_at ON departments;
CREATE TRIGGER departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION _set_updated_at();

-- ============================================================
-- 4. SEED DATA: DEPARTMENTS
-- ============================================================
INSERT INTO departments (name, code, description) VALUES
  ('Information Technology',    'ICT',  'Computing, software and digital systems'),
  ('Secretarial & Office Admin','SEC',  'Secretarial studies, office administration'),
  ('Business Administration',   'BUS',  'General business and management'),
  ('Accounting & Finance',      'ACC',  'Accountancy, banking and finance'),
  ('Sales & Marketing',         'MKT',  'Marketing, sales and consumer studies'),
  ('Supply Chain Management',   'SCM',  'Procurement, supplies and logistics'),
  ('Human Resource Management', 'HRM',  'HR, personnel and labour relations'),
  ('Co-operative Management',   'COOP', 'Co-operative banking, law and management'),
  ('Information Studies',       'LIB',  'Library, archives and information science'),
  ('Entrepreneurship',          'ENT',  'Small business and entrepreneurship'),
  ('Project Management',        'PM',   'Project planning, financing and management'),
  ('Transport Management',      'TRN',  'Transport and clearing & forwarding')
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- 5. VIEWS FOR REPORTING
-- ============================================================

-- View: Course Totals (Helper for summary)
CREATE OR REPLACE VIEW v_course_totals AS
SELECT 
    course_id,
    SUM(duration_months) AS total_duration_months,
    SUM(num_semesters) AS total_semesters
FROM course_modules
GROUP BY course_id;

-- View: Department Full Hierarchy
CREATE OR REPLACE VIEW v_department_structure AS
SELECT
  d.code                          AS dept_code,
  d.name                          AS department,
  c.knec_code,
  c.name                          AS course_name,
  ql.name                         AS qualification_level,
  c.is_modular,
  cm.module_number,
  cm.label                        AS module_label,
  s.name                          AS unit_name,
  mu.paper_code
FROM departments d
JOIN courses c                ON c.department_id = d.id
JOIN qualification_levels ql  ON ql.id = c.qualification_level_id
JOIN course_modules cm         ON cm.course_id = c.id
LEFT JOIN module_subjects mu   ON mu.module_id = cm.id
LEFT JOIN subjects s           ON s.id = mu.subject_id
WHERE d.is_active = TRUE AND c.is_active = TRUE;