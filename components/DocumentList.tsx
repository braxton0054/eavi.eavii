'use client';

import { useState, useEffect } from 'react';

interface ApplicationData {
  has_national_id: boolean;
  has_birth_certificate: boolean;
  has_kcse_certificate: boolean;
  has_kcse_result_slip: boolean;
  has_kcpe_certificate: boolean;
  has_kcpe_result_slip: boolean;
  has_passport_photo: boolean;
  has_passport_document: boolean;
  has_spring_file: boolean;
  has_rem_paper: boolean;
  has_kcse_photocopy: boolean;
  has_kcpe_photocopy: boolean;
  has_transfer_letter: boolean;
  has_sponsor_letter: boolean;
  has_medical_certificate: boolean;
  has_school_leaving: boolean;
  [key: string]: boolean | undefined;
}

interface DocumentListProps {
  applicationId: string;
  isAdmin?: boolean;
  onChange?: () => void;
}

const ALL_DOCUMENTS = [
  { type: 'has_national_id', label: 'National ID', required: true },
  { type: 'has_birth_certificate', label: 'Birth Certificate', required: true },
  { type: 'has_kcse_certificate', label: 'KCSE Certificate', required: true },
  { type: 'has_kcse_result_slip', label: 'KCSE Result Slip', required: false },
  { type: 'has_kcpe_certificate', label: 'KCPE Certificate', required: false },
  { type: 'has_kcpe_result_slip', label: 'KCPE Result Slip', required: false },
  { type: 'has_passport_photo', label: 'Passport Photo', required: true },
  { type: 'has_passport_document', label: 'Passport (Foreign Students)', required: false },
  { type: 'has_transfer_letter', label: 'Transfer Letter', required: false },
  { type: 'has_sponsor_letter', label: 'Sponsor Letter', required: false },
  { type: 'has_medical_certificate', label: 'Medical Certificate', required: false },
  { type: 'has_spring_file', label: 'Spring File', required: false },
  { type: 'has_rem_paper', label: 'REM Paper', required: false },
  { type: 'has_kcse_photocopy', label: 'KCSE Photocopy', required: false },
  { type: 'has_kcpe_photocopy', label: 'KCPE Photocopy', required: false },
  { type: 'has_school_leaving', label: 'School Leaving Certificate', required: false },
];

export default function DocumentList({ applicationId, isAdmin = false, onChange }: DocumentListProps) {
  const [checks, setChecks] = useState<ApplicationData>({
    has_national_id: false,
    has_birth_certificate: false,
    has_kcse_certificate: false,
    has_kcse_result_slip: false,
    has_kcpe_certificate: false,
    has_kcpe_result_slip: false,
    has_passport_photo: false,
    has_passport_document: false,
    has_spring_file: false,
    has_rem_paper: false,
    has_kcse_photocopy: false,
    has_kcpe_photocopy: false,
    has_transfer_letter: false,
    has_sponsor_letter: false,
    has_medical_certificate: false,
    has_school_leaving: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Load document checklist from applications table
  const fetchChecklist = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      
      setChecks({
        has_national_id: data.has_national_id || false,
        has_birth_certificate: data.has_birth_certificate || false,
        has_kcse_certificate: data.has_kcse_certificate || false,
        has_kcse_result_slip: data.has_kcse_result_slip || false,
        has_kcpe_certificate: data.has_kcpe_certificate || false,
        has_kcpe_result_slip: data.has_kcpe_result_slip || false,
        has_passport_photo: data.has_passport_photo || false,
        has_passport_document: data.has_passport_document || false,
        has_spring_file: data.has_spring_file || false,
        has_rem_paper: data.has_rem_paper || false,
        has_kcse_photocopy: data.has_kcse_photocopy || false,
        has_kcpe_photocopy: data.has_kcpe_photocopy || false,
        has_transfer_letter: data.has_transfer_letter || false,
        has_sponsor_letter: data.has_sponsor_letter || false,
        has_medical_certificate: data.has_medical_certificate || false,
        has_school_leaving: data.has_school_leaving || false,
      });
    } catch (err) {
      console.error('Failed to fetch checklist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecklist();
  }, [applicationId]);

  const toggleDocument = async (docType: string) => {
    const currentValue = (checks as any)[docType];
    const newValue = !currentValue;
    setSaving(docType);
    
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [docType]: newValue,
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setChecks({ ...checks, [docType]: newValue });
      onChange?.();
    } catch (err) {
      alert('Failed to update document status');
    } finally {
      setSaving(null);
    }
  };

  const receivedCount = Object.values(checks).filter(v => v).length;
  const requiredCount = ALL_DOCUMENTS.filter(d => d.required).length;
  const requiredReceived = ALL_DOCUMENTS.filter(d => d.required && checks[d.type]).length;

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
        Loading checklist...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          Document Checklist
        </h3>
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          {receivedCount}/{ALL_DOCUMENTS.length} received
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
          <span>Required: {requiredReceived}/{requiredCount}</span>
          <span>{Math.round((receivedCount / ALL_DOCUMENTS.length) * 100)}%</span>
        </div>
        <div style={{ height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${(receivedCount / ALL_DOCUMENTS.length) * 100}%`,
              background: requiredReceived === requiredCount ? '#22c55e' : '#f59e0b',
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
      </div>

      {/* Missing Required Alert */}
      {requiredReceived < requiredCount && (
        <div
          style={{
            padding: '12px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 500, color: '#dc2626' }}>
            Missing Required Documents: {requiredCount - requiredReceived}
          </p>
        </div>
      )}

      {/* Document Checklist */}
      {ALL_DOCUMENTS.map((doc) => {
        const received = checks[doc.type] || false;
        
        return (
          <div
            key={doc.type}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              marginBottom: '8px',
              background: received ? '#dcfce7' : '#f9fafb',
              border: `1px solid ${received ? '#86efac' : '#e5e7eb'}`,
              borderRadius: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Status Icon */}
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: received ? '#22c55e' : '#d1d5db',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '14px',
                  fontWeight: 'bold',
                }}
              >
                {received ? '✓' : '○'}
              </span>
              
              {/* Document Name */}
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: '#111' }}>
                  {doc.label}
                  {doc.required && (
                    <span style={{ color: '#dc2626', marginLeft: '4px', fontSize: '12px' }}>*required</span>
                  )}
                </p>
              </div>
            </div>

            {/* YES/NO Toggle (Admin Only) */}
            {isAdmin && (
              <button
                onClick={() => toggleDocument(doc.type)}
                disabled={saving === doc.type}
                style={{
                  padding: '6px 16px',
                  background: received ? '#22c55e' : '#ffffff',
                  border: `2px solid ${received ? '#22c55e' : '#d1d5db'}`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: received ? '#ffffff' : '#374151',
                  cursor: saving === doc.type ? 'not-allowed' : 'pointer',
                  minWidth: '60px',
                  transition: 'all 0.2s ease',
                }}
              >
                {saving === doc.type ? '...' : received ? 'YES' : 'NO'}
              </button>
            )}

            {/* Read-only Status (Non-Admin) */}
            {!isAdmin && (
              <span
                style={{
                  padding: '4px 12px',
                  background: received ? '#dcfce7' : '#f3f4f6',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: received ? '#166534' : '#6b7280',
                }}
              >
                {received ? 'Received' : 'Pending'}
              </span>
            )}
          </div>
        );
      })}

      {/* Summary Footer */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: requiredReceived === requiredCount ? '#dcfce7' : '#fef3c7',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 500, color: requiredReceived === requiredCount ? '#166534' : '#92400e' }}>
          {requiredReceived === requiredCount 
            ? '✓ All required documents received!' 
            : `⚠ ${requiredCount - requiredReceived} required document(s) still missing`}
        </p>
      </div>
    </div>
  );
}
