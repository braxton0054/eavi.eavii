'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

interface AcademicCalendar {
  id: string;
  academic_year: string;
  term: number;
  term_name: string;
  term_start_date: string;
  term_end_date: string;
  cat_opening_date: string;
  cat_closing_date: string;
  end_term_exam_date: string;
  mock_exam_available: boolean;
  mock_exam_date: string | null;
  campus: string;
}

export default function StudentCalendar() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [calendars, setCalendars] = useState<AcademicCalendar[]>([]);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login/student');
        return;
      }

      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'student') {
        if (userRole === 'admin') {
          router.push('/admin/dashboard');
        } else if (userRole === 'lecturer') {
          router.push('/lecturer/dashboard');
        } else {
          router.push('/login/student');
        }
        return;
      }

      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('studentCampus');
      setCampus(userCampus);

      await loadCalendars(userCampus);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadCalendars = async (campusFilter: string) => {
    const { data, error } = await supabase
      .from('academic_calendar')
      .select('*')
      .eq('campus', campusFilter)
      .order('academic_year', { ascending: false })
      .order('term', { ascending: true });

    if (error) {
      console.error('Error loading calendars:', error);
    } else {
      setCalendars(data || []);
    }
  };

  const getCampusName = (campusCode: string) => {
    switch (campusCode) {
      case 'main': return 'Main Campus';
      case 'west': return 'West Campus';
      default: return 'Unknown Campus';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isDatePassed = (dateString: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const isDateUpcoming = (dateString: string) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-green-950 via-green-900 to-emerald-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-green-950 via-green-900 to-emerald-950">
      <div className="relative z-10 w-full">
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/student/dashboard" className="text-green-200 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="relative w-12 h-12">
                <Image
                  src="/logo.webp"
                  alt="EAVI Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Academic Calendar</h1>
                <p className="text-green-200 text-sm">{getCampusName(campus)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Term Dates & Exam Schedule</h2>
            <p className="text-green-200">View upcoming term dates, CAT periods, and exam schedules</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {calendars.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
                <p className="text-green-200">No academic calendar entries available at this time.</p>
              </div>
            ) : (
              calendars.map((calendar) => (
                <div key={calendar.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-white">{calendar.academic_year} - {calendar.term_name}</h3>
                    <p className="text-green-200 text-sm">Term {calendar.term}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className={`bg-white/5 rounded-lg p-4 border ${isDateUpcoming(calendar.term_start_date) ? 'border-green-500' : ''}`}>
                      <p className="text-green-300 text-sm mb-1">Term Period</p>
                      <p className="text-white font-semibold">{formatDate(calendar.term_start_date)} - {formatDate(calendar.term_end_date)}</p>
                      {isDatePassed(calendar.term_end_date) && (
                        <p className="text-green-400 text-xs mt-1">Term ended</p>
                      )}
                    </div>
                    <div className={`bg-white/5 rounded-lg p-4 border ${isDateUpcoming(calendar.cat_opening_date) || isDateUpcoming(calendar.cat_closing_date) ? 'border-yellow-500' : ''}`}>
                      <p className="text-green-300 text-sm mb-1">CAT Period</p>
                      <p className="text-white font-semibold">{formatDate(calendar.cat_opening_date)} - {formatDate(calendar.cat_closing_date)}</p>
                      {isDatePassed(calendar.cat_closing_date) && (
                        <p className="text-green-400 text-xs mt-1">CAT closed</p>
                      )}
                      {!isDatePassed(calendar.cat_closing_date) && !isDatePassed(calendar.cat_opening_date) && (
                        <p className="text-yellow-400 text-xs mt-1">CAT ongoing</p>
                      )}
                    </div>
                    <div className={`bg-white/5 rounded-lg p-4 border ${isDateUpcoming(calendar.end_term_exam_date) ? 'border-red-500' : ''}`}>
                      <p className="text-green-300 text-sm mb-1">End Term Exam</p>
                      <p className="text-white font-semibold">{formatDate(calendar.end_term_exam_date)}</p>
                      {isDatePassed(calendar.end_term_exam_date) && (
                        <p className="text-green-400 text-xs mt-1">Exam completed</p>
                      )}
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-green-300 text-sm mb-1">Mock Exam</p>
                      <p className="text-white font-semibold">
                        {calendar.mock_exam_available ? `Yes - ${formatDate(calendar.mock_exam_date || '')}` : 'Not scheduled'}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
