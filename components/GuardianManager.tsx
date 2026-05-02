'use client';

import { useState, useEffect } from 'react';

interface Guardian {
  id?: string;
  application_id: string;
  full_name: string;
  relationship: string;
  phone: string;
  alt_phone?: string;
  email?: string;
  occupation?: string;
  postal_address?: string;
  county?: string;
  town?: string;
  is_emergency_contact: boolean;
}

interface GuardianManagerProps {
  applicationId: string;
  readOnly?: boolean;
  onGuardianSaved?: () => void;
}

const RELATIONSHIPS = [
  { value: 'parent', label: 'Parent' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'relative', label: 'Relative' },
  { value: 'other', label: 'Other' },
];

export default function GuardianManager({ applicationId, readOnly = false, onGuardianSaved }: GuardianManagerProps) {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Guardian>({
    application_id: applicationId,
    full_name: '',
    relationship: 'parent',
    phone: '',
    alt_phone: '',
    email: '',
    occupation: '',
    postal_address: '',
    county: '',
    town: '',
    is_emergency_contact: true,
  });

  const fetchGuardians = async () => {
    try {
      const response = await fetch(`/api/guardians?applicationId=${applicationId}`);
      const data = await response.json();
      setGuardians(data.guardians || []);
    } catch (err) {
      console.error('Failed to fetch guardians:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, [applicationId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingGuardian ? `/api/guardians/${editingGuardian.id}` : '/api/guardians';
      const method = editingGuardian ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save');

      setShowForm(false);
      setEditingGuardian(null);
      resetForm();
      fetchGuardians();
      
      // Call callback if provided (for apply flow)
      if (onGuardianSaved) {
        onGuardianSaved();
      }
    } catch (err) {
      alert('Failed to save guardian. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this guardian?')) return;

    try {
      const response = await fetch(`/api/guardians/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      fetchGuardians();
    } catch (err) {
      alert('Failed to remove guardian.');
    }
  };

  const resetForm = () => {
    setFormData({
      application_id: applicationId,
      full_name: '',
      relationship: 'parent',
      phone: '',
      alt_phone: '',
      email: '',
      occupation: '',
      postal_address: '',
      county: '',
      town: '',
      is_emergency_contact: true,
    });
  };

  const startEdit = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setFormData(guardian);
    setShowForm(true);
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading guardians...</div>;
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Guardians / Emergency Contacts</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            {guardians.length} guardian(s) added
          </p>
        </div>
        {!readOnly && (
          <button
            onClick={() => { setShowForm(true); resetForm(); setEditingGuardian(null); }}
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
            + Add Guardian
          </button>
        )}
      </div>

      {/* Guardian List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {guardians.map((guardian) => (
          <div
            key={guardian.id}
            style={{
              padding: '14px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: guardian.is_emergency_contact ? '#fef2f2' : '#f9fafb',
              borderLeft: guardian.is_emergency_contact ? '4px solid #dc2626' : '4px solid transparent',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{guardian.full_name}</span>
                  {guardian.is_emergency_contact && (
                    <span style={{
                      padding: '2px 8px',
                      background: '#dc2626',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}>
                      EMERGENCY
                    </span>
                  )}
                </div>
                <p style={{ margin: '2px 0', fontSize: '13px', color: '#6b7280' }}>
                  {RELATIONSHIPS.find(r => r.value === guardian.relationship)?.label || guardian.relationship}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#111', fontWeight: 500 }}>
                  📞 {guardian.phone}
                </p>
                {guardian.alt_phone && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    Alt: {guardian.alt_phone}
                  </p>
                )}
                {guardian.email && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    ✉️ {guardian.email}
                  </p>
                )}
                {(guardian.county || guardian.town) && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                    📍 {guardian.county}{guardian.county && guardian.town ? ', ' : ''}{guardian.town}
                  </p>
                )}
              </div>

              {!readOnly && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => startEdit(guardian)}
                    style={{
                      padding: '6px 12px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(guardian.id!)}
                    style={{
                      padding: '6px 12px',
                      background: '#fee2e2',
                      border: '1px solid #fecaca',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#dc2626',
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {guardians.length === 0 && (
          <div style={{ padding: '30px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
            <p style={{ margin: 0 }}>No guardians added yet.</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Add at least one emergency contact.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Form Modal */}
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
            maxWidth: '500px',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>
              {editingGuardian ? 'Edit Guardian' : 'Add Guardian'}
            </h3>

            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Relationship *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  >
                    {RELATIONSHIPS.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Alternative Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.alt_phone}
                    onChange={(e) => setFormData({ ...formData, alt_phone: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                      County
                    </label>
                    <input
                      type="text"
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>
                      Town
                    </label>
                    <input
                      type="text"
                      value={formData.town}
                      onChange={(e) => setFormData({ ...formData, town: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                    />
                  </div>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_emergency_contact}
                    onChange={(e) => setFormData({ ...formData, is_emergency_contact: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '14px' }}>This is the emergency contact</span>
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
                  disabled={saving}
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
                  {saving ? 'Saving...' : (editingGuardian ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
