'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [supabase, setSupabase] = useState<any>(null);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    // Check if user is authenticated (they should be after clicking the email link)
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setError('Invalid or expired reset link. Please request a new password reset.');
        return;
      }
      
      if (!session) {
        // Try to get session from URL params (some providers use hash)
        const hash = window.location.hash;
        if (hash && hash.includes('access_token')) {
          // Session might be in the URL, try to set it
          const { data: { session: newSession }, error: newSessionError } = await supabase.auth.getSession();
          if (newSessionError || !newSession) {
            setError('Invalid or expired reset link. Please request a new password reset.');
          }
        } else {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      }
    };
    checkSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: formData.password
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err) {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
        <div className="relative z-10 w-full max-w-md mx-auto px-4 md:px-6 py-8 md:py-12 flex items-center justify-center min-h-screen">
          <div className="w-full">
            <div className="text-center mb-8">
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto mb-6">
                <Image
                  src="/logo.webp"
                  alt="East Africa Vision Institute Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Password Updated!</h1>
              <p className="text-purple-200 text-sm md:text-base">
                Your password has been successfully updated. Redirecting to home page...
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-green-200 text-sm">You can now login with your new password.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full max-w-md mx-auto px-4 md:px-6 py-8 md:py-12 flex items-center justify-center min-h-screen">
        <div className="w-full">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto">
                <Image
                  src="/logo.webp"
                  alt="East Africa Vision Institute Logo"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">Reset Password</h1>
            <p className="text-purple-200 text-sm md:text-base">
              Enter your new password below
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-sm text-center text-red-200">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-white font-medium mb-2 text-sm md:text-base">
                  New Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-white font-medium mb-2 text-sm md:text-base">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>

              <div className="text-center mt-4">
                <Link
                  href="/"
                  className="text-purple-300 hover:text-purple-200 text-sm underline"
                >
                  Back to Home
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
