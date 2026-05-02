'use client';

import { useState, useEffect } from 'react';

interface SendNotificationProps {
  applicationId?: string;
  lecturerId?: string;
  onSend?: () => void;
}

const CHANNELS = [
  { value: 'email', label: 'Email', icon: '✉️' },
];

const RECIPIENT_TYPES = [
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent/Guardian' },
  { value: 'lecturer', label: 'Lecturer' },
  { value: 'staff', label: 'Staff' },
];

const MESSAGE_TEMPLATES = {
  'fee_reminder': {
    subject: 'Fee Payment Reminder',
    message: 'Dear {name}, this is a reminder that your fee payment of KES {amount} is due by {due_date}. Please make payment to avoid late fees.',
  },
  'exam_schedule': {
    subject: 'Exam Schedule Update',
    message: 'Dear {name}, your {exam_type} exam for {unit} is scheduled on {date} at {time}. Venue: {venue}.',
  },
  'class_reminder': {
    subject: 'Class Reminder',
    message: 'Dear {name}, reminder: {class_name} class tomorrow at {time}. Please be punctual.',
  },
  'general': {
    subject: '',
    message: '',
  },
};

export default function SendNotification({ applicationId, lecturerId, onSend }: SendNotificationProps) {
  const [recipientType, setRecipientType] = useState(applicationId ? 'student' : 'lecturer');
  const [channel] = useState('email');
  const [recipientId, setRecipientId] = useState(applicationId || lecturerId || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [template, setTemplate] = useState('general');
  const [notificationType, setNotificationType] = useState('general');
  const [campus, setCampus] = useState('main');
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load recipients (students/lecturers) for search
    const loadRecipients = async () => {
      try {
        const endpoint = recipientType === 'student' ? '/api/applications' : '/api/lecturers';
        const response = await fetch(endpoint);
        const data = await response.json();
        setRecipients(data[recipientType === 'student' ? 'applications' : 'lecturers'] || []);
      } catch (err) {
        console.error('Failed to load recipients:', err);
      }
    };

    loadRecipients();
  }, [recipientType]);

  useEffect(() => {
    if (template !== 'general' && MESSAGE_TEMPLATES[template as keyof typeof MESSAGE_TEMPLATES]) {
      const tmpl = MESSAGE_TEMPLATES[template as keyof typeof MESSAGE_TEMPLATES];
      setSubject(tmpl.subject);
      setMessage(tmpl.message);
    }
  }, [template]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_type: recipientType,
          application_id: recipientType === 'student' || recipientType === 'parent' ? recipientId : null,
          lecturer_id: recipientType === 'lecturer' ? recipientId : null,
          channel,
          subject: channel === 'email' ? subject : undefined,
          message,
          notification_type: notificationType,
          campus,
        }),
      });

      if (!response.ok) throw new Error('Failed to send');

      const data = await response.json();
      alert(`Notification sent! Reference: ${data.reference}`);
      onSend?.();
      resetForm();
    } catch (err) {
      alert('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setTemplate('general');
    setNotificationType('general');
  };

  const filteredRecipients = recipients.filter(r => {
    const search = searchQuery.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(search) ||
      r.phone?.includes(search) ||
      r.email?.toLowerCase().includes(search) ||
      r.admission_number?.toLowerCase().includes(search)
    );
  });

  return (
    <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>
        Send Notification
      </h3>

      <form onSubmit={handleSend}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {/* Channel - Email Only */}
          <div style={{ padding: '10px', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #86efac' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>✉️</span>
              <div>
                <p style={{ margin: 0, fontWeight: 500, color: '#166534' }}>Email Only</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#15803d' }}>Notifications sent via campus email</p>
              </div>
            </div>
          </div>

          {/* Recipient Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Send To *
            </label>
            <select
              value={recipientType}
              onChange={(e) => {
                setRecipientType(e.target.value);
                setRecipientId('');
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              {RECIPIENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Recipient Search */}
          {!applicationId && !lecturerId && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                Search Recipient
              </label>
              <input
                type="text"
                placeholder="Search by name, phone, or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '8px' }}
              />
              {searchQuery && (
                <div style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  {filteredRecipients.slice(0, 5).map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setRecipientId(r.id);
                        setSearchQuery(r.full_name);
                      }}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        textAlign: 'left',
                        background: recipientId === r.id ? '#f0f9ff' : 'white',
                        border: 'none',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      <strong>{r.full_name}</strong>
                      <span style={{ color: '#6b7280', marginLeft: '8px' }}>
                        {r.phone || r.email || r.admission_number}
                      </span>
                    </button>
                  ))}
                  {filteredRecipients.length === 0 && (
                    <p style={{ padding: '8px', margin: 0, color: '#6b7280', fontSize: '13px' }}>
                      No recipients found
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Template Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Message Template
            </label>
            <select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                // Auto-set notification type based on template
                const typeMap: Record<string, string> = {
                  fee_reminder: 'fee_payment',
                  exam_schedule: 'exam_results',
                  class_reminder: 'opening_date',
                  general: 'general',
                };
                setNotificationType(typeMap[e.target.value] || 'general');
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="general">Custom Message</option>
              <option value="fee_reminder">Fee Payment Reminder</option>
              <option value="exam_schedule">Exam Schedule</option>
              <option value="class_reminder">Class Reminder</option>
            </select>
          </div>

          {/* Notification Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Notification Type *
            </label>
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="general">📢 General Announcement</option>
              <option value="fee_payment">💰 Fee Payment</option>
              <option value="opening_date">📅 Opening Date</option>
              <option value="closing_date">⏰ Closing Date</option>
              <option value="exam_results">📊 Exam Results</option>
            </select>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
              Determines which campus email is used and email subject prefix
            </p>
          </div>

          {/* Campus Selection */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Campus *
            </label>
            <select
              value={campus}
              onChange={(e) => setCampus(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            >
              <option value="main">🏛️ Main Campus</option>
              <option value="west">🏢 West Campus</option>
            </select>
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
              Emails sent from campus-specific account
            </p>
          </div>

          {/* Subject */}
          <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
              />
            </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
              Message *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              maxLength={2000}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
              {message.length} characters
            </p>
          </div>

          {/* Preview */}
          {message && (
            <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 500, color: '#6b7280' }}>
                Preview:
              </p>
              <p style={{ margin: 0, fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                {message}
              </p>
            </div>
          )}

          {/* Send Button */}
          <button
            type="submit"
            disabled={sending || !message || (!applicationId && !lecturerId && !recipientId)}
            style={{
              width: '100%',
              padding: '12px',
              background: sending ? '#9ca3af' : '#111',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: sending ? 'not-allowed' : 'pointer',
              marginTop: '8px',
            }}
          >
            {sending ? 'Sending...' : `Send ${channel.toUpperCase()}`}
          </button>
        </div>
      </form>
    </div>
  );
}
