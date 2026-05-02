'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  recipient_type: string;
  channel: string;
  subject?: string;
  message: string;
  status: string;
  sent_at: string;
  error_message?: string;
  reference_id: string;
  student?: { full_name: string };
  lecturer?: { full_name: string };
}

interface NotificationHistoryProps {
  applicationId?: string;
  lecturerId?: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  sent: { bg: '#dbeafe', text: '#1e40af' },
  delivered: { bg: '#d1fae5', text: '#065f46' },
  failed: { bg: '#fee2e2', text: '#991b1b' },
};

const CHANNEL_ICONS: Record<string, string> = {
  email: '✉️',
};

export default function NotificationHistory({ applicationId, lecturerId }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      let url = '/api/notifications?';
      if (applicationId) url += `applicationId=${applicationId}&`;
      if (lecturerId) url += `lecturerId=${lecturerId}&`;

      const response = await fetch(url);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [applicationId, lecturerId]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    return n.status === filter;
  });

  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    delivered: notifications.filter(n => n.status === 'delivered').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading notifications...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Notification History</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            {stats.total} total • {stats.delivered} delivered • {stats.failed} failed
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
        >
          <option value="all">All Status</option>
          <option value="delivered">Delivered</option>
          <option value="sent">Sent</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1, padding: '10px', background: '#f0fdf4', borderRadius: '6px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>{stats.delivered}</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Delivered</p>
        </div>
        <div style={{ flex: 1, padding: '10px', background: '#eff6ff', borderRadius: '6px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>{stats.sent}</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Sent</p>
        </div>
        <div style={{ flex: 1, padding: '10px', background: '#fef2f2', borderRadius: '6px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>{stats.failed}</p>
          <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>Failed</p>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredNotifications.map((notification) => {
          const statusStyle = STATUS_COLORS[notification.status] || STATUS_COLORS.pending;
          const recipientName = notification.student?.full_name || notification.lecturer?.full_name || 'Unknown';

          return (
            <div
              key={notification.id}
              style={{
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                background: notification.status === 'failed' ? '#fef2f2' : 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px' }}>{CHANNEL_ICONS[notification.channel] || '📧'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase' }}>
                      {notification.channel}
                    </span>
                    <span
                      style={{
                        padding: '2px 8px',
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textTransform: 'uppercase',
                      }}
                    >
                      {notification.status}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 500 }}>
                    {notification.subject || 'No Subject'}
                  </p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#374151', lineHeight: 1.4 }}>
                    {notification.message.length > 100
                      ? notification.message.substring(0, 100) + '...'
                      : notification.message}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#6b7280' }}>
                    <span>To: {recipientName}</span>
                    <span>{new Date(notification.sent_at).toLocaleString()}</span>
                    <span style={{ fontFamily: 'monospace' }}>Ref: {notification.reference_id}</span>
                  </div>

                  {notification.error_message && (
                    <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#dc2626' }}>
                      Error: {notification.error_message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredNotifications.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
            No notifications found.
          </div>
        )}
      </div>
    </div>
  );
}
