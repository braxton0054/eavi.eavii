import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List notification logs with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('application_id');
    const campus = searchParams.get('campus');
    const status = searchParams.get('status');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('notification_logs')
      .select('*, applications(full_name, admission_number, campus), lecturers(full_name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by campus through applications
    if (campus) {
      query = query.eq('applications.campus', campus);
    }

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch notification logs', details: error.message },
        { status: 500 }
      );
    }

    // Get stats
    const { data: stats, error: statsError } = await supabase
      .from('notification_logs')
      .select('status')
      .eq('channel', 'email');

    const statsSummary = {
      total: stats?.length || 0,
      sent: stats?.filter(n => n.status === 'sent').length || 0,
      delivered: stats?.filter(n => n.status === 'delivered').length || 0,
      failed: stats?.filter(n => n.status === 'failed').length || 0,
      pending: stats?.filter(n => n.status === 'pending').length || 0,
    };

    return NextResponse.json({
      notifications: data,
      stats: statsSummary,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to fetch notification logs', details: err.message },
      { status: 500 }
    );
  }
}

// PUT - Retry failed notification
export async function PUT(request: NextRequest) {
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

    const { data: notification, error: fetchError } = await supabase
      .from('notification_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    // Update status to pending for retry
    const { data, error } = await supabase
      .from('notification_logs')
      .update({
        status: 'pending',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to retry notification', details: error.message },
        { status: 500 }
      );
    }

    // Trigger resend via notification API
    const resendResponse = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        application_id: notification.application_id,
        notification_type: 'general',
        subject: notification.subject,
        message: notification.message,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      return NextResponse.json(
        { error: 'Failed to resend notification', details: errorData.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to retry notification', details: err.message },
      { status: 500 }
    );
  }
}
