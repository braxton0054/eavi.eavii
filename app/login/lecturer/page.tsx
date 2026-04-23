'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export default function LecturerLogin() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [formData, setFormData] = useState({
    lecturerNumber: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    setSupabase(createClient());
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!supabase) {
          setError('System is not ready. Please refresh the page.');
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          setError(error.message || 'Invalid email or password. Please try again.');
          return;
        }

        if (data?.session) {
          console.log('Login successful, waiting for cookies...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          router.replace('/lecturer/dashboard');
        } else {
          setError('Login failed. Please try again.');
        }
      } else if (mode === 'register') {
        if (!supabase) {
          setError('System is not ready. Please refresh the page.');
          return;
        }
        // First validate lecturer number exists in lecturers table
        const { data: lecturerData, error: lecturerError } = await supabase
          .from('lecturers')
          .select('*')
          .eq('lecturer_number', formData.lecturerNumber)
          .single();

        if (lecturerError || !lecturerData) {
          setError('Invalid lecturer number. Please check with the admin.');
          return;
        }

        // Register with email and password, store lecturer number in metadata
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/login/lecturer`,
            data: {
              lecturer_number: formData.lecturerNumber,
              role: 'lecturer',
              full_name: lecturerData.full_name,
              phone_number: lecturerData.phone_number
            }
          },
        });

        if (error) {
          setError(error.message);
          return;
        }

        setSuccess('Registration successful! Please check your email to confirm your account.');
        setMode('login');
      } else if (mode === 'reset') {
        if (!supabase) {
          setError('System is not ready. Please refresh the page.');
          return;
        }

        // Verify this email is registered as a lecturer account
        const { data: lecturerData, error: lecturerError } = await supabase
          .from('lecturers')
          .select('email')
          .eq('email', formData.email)
          .single();

        if (lecturerError || !lecturerData) {
          setError('This email is not registered as a lecturer. Please contact admin.');
          return;
        }

        // Send reset email only for verified lecturer email
        const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          setError(error.message || 'Failed to send reset email. Please try again.');
          return;
        }

        setSuccess('Password reset email has been sent. Please check your email.');
        setMode('login');
      }
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
              {(mode === 'login' || mode === 'reset') ? 'Lecturer Login' : 'Lecturer Registration'}
            </h1>
            <p className="text-purple-200 text-sm md:text-base">
              {(mode === 'login' || mode === 'reset') ? 'Login to access lecturer' : 'Create your lecturer account'}
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
              {mode === 'login' ? (
                <>
                  <div>
                    <label htmlFor="lecturerNumber" className="block text-white font-medium mb-2 text-sm md:text-base">
                      Lecturer Number *
                    </label>
                    <input
                      type="text"
                      id="lecturerNumber"
                      name="lecturerNumber"
                      value={formData.lecturerNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>

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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Signing in...' : 'Login'}
                  </button>

                  <div className="text-center mt-4 space-y-2">
                    <button
                      type="button"
                      onClick={() => setMode('reset')}
                      className="text-purple-300 hover:text-purple-200 text-sm underline block"
                    >
                      Forgot Password?
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-purple-300 hover:text-purple-200 text-sm underline block"
                    >
                      Don't have an account? Register
                    </button>
                  </div>
                </>
              ) : mode === 'register' ? (
                <>
                  <div>
                    <label htmlFor="lecturerNumber" className="block text-white font-medium mb-2 text-sm md:text-base">
                      Lecturer Number *
                    </label>
                    <input
                      type="text"
                      id="lecturerNumber"
                      name="lecturerNumber"
                      value={formData.lecturerNumber}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm md:text-base"
                    />
                  </div>

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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Register'}
                  </button>

                  <div className="text-center mt-4">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-purple-300 hover:text-purple-200 text-sm underline"
                    >
                      Already have an account? Login
                    </button>
                  </div>
                </>
              ) : (
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
                      onClick={() => setMode('login')}
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
