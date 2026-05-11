'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Part 4: Enhanced Student interface
interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  email: string;
  phone: string;
  course: string;
  course_type?: string;
  department?: string;
  campus: string;
  kcse_grade: string;
  application_date: string;
  status: 'enrolled' | 'pending' | 'rejected';
  current_semester?: number;
  current_module?: number;
  class_name?: string;
  class_id?: string;
  photo_url?: string;
  financial_hold?: boolean;
  total_fee_due?: number;
  fee_paid?: number;
  certificate_number?: string;
  graduation_date?: string;
  // Document checklist
  has_spring_file?: boolean;
  has_rem_paper?: boolean;
  has_kcse_photocopy?: boolean;
  has_kcpe_photocopy?: boolean;
}

interface Guardian {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  relationship?: string;
  is_emergency_contact: boolean;
}

interface ExamMark {
  unit_code: string;
  unit_name?: string;
  exam_type: string;
  cat_marks?: number;
  end_term_marks?: number;
  practical_marks?: number;
  marks: number;
  grade?: string;
  semester: number;
  module_index: number;
}

interface FeePayment {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  payment_date: string;
  receipt_number?: string;
}

export default function StudentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Part 4: Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState<'all' | 'name' | 'phone' | 'admission'>('all');
  
  // Part 4: Selected student for detail view
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  
  // Part 4: Student detail data
  const [studentGuardians, setStudentGuardians] = useState<Guardian[]>([]);
  const [studentPayments, setStudentPayments] = useState<FeePayment[]>([]);
  const [studentMarks, setStudentMarks] = useState<ExamMark[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Part 4: Edit mode for student
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});

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
        .select('*, courses(name, departments(name)), course_types(level))')
        .order('application_date', { ascending: false });

      // Filter by campus to show only this campus's students
      // Handle both 'main'/'west' and 'Main Campus'/'West Campus' formats
      if (campusCode && campusCode !== 'all') {
        const campusVariants = [
          campusCode,
          campusCode === 'main' ? 'Main Campus' : campusCode === 'west' ? 'West Campus' : campusCode,
          campusCode === 'Main Campus' ? 'main' : campusCode === 'West Campus' ? 'west' : campusCode
        ];
        query = query.in('campus', campusVariants);
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
          course_type: student.course_types?.level,
          department: student.courses?.departments?.name
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
      case 'Main Campus':
        return 'Main Campus';
      case 'west':
      case 'West Campus':
        return 'West Campus';
      default:
        return campusCode || 'Unknown Campus';
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete student "${studentName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', studentId);

      if (error) {
        setError('Failed to delete student: ' + error.message);
      } else {
        setSuccess('Student deleted successfully!');
        await loadStudents(campus);
      }
    } catch (err) {
      setError('Failed to delete student');
    }
  };

  // Part 4: Search students
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = students.filter((student) => {
      if (searchFilter === 'name' || searchFilter === 'all') {
        if (student.full_name.toLowerCase().includes(query)) return true;
      }
      if (searchFilter === 'phone' || searchFilter === 'all') {
        if (student.phone.toLowerCase().includes(query)) return true;
      }
      if (searchFilter === 'admission' || searchFilter === 'all') {
        if (student.admission_number?.toLowerCase().includes(query)) return true;
      }
      return false;
    });
    setFilteredStudents(filtered);
  }, [searchQuery, searchFilter, students]);

  // Part 4: Load student details
  const loadStudentDetails = async (student: Student) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
    setLoadingDetails(true);
    setEditForm(student);
    
    try {
      // Load guardians
      const { data: guardians } = await supabase
        .from('guardians')
        .select('*')
        .eq('application_id', student.id);
      setStudentGuardians(guardians || []);
      
      // Load payments
      const { data: payments } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('application_id', student.id)
        .order('payment_date', { ascending: false });
      setStudentPayments(payments || []);
      
      // Load exam marks
      const { data: marks } = await supabase
        .from('exam_marks')
        .select('*, units(name)')
        .eq('application_id', student.id)
        .order('created_at', { ascending: false });
      const enrichedMarks = marks?.map((m: any) => ({
        ...m,
        unit_name: m.units?.name
      })) || [];
      setStudentMarks(enrichedMarks);
    } catch (err) {
      console.error('Error loading student details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Part 4: Toggle financial hold
  const toggleFinancialHold = async (studentId: string, currentHold: boolean) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ financial_hold: !currentHold })
        .eq('id', studentId);
      
      if (error) throw error;
      
      setSuccess(`Financial hold ${!currentHold ? 'placed' : 'removed'} successfully!`);
      if (selectedStudent) {
        setSelectedStudent({ ...selectedStudent, financial_hold: !currentHold });
      }
      await loadStudents(campus);
    } catch (err: any) {
      setError('Failed to update financial hold: ' + err.message);
    }
  };

  // Part 4: Update student semester/module
  const updateStudentProgress = async (studentId: string, semester: number, module: number) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          current_semester: semester, 
          current_module: module 
        })
        .eq('id', studentId);
      
      if (error) throw error;
      
      setSuccess('Student progress updated successfully!');
      if (selectedStudent) {
        setSelectedStudent({ 
          ...selectedStudent, 
          current_semester: semester, 
          current_module: module 
        });
      }
      await loadStudents(campus);
    } catch (err: any) {
      setError('Failed to update progress: ' + err.message);
    }
  };

  // Part 4: Issue certificate
  const issueCertificate = async (studentId: string, certNumber: string, gradDate: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          certificate_number: certNumber,
          graduation_date: gradDate,
          status: 'completed'
        })
        .eq('id', studentId);
      
      if (error) throw error;
      
      setSuccess('Certificate issued successfully!');
      if (selectedStudent) {
        setSelectedStudent({ 
          ...selectedStudent, 
          certificate_number: certNumber,
          graduation_date: gradDate
        });
      }
      await loadStudents(campus);
    } catch (err: any) {
      setError('Failed to issue certificate: ' + err.message);
    }
  };

  // Part 4: Update document checklist
  const updateDocumentChecklist = async (studentId: string, checklist: Partial<Student>) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          has_spring_file: checklist.has_spring_file,
          has_rem_paper: checklist.has_rem_paper,
          has_kcse_photocopy: checklist.has_kcse_photocopy,
          has_kcpe_photocopy: checklist.has_kcpe_photocopy
        })
        .eq('id', studentId);
      
      if (error) throw error;
      
      setSuccess('Document checklist updated!');
      await loadStudents(campus);
    } catch (err: any) {
      setError('Failed to update checklist: ' + err.message);
    }
  };

  // Part 4: Save student edit
  const saveStudentEdit = async () => {
    if (!selectedStudent || !editForm) return;
    
    try {
      const { error } = await supabase
        .from('applications')
        .update(editForm)
        .eq('id', selectedStudent.id);
      
      if (error) throw error;
      
      setSuccess('Student updated successfully!');
      setIsEditing(false);
      setSelectedStudent({ ...selectedStudent, ...editForm });
      await loadStudents(campus);
    } catch (err: any) {
      setError('Failed to update student: ' + err.message);
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
          <span className="text-sm font-medium">Loading students...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-50 border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-500 text-sm">{getCampusName(campus)}</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-gray-50 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900">Enrolled Students</h2>
              <div className="text-sm text-gray-500">
                {filteredStudents.length} of {students.length} students
              </div>
            </div>

            {error && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="mx-6 mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}

            {/* Search Bar */}
            <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by name, phone, or admission number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value as any)}
                  className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name Only</option>
                  <option value="phone">Phone Only</option>
                  <option value="admission">Admission # Only</option>
                </select>
              </div>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {searchQuery ? 'No students match your search.' : 'No enrolled students found.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                  {filteredStudents.map((student) => (
                    <div key={student.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {/* Avatar with photo or initials */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                          {student.photo_url ? (
                            <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white font-semibold text-sm">
                              {student.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h3 className="text-gray-900 font-semibold text-sm truncate">{student.full_name}</h3>
                              <p className="text-gray-500 text-xs font-mono">{student.admission_number}</p>
                            </div>
                            <span className={`shrink-0 px-2 py-1 rounded text-xs font-medium ${
                              student.status === 'enrolled' 
                                ? 'bg-green-100 text-green-800'
                                : student.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Phone:</span>
                          <span className="text-gray-900">{student.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Email:</span>
                          <span className="text-gray-900 truncate ml-2">{student.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">KCSE Grade:</span>
                          <span className="text-gray-900">{student.kcse_grade}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Department:</span>
                          <span className="text-gray-900">{student.department || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Course:</span>
                          <span className="text-gray-900 text-right">{student.course}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Type:</span>
                          <span className="text-gray-900 capitalize">{student.course_type || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Module:</span>
                          <span className="text-gray-900">{student.current_module || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Semester:</span>
                          <span className="text-gray-900">{student.current_semester || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Class:</span>
                          <span className="text-gray-900">{student.class_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Financial Hold:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${student.financial_hold ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                            {student.financial_hold ? 'On Hold' : 'Clear'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                
              </>
            )}
          </div>
        </main>

      {/* Student Detail Modal */}
      {showStudentDetail && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-gray-50 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-lg">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedStudent.full_name}</h2>
                <p className="text-gray-500 text-sm">{selectedStudent.admission_number} • {selectedStudent.course}</p>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={saveStudentEdit}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 bg-gray-50 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => setShowStudentDetail(false)}
                  className="px-4 py-2 bg-gray-50 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {loadingDetails ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading student details...</p>
                </div>
              ) : (
                <>
                  {/* Student Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-xs uppercase">Phone</p>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.phone || ''}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full mt-1 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-gray-900 text-sm"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedStudent.phone}</p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-xs uppercase">Email</p>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editForm.email || ''}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full mt-1 px-2 py-1 bg-gray-50 border border-gray-300 rounded text-gray-900 text-sm"
                        />
                      ) : (
                        <p className="text-gray-900">{selectedStudent.email || '-'}</p>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-xs uppercase">Campus</p>
                      <p className="text-gray-900">{getCampusName(selectedStudent.campus)}</p>
                    </div>
                  </div>

                  {/* Financial Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-900">Financial Status</h3>
                      <button
                        onClick={() => toggleFinancialHold(selectedStudent.id, selectedStudent.financial_hold || false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium ${
                          selectedStudent.financial_hold
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                      >
                        {selectedStudent.financial_hold ? 'Remove Hold' : 'Place Hold'}
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-500 text-xs">Total Due</p>
                        <p className="text-gray-900 font-semibold">KES {(selectedStudent.total_fee_due || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Paid</p>
                        <p className="text-green-600 font-semibold">KES {(selectedStudent.fee_paid || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Balance</p>
                        <p className={`font-semibold ${((selectedStudent.total_fee_due || 0) - (selectedStudent.fee_paid || 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          KES {((selectedStudent.total_fee_due || 0) - (selectedStudent.fee_paid || 0)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {selectedStudent.financial_hold && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-red-600 text-sm">Financial hold active - results blocked</p>
                      </div>
                    )}
                  </div>

                  {/* Academic Progress */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Academic Progress</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-gray-500 text-xs uppercase mb-1">Current Module</p>
                        <select
                          value={selectedStudent.current_module || 1}
                          onChange={(e) => updateStudentProgress(selectedStudent.id, selectedStudent.current_semester || 1, parseInt(e.target.value))}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm"
                        >
                          {[1, 2, 3].map(m => <option key={m} value={m}>Module {m}</option>)}
                        </select>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs uppercase mb-1">Current Semester</p>
                        <select
                          value={selectedStudent.current_semester || 1}
                          onChange={(e) => updateStudentProgress(selectedStudent.id, parseInt(e.target.value), selectedStudent.current_module || 1)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm"
                        >
                          {[1, 2, 3, 4, 5, 6].map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Section (for graduated students) */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Certificate & Graduation</h3>
                    {selectedStudent.certificate_number ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs uppercase">Certificate Number</p>
                          <p className="text-green-600 font-semibold">{selectedStudent.certificate_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase">Graduation Date</p>
                          <p className="text-gray-900">{selectedStudent.graduation_date ? new Date(selectedStudent.graduation_date).toLocaleDateString() : '-'}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <input
                          type="text"
                          placeholder="Certificate Number"
                          id="certNumber"
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm"
                        />
                        <input
                          type="date"
                          id="gradDate"
                          className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 text-sm"
                        />
                        <button
                          onClick={() => {
                            const certNum = (document.getElementById('certNumber') as HTMLInputElement)?.value;
                            const gradDate = (document.getElementById('gradDate') as HTMLInputElement)?.value;
                            if (certNum && gradDate) {
                              issueCertificate(selectedStudent.id, certNum, gradDate);
                            }
                          }}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
                        >
                          Issue Certificate
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Document Checklist */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Document Checklist</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'has_spring_file', label: 'Spring File' },
                        { key: 'has_rem_paper', label: 'REM Paper' },
                        { key: 'has_kcse_photocopy', label: 'KCSE Photocopy' },
                        { key: 'has_kcpe_photocopy', label: 'KCPE Photocopy' }
                      ].map((item) => (
                        <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(selectedStudent as any)[item.key] || false}
                            onChange={(e) => {
                              const updated = { ...selectedStudent, [item.key]: e.target.checked };
                              setSelectedStudent(updated as Student);
                              updateDocumentChecklist(selectedStudent.id, { [item.key]: e.target.checked });
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700 text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Guardians */}
                  {studentGuardians.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Guardians / Emergency Contacts</h3>
                      <div className="space-y-3">
                        {studentGuardians.map((guardian) => (
                          <div key={guardian.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                            <div>
                              <p className="text-gray-900 font-medium">{guardian.full_name}</p>
                              <p className="text-gray-500 text-sm">{guardian.phone} {guardian.relationship ? `• ${guardian.relationship}` : ''}</p>
                            </div>
                            {guardian.is_emergency_contact && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Emergency Contact</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payment History */}
                  {studentPayments.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Payment History</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {studentPayments.map((payment) => (
                          <div key={payment.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                            <div>
                              <span className="text-gray-900 capitalize">{payment.payment_type}</span>
                              <span className="text-gray-500 ml-2">({payment.payment_method})</span>
                            </div>
                            <div className="text-right">
                              <p className="text-green-600 font-semibold">KES {payment.amount.toLocaleString()}</p>
                              <p className="text-gray-500 text-xs">{new Date(payment.payment_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exam Results */}
                  {studentMarks.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Exam Results</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {studentMarks.slice(0, 10).map((mark, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                            <div>
                              <span className="text-gray-900">{mark.unit_code}</span>
                              {mark.unit_name && <span className="text-gray-500 ml-2">{mark.unit_name}</span>}
                              <span className="text-gray-500 ml-2 uppercase">({mark.exam_type})</span>
                            </div>
                            <div className="text-right">
                              <p className="text-gray-900 font-semibold">{mark.marks}% {mark.grade && `(${mark.grade})`}</p>
                              <p className="text-gray-500 text-xs">Sem {mark.semester}, Mod {mark.module_index}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
