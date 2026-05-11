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
      return NextResponse.json({ error: error.message, details: error.details, code: error.code }, { status: 400 });
    }

    // Also create an empty student profile
    const { error: profileError } = await supabase
      .from('student_profiles')
      .insert([{ application_id: data.id }]);

    if (profileError) {
      console.warn('Profile creation warning:', profileError.message);
      // Non-fatal
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
