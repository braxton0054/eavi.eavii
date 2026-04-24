'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  email: string;
  phone: string;
  course: string;
  course_type?: string;
  campus: string;
  kcse_grade: string;
  application_date: string;
  status: 'enrolled' | 'pending' | 'rejected';
  current_semester?: number;
  class_name?: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login/admin');
        return;
      }

      // Verify user has admin role
      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'admin') {
        if (userRole === 'lecturer') {
          router.push('/lecturer/dashboard');
        } else if (userRole === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/login/admin');
        }
        return;
      }

      // Get user metadata to determine campus
      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);

      // Load students
      loadStudents(userCampus);
    };

    checkAuth();
  }, [supabase, router]);

  const loadStudents = async (campusCode: string) => {
    try {
      let query = supabase
        .from('applications')
        .select('*, courses(name), course_types(level)')
        .eq('status', 'enrolled')
        .order('application_date', { ascending: false });

      // Filter by campus to show only this campus's students
      if (campusCode && campusCode !== 'all') {
        query = query.eq('campus', campusCode);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading students:', error);
        setError('Failed to load students: ' + error.message);
        setStudents([]);
      } else {
        console.log('Loaded students:', data);
        // Flatten the data for the UI
        const enrichedData = (data || []).map((student: any) => ({
          ...student,
          course: student.courses?.name,
          course_type: student.course_types?.level
        }));
        setStudents(enrichedData);
      }
    } catch (err) {
      console.error('Error loading students:', err);
      setError('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const getCampusName = (campusCode: string) => {
    switch (campusCode) {
      case 'main':
        return 'Main Campus';
      case 'west':
        return 'West Campus';
      default:
        return 'Unknown Campus';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="relative w-12 h-12">
                <Image
                  src="/logo.webp"
                  alt="EAVI Logo"
                  fill
                  className="object-contain"
                />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Students</h1>
                <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
              </div>
            </div>
            <Link
              href="/admin/dashboard"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 md:p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Enrolled Students</h2>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {students.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-purple-200">No enrolled students found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Name</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Admission No.</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Phone</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Email</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">KCSE Grade</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Course</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Type</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Semester</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Class</th>
                      <th className="text-left py-3 px-4 text-white font-semibold text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b border-white/10 hover:bg-white/5">
                        <td className="py-4 px-4 text-white text-sm">{student.full_name}</td>
                        <td className="py-4 px-4 text-white text-sm font-mono">{student.admission_number}</td>
                        <td className="py-4 px-4 text-white text-sm">{student.phone}</td>
                        <td className="py-4 px-4 text-white text-sm">{student.email || '-'}</td>
                        <td className="py-4 px-4 text-white text-sm">{student.kcse_grade}</td>
                        <td className="py-4 px-4 text-white text-sm">{student.course}</td>
                        <td className="py-4 px-4 text-white text-sm capitalize">{student.course_type || '-'}</td>
                        <td className="py-4 px-4 text-white text-sm">{student.current_semester || '-'}</td>
                        <td className="py-4 px-4 text-white text-sm">{student.class_name || '-'}</td>
                        <td className="py-4 px-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-green-500/20 border-green-500/50 text-green-400">
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
