import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List bridge groups with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campus = searchParams.get('campus');
    const status = searchParams.get('status');
    const intake = searchParams.get('intake');

    let query = supabase
      .from('bridge_groups')
      .select('*, academic_calendar(academic_year)')
      .order('created_at', { ascending: false });

    if (campus) {
      query = query.eq('campus', campus);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (intake) {
      query = query.eq('intake', intake);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bridge groups', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch bridge groups', details: err.message },
      { status: 500 }
    );
  }
}

// POST - Create new bridge group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data, error } = await supabase
      .from('bridge_groups')
      .insert({
        group_name: body.group_name,
        intake: body.intake,
        academic_calendar_id: body.academic_calendar_id,
        campus: body.campus,
        start_date: body.start_date,
        sync_target_date: body.sync_target_date,
        acceleration_factor: body.acceleration_factor || 1.5,
        milestone_module: body.milestone_module || 1,
        milestone_semester: body.milestone_semester || 1,
        holiday_bypass_enabled: body.holiday_bypass_enabled ?? true,
        catch_up_hours_needed: body.catch_up_hours_needed || 0,
        catch_up_hours_completed: body.catch_up_hours_completed || 0,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create bridge group', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to create bridge group', details: err.message },
      { status: 500 }
    );
  }
}
