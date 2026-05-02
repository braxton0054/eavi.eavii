import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List notifications
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const lecturerId = searchParams.get('lecturerId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('notification_logs')
      .select(`
        *,
        student:application_id (full_name),
        lecturer:lecturer_id (full_name)
      `)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    if (lecturerId) {
      query = query.eq('lecturer_id', lecturerId);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Fetch notifications error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notifications', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications: notifications || [] });

  } catch (error: any) {
    console.error('Notifications list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
