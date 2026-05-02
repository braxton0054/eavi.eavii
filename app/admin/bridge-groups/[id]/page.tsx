'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface BridgeGroup {
  id: string;
  group_name: string;
  intake: string;
  campus: string;
  start_date: string;
  sync_target_date: string;
  acceleration_factor: number;
  milestone_module: number;
  milestone_semester: number;
  catch_up_hours_needed: number;
  catch_up_hours_completed: number;
  holiday_bypass_enabled: boolean;
  status: 'active' | 'merged' | 'cancelled';
  merged_date: string | null;
  academic_calendar: any;
}

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  phone: string;
  email: string;
  current_module: number;
  current_semester: number;
  status: string;
  bridge_start_date: string;
  sync_target_date: string;
}

interface ExamSchedule {
  id: string;
  exam_name: string;
  exam_type: 'cat' | 'end_term' | 'mock' | 'milestone';
  scheduled_date: string;
  description: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export default function BridgeGroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bridgeGroupId = params.id as string;

  const [supabase, setSupabase] = useState<any>(null);
  const [bridgeGroup, setBridgeGroup] = useState<BridgeGroup | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'exams'>('overview');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase || !bridgeGroupId) return;

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

      fetchBridgeGroup();
    };

    checkAuth();
  }, [supabase, bridgeGroupId]);

  const fetchBridgeGroup = async () => {
    try {
      const response = await fetch(`/api/bridge-groups/${bridgeGroupId}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setBridgeGroup(data.bridgeGroup);
      setStudents(data.students);
      setExamSchedules(data.examSchedules);
    } catch (err) {
      console.error('Failed to fetch bridge group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch(`/api/bridge-groups/${bridgeGroupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group_name: formData.get('group_name'),
          campus: formData.get('campus'),
          acceleration_factor: parseFloat(formData.get('acceleration_factor') as string),
          milestone_module: parseInt(formData.get('milestone_module') as string),
          milestone_semester: parseInt(formData.get('milestone_semester') as string),
          catch_up_hours_needed: parseInt(formData.get('catch_up_hours_needed') as string),
          catch_up_hours_completed: parseInt(formData.get('catch_up_hours_completed') as string),
          holiday_bypass_enabled: formData.get('holiday_bypass_enabled') === 'true',
          status: formData.get('status'),
        }),
      });

      if (!response.ok) throw new Error('Failed to update');

      setShowEditForm(false);
      fetchBridgeGroup();
    } catch (err) {
      alert('Failed to update bridge group');
    }
  };

  const handleAddStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          bridge_group_id: bridgeGroupId,
          stream_type: 'bridge',
          bridge_start_date: bridgeGroup?.start_date,
          sync_target_date: bridgeGroup?.sync_target_date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentId);

      if (error) throw error;

      setShowAddStudent(false);
      fetchBridgeGroup();
    } catch (err) {
      alert('Failed to add student');
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Remove this student from the bridge group?')) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({
          bridge_group_id: null,
          stream_type: 'main',
          updated_at: new Date().toISOString(),
        })
        .eq('id', studentId);

      if (error) throw error;

      fetchBridgeGroup();
    } catch (err) {
      alert('Failed to remove student');
    }
  };

  const handleAddExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/bridge-exam-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bridge_group_id: bridgeGroupId,
          exam_name: formData.get('exam_name'),
          exam_type: formData.get('exam_type'),
          scheduled_date: formData.get('scheduled_date'),
          description: formData.get('description'),
        }),
      });

      if (!response.ok) throw new Error('Failed to create');

      setShowAddExam(false);
      fetchBridgeGroup();
    } catch (err) {
      alert('Failed to add exam schedule');
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('id, full_name, admission_number, phone, course')
        .eq('status', 'enrolled')
        .is('bridge_group_id', null)
        .order('full_name');

      if (!error) {
        setAvailableStudents(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const calculateProgress = () => {
    if (!bridgeGroup || !bridgeGroup.catch_up_hours_needed) return 0;
    return Math.min(
      100,
      Math.round((bridgeGroup.catch_up_hours_completed / bridgeGroup.catch_up_hours_needed) * 100)
    );
  };

  const openAddStudent = () => {
    fetchAvailableStudents();
    setShowAddStudent(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading bridge group...</div>
      </div>
    );
  }

  if (!bridgeGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-xl">Bridge group not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <Link
              href="/admin/bridge-groups"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Bridge Groups
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 mt-2">{bridgeGroup.group_name}</h1>
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 rounded text-sm ${
                bridgeGroup.status === 'active' ? 'bg-green-100 text-green-800' :
                bridgeGroup.status === 'merged' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {bridgeGroup.status.toUpperCase()}
              </span>
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded text-sm">
                {bridgeGroup.acceleration_factor}x Acceleration
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded text-sm capitalize">
                {bridgeGroup.campus} Campus
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditForm(true)}
              className="border rounded-lg px-4 py-2 hover:bg-gray-50"
            >
              Edit Group
            </button>
            {bridgeGroup.status === 'active' && (
              <button
                onClick={openAddStudent}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700"
              >
                + Add Student
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Catch-up Progress</span>
            <span className="text-sm text-gray-600">
              {bridgeGroup.catch_up_hours_completed} / {bridgeGroup.catch_up_hours_needed} hours
              ({calculateProgress()}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'students'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Students ({students.length})
            </button>
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'exams'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Exam Schedule ({examSchedules.length})
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Group Details</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Intake</span>
                      <span className="font-medium">{bridgeGroup.intake}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Academic Year</span>
                      <span className="font-medium">{bridgeGroup.academic_calendar?.academic_year}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Start Date</span>
                      <span className="font-medium">{new Date(bridgeGroup.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Target Merge Date</span>
                      <span className="font-medium">{new Date(bridgeGroup.sync_target_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Acceleration Factor</span>
                      <span className="font-medium">{bridgeGroup.acceleration_factor}x</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Holiday Bypass</span>
                      <span className="font-medium">{bridgeGroup.holiday_bypass_enabled ? 'Yes' : 'No'}</span>
                    </div>
                    {bridgeGroup.merged_date && (
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Merged Date</span>
                        <span className="font-medium">{new Date(bridgeGroup.merged_date).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Merge Target</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">When students complete this bridge group, they will merge to:</p>
                    <div className="text-2xl font-bold text-blue-700">
                      Module {bridgeGroup.milestone_module}
                    </div>
                    <div className="text-lg text-blue-600">
                      Semester {bridgeGroup.milestone_semester}
                    </div>
                  </div>

                  <h3 className="font-semibold mt-6 mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">{students.length}</div>
                      <div className="text-sm text-gray-600">Students</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold">{examSchedules.length}</div>
                      <div className="text-sm text-gray-600">Exams</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
              <div>
                {students.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No students in this bridge group yet.
                    {bridgeGroup.status === 'active' && (
                      <button
                        onClick={openAddStudent}
                        className="block mx-auto mt-4 text-blue-600 hover:text-blue-800"
                      >
                        + Add Student
                      </button>
                    )}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Student</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Admission #</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Contact</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm">Progress</th>
                        {bridgeGroup.status === 'active' && <th className="text-left py-3 px-4 font-semibold text-sm">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-t hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{student.full_name}</div>
                          </td>
                          <td className="py-3 px-4">{student.admission_number}</td>
                          <td className="py-3 px-4">
                            <div className="text-sm">{student.phone}</div>
                            <div className="text-xs text-gray-500">{student.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                              Mod {student.current_module}, Sem {student.current_semester}
                            </span>
                          </td>
                          {bridgeGroup.status === 'active' && (
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Exams Tab */}
            {activeTab === 'exams' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Exam Schedule</h3>
                  {bridgeGroup.status === 'active' && (
                    <button
                      onClick={() => setShowAddExam(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      + Add Exam
                    </button>
                  )}
                </div>

                {examSchedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No exam schedules yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {examSchedules.map((exam) => (
                      <div
                        key={exam.id}
                        className="border rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium">{exam.exam_name}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(exam.scheduled_date).toLocaleDateString()} ·{' '}
                            {exam.exam_type.toUpperCase()}
                          </div>
                          {exam.description && (
                            <div className="text-sm text-gray-500 mt-1">{exam.description}</div>
                          )}
                        </div>
                        <span className={`px-3 py-1 rounded text-sm ${
                          exam.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          exam.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {exam.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit Form Modal */}
        {showEditForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
              <h2 className="text-xl font-bold mb-4">Edit Bridge Group</h2>
              
              <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Group Name</label>
                  <input
                    name="group_name"
                    type="text"
                    defaultValue={bridgeGroup.group_name}
                    required
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Campus</label>
                  <select name="campus" defaultValue={bridgeGroup.campus} className="w-full border rounded-lg px-3 py-2">
                    <option value="main">Main Campus</option>
                    <option value="west">West Campus</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Acceleration</label>
                    <select name="acceleration_factor" defaultValue={bridgeGroup.acceleration_factor} className="w-full border rounded-lg px-3 py-2">
                      <option value="1.5">1.5x</option>
                      <option value="2.0">2.0x</option>
                      <option value="2.5">2.5x</option>
                      <option value="3.0">3.0x</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Holiday Bypass</label>
                    <select name="holiday_bypass_enabled" defaultValue={bridgeGroup.holiday_bypass_enabled.toString()} className="w-full border rounded-lg px-3 py-2">
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Module</label>
                    <input name="milestone_module" type="number" min="1" max="6" defaultValue={bridgeGroup.milestone_module} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Target Semester</label>
                    <input name="milestone_semester" type="number" min="1" max="3" defaultValue={bridgeGroup.milestone_semester} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Catch-up Hours Needed</label>
                    <input name="catch_up_hours_needed" type="number" defaultValue={bridgeGroup.catch_up_hours_needed} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hours Completed</label>
                    <input name="catch_up_hours_completed" type="number" defaultValue={bridgeGroup.catch_up_hours_completed} className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select name="status" defaultValue={bridgeGroup.status} className="w-full border rounded-lg px-3 py-2">
                    <option value="active">Active</option>
                    <option value="merged">Merged</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowEditForm(false)} className="flex-1 border rounded-lg py-2 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Student Modal */}
        {showAddStudent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
              <h2 className="text-xl font-bold mb-4">Add Student to Bridge Group</h2>
              
              {availableStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No available enrolled students found.
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-auto">
                  {availableStudents.map((student) => (
                    <div key={student.id} className="border rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-gray-600">{student.admission_number} · {student.phone}</div>
                      </div>
                      <button
                        onClick={() => handleAddStudent(student.id)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-4 mt-4 border-t">
                <button onClick={() => setShowAddStudent(false)} className="flex-1 border rounded-lg py-2 hover:bg-gray-50">Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Exam Modal */}
        {showAddExam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-auto">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">Add Exam Schedule</h2>
              
              <form onSubmit={handleAddExam} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Exam Name *</label>
                  <input name="exam_name" type="text" required className="w-full border rounded-lg px-3 py-2" placeholder="e.g., CAT 1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Exam Type *</label>
                    <select name="exam_type" required className="w-full border rounded-lg px-3 py-2">
                      <option value="cat">CAT</option>
                      <option value="end_term">End Term</option>
                      <option value="mock">Mock</option>
                      <option value="milestone">Milestone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Scheduled Date *</label>
                    <input name="scheduled_date" type="date" required className="w-full border rounded-lg px-3 py-2" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea name="description" rows={2} className="w-full border rounded-lg px-3 py-2" placeholder="Optional notes..." />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddExam(false)} className="flex-1 border rounded-lg py-2 hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="flex-1 bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700">Add Exam</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
