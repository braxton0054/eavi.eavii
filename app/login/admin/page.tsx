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
    <div className="min-h-screen w-full bg-[#1e0f3a] text-white">
      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full">
          <div className="text-center mb-8">
            <div className="inline-block p-2 bg-[#8b5cf6]/20 rounded-2xl mb-4">
              <Image src="/logo.webp" alt="EAVI" width={60} height={60} className="object-contain" />
            </div>
            <h1 className="text-3xl font-serif font-bold text-white mb-2">
              {resetMode === 'login' ? 'Admin Portal' : 'Reset Access'}
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#8b5cf6]/30 border border-[#8b5cf6]/50 rounded-full text-xs text-[#a78bfa] tracking-wider uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#a78bfa]"></span> Secure Portal
            </div>
          </div>

          <div className="bg-[#1e0f3a]/80 backdrop-blur-md rounded-2xl p-8 border border-[#8b5cf6]/30 shadow-2xl">
            {error && <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-500/50 text-sm text-center text-red-200">{error}</div>}
            {success && <div className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-500/50 text-sm text-center text-green-200">{success}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {resetMode === 'login' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#a78bfa] mb-1.5">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required 
                      className="w-full px-4 py-3 bg-[#130920] border border-[#8b5cf6]/30 rounded-xl focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#a78bfa] mb-1.5">Password</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required 
                      className="w-full px-4 py-3 bg-[#130920] border border-[#8b5cf6]/30 rounded-xl focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] outline-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#a78bfa] mb-2">Select Campus</label>
                    <div className="grid grid-cols-2 gap-2 bg-[#130920] p-1 rounded-xl border border-[#8b5cf6]/30">
                      {['west', 'main'].map(c => (
                        <button type="button" key={c} onClick={() => setFormData(p => ({...p, campus: c}))}
                          className={`py-2 px-4 rounded-lg text-sm font-semibold capitalize transition-all ${formData.campus === c ? 'bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white shadow-lg' : 'text-[#a78bfa]'}`}>
                          {c} Campus
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-4 bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white rounded-xl font-bold shadow-lg shadow-[#8b5cf6]/20">
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>

                  <button type="button" onClick={() => setResetMode('reset')} className="w-full text-center text-[#a78bfa] text-sm hover:text-white">Forgot Password?</button>
                </>
              ) : (
                <>
                  <p className="text-[#a78bfa] text-sm mb-4">Enter your email and we'll send a reset link.</p>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-4 py-3 bg-[#130920] border border-[#8b5cf6]/30 rounded-xl" />
                  <button type="submit" className="w-full py-4 bg-gradient-to-r from-[#6d28d9] to-[#8b5cf6] text-white rounded-xl font-bold">Send Reset Link</button>
                  <button type="button" onClick={() => setResetMode('login')} className="w-full text-center text-[#a78bfa] text-sm">Back to Login</button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
