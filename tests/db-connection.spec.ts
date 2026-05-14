import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Core Tables ────────────────────────────────────────────────────
test.describe('Database Connectivity', () => {

  test('courses table returns data', async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('id, name, exam_body', { count: 'exact', head: true })
      .eq('is_active', true);
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('classes table returns data', async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, class_name, campus, semester, module_index', { count: 'exact', head: true })
      .eq('is_active', true);
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('units table returns data', async () => {
    const { data, error } = await supabase
      .from('units')
      .select('unit_code, name, module_index', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('modules table returns data', async () => {
    const { data, error } = await supabase
      .from('modules')
      .select('id, module_index, label, duration_months, exam_body', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('academic_calendar table returns data', async () => {
    const { data, error } = await supabase
      .from('academic_calendar')
      .select('id, term, semester, term_name, cat_opening_date, cat_closing_date, end_term_exam_date', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('lecturers table returns data', async () => {
    const { data, error } = await supabase
      .from('lecturers')
      .select('id, full_name, lecturer_number', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('lecturer_assignments table returns data', async () => {
    const { data, error } = await supabase
      .from('lecturer_assignments')
      .select('id, course_id, campus', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('lecturer_assignment_units table returns data', async () => {
    const { data, error } = await supabase
      .from('lecturer_assignment_units')
      .select('id, unit_code, course_id, class_id', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('applications table returns data', async () => {
    const { data, error } = await supabase
      .from('applications')
      .select('id, full_name, status, current_module, current_semester', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('exam_marks table returns data', async () => {
    const { data, error } = await supabase
      .from('exam_marks')
      .select('id, application_id, unit_code, exam_type, marks', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('fee_payments table returns data', async () => {
    const { data, error } = await supabase
      .from('fee_payments')
      .select('id, amount, payment_method, status', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('course_types table returns data', async () => {
    const { data, error } = await supabase
      .from('course_types')
      .select('id, course_id, payment_mode, duration_months', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('semesters table returns data', async () => {
    const { data, error } = await supabase
      .from('semesters')
      .select('id, module_id, semester_index, fee', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('v_lecturer_assignments_full view returns data', async () => {
    const { data, error } = await supabase
      .from('v_lecturer_assignments_full')
      .select('assignment_id, course_name, campus, class_name, cat_opening_date, cat_closing_date, end_term_exam_date, is_attachment_stage', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('qualification_levels table returns data', async () => {
    const { data, error } = await supabase
      .from('qualification_levels')
      .select('id, name, exam_body', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('departments table returns data', async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('short_courses table accessible', async () => {
    const { data, error } = await supabase
      .from('short_courses')
      .select('id, name', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('student_promotion_log table accessible', async () => {
    const { data, error } = await supabase
      .from('student_promotion_log')
      .select('id, application_id, action, from_module, to_module', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  test('student_graduation_records table accessible', async () => {
    const { data, error } = await supabase
      .from('student_graduation_records')
      .select('id, application_id, final_module, final_semester', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
