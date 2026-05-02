import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendCampusEmail } from '@/lib/email-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Send notification (Email only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      recipient_type,
      application_id,
      lecturer_id,
      channel,
      subject,
      message,
      campus = 'main', // Default to main campus
      notification_type = 'general', // fee_payment, opening_date, closing_date, exam_results, general
    } = body;

    if (!recipient_type || !channel || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: recipient_type, channel, message' },
        { status: 400 }
      );
    }

    // Get recipient contact info
    let recipientPhone = '';
    let recipientEmail = '';
    let recipientName = '';
    let recipientCampus = campus;

    if (recipient_type === 'student' && application_id) {
      const { data: student } = await supabase
        .from('applications')
        .select('phone, email, full_name, campus')
        .eq('id', application_id)
        .single();
      if (student) {
        recipientPhone = student.phone || '';
        recipientEmail = student.email || '';
        recipientName = student.full_name || '';
        if (student.campus) recipientCampus = student.campus;
      }
    } else if (recipient_type === 'parent' && application_id) {
      // Get primary guardian
      const { data: guardian } = await supabase
        .from('guardians')
        .select('phone, email, full_name')
        .eq('application_id', application_id)
        .eq('is_emergency_contact', true)
        .single();
      if (guardian) {
        recipientPhone = guardian.phone || '';
        recipientEmail = guardian.email || '';
        recipientName = guardian.full_name || '';
      }
    } else if (recipient_type === 'lecturer' && lecturer_id) {
      const { data: lecturer } = await supabase
        .from('lecturers')
        .select('phone, email, full_name, campus')
        .eq('id', lecturer_id)
        .single();
      if (lecturer) {
        recipientPhone = lecturer.phone || '';
        recipientEmail = lecturer.email || '';
        recipientName = lecturer.full_name || '';
        if (lecturer.campus) recipientCampus = lecturer.campus;
      }
    }

    // Generate reference ID
    const referenceId = `NTF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Determine final recipient ID
    const finalApplicationId = ['student', 'parent'].includes(recipient_type) ? application_id : null;
    const finalLecturerId = recipient_type === 'lecturer' ? lecturer_id : null;

    // Send email if channel is email and we have an email address
    let emailResult = null;
    if (channel === 'email' && recipientEmail) {
      try {
        emailResult = await sendCampusEmail({
          campus: recipientCampus,
          to: recipientEmail,
          subject: subject || 'Notification',
          message: recipientName ? `Dear ${recipientName},\n\n${message}` : message,
          type: notification_type as any,
        });
      } catch (emailError: any) {
        console.error('Email send failed:', emailError);
        // Continue to save to DB even if email fails
      }
    }

    // Save to notification_logs
    const { data: notification, error: dbError } = await supabase
      .from('notification_logs')
      .insert({
        recipient_type,
        application_id: finalApplicationId,
        lecturer_id: finalLecturerId,
        channel,
        subject: subject || null,
        message,
        status: emailResult?.success ? 'sent' : 'pending',
        sent_at: new Date().toISOString(),
        reference_id: referenceId,
        error_message: emailResult ? null : 'Email service pending integration',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Notification log error:', dbError);
      return NextResponse.json(
        { error: 'Failed to log notification', details: dbError.message },
        { status: 500 }
      );
    }

    // Email is the only supported channel
    if (channel !== 'email') {
      console.log(`Channel ${channel} is not supported. Only email is available.`);
    }

    return NextResponse.json({
      success: true,
      notification,
      reference: referenceId,
      recipient: {
        name: recipientName,
        phone: recipientPhone,
        email: recipientEmail,
      },
      campus: recipientCampus,
      email_sent: emailResult?.success || false,
      message: 'Notification sent successfully',
    });

  } catch (error: any) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
