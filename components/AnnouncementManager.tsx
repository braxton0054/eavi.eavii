'use client';

import { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  title: string;
  body: string;
  category: string;
  audience: string[];
  campus: string | null;
  is_pinned: boolean;
  publish_at: string;
  expire_at: string | null;
  created_at: string;
}

interface AnnouncementManagerProps {
  userRole?: string;
  userCampus?: string;
}

const CATEGORIES = [
  { value: 'general', label: 'General', color: '#6b7280' },
  { value: 'academic', label: 'Academic', color: '#3b82f6' },
  { value: 'fees', label: 'Fees', color: '#22c55e' },
  { value: 'exam', label: 'Exam', color: '#f59e0b' },
  { value: 'event', label: 'Event', color: '#8b5cf6' },
  { value: 'emergency', label: 'Emergency', color: '#dc2626' },
  { value: 'holiday', label: 'Holiday', color: '#06b6d4' },
];

const AUDIENCES = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students' },
  { value: 'lecturers', label: 'Lecturers' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
];

export default function AnnouncementManager({ userRole = 'admin', userCampus = 'main' }: AnnouncementManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    category: 'general',
    audience: ['all'],
    campus: '',
    is_pinned: false,
    publish_at: new Date().toISOString().slice(0, 16),
    expire_at: '',
  });

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements');
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          created_by: 'admin', // Replace with actual user ID
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      setShowForm(false);
      resetForm();
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to create announcement. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      fetchAnnouncements();
    } catch (err) {
      alert('Failed to delete announcement.');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      body: '',
      category: 'general',
      audience: ['all'],
      campus: '',
      is_pinned: false,
      publish_at: new Date().toISOString().slice(0, 16),
      expire_at: '',
    });
  };

  const getCategoryStyle = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return { background: cat?.color || '#6b7280', color: 'white' };
  };

  const isExpired = (expireAt: string | null) => {
    if (!expireAt) return false;
    return new Date(expireAt) < new Date();
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading announcements...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Announcements</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            {announcements.filter(a => !isExpired(a.expire_at)).length} active
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          style={{
            padding: '8px 16px',
            background: '#111',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          + New Announcement
        </button>
      </div>

      {/* Announcements List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {announcements.map((announcement) => {
          const expired = isExpired(announcement.expire_at);
          const category = CATEGORIES.find(c => c.value === announcement.category);

          return (
            <div
              key={announcement.id}
              style={{
                padding: '14px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                background: expired ? '#f9fafb' : announcement.is_pinned ? '#fefce8' : 'white',
                opacity: expired ? 0.7 : 1,
                borderLeft: announcement.is_pinned ? '4px solid #f59e0b' : '4px solid transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    {announcement.is_pinned && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#f59e0b',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                      }}>
                        PINNED
                      </span>
                    )}
                    <span style={{
                      padding: '2px 8px',
                      background: category?.color || '#6b7280',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}>
                      {category?.label || announcement.category}
                    </span>
                    {expired && (
                      <span style={{
                        padding: '2px 8px',
                        background: '#9ca3af',
                        color: 'white',
                        borderRadius: '10px',
                        fontSize: '10px',
                      }}>
                        EXPIRED
                      </span>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 600 }}>
                    {announcement.title}
                  </h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
                    {announcement.body}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#6b7280', flexWrap: 'wrap' }}>
                    <span>📢 {announcement.audience.join(', ')}</span>
                    {announcement.campus && <span>📍 {announcement.campus}</span>}
                    <span>📅 {new Date(announcement.publish_at).toLocaleDateString()}</span>
                    {announcement.expire_at && (
                      <span>⏰ Expires: {new Date(announcement.expire_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(announcement.id)}
                  style={{
                    padding: '6px 10px',
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#dc2626',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {announcements.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
            No announcements yet.
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>New Announcement</h3>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Message *
                  </label>
                  <textarea
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    required
                    rows={4}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    >
                      {CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                      Campus
                    </label>
                    <select
                      value={formData.campus}
                      onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    >
                      <option value="">All Campuses</option>
                      <option value="main">Main Campus</option>
                      <option value="west">West Campus</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Target Audience *
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {AUDIENCES.map(a => (
                      <label key={a.value} style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
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
                        <span style={{ fontSize: '13px' }}>{a.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                      Publish At
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.publish_at}
                      onChange={(e) => setFormData({ ...formData, publish_at: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                      Expire At (optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expire_at}
                      onChange={(e) => setFormData({ ...formData, expire_at: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                  />
                  <span style={{ fontSize: '14px' }}>Pin this announcement (appears at top)</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.title || !formData.body || formData.audience.length === 0}
                  style={{
                    flex: 1,
                    padding: '10px',
                    background: saving ? '#9ca3af' : '#111',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
