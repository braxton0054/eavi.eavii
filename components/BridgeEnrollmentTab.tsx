'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/client';

const ACADEMIC_CALENDAR_IDS = {
  main: '2544104f-d888-4c1c-a082-619ce205f64b',
  west: '79fb42a6-2d13-4fcd-b514-0bf18a950c94'
};

interface BridgeEnrollmentProps {
  campus: string;
}

export default function BridgeEnrollmentTab({ campus }: BridgeEnrollmentProps) {
  const [supabase] = useState(() => createClient());
  const [activeSubTab, setActiveSubTab] = useState<'enroll' | 'students' | 'merge'>('enroll');
  
  // Enrollment form
  const [pendingApplications, setPendingApplications] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [bridgeGroups, setBridgeGroups] = useState<any[]>([]);
  const [bridgeForm, setBridgeForm] = useState({
    application_id: '',
    course_id: '',
    campus: campus || 'main',
    start_date: '',
    sync_date: '',
    suggested_intake: '',
    selected_intake: ''
  });
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Bridge students
  const [bridgeStudents, setBridgeStudents] = useState<any[]>([]);
  const [filterCampus, setFilterCampus] = useState('all');
  const [filterIntake, setFilterIntake] = useState('all');

  // Merge management
  const [allBridgeClasses, setAllBridgeClasses] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [campus]);

  const loadData = async () => {
    await Promise.all([
      loadPendingApplications(),
      loadCourses(),
      loadBridgeGroups(),
      loadBridgeStudents(),
      loadBridgeClasses()
    ]);
  };

  const loadPendingApplications = async () => {
    const { data } = await supabase
      .from('applications')
      .select('id, full_name, admission_number, course_id, campus, status, courses(name)')
      .eq('status', 'pending')
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

  const loadBridgeGroups = async () => {
    const { data } = await supabase
      .from('bridge_groups')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    setBridgeGroups(data || []);
  };

  const loadBridgeStudents = async () => {
    const { data } = await supabase
      .from('bridge_student_status')
      .select('*')
      .order('created_at', { ascending: false });
    
    setBridgeStudents(data || []);
  };

  const loadBridgeClasses = async () => {
    const { data } = await supabase
      .from('class_merge_status')
      .select('*')
      .order('sync_target_date', { ascending: true });
    
    setAllBridgeClasses(data || []);
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

  const handleStartDateChange = (date: string) => {
    setBridgeForm({ ...bridgeForm, start_date: date });
    if (date) {
      const month = new Date(date).getMonth() + 1;
      const intake = suggestIntake(month);
      setBridgeForm(prev => ({
        ...prev,
        start_date: date,
        suggested_intake: intake,
        selected_intake: intake
      }));
    } else {
      setBridgeForm(prev => ({
        ...prev,
        start_date: date,
        suggested_intake: '',
        selected_intake: ''
      }));
    }
  };

  const handleEnroll = async () => {
    if (!bridgeForm.application_id || !bridgeForm.course_id || !bridgeForm.start_date || 
        !bridgeForm.sync_date || !bridgeForm.selected_intake) {
      setError('Please fill in all required fields');
      return;
    }

    if (bridgeForm.sync_date < bridgeForm.start_date) {
      setError('Sync date must be after start date');
      return;
    }

    if (new Date(bridgeForm.sync_date) < new Date()) {
      const confirmed = confirm('Warning: Sync date has already passed. Continue anyway?');
      if (!confirmed) return;
    }

    setEnrolling(true);
    setError('');
    setSuccess('');

    try {
      let bridgeGroupId = bridgeGroups.find(
        (g: any) => g.campus === bridgeForm.campus && g.intake === bridgeForm.selected_intake
      )?.id;

      if (!bridgeGroupId) {
        const { data: newGroup, error: groupError } = await supabase.rpc('create_bridge_group', {
          p_campus: bridgeForm.campus,
          p_intake: bridgeForm.selected_intake,
          p_start_date: bridgeForm.start_date,
          p_sync_date: bridgeForm.sync_date,
          p_calendar_id: ACADEMIC_CALENDAR_IDS[bridgeForm.campus as keyof typeof ACADEMIC_CALENDAR_IDS]
        });

        if (groupError) throw groupError;
        bridgeGroupId = newGroup;
      }

      const { data: result, error: enrollError } = await supabase.rpc('enroll_bridge_student', {
        p_application_id: bridgeForm.application_id,
        p_bridge_group_id: bridgeGroupId,
        p_course_id: bridgeForm.course_id,
        p_campus: bridgeForm.campus,
        p_start_date: bridgeForm.start_date,
        p_sync_date: bridgeForm.sync_date
      });

      if (enrollError) throw enrollError;

      setSuccess(`Student enrolled successfully! Intake: ${result.suggested_intake}`);
      setBridgeForm({
        application_id: '',
        course_id: '',
        campus: campus || 'main',
        start_date: '',
        sync_date: '',
        suggested_intake: '',
        selected_intake: ''
      });
      await loadData();
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
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to merge bridge class');
    }
  };

  const filteredStudents = bridgeStudents.filter((student: any) => {
    if (filterCampus !== 'all' && student.campus !== filterCampus) return false;
    if (filterIntake !== 'all' && student.target_intake !== filterIntake) return false;
    return true;
  });

  const mergeReadyClasses = allBridgeClasses.filter((c: any) => c.ready_to_merge);
  const getCampusName = (c: string) => c === 'main' ? 'Main Campus' : 'West Campus';

  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="glass-neu p-2 flex gap-2">
        <button
          onClick={() => setActiveSubTab('enroll')}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            activeSubTab === 'enroll' ? 'glass-neu-btn text-white' : 'text-purple-200 hover:text-white'
          }`}
        >
          Enroll Student
        </button>
        <button
          onClick={() => setActiveSubTab('students')}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            activeSubTab === 'students' ? 'glass-neu-btn text-white' : 'text-purple-200 hover:text-white'
          }`}
        >
          Bridge Students ({bridgeStudents.length})
        </button>
        <button
          onClick={() => setActiveSubTab('merge')}
          className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
            activeSubTab === 'merge' ? 'glass-neu-btn text-white' : 'text-purple-200 hover:text-white'
          }`}
        >
          Merge Classes ({mergeReadyClasses.length})
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="glass-neu-inset p-4 border border-red-500/30">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="glass-neu-inset p-4 border border-green-500/30">
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}

      {/* Enroll Tab */}
      {activeSubTab === 'enroll' && (
        <div className="glass-neu p-6 md:p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Enroll Student in Bridge Program</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-purple-200 text-sm mb-2 font-semibold">Select Student *</label>
              <select
                value={bridgeForm.application_id}
                onChange={(e) => setBridgeForm({ ...bridgeForm, application_id: e.target.value })}
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

            <div>
              <label className="block text-purple-200 text-sm mb-2 font-semibold">Course *</label>
              <select
                value={bridgeForm.course_id}
                onChange={(e) => setBridgeForm({ ...bridgeForm, course_id: e.target.value })}
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

            <div>
              <label className="block text-purple-200 text-sm mb-2 font-semibold">Campus *</label>
              <select
                value={bridgeForm.campus}
                onChange={(e) => setBridgeForm({ ...bridgeForm, campus: e.target.value })}
                className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="main">Main Campus</option>
                <option value="west">West Campus</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-200 text-sm mb-2 font-semibold">Start Date *</label>
              <input
                type="date"
                value={bridgeForm.start_date}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {bridgeForm.suggested_intake && (
              <div className="glass-neu-inset p-4">
                <p className="text-purple-200 text-sm mb-1">Suggested Intake:</p>
                <p className="text-white text-lg font-bold">{bridgeForm.suggested_intake}</p>
              </div>
            )}

            <div>
              <label className="block text-purple-200 text-sm mb-2 font-semibold">Target Intake * (Admin Decision)</label>
              <select
                value={bridgeForm.selected_intake}
                onChange={(e) => setBridgeForm({ ...bridgeForm, selected_intake: e.target.value })}
                className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select intake...</option>
                <option value="January">January</option>
                <option value="May">May</option>
                <option value="September">September</option>
              </select>
            </div>

            <div>
              <label className="block text-purple-200 text-sm mb-2 font-semibold">Sync/Merge Target Date *</label>
              <input
                type="date"
                value={bridgeForm.sync_date}
                onChange={(e) => setBridgeForm({ ...bridgeForm, sync_date: e.target.value })}
                className="w-full px-4 py-3 glass-neu-inset text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

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

      {/* Students Tab */}
      {activeSubTab === 'students' && (
        <div className="space-y-6">
          <div className="glass-neu p-6">
            <h3 className="text-xl font-bold text-white mb-4">Filters</h3>
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

          <div className="glass-neu p-6">
            <h3 className="text-xl font-bold text-white mb-4">Active Bridge Students ({filteredStudents.length})</h3>
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
                      <tr key={student.application_id} className="text-white border-b border-white/5 hover:bg-white/5">
                        <td className="py-3 px-2">
                          <div>
                            <p className="font-medium">{student.full_name}</p>
                            <p className="text-xs text-purple-300">{student.admission_number}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">{student.course_name || 'N/A'}</td>
                        <td className="py-3 px-2">{getCampusName(student.campus)}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-1 bg-purple-500/20 rounded text-xs">{student.target_intake}</span>
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
                            student.merge_readiness ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
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

      {/* Merge Tab */}
      {activeSubTab === 'merge' && (
        <div className="space-y-6">
          <div className="glass-neu p-6">
            <h3 className="text-xl font-bold text-white mb-4">Classes Ready to Merge ({mergeReadyClasses.length})</h3>
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
                        <p className="text-red-400 text-2xl font-bold">{bridgeClass.days_overdue || 0}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
