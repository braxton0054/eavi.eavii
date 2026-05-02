'use client';

import { useState, useCallback } from 'react';

interface DocumentUploadProps {
  applicationId: string;
  onUploadComplete?: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'national_id', label: 'National ID', required: true },
  { value: 'birth_certificate', label: 'Birth Certificate', required: false },
  { value: 'kcse_certificate', label: 'KCSE Certificate', required: true },
  { value: 'kcpe_certificate', label: 'KCPE Certificate', required: false },
  { value: 'passport', label: 'Passport', required: false },
  { value: 'photo', label: 'Passport Photo', required: true },
  { value: 'transfer_letter', label: 'Transfer Letter', required: false },
  { value: 'sponsor_letter', label: 'Sponsor Letter', required: false },
  { value: 'medical_certificate', label: 'Medical Certificate', required: false },
  { value: 'other', label: 'Other Document', required: false },
];

export default function DocumentUpload({ applicationId, onUploadComplete }: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Allowed: JPEG, PNG, PDF');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !documentType) {
      setError('Please select a file and document type');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('applicationId', applicationId);
      formData.append('documentType', documentType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess('Document uploaded successfully!');
      setSelectedFile(null);
      setDocumentType('');
      onUploadComplete?.();

    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size exceeds 10MB limit');
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Allowed: JPEG, PNG, PDF');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600 }}>Upload Document</h3>

      {/* Document Type Selector */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 500 }}>
          Document Type
        </label>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
          }}
        >
          <option value="">Select document type...</option>
          {DOCUMENT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label} {type.required && '*'}
            </option>
          ))}
        </select>
        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#6b7280' }}>
          * Required documents
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        style={{
          border: '2px dashed #d1d5db',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          background: selectedFile ? '#f0fdf4' : '#f9fafb',
          cursor: 'pointer',
          marginBottom: '16px',
        }}
      >
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
          {selectedFile ? (
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: 500, color: '#166534' }}>
                ✓ {selectedFile.name}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: 500 }}>
                Drop file here or click to browse
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                JPEG, PNG, PDF up to 10MB
              </p>
            </div>
          )}
        </label>
      </div>

      {/* Progress Bar */}
      {uploading && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              height: '4px',
              background: '#e5e7eb',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: '#3b82f6',
                transition: 'width 0.3s',
              }}
            />
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Uploading... {progress}%
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: '10px 12px',
            background: '#fee2e2',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div
          style={{
            padding: '10px 12px',
            background: '#dcfce7',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#166534',
          }}
        >
          {success}
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!selectedFile || !documentType || uploading}
        style={{
          width: '100%',
          padding: '10px',
          background: !selectedFile || !documentType || uploading ? '#9ca3af' : '#111',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 500,
          cursor: !selectedFile || !documentType || uploading ? 'not-allowed' : 'pointer',
        }}
      >
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
    </div>
  );
}
