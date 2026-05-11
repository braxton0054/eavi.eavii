'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Notification {
  id: string;
  recipient_type: string;
  application_id: string;
  lecturer_id: string;
  channel: string;
  subject: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at: string;
  error_message: string;
  reference_id: string;
  created_at: string;
  applications?: { full_name: string; admission_number: string; campus: string };
  lecturers?: { full_name: string };
}

interface NotificationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    campus: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login/admin');
        return;
      }

      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'admin') {
        router.push('/login/admin');
        return;
      }

      fetchNotifications();
    };

    checkAuth();
  }, [supabase, filter]);

  const fetchNotifications = async () => {
    try {
      let url = '/api/notification-logs?';
      if (filter.campus) url += `campus=${filter.campus}&`;
      if (filter.status) url += `status=${filter.status}&`;
      if (filter.startDate) url += `start_date=${filter.startDate}&`;
      if (filter.endDate) url += `end_date=${filter.endDate}&`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setNotifications(data.notifications || []);
      setStats(data.stats || { total: 0, sent: 0, delivered: 0, failed: 0, pending: 0 });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (id: string) => {
    if (!confirm('Retry sending this notification?')) return;

    setRetrying(id);
    try {
      const response = await fetch(`/api/notification-logs?id=${id}`, {
        method: 'PUT',
      });

      if (!response.ok) throw new Error('Failed to retry');

      fetchNotifications();
    } catch (err) {
      alert('Failed to retry notification');
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-500 text-white';
      case 'sent':
        return 'bg-blue-500 text-white';
      case 'failed':
        return 'bg-red-500 text-white';
      case 'pending':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return '📧';
      case 'sms':
        return '📱';
      case 'whatsapp':
        return '💬';
      case 'push':
        return '🔔';
      default:
        return '📨';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Notification History</h1>
            <p className="text-gray-600 mt-1">
              View and manage all sent notifications
            </p>
          </div>
          <Link
            href="/admin/announcements"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            📢 Manage Announcements
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
            <p className="text-sm text-gray-600">Delivered</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-blue-600">{stats.sent}</p>
            <p className="text-sm text-gray-600">Sent</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            <p className="text-sm text-gray-600">Failed</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4">
          <select
            value={filter.campus}
            onChange={(e) => setFilter({ ...filter, campus: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Campuses</option>
            <option value="main">Main Campus</option>
            <option value="west">West Campus</option>
          </select>

          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Statuses</option>
            <option value="delivered">Delivered</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            value={filter.startDate}
            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
            className="border rounded-lg px-3 py-2"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filter.endDate}
            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
            className="border rounded-lg px-3 py-2"
            placeholder="End Date"
          />

          <button
            onClick={() => setFilter({ campus: '', status: '', startDate: '', endDate: '' })}
            className="text-blue-600 hover:text-blue-800 px-3"
          >
            Clear Filters
          </button>
        </div>

        {/* Notifications Table */}
        <div className="bg-gray-50 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-sm">Recipient</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Campus</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Subject</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Channel</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="font-medium">
                      {notification.applications?.full_name || notification.lecturers?.full_name || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {notification.applications?.admission_number || ''}
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize">
                    {notification.applications?.campus || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium truncate max-w-xs">
                      {notification.subject || '(No subject)'}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-xs">
                      {notification.message.substring(0, 60)}...
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1">
                      {getChannelIcon(notification.channel)} {notification.channel}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(notification.status)}`}>
                      {notification.status.toUpperCase()}
                    </span>
                    {notification.error_message && (
                      <div className="text-xs text-red-500 mt-1">
                        Error: {notification.error_message.substring(0, 50)}...
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {new Date(notification.created_at).toLocaleDateString()}
                    <div className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {notification.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(notification.id)}
                        disabled={retrying === notification.id}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                      >
                        {retrying === notification.id ? 'Retrying...' : 'Retry'}
                      </button>
                    )}
                    {notification.status !== 'failed' && (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {notifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No notifications found. Use "Manage Announcements" to send new notifications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
