import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('applications')
      .insert([{
        full_name: body.full_name,
        first_name: body.first_name || body.full_name?.split(' ')[0] || '',
        middle_name: body.middle_name || (body.full_name?.split(' ').length > 2 ? body.full_name?.split(' ').slice(1, -1).join(' ') : null) || null,
        last_name: body.last_name || body.full_name?.split(' ').slice(-1)[0] || '',
        phone: body.phone,
        email: body.email || null,
        kcse_grade: body.kcse_grade,
        exam_body: body.exam_body,
        intake: body.intake,
        course_id: body.course_id,
        course_type_id: body.course_type_id,
        campus: body.campus,
        enrollment_type: body.enrollment_type || 'new',
        admission_number: body.admission_number || null,
        application_date: body.application_date,
        status: 'pending',
        stream_type: body.stream_type || 'main',
        bridge_group_id: body.bridge_group_id || null,
        bridge_start_date: body.bridge_start_date || null,
        sync_target_date: body.sync_target_date || null,
        acceleration_factor: body.acceleration_factor || 1.0,
        current_semester: body.current_semester || 1,
      }])
      .select()
      .single();

    if (error) {
      console.error('[/api/apply] DB:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Create student profile with gender if provided
    const profileData: Record<string, any> = { application_id: data.id };
    if (body.gender) profileData.gender = body.gender;

    const { error: profileError } = await supabase
      .from('student_profiles')
      .insert([profileData]);

    if (profileError) {
      console.warn('Profile creation warning:', profileError.message);
      // Non-fatal
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error('[/api/apply]', err.message);
    // Auto-send alert email on critical errors
    try {
      await fetch('http://localhost:3000/api/send-alert-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts: [{ log_type: 'error', module: 'API/apply', message: err.message, created_at: new Date().toISOString() }], alertType: 'critical', systemInfo: { campus: 'all' } }),
      });
    } catch (_) {}
    return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 });
  }
}
