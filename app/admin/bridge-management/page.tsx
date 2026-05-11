'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

const ACADEMIC_CALENDAR_IDS = {
  main: '2544104f-d888-4c1c-a082-619ce205f64b',
  west: '79fb42a6-2d13-4fcd-b514-0bf18a950c94'
};

export default function BridgeManagement() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [activeTab, setActiveTab] = useState<'enroll' | 'students' | 'merge'>('enroll');
  
  // Enrollment form state
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState('');
  const [enrollCampus, setEnrollCampus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [syncDate, setSyncDate] = useState('');
  const [suggestedIntake, setSuggestedIntake] = useState('');
  const [selectedIntake, setSelectedIntake] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState<any[]>([]);
  const [bridgeGroups, setBridgeGroups] = useState<any[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bridge students state
  const [bridgeStudents, setBridgeStudents] = useState<any[]>([]);
  const [filterCampus, setFilterCampus] = useState('all');
  const [filterIntake, setFilterIntake] = useState('all');

  // Merge management state
  const [mergeReadyClasses, setMergeReadyClasses] = useState<any[]>([]);
  const [allBridgeClasses, setAllBridgeClasses] = useState<any[]>([]);

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
        router.push('/login/admin');
        return;
      }

      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);
      setEnrollCampus(userCampus);
      
      await loadData(userCampus);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadData = async (campusFilter: string) => {
    await Promise.all([
      loadPendingApplications(campusFilter),
      loadCourses(),
      loadBridgeGroups(campusFilter),
      loadBridgeStudents(),
      loadMergeReadyClasses()
    ]);
  };

  const loadPendingApplications = async (campusFilter: string) => {
    const { data } = await supabase
      .from('applications')
      .select('id, full_name, admission_number, course_id, campus, status, courses(name)')
      .eq('status', 'pending')
      .ilike('campus', `%${campusFilter}%`)
      .order('created_at', { ascending: false });
    
    setPendingApplications(data || []);
  };

  const loadCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, name')
      .order('name');
    
    setCourses(data || []);
  };

  const loadBridgeGroups = async (campusFilter: string) => {
    const { data } = await supabase
      .from('bridge_groups')
      .select('*')
      .eq('campus', campusFilter)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    setBridgeGroups(data || []);
  };

  const loadBridgeStudents = async () => {
    // Bridge students are applications with stream_type='bridge'
    const { data } = await supabase
      .from('applications')
      .select('id, full_name, phone, email, course_id, bridge_group_id, bridge_start_date, sync_target_date, acceleration_factor, current_module, current_semester, status')
      .eq('stream_type', 'bridge')
      .order('created_at', { ascending: false });
    
    setBridgeStudents(data || []);
  };

  const loadMergeReadyClasses = async () => {
    // Classes with merge info now use classes table with merge_status column
    const { data } = await supabase
      .from('classes')
      .select('id, class_name, course_id, campus, merge_status, merged_into_class_id, merged_date, bridge_group_id')
      .not('merge_status', 'eq', 'cancelled')
      .order('created_at', { ascending: false });
    
    setAllBridgeClasses(data || []);
    setMergeReadyClasses((data || []).filter((c: any) => c.merge_status === 'active' && c.bridge_group_id));
  };

  // Auto-suggest intake based on start date
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (date) {
      const month = new Date(date).getMonth() + 1;
      const intake = suggestIntake(month);
      setSuggestedIntake(intake);
      setSelectedIntake(intake);
    } else {
      setSuggestedIntake('');
      setSelectedIntake('');
    }
  };

  const suggestIntake = (month: number): string => {
    switch (month) {
      case 2: return 'January';
      case 3:
      case 4: return 'May';
      case 6: return 'May';
      case 7:
      case 8: return 'September';
      case 10:
      case 11:
      case 12: return 'September';
      case 1: return 'January';
      case 5: return 'May';
      case 9: return 'September';
      default: return 'January';
    }
  };

  const handleEnroll = async () => {
    if (!selectedApplication || !enrollCampus || !startDate || !syncDate || !selectedIntake || !selectedCourse) {
      setError('Please fill in all required fields');
      return;
    }

    if (syncDate < startDate) {
      setError('Sync date must be after start date');
      return;
    }

    // Check if sync date has passed
    if (new Date(syncDate) < new Date()) {
      const confirmed = confirm('Warning: Sync date has already passed. Continue anyway?');
      if (!confirmed) return;
    }

    setEnrolling(true);
    setError('');
    setSuccess('');

    try {
      // Check if bridge group exists for this campus + intake
      let bridgeGroupId = bridgeGroups.find(
        (g: any) => g.campus === enrollCampus && g.intake === selectedIntake
      )?.id;

      // Create bridge group if it doesn't exist
      if (!bridgeGroupId) {
        const { data: newGroup, error: groupError } = await supabase.rpc('create_bridge_group', {
          p_campus: enrollCampus,
          p_intake: selectedIntake,
          p_start_date: startDate,
          p_sync_date: syncDate,
          p_calendar_id: ACADEMIC_CALENDAR_IDS[enrollCampus as keyof typeof ACADEMIC_CALENDAR_IDS]
        });

        if (groupError) throw groupError;
        bridgeGroupId = newGroup;
      }

      // Enroll student
      const { data: result, error: enrollError } = await supabase.rpc('enroll_bridge_student', {
        p_application_id: selectedApplication,
        p_bridge_group_id: bridgeGroupId,
        p_course_id: selectedCourse,
        p_campus: enrollCampus,
        p_start_date: startDate,
        p_sync_date: syncDate
      });

      if (enrollError) throw enrollError;

      setSuccess(`Student enrolled successfully! Suggested intake: ${result.suggested_intake}`);
      
      // Reset form
      setSelectedApplication('');
      setStartDate('');
      setSyncDate('');
      setSuggestedIntake('');
      setSelectedIntake('');
      setSelectedCourse('');
      
      // Reload data
      await loadData(campus);
    } catch (err: any) {
      setError(err.message || 'Failed to enroll student');
    } finally {
      setEnrolling(false);
    }
  };

  const handleMerge = async (bridgeGroupId: string) => {
    const bridgeClass = allBridgeClasses.find((c: any) => c.bridge_group_id === bridgeGroupId);
    if (!bridgeClass) return;

    const confirmed = confirm(
      `Merge ${bridgeClass.total_students} bridge students into main intake? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const { data, error } = await supabase.rpc('merge_bridge_class', {
        p_bridge_group_id: bridgeGroupId,
        p_main_class_id: `${bridgeClass.campus}-${new Date().getFullYear()}`
      });

      if (error) throw error;

      alert(data.message);
      await loadData(campus);
    } catch (err: any) {
      alert(err.message || 'Failed to merge bridge class');
    }
  };

  const filteredStudents = bridgeStudents.filter((student: any) => {
    if (filterCampus !== 'all' && student.campus !== filterCampus) return false;
    if (filterIntake !== 'all' && student.target_intake !== filterIntake) return false;
    return true;
  });

  const getCampusName = (c: string) => c === 'main' ? 'Main Campus' : 'West Campus';

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
        <div className="glass-neu-inset border-b border-white/10 rounded-none">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="text-purple-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Bridge Enrollment Management</h1>
                <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="glass-neu p-2 flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('enroll')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'enroll' ? 'glass-neu-btn text-white' : 'text-purple-200 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Enroll Student
              </div>
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'students' ? 'glass-neu-btn text-white' : 'text-purple-200 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Bridge Students
              </div>
            </button>
            <button
              onClick={() => setActiveTab('merge')}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === 'merge' ? 'glass-neu-btn text-white' : 'text-purple-200 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Merge Classes
                {mergeReadyClasses.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-green-500/30 rounded-full text-xs">
                    {mergeReadyClasses.length}
                  </span>
                )}
              </div>
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="glass-neu-inset p-4 mb-6 border border-red-500/30">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="glass-neu-inset p-4 mb-6 border border-green-500/30">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Tab Content */}
          {activeTab === 'enroll' && (
            <div className="glass-neu p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Enroll Student in Bridge Program</h2>
              
              <div className="space-y-6">
                {/* Select Student */}
                <div>
                  <label className="block text-purple-200 text-sm mb-2 font-semibold">
                    Select Student (Pending Applications) *
                  </label>
                  <select
                    value={selectedApplication}
                    onChange={(e) => setSelectedApplication(e.target.value)}
                    className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Choose a student...</option>
                    {pendingApplications.map((app: any) => (
                      <option key={app.id} value={app.id} className="text-gray-900">
                        {app.full_name} - {app.admission_number || 'No admission number'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Course */}
                <div>
                  <label className="block text-purple-200 text-sm mb-2 font-semibold">
                    Course *
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select course...</option>
                    {courses.map((course: any) => (
                      <option key={course.id} value={course.id} className="text-gray-900">
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campus Selection */}
                <div>
                  <label className="block text-purple-200 text-sm mb-2 font-semibold">
                    Campus * (Same campus only)
                  </label>
                  <select
                    value={enrollCampus}
                    onChange={(e) => setEnrollCampus(e.target.value)}
                    className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select campus...</option>
                    <option value="main" className="text-gray-900">Main Campus</option>
                    <option value="west" className="text-gray-900">West Campus</option>
                  </select>
                  <p className="text-purple-300 text-xs mt-1">Students can only bridge within the same campus</p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-purple-200 text-sm mb-2 font-semibold">
                    Start Date (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Suggested Intake */}
                {suggestedIntake && (
                  <div className="glass-neu-inset p-4">
                    <p className="text-purple-200 text-sm mb-1">Suggested Intake:</p>
                    <p className="text-white text-lg font-bold">{suggestedIntake}</p>
                    <p className="text-purple-300 text-xs mt-1">Based on start date month</p>
                  </div>
                )}

                {/* Select/Override Intake */}
                <div>
                  <label className="block text-purple-200 text-sm mb-2 font-semibold">
                    Target Intake * (Admin Decision)
                  </label>
                  <select
                    value={selectedIntake}
                    onChange={(e) => setSelectedIntake(e.target.value)}
                    className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select intake...</option>
                    <option value="January" className="text-gray-900">January</option>
                    <option value="May" className="text-gray-900">May</option>
                    <option value="September" className="text-gray-900">September</option>
                  </select>
                  {selectedIntake !== suggestedIntake && suggestedIntake && (
                    <p className="text-yellow-300 text-xs mt-1">
                      ⚠️ You're overriding the suggested intake ({suggestedIntake})
                    </p>
                  )}
                </div>

                {/* Sync Target Date */}
                <div>
                  <label className="block text-purple-200 text-sm mb-2 font-semibold">
                    Sync/Merge Target Date (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    value={syncDate}
                    onChange={(e) => setSyncDate(e.target.value)}
                    className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {new Date(syncDate) < new Date() && syncDate && (
                    <p className="text-red-300 text-xs mt-1">
                      ⚠️ Warning: This sync date has already passed
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full py-4 glass-neu-btn text-white text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll in Bridge Program'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="glass-neu p-6">
                <h3 className="text-xl font-bold text-white mb-4">Filter Bridge Students</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Campus</label>
                    <select
                      value={filterCampus}
                      onChange={(e) => setFilterCampus(e.target.value)}
                      className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Campuses</option>
                      <option value="main">Main Campus</option>
                      <option value="west">West Campus</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-purple-200 text-sm mb-2">Intake</label>
                    <select
                      value={filterIntake}
                      onChange={(e) => setFilterIntake(e.target.value)}
                      className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Intakes</option>
                      <option value="January">January</option>
                      <option value="May">May</option>
                      <option value="September">September</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Students Table */}
              <div className="glass-neu p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Active Bridge Students ({filteredStudents.length})
                </h3>
                {filteredStudents.length === 0 ? (
                  <p className="text-purple-200 text-center py-8">No bridge students found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-purple-300 border-b border-white/10">
                          <th className="text-left py-3 px-2">Name</th>
                          <th className="text-left py-3 px-2">Course</th>
                          <th className="text-left py-3 px-2">Campus</th>
                          <th className="text-left py-3 px-2">Target Intake</th>
                          <th className="text-left py-3 px-2">Start Date</th>
                          <th className="text-left py-3 px-2">Sync Date</th>
                          <th className="text-left py-3 px-2">Days in Bridge</th>
                          <th className="text-left py-3 px-2">Days Until Sync</th>
                          <th className="text-left py-3 px-2">Merge Ready</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student: any) => (
                          <tr key={student.application_id} className="text-white border-b border-white/5 hover:bg-gray-50/5">
                            <td className="py-3 px-2">
                              <div>
                                <p className="font-medium">{student.full_name}</p>
                                <p className="text-xs text-purple-300">{student.admission_number}</p>
                              </div>
                            </td>
                            <td className="py-3 px-2">{student.course_name || 'N/A'}</td>
                            <td className="py-3 px-2">{getCampusName(student.campus)}</td>
                            <td className="py-3 px-2">
                              <span className="px-2 py-1 bg-purple-500/20 rounded text-xs">
                                {student.target_intake}
                              </span>
                            </td>
                            <td className="py-3 px-2">{new Date(student.bridge_start_date).toLocaleDateString()}</td>
                            <td className="py-3 px-2">{new Date(student.sync_target_date).toLocaleDateString()}</td>
                            <td className="py-3 px-2">
                              <span className="text-blue-400 font-semibold">{student.days_in_bridge}</span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={student.days_until_sync < 0 ? 'text-red-400' : 'text-green-400'}>
                                {student.days_until_sync < 0 ? 'Overdue' : student.days_until_sync}
                              </span>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`px-2 py-1 rounded text-xs ${
                                student.merge_readiness 
                                  ? 'bg-green-500/20 text-green-300' 
                                  : 'bg-yellow-500/20 text-yellow-300'
                              }`}>
                                {student.merge_readiness ? 'Ready' : 'In Progress'}
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
          )}

          {activeTab === 'merge' && (
            <div className="space-y-6">
              {/* Ready to Merge */}
              <div className="glass-neu p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Classes Ready to Merge ({mergeReadyClasses.length})
                </h3>
                {mergeReadyClasses.length === 0 ? (
                  <p className="text-purple-200 text-center py-8">No bridge classes ready to merge</p>
                ) : (
                  <div className="space-y-4">
                    {mergeReadyClasses.map((bridgeClass: any) => (
                      <div key={bridgeClass.bridge_group_id} className="glass-neu-inset p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-white">{bridgeClass.group_name}</h4>
                            <p className="text-purple-200 text-sm">
                              {getCampusName(bridgeClass.campus)} • {bridgeClass.intake} Intake
                            </p>
                          </div>
                          <button
                            onClick={() => handleMerge(bridgeClass.bridge_group_id)}
                            className="px-6 py-3 glass-neu-btn text-white font-semibold"
                          >
                            Execute Merge
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-purple-300 text-xs">Total Students</p>
                            <p className="text-white text-2xl font-bold">{bridgeClass.total_students}</p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-xs">Ready Students</p>
                            <p className="text-green-400 text-2xl font-bold">{bridgeClass.ready_students}</p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-xs">Sync Date</p>
                            <p className="text-white text-sm font-semibold">
                              {new Date(bridgeClass.sync_target_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-purple-300 text-xs">Days Overdue</p>
                            <p className="text-red-400 text-2xl font-bold">
                              {bridgeClass.days_overdue || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* All Active Bridge Classes */}
              <div className="glass-neu p-6">
                <h3 className="text-xl font-bold text-white mb-4">All Active Bridge Classes</h3>
                <div className="space-y-3">
                  {allBridgeClasses.map((bridgeClass: any) => (
                    <div key={bridgeClass.bridge_group_id} className="glass-neu-inset p-4 flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-semibold">{bridgeClass.group_name}</h4>
                        <p className="text-purple-200 text-sm">
                          {bridgeClass.total_students} students • Sync: {new Date(bridgeClass.sync_target_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          bridgeClass.ready_to_merge 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {bridgeClass.ready_to_merge ? 'Ready' : 'Not Ready'}
                        </span>
                        <span className="text-purple-300 text-sm">
                          {bridgeClass.ready_students}/{bridgeClass.total_students} ready
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
