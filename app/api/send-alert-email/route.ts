import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const DEVELOPER_EMAIL = 'braxtonkipchumba3@gmail.com';

export async function POST(request: NextRequest) {
  try {
    const { alerts, alertType, systemInfo } = await request.json();

    if (!alerts || alerts.length === 0) {
      return NextResponse.json({ error: 'No alerts provided' }, { status: 400 });
    }

    // Create Gmail transporter using app password
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'braxtonkipchumba3@gmail.com',
        pass: process.env.SMTP_PASSWORD || 'wvphudinszropnrb',
      },
    });

    // Format email content
    const alertList = alerts.map((alert: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; vertical-align: top;">
          <strong style="color: ${alertType === 'critical' ? '#dc2626' : '#d97706'};">${alert.log_type?.toUpperCase()}</strong>
        </td>
        <td style="padding: 12px; vertical-align: top;">${alert.module || 'System'}</td>
        <td style="padding: 12px; vertical-align: top;">${alert.message}</td>
        <td style="padding: 12px; vertical-align: top; white-space: nowrap;">${new Date(alert.created_at).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: ${alertType === 'critical' ? '#dc2626' : '#d97706'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 EAVI System ${alertType === 'critical' ? 'CRITICAL' : 'WARNING'} Alerts</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">${new Date().toLocaleString()}</p>
        </div>
        
        <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #111827; margin-top: 0;">System Information</h2>
          <p><strong>Campus:</strong> ${systemInfo?.campus || 'N/A'}</p>
          <p><strong>Admin:</strong> ${systemInfo?.adminEmail || 'N/A'}</p>
          <p><strong>Total Alerts:</strong> ${alerts.length}</p>
          
          <h3 style="color: #111827; margin-top: 24px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
            Alert Details
          </h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f3f4f6; text-align: left;">
                <th style="padding: 12px; font-weight: 600;">Severity</th>
                <th style="padding: 12px; font-weight: 600;">Module</th>
                <th style="padding: 12px; font-weight: 600;">Message</th>
                <th style="padding: 12px; font-weight: 600;">Time</th>
              </tr>
            </thead>
            <tbody>
              ${alertList}
            </tbody>
          </table>
          
          <div style="margin-top: 24px; padding: 16px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
            <p style="margin: 0; color: #92400e;">
              <strong>Action Required:</strong> Please investigate these issues in the EAVI admin dashboard immediately.
            </p>
          </div>
          
          <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">
            This is an automated alert from the EAVI School Management System. 
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"EAVI System Alerts" <${process.env.SMTP_FROM_EMAIL || 'braxtonkipchumba3@gmail.com'}>`,
      to: DEVELOPER_EMAIL,
      subject: `🚨 [${alertType.toUpperCase()}] EAVI System Alerts - ${alerts.length} issue${alerts.length > 1 ? 's' : ''} detected`,
      html: emailHtml,
    });

    console.log('Alert email sent:', info.messageId);

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId,
      sentTo: DEVELOPER_EMAIL 
    });

  } catch (error) {
    console.error('Failed to send alert email:', error);
    return NextResponse.json({ 
      error: 'Failed to send email notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
