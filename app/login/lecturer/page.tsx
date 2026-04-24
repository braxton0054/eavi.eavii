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
    <div className="min-h-screen w-full bg-[#1e0f3a] text-white">
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full">
          <div className="text-center mb-8">
            <div className="inline-block p-2 bg-[#8b5cf6]/20 rounded-2xl mb-4">
              <Image src="/logo.webp" alt="EAVI" width={60} height={60} className="object-contain" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">
              {mode === 'login' ? 'Lecturer Portal' : mode === 'register' ? 'Register Account' : 'Reset Access'}
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8b5cf6]/30 border border-[#8b5cf6]/50 rounded-full text-xs text-[#a78bfa] tracking-wider uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#a78bfa]"></span> Secure Portal
            </div>
          </div>

          <div className="bg-[#1e0f3a]/80 backdrop-blur-md rounded-2xl p-8 border border-[#8b5cf6]/30 shadow-2xl">
            {error && <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-sm text-center text-red-200">{error}</div>}
            {success && <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-500/50 text-sm text-center text-green-200">{success}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {(mode === 'login' || mode === 'register') && (
                <>
                  {mode === 'register' && (
                    <div>
                      <label className="block text-sm font-medium text-[#a78bfa] mb-1.5">Lecturer Number</label>
                      <input type="text" name="lecturerNumber" value={formData.lecturerNumber} onChange={handleChange} required 
                        className="w-full px-4 py-3 bg-[#130920] border border-[#8b5cf6]/30 rounded-xl focus:border-[#8b5cf6] outline-none" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[#a78bfa] mb-1.5">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required 
                      className="w-full px-4 py-3 bg-[#130920] border border-[#8b5cf6]/30 rounded-xl focus:border-[#8b5cf6] outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#a78bfa] mb-1.5">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required 
                      className="w-full px-4 py-3 bg-[#130920] border border-[#8b5cf6]/30 rounded-xl focus:border-[#8b5cf6] outline-none" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white rounded-xl font-bold shadow-lg shadow-[#8b5cf6]/20">
                    {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Register'}
                  </button>
                  <div className="text-center space-y-2">
                    <button type="button" onClick={() => setMode('reset')} className="block w-full text-[#a78bfa] text-sm hover:text-white">Forgot Password?</button>
                    <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="block w-full text-[#a78bfa] text-sm hover:text-white">
                      {mode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                  </div>
                </>
              )}
              {mode === 'reset' && (
                <>
                  <p className="text-[#a78bfa] text-sm mb-4">Enter your email and we'll send a reset link.</p>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-[#130920] border border-[#8b5cf6]/30 rounded-xl" />
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white rounded-xl font-bold">Send Reset Link</button>
                  <button type="button" onClick={() => setMode('login')} className="w-full text-center text-[#a78bfa] text-sm">Back to Login</button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
