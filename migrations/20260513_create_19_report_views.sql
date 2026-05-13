-- ============================================
-- REPORT VIEWS FOR EAVI COLLEGE
-- ============================================

-- ─── FINANCIAL REPORTS ───────────────────────

-- 1. Fee collection summary by payment method per campus/department
CREATE OR REPLACE VIEW vw_fee_collection_by_method AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  fp.payment_method,
  count(fp.id) AS transaction_count,
  count(DISTINCT fp.application_id) AS students_count,
  sum(fp.amount) AS total_collected,
  min(fp.payment_date) AS first_payment,
  max(fp.payment_date) AS last_payment
FROM fee_payments fp
JOIN applications a ON a.id = fp.application_id
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
WHERE fp.status = 'completed'
GROUP BY a.campus, d.name, c.name, fp.payment_method
ORDER BY a.campus, d.name, c.name, fp.payment_method;

-- 2. Students with overdue installments
CREATE OR REPLACE VIEW vw_overdue_installments AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  a.admission_number,
  a.full_name AS student_name,
  a.phone AS student_phone,
  pi.installment_number,
  pi.due_date,
  pi.amount,
  pi.late_fee,
  (pi.amount + COALESCE(pi.late_fee, 0)) AS total_due,
  CURRENT_DATE - pi.due_date AS days_overdue,
  pi.payment_level,
  m.module_index,
  s.semester_index
FROM payment_installments pi
JOIN applications a ON a.id = pi.application_id
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
LEFT JOIN modules m ON m.id = pi.module_id
LEFT JOIN semesters s ON s.id = pi.semester_id
WHERE pi.status IN ('pending', 'overdue')
  AND pi.due_date < CURRENT_DATE
  AND a.status = 'enrolled'
ORDER BY pi.due_date ASC;

-- 3. Daily fee collection trend
CREATE OR REPLACE VIEW vw_daily_fee_collection AS
SELECT
  fp.payment_date,
  a.campus,
  count(fp.id) AS transaction_count,
  count(DISTINCT fp.application_id) AS students_paid,
  sum(fp.amount) AS total_collected,
  count(DISTINCT fp.payment_method) AS methods_used
FROM fee_payments fp
JOIN applications a ON a.id = fp.application_id
WHERE fp.status = 'completed'
GROUP BY fp.payment_date, a.campus
ORDER BY fp.payment_date DESC;

-- 4. Fee collection rate (payments vs expected)
CREATE OR REPLACE VIEW vw_fee_collection_rate AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  ct.level AS course_level,
  count(DISTINCT a.id) AS enrolled_students,
  sum(pi.amount) AS total_expected,
  COALESCE(sum(fp.paid), 0) AS total_paid,
  CASE WHEN sum(pi.amount) > 0
    THEN round((COALESCE(sum(fp.paid), 0) / sum(pi.amount)) * 100, 2)
    ELSE 0
  END AS collection_rate_pct,
  sum(pi.amount) - COALESCE(sum(fp.paid), 0) AS outstanding_balance
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
JOIN course_types ct ON ct.id = a.course_type_id
LEFT JOIN payment_installments pi ON pi.application_id = a.id AND pi.status IN ('pending', 'overdue', 'paid')
LEFT JOIN (
  SELECT application_id, sum(amount) AS paid
  FROM fee_payments WHERE status = 'completed'
  GROUP BY application_id
) fp ON fp.application_id = a.id
WHERE a.status = 'enrolled'
GROUP BY a.campus, d.name, c.name, ct.level
ORDER BY collection_rate_pct ASC;

-- 5. Students on financial hold with balance
CREATE OR REPLACE VIEW vw_students_on_hold AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  ct.level AS course_level,
  a.admission_number,
  a.full_name,
  a.phone,
  a.total_balance,
  a.credit_balance,
  (a.total_balance - COALESCE(a.credit_balance, 0)) AS net_balance,
  a.current_module,
  a.current_semester,
  a.last_payment_date,
  a.financial_hold
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
JOIN course_types ct ON ct.id = a.course_type_id
WHERE a.status = 'enrolled' AND a.financial_hold = true
ORDER BY a.total_balance DESC;

-- 6. Overpayment/credit balance report
CREATE OR REPLACE VIEW vw_credit_balances AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  a.admission_number,
  a.full_name,
  a.phone,
  a.credit_balance,
  a.total_balance,
  a.last_payment_date,
  a.updated_at
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
WHERE a.status = 'enrolled' AND COALESCE(a.credit_balance, 0) > 0
ORDER BY a.credit_balance DESC;

-- ─── STUDENT REPORTS ─────────────────────────

-- 7. Enrollment statistics by type per campus/department
CREATE OR REPLACE VIEW vw_enrollment_stats AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  a.enrollment_type,
  count(a.id) AS student_count
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
WHERE a.status = 'enrolled'
GROUP BY a.campus, d.name, c.name, a.enrollment_type
ORDER BY a.campus, d.name, c.name;

-- 8. Student status breakdown per department
CREATE OR REPLACE VIEW vw_student_status_breakdown AS
SELECT
  d.name AS department,
  a.student_status,
  count(a.id) AS student_count
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
WHERE a.status = 'enrolled'
GROUP BY d.name, a.student_status
ORDER BY d.name, a.student_status;

-- 9. Students currently on each module/semester per course
CREATE OR REPLACE VIEW vw_students_by_module AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  ct.level AS course_level,
  a.current_module,
  a.current_semester,
  count(a.id) AS student_count
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
JOIN course_types ct ON ct.id = a.course_type_id
WHERE a.status = 'enrolled'
GROUP BY a.campus, d.name, c.name, ct.level, a.current_module, a.current_semester
ORDER BY c.name, a.current_module, a.current_semester;

-- 10. Students missing profile info
CREATE OR REPLACE VIEW vw_incomplete_profiles AS
SELECT
  a.campus,
  a.admission_number,
  a.full_name,
  a.phone,
  c.name AS course_name,
  CASE WHEN sp.id IS NULL THEN 'No profile' ELSE 'Incomplete' END AS profile_status,
  CASE WHEN sp.gender IS NULL THEN 'Missing gender' ELSE NULL END AS missing_gender,
  CASE WHEN sp.date_of_birth IS NULL THEN 'Missing DOB' ELSE NULL END AS missing_dob,
  CASE WHEN sp.national_id IS NULL THEN 'Missing ID' ELSE NULL END AS missing_id,
  CASE WHEN sp.county IS NULL THEN 'Missing county' ELSE NULL END AS missing_county
FROM applications a
JOIN courses c ON c.id = a.course_id
LEFT JOIN student_profiles sp ON sp.application_id = a.id
WHERE a.status = 'enrolled'
  AND (sp.id IS NULL
    OR sp.gender IS NULL
    OR sp.date_of_birth IS NULL
    OR sp.national_id IS NULL
    OR sp.county IS NULL)
ORDER BY a.campus, c.name;

-- 11. Students without guardians
CREATE OR REPLACE VIEW vw_students_without_guardians AS
SELECT
  a.campus,
  a.admission_number,
  a.full_name,
  a.phone,
  c.name AS course_name,
  ct.level AS course_level
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN course_types ct ON ct.id = a.course_type_id
WHERE a.status = 'enrolled'
  AND NOT EXISTS (
    SELECT 1 FROM guardians g WHERE g.application_id = a.id
  )
ORDER BY a.campus, c.name;

-- ─── ACADEMIC REPORTS ────────────────────────

-- 12. Students passed vs failed per semester (uses existing exam_marks)
CREATE OR REPLACE VIEW vw_pass_fail_summary AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  em.module_index,
  em.semester,
  em.semester_id,
  count(em.application_id) AS total_students,
  count(*) FILTER (WHERE em.marks >= 40) AS passed,
  count(*) FILTER (WHERE em.marks < 40) AS failed,
  round(avg(em.marks), 2) AS average_mark,
  round(stddev(em.marks), 2) AS std_dev
FROM exam_marks em
JOIN applications a ON a.id = em.application_id
JOIN courses c ON c.id = em.course_id
JOIN departments d ON d.id = c.department_id
GROUP BY a.campus, d.name, c.name, em.module_index, em.semester, em.semester_id
ORDER BY d.name, c.name, em.module_index, em.semester;

-- ─── ADMISSION & INTAKE REPORTS ──────────────

-- 13. Applications pipeline per intake
CREATE OR REPLACE VIEW vw_applications_pipeline AS
SELECT
  a.campus,
  c.name AS course_name,
  a.intake,
  a.status,
  count(a.id) AS application_count
FROM applications a
JOIN courses c ON c.id = a.course_id
GROUP BY a.campus, c.name, a.intake, a.status
ORDER BY a.campus, a.intake, c.name;

-- 14. Enrollment growth per intake/academic year
CREATE OR REPLACE VIEW vw_enrollment_growth AS
SELECT
  a.campus,
  a.intake,
  date_trunc('month', a.application_date::date) AS enrollment_month,
  count(a.id) AS enrolled_count,
  count(*) FILTER (WHERE a.enrollment_type = 'new') AS new_students,
  count(*) FILTER (WHERE a.enrollment_type = 'transfer') AS transfers,
  count(*) FILTER (WHERE a.enrollment_type = 'upgrade') AS upgrades,
  count(*) FILTER (WHERE a.enrollment_type = 'repeat') AS repeats
FROM applications a
WHERE a.status = 'enrolled'
GROUP BY a.campus, a.intake, date_trunc('month', a.application_date::date)
ORDER BY a.campus, enrollment_month DESC;

-- 15. Students missing documents
CREATE OR REPLACE VIEW vw_missing_documents AS
SELECT
  a.campus,
  a.admission_number,
  a.full_name,
  a.phone,
  c.name AS course_name,
  CASE WHEN COALESCE(a.has_kcse_photocopy, false) = false THEN 'KCSE copy' ELSE NULL END AS missing_kcse,
  CASE WHEN COALESCE(a.has_kcpe_photocopy, false) = false THEN 'KCPE copy' ELSE NULL END AS missing_kcpe,
  CASE WHEN COALESCE(a.has_spring_file, false) = false THEN 'Spring file' ELSE NULL END AS missing_spring_file,
  CASE WHEN COALESCE(a.has_rem_paper, false) = false THEN 'REM paper' ELSE NULL END AS missing_rem_paper,
  CASE WHEN sp.national_id IS NULL THEN 'National ID' ELSE NULL END AS missing_id
FROM applications a
JOIN courses c ON c.id = a.course_id
LEFT JOIN student_profiles sp ON sp.application_id = a.id
WHERE a.status = 'enrolled'
  AND (COALESCE(a.has_kcse_photocopy, false) = false
    OR COALESCE(a.has_kcpe_photocopy, false) = false
    OR COALESCE(a.has_spring_file, false) = false
    OR COALESCE(a.has_rem_paper, false) = false
    OR sp.national_id IS NULL)
ORDER BY a.campus, c.name;

-- ─── OPERATIONAL REPORTS ─────────────────────

-- 16. Course-wise student count per campus
CREATE OR REPLACE VIEW vw_course_capacity AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  ct.level AS course_level,
  c.exam_body,
  count(a.id) AS current_enrollment
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
JOIN course_types ct ON ct.id = a.course_type_id
WHERE a.status = 'enrolled' AND a.student_status = 'active'
GROUP BY a.campus, d.name, c.name, ct.level, c.exam_body
ORDER BY a.campus, d.name, c.name;

-- 17. Students due for promotion
CREATE OR REPLACE VIEW vw_pending_promotion AS
SELECT
  a.campus,
  a.admission_number,
  a.full_name,
  a.phone,
  c.name AS course_name,
  a.current_module,
  a.current_semester,
  a.progression_status
FROM applications a
JOIN courses c ON c.id = a.course_id
WHERE a.status = 'enrolled' AND a.progression_status = 'pending_promotion'
ORDER BY a.campus, c.name;

-- 18. Graduation pipeline (students in final period)
CREATE OR REPLACE VIEW vw_graduation_pipeline AS
SELECT
  a.campus,
  d.name AS department,
  c.name AS course_name,
  ct.level AS course_level,
  a.admission_number,
  a.full_name,
  a.current_module,
  a.current_semester,
  a.total_balance,
  a.student_status,
  a.transcript_unlocked,
  a.enrollment_type
FROM applications a
JOIN courses c ON c.id = a.course_id
JOIN departments d ON d.id = c.department_id
JOIN course_types ct ON ct.id = a.course_type_id
WHERE a.status = 'enrolled' AND public.is_student_final_period(a.id)
ORDER BY a.campus, c.name;

-- 19. Students with credit exemptions
CREATE OR REPLACE VIEW vw_credit_exemptions AS
SELECT
  a.campus,
  a.admission_number,
  a.full_name,
  a.phone,
  c.name AS course_name,
  a.current_module,
  a.current_semester,
  a.enrollment_type,
  sp.sponsorship_type,
  sp.sponsor_name,
  sp.sponsor_phone,
  sp.previous_school,
  sp.previous_qualification
FROM applications a
JOIN courses c ON c.id = a.course_id
LEFT JOIN student_profiles sp ON sp.application_id = a.id
WHERE a.status = 'enrolled'
  AND (sp.previous_school IS NOT NULL OR a.enrollment_type IN ('transfer', 'upgrade'))
ORDER BY a.campus, c.name;
