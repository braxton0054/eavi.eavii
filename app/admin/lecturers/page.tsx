'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function LecturersPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'add' | 'list' | 'migrate' | 'workload' | 'submissions'>('add');
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [editingLecturer, setEditingLecturer] = useState<string | null>(null);
  
  // Part 4: Lecturer workload and assignments
  const [lecturerWorkload, setLecturerWorkload] = useState<any[]>([]);
  const [selectedLecturerWorkload, setSelectedLecturerWorkload] = useState<string | null>(null);
  const [workloadDetails, setWorkloadDetails] = useState<any[]>([]);
  
  // Part 4: Submission status tracking
  const [submissionStatus, setSubmissionStatus] = useState<any[]>([]);
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  // Migration state
  const [migrateFrom, setMigrateFrom] = useState('');
  const [migrateTo, setMigrateTo] = useState('');

  // Lecturer form data
  const [formData, setFormData] = useState({
    lecturerNumber: '',
    fullName: '',
    phoneNumber: '',
    gender: ''
  });

  // Generate 6-digit lecturer number
  const generateLecturerNumber = () => {
    const sequenceNumber = Math.floor(Math.random() * 900000) + 100000; // Random 6-digit number
    return `LEC${sequenceNumber}`;
  };

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
        // Redirect to appropriate dashboard based on role
        if (userRole === 'lecturer') {
          router.push('/lecturer/dashboard');
        } else if (userRole === 'student') {
          router.push('/student/dashboard');
        } else {
          router.push('/login/admin');
        }
        return;
      }

      setCampus(session.user?.user_metadata?.campus || '');

      // Generate initial lecturer number
      setFormData(prev => ({ ...prev, lecturerNumber: generateLecturerNumber() }));
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  // Load lecturers when viewMode changes
  useEffect(() => {
    if (viewMode === 'list') {
      loadLecturers();
    }
    if (viewMode === 'workload') {
      loadLecturerWorkload();
    }
    if (viewMode === 'submissions') {
      loadSubmissionStatus();
    }
  }, [viewMode]);

  // Part 4: Load lecturer workload (assignments)
  const loadLecturerWorkload = async () => {
    setLoadingWorkload(true);
    try {
      // Get all lecturers
      const { data: lecturersData } = await supabase.from('lecturers').select('id, full_name, lecturer_number');
      
      // Get all assignments with related data
      const { data: assignments } = await supabase
        .from('lecturer_assignments')
        .select(`
          id,
          lecturer_id,
          campus,
          course_id,
          class_id,
          classes(class_name, intake_month),
          courses(name),
          lecturer_assignment_semesters(semester, module_index, is_active)
        `);
      
      // Calculate workload per lecturer
      const workload = lecturersData?.map((lecturer: any) => {
        const lecturerAssignments = assignments?.filter((a: any) => a.lecturer_id === lecturer.id) || [];
        const activeAssignments = lecturerAssignments.filter((a: any) => 
          a.lecturer_assignment_semesters?.some((s: any) => s.is_active)
        );
        
        return {
          ...lecturer,
          total_assignments: lecturerAssignments.length,
          active_assignments: activeAssignments.length,
          classes: lecturerAssignments.map((a: any) => ({
            class_name: a.classes?.class_name,
            course_name: a.courses?.name,
            campus: a.campus,
            intake: a.classes?.intake_month,
            semester: a.lecturer_assignment_semesters?.[0]?.semester,
            module: a.lecturer_assignment_semesters?.[0]?.module_index,
            is_active: a.lecturer_assignment_semesters?.[0]?.is_active
          }))
        };
      }) || [];
      
      setLecturerWorkload(workload);
    } catch (err) {
      console.error('Error loading workload:', err);
    } finally {
      setLoadingWorkload(false);
    }
  };

  // Part 4: Load submission status
  const loadSubmissionStatus = async () => {
    setLoadingWorkload(true);
    try {
      // Get all lecturers
      const { data: lecturersData } = await supabase.from('lecturers').select('id, full_name, lecturer_number');
      
      // Get all exam marks with lecturer_id and is_submitted
      const { data: examMarks } = await supabase
        .from('exam_marks')
        .select('lecturer_id, is_submitted, unit_code, class_id');
      
      // Calculate submission status per lecturer
      const status = lecturersData?.map((lecturer: any) => {
        const lecturerMarks = examMarks?.filter((m: any) => m.lecturer_id === lecturer.id) || [];
        const totalMarks = lecturerMarks.length;
        const submittedMarks = lecturerMarks.filter((m: any) => m.is_submitted).length;
        const pendingMarks = totalMarks - submittedMarks;
        
        return {
          ...lecturer,
          total_marks: totalMarks,
          submitted_marks: submittedMarks,
          pending_marks: pendingMarks,
          completion_rate: totalMarks > 0 ? Math.round((submittedMarks / totalMarks) * 100) : 0,
          status: pendingMarks === 0 && totalMarks > 0 ? 'Complete' : pendingMarks > 0 ? 'Pending' : 'No Marks'
        };
      }).sort((a: any, b: any) => b.pending_marks - a.pending_marks) || [];
      
      setSubmissionStatus(status);
    } catch (err) {
      console.error('Error loading submission status:', err);
    } finally {
      setLoadingWorkload(false);
    }
  };

  const loadLecturers = async () => {
    try {
      const { data, error } = await supabase
        .from('lecturers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading lecturers:', error);
      } else {
        setLecturers(data || []);
      }
    } catch (err) {
      console.error('Error loading lecturers:', err);
    }
  };

  const handleEditLecturer = (lecturer: any) => {
    setEditingLecturer(lecturer.id);
    setFormData({
      lecturerNumber: lecturer.lecturer_number,
      fullName: lecturer.full_name,
      phoneNumber: lecturer.phone,
      gender: lecturer.gender || ''
    });
    setViewMode('add');
  };

  const handleDeleteLecturer = async (lecturerId: string) => {
    if (!confirm('Are you sure you want to delete this lecturer? This will affect both campuses.')) {
      return;
    }
    try {
      const { error } = await supabase
        .from('lecturers')
        .delete()
        .eq('id', lecturerId);
      
      if (error) {
        setError('Failed to delete lecturer. Please try again.');
        console.error('Error deleting lecturer:', error);
      } else {
        setError('Lecturer deleted successfully!');
        loadLecturers();
      }
    } catch (err) {
      setError('Failed to delete lecturer. Please try again.');
      console.error('Error deleting lecturer:', err);
    }
  };

  const handleCopyLecturerNumber = (lecturerNumber: string) => {
    navigator.clipboard.writeText(lecturerNumber).then(() => {
      setError('Lecturer number copied to clipboard!');
      setTimeout(() => setError(''), 2000);
    }).catch(() => {
      setError('Failed to copy lecturer number');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate form
      if (!formData.fullName.trim()) {
        setError('Full name is required');
        setSubmitting(false);
        return;
      }
      if (!formData.phoneNumber.trim()) {
        setError('Phone number is required');
        setSubmitting(false);
        return;
      }

      if (!campus) {
        setError('Campus information not found. Please log in again.');
        setSubmitting(false);
        return;
      }

      const lecturerData = {
        lecturer_number: formData.lecturerNumber,
        full_name: formData.fullName,
        phone: formData.phoneNumber,
        email: `${formData.lecturerNumber.toLowerCase()}@eavicollege.ac.ke`,
        gender: formData.gender,
        campus: ['main', 'west'] // All lecturers are available at both campuses
      };

      if (editingLecturer) {
        // Update existing lecturer
        const { error } = await supabase
          .from('lecturers')
          .update(lecturerData)
          .eq('id', editingLecturer);
        
        if (error) {
          setError('Failed to update lecturer. Please try again.');
          console.error('Error updating lecturer:', error);
        } else {
          setError('Lecturer updated successfully!');
        }
      } else {
        // Insert new lecturer
        const { data, error } = await supabase
          .from('lecturers')
          .insert([lecturerData])
          .select();

        if (error) {
          setError(`Failed to add lecturer: ${error.message}`);
          console.error('Error adding lecturer:', error);
          console.error('Lecturer data:', lecturerData);
        } else {
          setError('Lecturer added successfully!');
          console.log('Lecturer added successfully:', data);
        }
      }

      // Reset form
      setFormData({
        lecturerNumber: generateLecturerNumber(),
        fullName: '',
        phoneNumber: '',
        gender: ''
      });
      setEditingLecturer(null);

    } catch (err) {
      setError('Failed to save lecturer. Please try again.');
      console.error('Error saving lecturer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleMigration = async () => {
    if (!migrateFrom || !migrateTo) {
      setError('Please select both lecturers for migration');
      return;
    }

    if (migrateFrom === migrateTo) {
      setError('Cannot migrate to the same lecturer');
      return;
    }

    if (!confirm(`Are you sure you want to migrate all assignments from the selected lecturer to the new lecturer? This action cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Get lecturer assignments for the old lecturer
      const { data: oldAssignments } = await supabase
        .from('lecturer_assignments')
        .select('*')
        .eq('lecturer_number', migrateFrom);

      if (!oldAssignments || oldAssignments.length === 0) {
        setError('No assignments found for the selected lecturer');
        setSubmitting(false);
        return;
      }

      // Update all assignments to the new lecturer
      const { error: updateError } = await supabase
        .from('lecturer_assignments')
        .update({ lecturer_number: migrateTo })
        .eq('lecturer_number', migrateFrom);

      if (updateError) {
        setError('Failed to migrate assignments. Please try again.');
        console.error('Error migrating assignments:', updateError);
      } else {
        setError(`Successfully migrated ${oldAssignments.length} assignment(s) from old lecturer to new lecturer!`);
        setMigrateFrom('');
        setMigrateTo('');
      }
    } catch (err) {
      setError('Failed to migrate lecturer. Please try again.');
      console.error('Error migrating lecturer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium">Loading lecturers...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lecturer Management</h1>
            <p className="text-gray-500 text-sm">
              Campus: {campus === 'main' ? 'Main Campus' : campus === 'west' ? 'West Campus' : 'Unknown'}
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {viewMode === 'migrate' ? 'Migrate Lecturer Assignments' :
                 viewMode === 'workload' ? 'Lecturer Workload' :
                 viewMode === 'submissions' ? 'Submission Status' :
                 viewMode === 'add' ? (editingLecturer ? 'Edit Lecturer' : 'Add New Lecturer') : 'Existing Lecturers'}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {viewMode !== 'migrate' && viewMode !== 'workload' && viewMode !== 'submissions' && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode(viewMode === 'add' ? 'list' : 'add');
                      if (viewMode === 'add') {
                        setEditingLecturer(null);
                        setFormData({
                          lecturerNumber: generateLecturerNumber(),
                          fullName: '',
                          phoneNumber: '',
                          gender: ''
                        });
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    {viewMode === 'add' ? 'View All Lecturers' : 'Add New Lecturer'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setViewMode(viewMode === 'migrate' ? 'list' : 'migrate');
                    setMigrateFrom('');
                    setMigrateTo('');
                    setError('');
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                >
                  {viewMode === 'migrate' ? 'Cancel' : 'Migrate'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'workload' ? 'list' : 'workload')}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    viewMode === 'workload'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {viewMode === 'workload' ? 'Back to List' : 'Workload'}
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'submissions' ? 'list' : 'submissions')}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    viewMode === 'submissions'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {viewMode === 'submissions' ? 'Back to List' : 'Submissions'}
                </button>
              </div>
            </div>

            {error && (
              <div className={`mx-6 mt-4 p-3 rounded-lg text-sm ${
                error.includes('successfully')
                  ? 'bg-green-50 text-green-600 border border-green-200'
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {error}
              </div>
            )}

          {viewMode === 'migrate' ? (
            <div className="p-6 space-y-6">
              <p className="text-gray-600 text-sm mb-4">
                Select a lecturer to migrate assignments FROM and a lecturer to migrate TO. All course and unit assignments will be transferred.
              </p>

              {/* Migrate From */}
              <div>
                <label htmlFor="migrateFrom" className="block text-gray-700 text-sm font-medium mb-2">
                  Migrate From (Old Lecturer) *
                </label>
                <select
                  id="migrateFrom"
                  value={migrateFrom}
                  onChange={(e) => setMigrateFrom(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select lecturer to migrate from</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.lecturer_number}>
                      {lecturer.full_name} ({lecturer.lecturer_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Migrate To */}
              <div>
                <label htmlFor="migrateTo" className="block text-gray-700 text-sm font-medium mb-2">
                  Migrate To (New Lecturer) *
                </label>
                <select
                  id="migrateTo"
                  value={migrateTo}
                  onChange={(e) => setMigrateTo(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select lecturer to migrate to</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.lecturer_number}>
                      {lecturer.full_name} ({lecturer.lecturer_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit Migration */}
              <button
                onClick={handleMigration}
                disabled={submitting || !migrateFrom || !migrateTo}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Migrating...' : 'Migrate Assignments'}
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="divide-y divide-gray-200">
              {lecturers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No lecturers found. Add your first lecturer.</p>
                </div>
              ) : (
                lecturers.map((lecturer) => (
                  <div key={lecturer.id} className="p-4 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">{lecturer.full_name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-gray-500 text-sm">Lecturer Number: {lecturer.lecturer_number}</p>
                          <button
                            onClick={() => handleCopyLecturerNumber(lecturer.lecturer_number)}
                            className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                            title="Copy lecturer number"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">Phone: {lecturer.phone}</p>
                        <p className="text-gray-600 text-sm">Gender: {lecturer.gender ? lecturer.gender.charAt(0).toUpperCase() + lecturer.gender.slice(1) : 'Not specified'}</p>
                        {lecturer.campus && (
                          <p className="text-gray-600 text-sm">
                            Campus: {Array.isArray(lecturer.campus)
                              ? lecturer.campus.map((c: string) => c === 'main' ? 'Main' : c === 'west' ? 'West' : c === 'town' ? 'Town' : c).join(', ')
                              : (lecturer.campus === 'main' ? 'Main' : lecturer.campus === 'west' ? 'West' : lecturer.campus === 'town' ? 'Town' : lecturer.campus)
                            }
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditLecturer(lecturer)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteLecturer(lecturer.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : viewMode === 'workload' ? (
            /* Workload View */
            <div className="divide-y divide-gray-200">
              {loadingWorkload ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading workload data...</p>
                </div>
              ) : lecturerWorkload.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No workload data available.</p>
                </div>
              ) : (
                lecturerWorkload.map((lecturer) => (
                  <div key={lecturer.id} className="p-4 md:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{lecturer.full_name}</h3>
                        <p className="text-gray-500 text-sm">{lecturer.lecturer_number}</p>
                        <div className="flex gap-4 mt-2">
                          <span className="text-sm">
                            <span className="text-gray-500">Total Assignments:</span>
                            <span className="text-gray-900 font-semibold ml-1">{lecturer.total_assignments}</span>
                          </span>
                          <span className="text-sm">
                            <span className="text-gray-500">Active:</span>
                            <span className="text-green-600 font-semibold ml-1">{lecturer.active_assignments}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedLecturerWorkload(
                          selectedLecturerWorkload === lecturer.id ? null : lecturer.id
                        )}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                      >
                        {selectedLecturerWorkload === lecturer.id ? 'Hide Details' : 'View Classes'}
                      </button>
                    </div>
                    
                    {selectedLecturerWorkload === lecturer.id && lecturer.classes.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-700">Assigned Classes:</h4>
                        {lecturer.classes.map((cls: any, idx: number) => (
                          <div key={idx} className="bg-gray-50 rounded p-3 text-sm border border-gray-200">
                            <div className="flex justify-between">
                              <span className="text-gray-900 font-medium">{cls.class_name}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                cls.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {cls.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="text-gray-600 mt-1">
                              {cls.course_name} • {cls.campus} Campus • Intake: {cls.intake}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">
                              Module {cls.module}, Semester {cls.semester}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : viewMode === 'submissions' ? (
            /* Submissions View */
            <div className="p-6">
              {loadingWorkload ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading submission status...</p>
                </div>
              ) : submissionStatus.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No submission data available.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div>Lecturer</div>
                    <div className="text-center">Total Marks</div>
                    <div className="text-center">Submitted</div>
                    <div className="text-center">Status</div>
                  </div>
                  {submissionStatus.map((lecturer) => (
                    <div key={lecturer.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-3">
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <div>
                          <h3 className="text-gray-900 font-medium text-sm">{lecturer.full_name}</h3>
                          <p className="text-gray-500 text-xs">{lecturer.lecturer_number}</p>
                        </div>
                        <div className="text-center">
                          <span className="text-gray-900 font-semibold">{lecturer.total_marks}</span>
                        </div>
                        <div className="text-center">
                          <span className={`font-semibold ${
                            lecturer.submitted_marks === lecturer.total_marks && lecturer.total_marks > 0
                              ? 'text-green-600'
                              : lecturer.submitted_marks > 0
                              ? 'text-yellow-600'
                              : 'text-gray-400'
                          }`}>
                            {lecturer.submitted_marks}
                          </span>
                          {lecturer.pending_marks > 0 && (
                            <span className="text-red-600 text-xs ml-1">({lecturer.pending_marks} pending)</span>
                          )}
                        </div>
                        <div className="text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            lecturer.status === 'Complete'
                              ? 'bg-green-100 text-green-800'
                              : lecturer.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {lecturer.status}
                          </span>
                        </div>
                      </div>
                      {lecturer.total_marks > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Completion Rate</span>
                            <span>{lecturer.completion_rate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                lecturer.completion_rate === 100 ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${lecturer.completion_rate}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lecturer Number (Auto-generated) */}
              <div>
                <label htmlFor="lecturerNumber" className="block text-purple-200 text-sm mb-1">
                  Lecturer Number (Auto-generated)
                </label>
                <input
                  type="text"
                  id="lecturerNumber"
                  name="lecturerNumber"
                  value={formData.lecturerNumber}
                  disabled
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white/70 cursor-not-allowed text-sm"
                />
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-purple-200 text-sm mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter lecturer's full name"
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-purple-200 text-sm mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  placeholder="Enter phone number (e.g., 0712345678)"
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-purple-200 text-sm mb-1">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="">Select Gender</option>
                  <option value="male" className="text-gray-900">Male</option>
                  <option value="female" className="text-gray-900">Female</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 text-base font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (editingLecturer ? 'Updating Lecturer...' : 'Adding Lecturer...') : (editingLecturer ? 'Update Lecturer' : 'Add Lecturer')}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
