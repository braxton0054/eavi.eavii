import nodemailer from 'nodemailer';

// Campus email configurations
const CAMPUS_EMAILS: Record<string, { user: string; pass: string }> = {
  main: {
    user: process.env.MAIN_CAMPUS_EMAIL || '',
    pass: process.env.MAIN_CAMPUS_EMAIL_PASSWORD || '',
  },
  west: {
    user: process.env.WEST_CAMPUS_EMAIL || '',
    pass: process.env.WEST_CAMPUS_EMAIL_PASSWORD || '',
  },
};

// Create transporter for a specific campus
export function getCampusTransporter(campus: string) {
  const config = CAMPUS_EMAILS[campus.toLowerCase()];
  
  if (!config || !config.user || !config.pass) {
    // Fallback to default SMTP
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

// Send campus-specific notification
export async function sendCampusEmail({
  campus,
  to,
  subject,
  message,
  type,
}: {
  campus: string;
  to: string;
  subject: string;
  message: string;
  type: 'fee_payment' | 'opening_date' | 'closing_date' | 'exam_results' | 'general';
}) {
  try {
    const transporter = getCampusTransporter(campus);
    
    // Campus-specific sender name
    const campusName = campus.toLowerCase() === 'west' ? 'EAVI West Campus' : 'EAVI Main Campus';
    
    // Type-specific email templates
    const emailTemplates: Record<string, { prefix: string; priority: 'high' | 'normal' | 'low' }> = {
      fee_payment: { prefix: '💰 FEE PAYMENT:', priority: 'high' },
      opening_date: { prefix: '📅 OPENING DATE:', priority: 'high' },
      closing_date: { prefix: '⏰ CLOSING DATE:', priority: 'high' },
      exam_results: { prefix: '📊 EXAM RESULTS:', priority: 'normal' },
      general: { prefix: '📢 ANNOUNCEMENT:', priority: 'normal' },
    };

    const template = emailTemplates[type] || emailTemplates.general;

    const mailOptions = {
      from: {
        name: campusName,
        address: campus.toLowerCase() === 'west' 
          ? (process.env.WEST_CAMPUS_EMAIL || '')
          : (process.env.MAIN_CAMPUS_EMAIL || ''),
      },
      to,
      subject: `${template.prefix} ${subject}`,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #111; color: white; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">${campusName}</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <h3 style="color: #111; margin-top: 0;">${subject}</h3>
            <p style="color: #374151; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280;">
              This notification was sent from ${campusName} system.<br />
              Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      priority: template.priority,
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      campus,
      type,
    };
  } catch (error: any) {
    console.error(`Email send error for ${campus}:`, error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Bulk send to multiple recipients
export async function sendBulkCampusEmails({
  campus,
  recipients,
  subject,
  message,
  type,
}: {
  campus: string;
  recipients: { email: string; name?: string }[];
  subject: string;
  message: string;
  type: 'fee_payment' | 'opening_date' | 'closing_date' | 'exam_results' | 'general';
}) {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendCampusEmail({
        campus,
        to: recipient.email,
        subject,
        message: recipient.name ? `Dear ${recipient.name},\n\n${message}` : message,
        type,
      });
      results.push({ email: recipient.email, status: 'sent', result });
    } catch (error: any) {
      results.push({ email: recipient.email, status: 'failed', error: error.message });
    }
  }
  
  return {
    total: recipients.length,
    sent: results.filter(r => r.status === 'sent').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  };
}
