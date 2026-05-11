'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/client';

interface ProfilePictureUploadProps {
  currentUrl?: string | null;
  applicationId?: string;
  userName?: string;
  size?: 'sm' | 'md' | 'lg';
  onUpdate?: (url: string) => void;
}

export default function ProfilePictureUpload({
  currentUrl,
  applicationId,
  userName = '',
  size = 'md',
  onUpdate,
}: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient().auth.getSession().then((s: any) => {
      if (s.data.session?.access_token) setToken(s.data.session.access_token);
    });
  }, []);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const initials = userName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');

    // Validate type
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Invalid file type. Use JPG, PNG, or WebP.');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Max 5MB.');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file || !applicationId) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('application_id', applicationId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (onUpdate) onUpdate(data.url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100`}>
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : currentUrl ? (
          <img src={currentUrl} alt={userName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold text-lg">
            {initials || '?'}
          </div>
        )}

        {/* Upload overlay */}
        <label
          htmlFor="profile-upload"
          className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-colors cursor-pointer group"
        >
          <svg
            className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </label>
        <input
          ref={fileInputRef}
          id="profile-upload"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {preview && (
        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </span>
            ) : (
              'Save Photo'
            )}
          </button>
          <button
            onClick={() => { setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
