'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    campus: 'main'
  });

  useEffect(() => {
    setSupabase(createClient());
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetMode, setResetMode] = useState<'login' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (resetMode === 'login') {
        if (!supabase) {
          setError('System is not ready. Please refresh the page.');
          return;
        }
        console.log('Attempting login with:', formData.email, formData.campus);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        console.log('Login response:', { data, error });

        if (error) {
          console.error('Supabase auth error:', error);
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please confirm your email address first. Check your inbox.');
          } else if (error.message.includes('User not found')) {
            setError('No account found with this email. Please register first.');
          } else {
            setError(error.message || 'Login failed. Please try again.');
          }
          return;
        }

        if (!data.user) {
          setError('No user data returned. Please try again.');
          return;
        }

        // Verify user has admin role
        const userRole = data.user.user_metadata?.role;
        console.log('User role from metadata:', userRole);
        if (userRole !== 'admin') {
          setError('Access denied. You do not have admin privileges. Current role: ' + (userRole || 'none'));
          await supabase.auth.signOut();
          return;
        }

        // Verify campus matches user's assigned campus
        const userCampus = data.user.user_metadata?.campus;
        console.log('User campus from metadata:', userCampus);
        if (userCampus !== formData.campus) {
          setError(`Access denied. This account is registered for ${userCampus === 'main' ? 'Main' : 'West'} Campus, not ${formData.campus === 'main' ? 'Main' : 'West'} Campus.`);
          await supabase.auth.signOut();
          return;
        }

        if (data?.session) {
          console.log('Admin login successful, waiting for cookies...');
          localStorage.setItem('adminCampus', formData.campus);
          await new Promise(resolve => setTimeout(resolve, 1000));
          router.replace('/admin/dashboard');
        } else {
          setError('Session not created. Please try again.');
        }
      } else if (resetMode === 'reset') {
        if (!supabase) {
          setError('System is not ready. Please refresh the page.');
          return;
        }

        // First verify the user exists and is an admin
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', formData.email)
          .single();

        // User might not exist in our app table, but might exist in auth
        // Let's check auth directly by attempting a dummy sign in
        // Actually, let's send the reset email - Supabase will handle validation

        // Send the reset email directly without requiring current password
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          // Check specific error types
          if (error.message.includes('User not found')) {
            setError('No account found with this email. Please check your email address.');
          } else if (error.message.includes('Already been sent')) {
            setError('A reset email has already been sent recently. Please check your inbox or try again later.');
          } else {
            setError(error.message);
          }
          return;
        }

        setSuccess('Password reset email sent! Please check your email and follow the instructions to reset your password.');
        setResetMode('login');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
                  sizes="(max-width: 768px) 128px, 160px"
                  loading="eager"
                />
              </div>
            </Link>
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
              {resetMode === 'login' ? 'Admin Login' : 'Reset Password'}
            </h1>
            <p className="text-purple-200 text-sm md:text-base">
              {resetMode === 'login' ? 'Login to access admin' : 'Reset your admin password'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-sm text-center text-red-200">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/50">
                <p className="text-sm text-center text-green-200">{success}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              {resetMode === 'login' ? (
                <>
                  <div>
                    <label htmlFor="email" className="block text-white font-medium mb-2 text-sm md:text-base">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-white font-medium mb-2 text-sm md:text-base">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="campus" className="block text-white font-medium mb-2 text-sm md:text-base">
                      Campus *
                    </label>
                    <select
                      id="campus"
                      name="campus"
                      value={formData.campus}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    >
                      <option value="west" className="bg-purple-900">West Campus</option>
                      <option value="main" className="bg-purple-900">Main Campus</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing in...' : 'Login'}
                  </button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setResetMode('reset')}
                      className="text-purple-300 hover:text-purple-200 text-sm underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-purple-200 text-sm mb-4">Enter your email address and we'll send you a password reset link.</p>
                  <div>
                    <label htmlFor="email" className="block text-white font-medium mb-2 text-sm md:text-base">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Send Reset Email'}
                  </button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setResetMode('login')}
                      className="text-purple-300 hover:text-purple-200 text-sm underline"
                    >
                      Back to Login
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/30 hover:border-white/50 text-white rounded-xl transition-all duration-300 text-sm md:text-base font-medium backdrop-blur-sm"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
