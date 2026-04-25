'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

// Password strength calculator
const calculatePasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
  
  return {
    strength: Math.min(strength, 4),
    label: labels[strength] || 'Very Weak',
    color: colors[strength] || 'bg-red-500'
  };
};

export default function StudentLogin() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [formData, setFormData] = useState({
    username: '',
    admissionNumber: '',
    email: '',
    password: '',
    termsAccepted: false
  });

  useEffect(() => {
    setSupabase(createClient());
  }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  const passwordStrength = calculatePasswordStrength(formData.password);

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
        console.log('Attempting login...');
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          console.error('Login error:', error);
          setError(error.message || 'Invalid email or password. Please try again.');
          return;
        }

        if (data?.session) {
          console.log('Login successful, session obtained');
          // Wait longer for cookies to be set and cookies to be available to middleware
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('Redirecting to dashboard');
          // Use replace to prevent going back to login
          router.replace('/student/dashboard');
        } else {
          console.error('No session data returned from login');
          setError('Login failed. Please try again.');
        }
      } else if (mode === 'register') {
        if (!supabase) {
          setError('System is not ready. Please refresh the page.');
          return;
        }
        // First validate admission number exists in applications table (enrolled students)
        const { data: studentData, error: studentError } = await supabase
          .from('applications')
          .select('*')
          .eq('admission_number', formData.admissionNumber)
          .eq('status', 'enrolled')
          .single();

        if (studentError || !studentData) {
          setError('Invalid admission number. Please check with the admin.');
          return;
        }

        // Register with email and password, store admission number in metadata
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/login/student`,
            data: {
              admission_number: formData.admissionNumber,
              role: 'student',
              full_name: studentData.full_name,
              campus: studentData.campus
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

        // Verify this email is registered as a student account
        const { data: studentData, error: studentError } = await supabase
          .from('applications')
          .select('email')
          .eq('email', formData.email)
          .eq('status', 'enrolled')
          .single();

        if (studentError || !studentData) {
          setError('This email is not registered as an enrolled student. Please contact admin.');
          return;
        }

        // Send reset email only for verified student email
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(formData.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (resetError) {
          setError(resetError.message || 'Failed to send reset email. Please try again.');
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
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
    });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a1628] via-[#0d1e36] to-[#112244] text-white font-sans">
      {/* Back Button */}
      <Link href="/" className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 bg-[#c4a050]/10 border border-[#c4a050]/30 rounded-full text-[#c4a050] hover:bg-[#c4a050]/20 transition-all">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-[#c4a050]/10 border border-[#c4a050]/30 rounded-2xl mb-4">
              <Image src="/logo.webp" alt="EAVI" width={70} height={70} className="object-contain" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              {mode === 'login' ? 'Student Portal' : mode === 'register' ? 'Create Account' : 'Reset Password'}
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#c4a050]/10 border border-[#c4a050]/30 rounded-full text-xs text-[#c4a050] tracking-wider uppercase font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#c4a050] animate-pulse"></span> Secure Portal
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex justify-center mb-6">
            <div className="bg-[#0a1628]/80 backdrop-blur-sm p-1 rounded-xl border border-[#c4a050]/20">
              {['login', 'register', 'reset'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m
                      ? 'bg-gradient-to-r from-[#c4a050] to-[#d4b060] text-[#0a1628]'
                      : 'text-[#c4a050]/70 hover:text-[#c4a050]'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Card */}
          <div className="bg-[#0d1e36]/60 backdrop-blur-xl rounded-2xl p-8 border border-[#c4a050]/20 shadow-2xl shadow-black/30">
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
              {(mode === 'login' || mode === 'register') && (
                <>
                  {mode === 'register' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#c4a050] mb-2">Full Name</label>
                        <input 
                          type="text" 
                          name="username" 
                          value={formData.username} 
                          onChange={handleChange} 
                          required 
                          className="w-full px-4 py-3.5 bg-[#0a1628]/80 border border-[#c4a050]/30 rounded-xl focus:border-[#c4a050] focus:ring-2 focus:ring-[#c4a050]/20 outline-none transition-all text-white placeholder-gray-500" 
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#c4a050] mb-2">Admission Number</label>
                        <input 
                          type="text" 
                          name="admissionNumber" 
                          value={formData.admissionNumber} 
                          onChange={handleChange} 
                          required 
                          className="w-full px-4 py-3.5 bg-[#0a1628]/80 border border-[#c4a050]/30 rounded-xl focus:border-[#c4a050] focus:ring-2 focus:ring-[#c4a050]/20 outline-none transition-all text-white placeholder-gray-500" 
                          placeholder="E.g., EAVI/2024/001"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[#c4a050] mb-2">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      className="w-full px-4 py-3.5 bg-[#0a1628]/80 border border-[#c4a050]/30 rounded-xl focus:border-[#c4a050] focus:ring-2 focus:ring-[#c4a050]/20 outline-none transition-all text-white placeholder-gray-500" 
                      placeholder="student@eavi.ac.ke"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#c4a050] mb-2">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                        className="w-full px-4 py-3.5 bg-[#0a1628]/80 border border-[#c4a050]/30 rounded-xl focus:border-[#c4a050] focus:ring-2 focus:ring-[#c4a050]/20 outline-none transition-all text-white placeholder-gray-500" 
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c4a050]/60 hover:text-[#c4a050]"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    {/* Password Strength Bar */}
                    {mode === 'register' && formData.password && (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Password Strength</span>
                          <span className={passwordStrength.color.replace('bg-', 'text-')}>{passwordStrength.label}</span>
                        </div>
                        <div className="h-1.5 bg-[#0a1628] rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                            style={{ width: `${(passwordStrength.strength + 1) * 20}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">Use 8+ characters with uppercase, lowercase, numbers & symbols</p>
                      </div>
                    )}
                  </div>
                  {mode === 'register' && (
                    <div className="flex items-start gap-3 text-sm">
                      <input 
                        type="checkbox" 
                        name="termsAccepted" 
                        checked={formData.termsAccepted} 
                        onChange={handleChange} 
                        className="mt-0.5 w-4 h-4 accent-[#c4a050] rounded border-[#c4a050]/30" 
                      />
                      <span className="text-gray-400">
                        I agree to the <a href="#" className="text-[#c4a050] hover:underline">Terms of Service</a> and <a href="#" className="text-[#c4a050] hover:underline">Privacy Policy</a>
                      </span>
                    </div>
                  )}
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('reset')} 
                      className="text-sm text-[#c4a050]/70 hover:text-[#c4a050] transition-colors"
                    >
                      Forgot your password?
                    </button>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading || (mode === 'register' && !formData.termsAccepted)} 
                    className="w-full py-4 bg-gradient-to-r from-[#c4a050] to-[#d4b060] text-[#0a1628] rounded-xl font-bold text-lg shadow-lg shadow-[#c4a050]/20 hover:shadow-[#c4a050]/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                        Processing...
                      </span>
                    ) : mode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>
                </>
              )}
              
              {mode === 'reset' && (
                <>
                  {/* Step Indicator */}
                  <div className="flex items-center justify-center gap-2 mb-6">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          resetStep >= step 
                            ? 'bg-[#c4a050] text-[#0a1628]' 
                            : 'bg-[#0a1628] border border-[#c4a050]/30 text-gray-500'
                        }`}>
                          {step}
                        </div>
                        {step < 3 && (
                          <div className={`w-8 h-0.5 ${resetStep > step ? 'bg-[#c4a050]' : 'bg-[#c4a050]/20'}`} />
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
                    className="w-full px-4 py-3.5 bg-[#0a1628]/80 border border-[#c4a050]/30 rounded-xl focus:border-[#c4a050] focus:ring-2 focus:ring-[#c4a050]/20 outline-none transition-all text-white placeholder-gray-500" 
                    placeholder="Enter your email"
                  />
                  <button 
                    type="submit" 
                    className="w-full py-4 bg-gradient-to-r from-[#c4a050] to-[#d4b060] text-[#0a1628] rounded-xl font-bold text-lg shadow-lg shadow-[#c4a050]/20 hover:shadow-[#c4a050]/30 hover:scale-[1.02] transition-all"
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
