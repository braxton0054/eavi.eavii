'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import BridgeEnrollmentTab from '@/components/BridgeEnrollmentTab';

export const dynamic = 'force-dynamic';

interface Class {
  id: string;
  class_name: string;
  course_id: string;
  campus: 'main' | 'west';
  semester: number;
  module_index: number;
  intake: string;
  intake_month: string;
  academic_calendar_id?: string;
  stream_type: 'main' | 'bridge';
  is_active: boolean;
  courses?: { name: string };
  total_students?: number;
}

interface Course {
  id: string;
  name: string;
  code?: string;
}

interface AcademicCalendar {
  id: string;
  term_name: string;
}

interface Lecturer {
  id: string;
  full_name: string;
  lecturer_number: string;
}

export default function ClassesPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Data
  const [classes, setClasses] = useState<Class[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [calendars, setCalendars] = useState<AcademicCalendar[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);

  // Filters
  const [filterCampus, setFilterCampus] = useState<string>('all');
  const [filterIntake, setFilterIntake] = useState<string>('all');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [students, setStudents] = useState<any[]>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'classes' | 'bridge'>('classes');

  // Bridge enrollment state
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [bridgeStudents, setBridgeStudents] = useState<any[]>([]);
  const [bridgeGroups, setBridgeGroups] = useState<any[]>([]);
  const [mergeReadyClasses, setMergeReadyClasses] = useState<any[]>([]);
  const [allBridgeClasses, setAllBridgeClasses] = useState<any[]>([]);
  const [bridgeForm, setBridgeForm] = useState({
    application_id: '',
    course_id: '',
    campus: 'main' as 'main' | 'west',
    start_date: '',
    sync_date: '',
    suggested_intake: '',
    selected_intake: ''
  });
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [bridgeFilterCampus, setBridgeFilterCampus] = useState('all');
  const [bridgeFilterIntake, setBridgeFilterIntake] = useState('all');

  // Form data
  const [formData, setFormData] = useState({
    class_name: '',
    course_id: '',
    campus: 'main' as 'main' | 'west',
    semester: 1,
    module_index: 1,
    intake: '',
    intake_month: 'January',
    academic_calendar_id: '',
    stream_type: 'main' as 'main' | 'bridge',
    is_active: true
  });

  const [assignFormData, setAssignFormData] = useState({
    lecturer_id: '',
    class_id: '',
    exam_type_allowed: ['cat', 'end_term', 'mock'] as string[]
  });

  const intakeMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;
    checkAuth();
  }, [supabase]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login/admin');
      return;
    }

    const userRole = session.user?.user_metadata?.role;
    if (userRole !== 'admin') {
      router.push('/login/admin');
      return;
    }

    const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
    setCampus(userCampus);

    await loadData(userCampus);
    setLoading(false);
  };

  const loadData = async (campusCode: string) => {
    await Promise.all([
      loadClasses(campusCode),
      loadCourses(),
      loadCalendars(),
      loadLecturers()
    ]);
  };

  const loadClasses = async (campusCode: string) => {
    let query = supabase
      .from('classes')
      .select('*, courses(name)')
      .order('class_name');

    if (campusCode && campusCode !== 'all') {
      const normalizedCampus = campusCode === 'Main Campus' ? 'main' : 
                              campusCode === 'West Campus' ? 'west' : 
                              campusCode.toLowerCase();
      query = query.eq('campus', normalizedCampus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading classes:', error);
      return;
    }

    // Get student counts
    const classesWithCounts = await Promise.all((data || []).map(async (cls: Class) => {
      const { count } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', cls.id);
      return { ...cls, total_students: count || 0 };
    }));

    setClasses(classesWithCounts);
  };

  const loadCourses = async () => {
    const { data } = await supabase.from('courses').select('id, name, code').order('name');
    setCourses(data || []);
  };

  const loadCalendars = async () => {
    const { data } = await supabase
      .from('academic_calendar')
      .select('id, term_name')
      .eq('is_active', true)
      .order('term_name');
    setCalendars(data || []);
  };

  const loadLecturers = async () => {
    const { data } = await supabase
      .from('lecturers')
      .select('id, full_name, lecturer_number')
      .order('full_name');
    setLecturers(data || []);
  };

  // Auto-generate class name
  const generateClassName = () => {
    if (!formData.course_id) return '';
    
    const course = courses.find(c => c.id === formData.course_id);
    const courseCode = course?.code || course?.name?.split(' ').map(w => w[0]).join('').toUpperCase() || 'COURSE';
    const campusShort = formData.campus === 'west' ? 'WEST' : 'MAIN';
    const intakeShort = formData.intake_month?.substring(0, 3).toUpperCase() || 'JAN';
    
    return `${courseCode}-${campusShort}-${intakeShort}-M${formData.module_index}-S${formData.semester}`;
  };

  useEffect(() => {
    if (!formData.class_name || formData.class_name === generateClassName()) {
      const newName = generateClassName();
      if (newName) {
        setFormData(prev => ({ ...prev, class_name: newName }));
      }
    }
  }, [formData.course_id, formData.campus, formData.intake_month, formData.module_index, formData.semester]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      setSuccess('Class created successfully!');
      setShowCreateModal(false);
      setFormData({
        class_name: '',
        course_id: '',
        campus: 'main',
        semester: 1,
        module_index: 1,
        intake: '',
        intake_month: 'January',
        academic_calendar_id: '',
        stream_type: 'main',
        is_active: true
      });
      await loadClasses(campus);
    } catch (err: any) {
      setError(`Failed to create class: ${err.message}`);
    }
  };

  const handleAssignLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // 1. Create lecturer assignment
      const cls = classes.find(c => c.id === assignFormData.class_id);
      if (!cls) throw new Error('Class not found');

      const { data: assignmentData, error: assignmentError } = await supabase
        .from('lecturer_assignments')
        .insert([{
          lecturer_id: assignFormData.lecturer_id,
          class_id: assignFormData.class_id,
          course_id: cls.course_id,
          campus: cls.campus
        }])
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // 2. Create semester assignment
      const { error: semesterError } = await supabase
        .from('lecturer_assignment_semesters')
        .insert([{
          assignment_id: assignmentData.id,
          academic_calendar_id: cls.academic_calendar_id,
          semester: cls.semester,
          module_index: cls.module_index,
          exam_type_allowed: assignFormData.exam_type_allowed
        }]);

      if (semesterError) throw semesterError;

      setSuccess('Lecturer assigned successfully!');
      setShowAssignModal(false);
      setAssignFormData({
        lecturer_id: '',
        class_id: '',
        exam_type_allowed: ['cat', 'end_term', 'mock']
      });
    } catch (err: any) {
      setError(`Failed to assign lecturer: ${err.message}`);
    }
  };

  const toggleClassActive = async (cls: Class) => {
    try {
      const { error } = await supabase
        .from('classes')
        .update({ is_active: !cls.is_active })
        .eq('id', cls.id);

      if (error) throw error;

      setSuccess(`Class ${cls.is_active ? 'deactivated' : 'activated'} successfully!`);
      await loadClasses(campus);
    } catch (err: any) {
      setError(`Failed to update class: ${err.message}`);
    }
  };

  const viewStudents = async (cls: Class) => {
    setSelectedClass(cls);
    
    const { data } = await supabase
      .from('applications')
      .select('id, full_name, admission_number, status, financial_hold')
      .eq('class_id', cls.id)
      .order('full_name');

    setStudents(data || []);
    setShowStudentsModal(true);
  };

  const filteredClasses = classes.filter(cls => {
    if (filterCampus !== 'all' && cls.campus !== filterCampus) return false;
    if (filterIntake !== 'all' && cls.intake_month !== filterIntake) return false;
    if (filterSemester !== 'all' && cls.semester !== parseInt(filterSemester)) return false;
    if (filterCourse !== 'all' && cls.course_id !== filterCourse) return false;
    if (filterActive !== 'all') {
      const isActive = filterActive === 'true';
      if (cls.is_active !== isActive) return false;
    }
    return true;
  });

  const getCampusName = (c: string) => c === 'west' ? 'West Campus' : 'Main Campus';

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Header */}
      <div className="relative z-10 w-full">
        <div className="bg-gray-50/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="relative w-12 h-12">
                <Image src="/logo.webp" alt="EAVI Logo" fill className="object-contain" />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Classes Management</h1>
                <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
              >
                Assign Lecturer
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold"
              >
                + Create Class
              </button>
              <Link
                href="/admin/dashboard"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
          <div className="glass-neu p-2 flex gap-2">
            <button
              onClick={() => setActiveTab('classes')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'classes' ? 'glass-neu-btn text-white' : 'text-purple-200 hover:text-white'
              }`}
            >
              Classes & Intakes
            </button>
            <button
              onClick={() => setActiveTab('bridge')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'bridge' ? 'glass-neu-btn text-white' : 'text-purple-200 hover:text-white'
              }`}
            >
              Bridge Enrollment
            </button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {activeTab === 'classes' ? (
            <>
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-200 text-sm">
              {success}
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 glass-neu p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <select
                value={filterCampus}
                onChange={(e) => setFilterCampus(e.target.value)}
                className="px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white text-sm"
              >
                <option value="all">All Campuses</option>
                <option value="main">Main Campus</option>
                <option value="west">West Campus</option>
              </select>

              <select
                value={filterIntake}
                onChange={(e) => setFilterIntake(e.target.value)}
                className="px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white text-sm"
              >
                <option value="all">All Intakes</option>
                {intakeMonths.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <select
                value={filterSemester}
                onChange={(e) => setFilterSemester(e.target.value)}
                className="px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white text-sm"
              >
                <option value="all">All Semesters</option>
                {[1, 2, 3, 4, 5, 6].map(s => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>

              <select
                value={filterCourse}
                onChange={(e) => setFilterCourse(e.target.value)}
                className="px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white text-sm"
              >
                <option value="all">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          {/* Classes Table */}
          <div className="glass-neu overflow-x-auto">
            {filteredClasses.length === 0 ? (
              <div className="p-8 text-center text-purple-200">
                No classes found. Create a new class to get started.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-4 text-white font-semibold text-sm">Class Name</th>
                    <th className="text-left p-4 text-white font-semibold text-sm">Course</th>
                    <th className="text-left p-4 text-white font-semibold text-sm">Campus</th>
                    <th className="text-left p-4 text-white font-semibold text-sm">Semester</th>
                    <th className="text-left p-4 text-white font-semibold text-sm">Intake</th>
                    <th className="text-left p-4 text-white font-semibold text-sm">Students</th>
                    <th className="text-left p-4 text-white font-semibold text-sm">Status</th>
                    <th className="text-left p-4 text-white font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((cls) => (
                    <tr key={cls.id} className="border-b border-white/10 hover:bg-gray-50/5">
                      <td className="p-4 text-white text-sm font-mono">{cls.class_name}</td>
                      <td className="p-4 text-white text-sm">{cls.courses?.name}</td>
                      <td className="p-4 text-white text-sm">{getCampusName(cls.campus)}</td>
                      <td className="p-4 text-white text-sm">Sem {cls.semester} • Mod {cls.module_index}</td>
                      <td className="p-4 text-white text-sm">{cls.intake_month}</td>
                      <td className="p-4 text-white text-sm">{cls.total_students || 0}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          cls.is_active ? 'bg-green-500/30 text-green-300' : 'bg-red-500/30 text-red-300'
                        }`}>
                          {cls.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleClassActive(cls)}
                            className={`px-2 py-1 rounded text-xs ${
                              cls.is_active 
                                ? 'bg-red-600/50 hover:bg-red-600 text-white' 
                                : 'bg-green-600/50 hover:bg-green-600 text-white'
                            }`}
                          >
                            {cls.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => viewStudents(cls)}
                            className="px-2 py-1 bg-blue-600/50 hover:bg-blue-600 text-white rounded text-xs"
                          >
                            View Students
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-neu p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Create New Class</h2>
            
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm mb-1">Class Name (Auto-generated)</label>
                <input
                  type="text"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-1">Course *</label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                    required
                  >
                    <option value="">Select Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-1">Campus *</label>
                  <select
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value as 'main' | 'west' })}
                    className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                    required
                  >
                    <option value="main">Main Campus</option>
                    <option value="west">West Campus</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-1">Semester (1-6) *</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-1">Module Index *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.module_index}
                    onChange={(e) => setFormData({ ...formData, module_index: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-1">Intake Month *</label>
                  <select
                    value={formData.intake_month}
                    onChange={(e) => setFormData({ ...formData, intake_month: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                    required
                  >
                    {intakeMonths.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-purple-200 text-sm mb-1">Academic Calendar</label>
                  <select
                    value={formData.academic_calendar_id}
                    onChange={(e) => setFormData({ ...formData, academic_calendar_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                  >
                    <option value="">Select Calendar</option>
                    {calendars.map(c => (
                      <option key={c.id} value={c.id}>{c.term_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm mb-1">Stream Type</label>
                  <select
                    value={formData.stream_type}
                    onChange={(e) => setFormData({ ...formData, stream_type: e.target.value as 'main' | 'bridge' })}
                    className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                  >
                    <option value="main">Main</option>
                    <option value="bridge">Bridge</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center text-purple-200 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    Active
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Lecturer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-neu p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-4">Assign Lecturer to Class</h2>
            
            <form onSubmit={handleAssignLecturer} className="space-y-4">
              <div>
                <label className="block text-purple-200 text-sm mb-1">Lecturer *</label>
                <select
                  value={assignFormData.lecturer_id}
                  onChange={(e) => setAssignFormData({ ...assignFormData, lecturer_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                  required
                >
                  <option value="">Select Lecturer</option>
                  {lecturers.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} ({l.lecturer_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-1">Class *</label>
                <select
                  value={assignFormData.class_id}
                  onChange={(e) => setAssignFormData({ ...assignFormData, class_id: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50/10 border border-white/30 rounded text-white"
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.class_name} — {c.courses?.name} — {c.intake_month} — {getCampusName(c.campus)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-purple-200 text-sm mb-2">Exam Types Allowed</label>
                <div className="flex gap-4">
                  {['cat', 'end_term', 'mock'].map(type => (
                    <label key={type} className="flex items-center text-purple-200 text-sm">
                      <input
                        type="checkbox"
                        checked={assignFormData.exam_type_allowed.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignFormData({
                              ...assignFormData,
                              exam_type_allowed: [...assignFormData.exam_type_allowed, type]
                            });
                          } else {
                            setAssignFormData({
                              ...assignFormData,
                              exam_type_allowed: assignFormData.exam_type_allowed.filter(t => t !== type)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      {type === 'cat' ? 'CAT' : type === 'end_term' ? 'End Term' : 'Mock'}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Assign Lecturer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Students Modal */}
      {showStudentsModal && selectedClass && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-neu p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">
              Students in {selectedClass.class_name}
            </h2>
            
            {students.length === 0 ? (
              <p className="text-purple-200">No students enrolled in this class.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left p-3 text-white font-semibold text-sm">Name</th>
                    <th className="text-left p-3 text-white font-semibold text-sm">Admission #</th>
                    <th className="text-left p-3 text-white font-semibold text-sm">Status</th>
                    <th className="text-left p-3 text-white font-semibold text-sm">Financial Hold</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-white/10">
                      <td className="p-3 text-white text-sm">{student.full_name}</td>
                      <td className="p-3 text-white text-sm font-mono">{student.admission_number}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          student.status === 'enrolled' 
                            ? 'bg-green-500/30 text-green-300' 
                            : 'bg-yellow-500/30 text-yellow-300'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {student.financial_hold && (
                          <span className="px-2 py-1 bg-red-500/30 text-red-300 rounded text-xs">
                            HOLD
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowStudentsModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
