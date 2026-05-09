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

        // Send reset email — Supabase Auth handles user existence validation

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
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 text-white font-sans">
      {/* Back Button */}
      <Link href="/" className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-purple-200 hover:bg-white/20 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mb-4">
              <Image src="/logo.webp" alt="EAVI" width={70} height={70} className="object-contain" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              {resetMode === 'login' ? 'Admin Portal' : 'Reset Password'}
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs text-purple-200 tracking-wider uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span> Secure Portal
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20">
              {['login', 'reset'].map((m) => (
                <button
                  key={m}
                  onClick={() => setResetMode(m as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    resetMode === m
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/30'
                      : 'text-purple-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl shadow-black/30">
            {error && (
              <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-center text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-center text-green-300">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {resetMode === 'login' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-white placeholder-purple-300" 
                      placeholder="admin@eavi.ac.ke"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-2">Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-white placeholder-purple-300" 
                      placeholder="Enter your password"
                    />
                  </div>

                  {/* Campus Selector */}
                  <div>
                    <label className="block text-sm font-medium text-purple-200 mb-3">Select Campus</label>
                    <div className="flex gap-3">
                      {['main', 'west'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData(p => ({...p, campus: c}))}
                          className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold capitalize transition-all ${
                            formData.campus === c
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-600/30'
                              : 'bg-white/10 backdrop-blur-md border border-white/20 text-purple-200 hover:text-white hover:border-green-400'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {c} Campus
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                        Authenticating...
                      </span>
                    ) : 'Sign In'}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setResetMode('reset')} 
                    className="w-full text-center text-sm text-purple-300 hover:text-purple-200 transition-colors"
                  >
                    Forgot your password?
                  </button>
                </>
              ) : (
                <>
                  {/* Step Indicator */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          step === 1 
                            ? 'bg-[#c4a050] text-[#0a1628]' 
                            : 'bg-[#0a1628] border border-[#c4a050]/30 text-gray-500'
                        }`}>
                          {step}
                        </div>
                        {step < 3 && (
                          <div className="w-8 h-0.5 bg-[#c4a050]/20" />
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-gray-400 text-sm text-center mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-white placeholder-purple-300" 
                    placeholder="Enter your email"
                  />
                  <button 
                    type="submit" 
                    className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-600/30 hover:shadow-green-600/50 hover:scale-[1.02] transition-all"
                  >
                    Send Reset Link
                  </button>
                </>
              )}
            </form>
          </div>

          {/* Footer Text */}
          <p className="text-center text-gray-500 text-sm mt-6">
            © 2026 East Africa Vision Institute. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
