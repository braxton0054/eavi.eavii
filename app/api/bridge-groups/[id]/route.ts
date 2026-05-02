import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch single bridge group with students and exam schedules
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Fetch bridge group details
    const { data: bridgeGroup, error: groupError } = await supabase
      .from('bridge_groups')
      .select('*, academic_calendar(*)')
      .eq('id', id)
      .single();

    if (groupError) {
      return NextResponse.json(
        { error: 'Bridge group not found', details: groupError.message },
        { status: 404 }
      );
    }

    // Fetch students in this bridge group
    const { data: students, error: studentsError } = await supabase
      .from('applications')
      .select('id, full_name, admission_number, phone, email, current_module, current_semester, status, bridge_start_date, sync_target_date')
      .eq('bridge_group_id', id)
      .order('full_name');

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
    }

    // Fetch exam schedules
    const { data: examSchedules, error: examError } = await supabase
      .from('bridge_exam_schedules')
      .select('*')
      .eq('bridge_group_id', id)
      .order('scheduled_date');

    if (examError) {
      console.error('Error fetching exam schedules:', examError);
    }

    return NextResponse.json({
      bridgeGroup,
      students: students || [],
      examSchedules: examSchedules || [],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch bridge group', details: err.message },
      { status: 500 }
    );
  }
}

// PUT - Update bridge group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('bridge_groups')
      .update({
        group_name: body.group_name,
        intake: body.intake,
        campus: body.campus,
        start_date: body.start_date,
        sync_target_date: body.sync_target_date,
        acceleration_factor: body.acceleration_factor,
        milestone_module: body.milestone_module,
        milestone_semester: body.milestone_semester,
        holiday_bypass_enabled: body.holiday_bypass_enabled,
        catch_up_hours_needed: body.catch_up_hours_needed,
        catch_up_hours_completed: body.catch_up_hours_completed,
        status: body.status,
        merged_date: body.status === 'merged' ? body.merged_date || new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update bridge group', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update bridge group', details: err.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete bridge group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // First, remove students from this bridge group
    await supabase
      .from('applications')
      .update({ 
        bridge_group_id: null,
        stream_type: 'main',
        updated_at: new Date().toISOString(),
      })
      .eq('bridge_group_id', id);

    // Delete exam schedules
    await supabase
      .from('bridge_exam_schedules')
      .delete()
      .eq('bridge_group_id', id);

    // Delete bridge group
    const { error } = await supabase
      .from('bridge_groups')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete bridge group', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to delete bridge group', details: err.message },
      { status: 500 }
    );
  }
}
