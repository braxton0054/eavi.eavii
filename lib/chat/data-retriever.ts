import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export interface StudentFeeData {
  student_name: string;
  total_fee: number;
  paid: number;
  balance: number;
  status: string;
}

export interface StudentRecord {
  name: string;
  admission_number: string;
  course: string;
  campus: string;
  status: string;
}

export interface CourseInfo {
  name: string;
  course_type: string;
  duration: string;
}

export async function getStudentFeeBalance(studentId?: string, studentName?: string): Promise<StudentFeeData | null> {
  try {
    let query = supabase
      .from('v_student_financials')
      .select('full_name, total_fees, total_paid, total_balance, status')
      .limit(1);

    if (studentId) {
      query = query.eq('admission_number', studentId);
    } else if (studentName) {
      query = query.ilike('full_name', `%${studentName}%`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return null;
    }

    const student = data[0];
    return {
      student_name: student.full_name,
      total_fee: student.total_fees || 0,
      paid: student.total_paid || 0,
      balance: student.total_balance || 0,
      status: student.status || 'unknown',
    };
  } catch {
    return null;
  }
}

export async function getStudentRecords(limit: number = 5): Promise<StudentRecord[]> {
  try {
    const { data, error } = await supabase
      .from('v_student_financials')
      .select('full_name, admission_number, course_id, campus, status')
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((s: any) => ({
      name: s.full_name,
      admission_number: s.admission_number,
      course: s.course_id || 'Unknown',
      campus: s.campus || 'Unknown',
      status: s.status || 'unknown',
    }));
  } catch {
    return [];
  }
}

export async function getCourses(limit: number = 10): Promise<CourseInfo[]> {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('name, course_types(name)')
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((c: any) => ({
      name: c.name,
      course_type: c.course_types?.name || 'Unknown',
      duration: 'N/A',
    }));
  } catch {
    return [];
  }
}

export async function getApplicationStatus(status?: string): Promise<any[]> {
  try {
    let query = supabase
      .from('applications')
      .select('full_name, status, course_id, campus')
      .order('application_date', { ascending: false })
      .limit(10);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    return error || !data ? [] : data;
  } catch {
    return [];
  }
}

export async function getRowCounts(): Promise<Record<string, number>> {
  try {
    const { data, error } = await supabase.rpc('get_table_row_counts');
    if (error || !data) return {};

    const result: Record<string, number> = {};
    for (const row of data) {
      result[row.tablename] = row.row_count;
    }
    return result;
  } catch {
    return {};
  }
}

export async function getDataForIntent(
  intent: string,
  entities: Record<string, any>
): Promise<{ context: string; data: any }> {
  let data: any = null;
  let context = '';

  switch (intent) {
    case 'fee_balance': {
      const feeData = await getStudentFeeBalance(entities.id, entities.name);
      if (feeData) {
        data = feeData;
        context = `Student Fee Summary:
Name: ${feeData.student_name}
Total Fee: ${feeData.total_fee}
Paid: ${feeData.paid}
Balance: ${feeData.balance}
Status: ${feeData.status}`;
      } else {
        context = 'No student fee data found.';
      }
      break;
    }

    case 'student_record': {
      const students = await getStudentRecords(entities.limit || 5);
      data = students;
      if (students.length > 0) {
        context = `Student Records (${students.length} found):
${students.slice(0, 3).map((s) => `- ${s.name} (${s.admission_number}): ${s.course}, ${s.status}`).join('\n')}`;
      } else {
        context = 'No student records found.';
      }
      break;
    }

    case 'course_info': {
      const courses = await getCourses(entities.limit || 10);
      data = courses;
      if (courses.length > 0) {
        context = `Courses (${courses.length} found):
${courses.slice(0, 5).map((c) => `- ${c.name} (${c.course_type})`).join('\n')}`;
      } else {
        context = 'No courses found.';
      }
      break;
    }

    case 'application_status': {
      const apps = await getApplicationStatus();
      data = apps;
      if (apps.length > 0) {
        const counts = apps.reduce((acc: Record<string, number>, a: any) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {});
        context = `Applications: ${Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ')}`;
      } else {
        context = 'No applications found.';
      }
      break;
    }

    case 'database_health': {
      const counts = await getRowCounts();
      data = counts;
      context = `Database Health:
${Object.entries(counts).slice(0, 5).map(([k, v]) => `${k}: ${v} rows`).join('\n')}`;
      break;
    }

    default:
      context = 'No data available for this query.';
  }

  return { context, data };
}