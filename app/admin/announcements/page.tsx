'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  campus: string;
  audience: string[];
  is_pinned: boolean;
  publish_at: string;
  expire_at: string | null;
  created_by: string;
  creator?: { full_name: string };
}

const CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-gray-500' },
  { value: 'academic', label: 'Academic', color: 'bg-blue-500' },
  { value: 'fees', label: 'Fees', color: 'bg-green-500' },
  { value: 'exam', label: 'Exam', color: 'bg-yellow-500' },
  { value: 'event', label: 'Event', color: 'bg-purple-500' },
  { value: 'emergency', label: 'Emergency', color: 'bg-red-500' },
  { value: 'holiday', label: 'Holiday', color: 'bg-cyan-500' },
];

const CAMPUSES = [
  { value: 'main', label: 'Main Campus' },
  { value: 'west', label: 'West Campus' },
];

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students' },
  { value: 'lecturers', label: 'Lecturers' },
  { value: 'staff', label: 'Staff' },
];

export default function AnnouncementsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCampus, setUserCampus] = useState('main');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'general',
    campus: 'main',
    audience: ['all'],
    is_pinned: false,
    publish_at: new Date().toISOString().slice(0, 16),
    expire_at: '',
  });

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
      const campus = session.user?.user_metadata?.campus || 'main';
      
      if (userRole !== 'admin') {
        router.push('/login/admin');
        return;
      }

      setUserCampus(campus);
      setFormData(prev => ({ ...prev, campus }));
      fetchAnnouncements(campus);
    };

    checkAuth();
  }, [supabase]);

  const fetchAnnouncements = async (campus: string) => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, creator:created_by(full_name)')
        .eq('campus', campus)
        .order('is_pinned', { ascending: false })
        .order('publish_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('announcements')
        .insert({
          ...formData,
          campus: userCampus, // Force user's campus
          created_by: session?.user?.id,
          expire_at: formData.expire_at || null,
        });

      if (error) throw error;

      setShowForm(false);
      resetForm();
      fetchAnnouncements(userCampus);
    } catch (err) {
      alert('Failed to create announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      fetchAnnouncements(userCampus);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      category: 'general',
      campus: userCampus,
      audience: ['all'],
      is_pinned: false,
      publish_at: new Date().toISOString().slice(0, 16),
      expire_at: '',
    });
  };

  const isExpired = (expireAt: string | null) => {
    if (!expireAt) return false;
    return new Date(expireAt) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {userCampus === 'west' ? 'West Campus' : 'Main Campus'} Announcements
            </h1>
            <p className="text-gray-600 mt-1">
              Campus-specific announcements (not shared between campuses)
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            + New Announcement
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-blue-600">
              {announcements.filter(a => !isExpired(a.expire_at)).length}
            </p>
            <p className="text-sm text-gray-600">Active</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-yellow-600">
              {announcements.filter(a => a.is_pinned).length}
            </p>
            <p className="text-sm text-gray-600">Pinned</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <p className="text-2xl font-bold text-gray-600">{announcements.length}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const category = CATEGORIES.find(c => c.value === announcement.category);
            const expired = isExpired(announcement.expire_at);

            return (
              <div
                key={announcement.id}
                className={`bg-gray-50 rounded-lg shadow p-6 ${
                  announcement.is_pinned ? 'border-l-4 border-yellow-500' : ''
                } ${expired ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {announcement.is_pinned && (
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                          📌 PINNED
                        </span>
                      )}
                      <span className={`${category?.color || 'bg-gray-500'} text-white text-xs px-2 py-1 rounded`}>
                        {category?.label || announcement.category}
                      </span>
                      {expired && (
                        <span className="bg-gray-400 text-white text-xs px-2 py-1 rounded">
                          EXPIRED
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-800">{announcement.title}</h3>
                    <p className="text-gray-600 mt-2 whitespace-pre-wrap">{announcement.body}</p>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                      <span>👥 {announcement.audience.join(', ')}</span>
                      <span>📅 {new Date(announcement.publish_at).toLocaleDateString()}</span>
                      {announcement.expire_at && (
                        <span>⏰ Expires: {new Date(announcement.expire_at).toLocaleDateString()}</span>
                      )}
                      <span>By: {announcement.creator?.full_name || 'Admin'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="text-red-500 hover:text-red-700 ml-4"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}

          {announcements.length === 0 && (
            <div className="bg-gray-50 rounded-lg shadow p-8 text-center text-gray-500">
              No announcements for {userCampus === 'west' ? 'West' : 'Main'} Campus yet.
            </div>
          )}
        </div>

        {/* Create Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-50 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
              <h2 className="text-xl font-bold mb-4">New Announcement</h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message *</label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    required
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Campus</label>
                    <input
                      type="text"
                      value={userCampus === 'west' ? 'West Campus' : 'Main Campus'}
                      disabled
                      className="w-full border rounded-lg px-3 py-2 bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Based on your admin campus</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience</label>
                  <div className="flex flex-wrap gap-2">
                    {AUDIENCES.map(a => (
                      <label key={a.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.audience.includes(a.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, audience: [...formData.audience, a.value] });
                            } else {
                              setFormData({ ...formData, audience: formData.audience.filter(v => v !== a.value) });
                            }
                          }}
                        />
                        <span className="text-sm">{a.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Publish At</label>
                    <input
                      type="datetime-local"
                      value={formData.publish_at}
                      onChange={(e) => setFormData({ ...formData, publish_at: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Expire At (optional)</label>
                    <input
                      type="datetime-local"
                      value={formData.expire_at}
                      onChange={(e) => setFormData({ ...formData, expire_at: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  />
                  <span className="text-sm">Pin this announcement (appears at top)</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 border rounded-lg py-2 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
