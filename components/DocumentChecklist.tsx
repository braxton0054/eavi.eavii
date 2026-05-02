'use client';

import { useState, useEffect } from 'react';

interface DocumentChecklistProps {
  applicationId: string;
  readOnly?: boolean;
  onUpdate?: (items: DocumentChecklistItem[]) => void;
}

interface DocumentChecklistItem {
  id: string;
  label: string;
  field: string;
  checked: boolean;
  required: boolean;
}

const DEFAULT_ITEMS: DocumentChecklistItem[] = [
  { id: '1', label: 'Spring File', field: 'has_spring_file', checked: false, required: true },
  { id: '2', label: 'REM Paper', field: 'has_rem_paper', checked: false, required: true },
  { id: '3', label: 'KCSE Photocopy', field: 'has_kcse_photocopy', checked: false, required: true },
  { id: '4', label: 'KCPE Photocopy', field: 'has_kcpe_photocopy', checked: false, required: false },
];

export default function DocumentChecklist({ applicationId, readOnly = false, onUpdate }: DocumentChecklistProps) {
  const [items, setItems] = useState<DocumentChecklistItem[]>(DEFAULT_ITEMS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch current checklist status from application
  useEffect(() => {
    const fetchChecklist = async () => {
      try {
        const response = await fetch(`/api/applications/${applicationId}/checklist`);
        const data = await response.json();

        if (data.checklist) {
          setItems(prev => prev.map(item => ({
            ...item,
            checked: data.checklist[item.field] || false,
          })));
        }
      } catch (err) {
        console.error('Failed to fetch checklist:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChecklist();
  }, [applicationId]);

  const handleToggle = async (id: string) => {
    if (readOnly) return;

    const newItems = items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    setItems(newItems);

    // Auto-save
    setSaving(true);
    try {
      const updates = newItems.reduce((acc, item) => ({
        ...acc,
        [item.field]: item.checked,
      }), {});

      const response = await fetch(`/api/applications/${applicationId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update');

      onUpdate?.(newItems);
    } catch (err) {
      console.error('Save error:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const allRequiredChecked = items
    .filter(item => item.required)
    .every(item => item.checked);

  const checkedCount = items.filter(item => item.checked).length;
  const requiredCheckedCount = items
    .filter(item => item.required && item.checked).length;
  const totalRequired = items.filter(item => item.required).length;

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Loading checklist...
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      background: 'white',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
            Required Documents Checklist
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Has the student brought these documents?
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: allRequiredChecked ? '#22c55e' : '#f59e0b',
          }}>
            {checkedCount}/{items.length}
          </span>
          <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>
            {requiredCheckedCount}/{totalRequired} required
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '6px',
        background: '#e5e7eb',
        borderRadius: '3px',
        marginBottom: '16px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${(checkedCount / items.length) * 100}%`,
          background: allRequiredChecked ? '#22c55e' : '#3b82f6',
          borderRadius: '3px',
          transition: 'all 0.3s',
        }} />
      </div>

      {/* Checklist Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map(item => (
          <label
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '6px',
              cursor: readOnly ? 'default' : 'pointer',
              background: item.checked ? '#f0fdf4' : '#fefce8',
              border: `2px solid ${item.checked ? '#86efac' : '#fde047'}`,
              transition: 'all 0.2s',
            }}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => handleToggle(item.id)}
              disabled={readOnly}
              style={{
                width: '20px',
                height: '20px',
                cursor: readOnly ? 'default' : 'pointer',
                accentColor: '#22c55e',
              }}
            />
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: '14px',
                fontWeight: 500,
                color: item.checked ? '#166534' : '#713f12',
              }}>
                {item.label}
              </span>
              {item.required && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '11px',
                  color: '#dc2626',
                  fontWeight: 'bold',
                }}>
                  * REQUIRED
                </span>
              )}
            </div>
            <span style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: item.checked ? '#22c55e' : '#f59e0b',
              color: 'white',
            }}>
              {item.checked ? 'YES ✓' : 'NO'}
            </span>
          </label>
        ))}
      </div>

      {/* Status Footer */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        borderRadius: '6px',
        background: allRequiredChecked ? '#f0fdf4' : '#fef2f2',
        border: `1px solid ${allRequiredChecked ? '#86efac' : '#fecaca'}`,
      }}>
        <p style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: 500,
          color: allRequiredChecked ? '#166534' : '#dc2626',
        }}>
          {allRequiredChecked
            ? '✓ All required documents brought!'
            : `⚠ Missing ${totalRequired - requiredCheckedCount} required document(s)`}
        </p>
      </div>

      {saving && (
        <p style={{
          margin: '8px 0 0 0',
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
        }}>
          Saving...
        </p>
      )}
    </div>
  );
}
