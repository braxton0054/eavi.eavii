'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  
  // Filter options
  const [filterIntake, setFilterIntake] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterGender, setFilterGender] = useState('');
  
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

      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);

      loadStudents(userCampus);
      loadCourses();
      loadDepartments();
    };

    checkAuth();
  }, [supabase, router]);

  const loadStudents = async (campusCode: string) => {
    try {
      let query = supabase
        .from('applications')
        .select('*')
        .order('application_date', { ascending: false });

      if (campusCode && campusCode !== 'all') {
        query = query.eq('campus', campusCode);
      }

      const { data: appsData, error: appsError } = await query;

      if (appsError) {
        console.error('Error loading students:', appsError);
        setStudents([]);
      } else {
        // Fetch courses separately and merge with applications
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, name, department');

        const coursesMap = new Map();
        if (coursesData) {
          coursesData.forEach((course: any) => {
            coursesMap.set(course.id, course);
          });
        }

        // Merge course data with applications
        const studentsWithCourses = (appsData || []).map((app: any) => ({
          ...app,
          courses: coursesMap.get(app.course_id) || null
        }));

        setStudents(studentsWithCourses);
      }
    } catch (err) {
      console.error('Error loading students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, name, department')
      .order('name');
    
    if (data) {
      setCourses(data);
    }
  };

  const loadDepartments = async () => {
    const { data } = await supabase
      .from('courses')
      .select('department');
    
    if (data) {
      const uniqueDepts = [...new Set(data.map((c: any) => c.department))] as string[];
      setDepartments(uniqueDepts);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('adminCampus');
    router.push('/login/admin');
  };

  const getFilteredStudents = () => {
    return students.filter(student => {
      if (filterIntake && student.application_date !== filterIntake) return false;
      if (filterCourse && student.course_id !== filterCourse) return false;
      if (filterDepartment && student.courses?.department !== filterDepartment) return false;
      if (filterGender && student.gender !== filterGender) return false;
      return true;
    });
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const filteredStudents = getFilteredStudents();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="relative w-10 h-10 md:w-12 md:h-12">
                <Image
                  src="/logo.webp"
                  alt="EAVI Logo"
                  fill
                  className="object-contain"
                />
              </Link>
              <div>
                <h1 className="text-xl md:text-3xl font-bold text-white">Student Reports</h1>
                <p className="text-purple-200 text-xs md:text-sm">View and print student reports</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Student List Report</h2>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-purple-200 text-sm mb-2">Intake (Application Date)</label>
                <select
                  value={filterIntake}
                  onChange={(e) => setFilterIntake(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Intakes</option>
                  {[...new Set(students.map(s => s.application_date))].sort().map(date => (
                    <option key={date} value={date} className="text-gray-900">{date}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">Course</label>
                <select
                  value={filterCourse}
                  onChange={(e) => setFilterCourse(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id} className="text-gray-900">{course.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">Department</label>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept} className="text-gray-900">{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">Gender</label>
                <select
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="w-full px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">All Genders</option>
                  <option value="male" className="text-gray-900">Male</option>
                  <option value="female" className="text-gray-900">Female</option>
                  <option value="other" className="text-gray-900">Other</option>
                </select>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-purple-200 text-sm">Total Students</p>
                <p className="text-2xl font-bold text-white">{students.length}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-purple-200 text-sm">Filtered Results</p>
                <p className="text-2xl font-bold text-white">{filteredStudents.length}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-purple-200 text-sm">Enrolled</p>
                <p className="text-2xl font-bold text-white">{students.filter(s => s.status === 'enrolled').length}</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-purple-200 text-sm">Pending</p>
                <p className="text-2xl font-bold text-white">{students.filter(s => s.status === 'pending').length}</p>
              </div>
            </div>

            {/* Print Button */}
            <div className="mb-6">
              <button
                onClick={printReport}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 text-sm font-semibold"
              >
                Print Report
              </button>
            </div>

            {/* Student Table - Desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-white border-collapse">
                <thead>
                  <tr className="border-b border-white/20 bg-white/5">
                    <th className="py-3 px-4 text-white font-semibold">Admission No</th>
                    <th className="py-3 px-4 text-white font-semibold">Name</th>
                    <th className="py-3 px-4 text-white font-semibold">Course</th>
                    <th className="py-3 px-4 text-white font-semibold">Department</th>
                    <th className="py-3 px-4 text-white font-semibold">Gender</th>
                    <th className="py-3 px-4 text-white font-semibold">Campus</th>
                    <th className="py-3 px-4 text-white font-semibold">Intake Date</th>
                    <th className="py-3 px-4 text-white font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 text-white font-mono">{student.admission_number || '-'}</td>
                      <td className="py-3 px-4 text-white">{student.full_name}</td>
                      <td className="py-3 px-4 text-white">{student.courses?.name || '-'}</td>
                      <td className="py-3 px-4 text-white">{student.courses?.department || '-'}</td>
                      <td className="py-3 px-4 text-white capitalize">{student.gender}</td>
                      <td className="py-3 px-4 text-white capitalize">{student.campus}</td>
                      <td className="py-3 px-4 text-white">{student.application_date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          student.status === 'enrolled' ? 'bg-green-500/20 text-green-400' :
                          student.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-semibold">{student.full_name}</p>
                      <p className="text-purple-200 text-sm">{student.admission_number || '-'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      student.status === 'enrolled' ? 'bg-green-500/20 text-green-400' :
                      student.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-purple-200">Course:</span>
                      <span className="text-white">{student.courses?.name || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200">Department:</span>
                      <span className="text-white">{student.courses?.department || '-'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200">Gender:</span>
                      <span className="text-white capitalize">{student.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200">Campus:</span>
                      <span className="text-white capitalize">{student.campus}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200">Intake Date:</span>
                      <span className="text-white">{student.application_date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredStudents.length === 0 && (
              <div className="text-center py-12">
                <p className="text-purple-200">No students found matching the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
