import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List exam schedules for a bridge group
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const bridgeGroupId = searchParams.get('bridge_group_id');

    if (!bridgeGroupId) {
      return NextResponse.json(
        { error: 'bridge_group_id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bridge_exam_schedules')
      .select('*')
      .eq('bridge_group_id', bridgeGroupId)
      .order('scheduled_date');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch exam schedules', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch exam schedules', details: err.message },
      { status: 500 }
    );
  }
}

// POST - Create new exam schedule
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const { data, error } = await supabase
      .from('bridge_exam_schedules')
      .insert({
        bridge_group_id: body.bridge_group_id,
        exam_name: body.exam_name,
        exam_type: body.exam_type,
        scheduled_date: body.scheduled_date,
        description: body.description,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create exam schedule', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to create exam schedule', details: err.message },
      { status: 500 }
    );
  }
}

// PUT - Update exam schedule
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('bridge_exam_schedules')
      .update({
        exam_name: body.exam_name,
        exam_type: body.exam_type,
        scheduled_date: body.scheduled_date,
        description: body.description,
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update exam schedule', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to update exam schedule', details: err.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove exam schedule
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('bridge_exam_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete exam schedule', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to delete exam schedule', details: err.message },
      { status: 500 }
    );
  }
}
