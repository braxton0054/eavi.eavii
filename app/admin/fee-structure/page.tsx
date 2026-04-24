'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FeeStructure {
  id: string;
  course_type_id: string;
  exam_body: string;
  semester: number;
  module: number;
  tuition_fee: number;
  practical_fee: number;
  exam_fee: number;
  registration_fee: number;
  library_fee: number;
  lab_fee: number;
  campus: string;
  academic_year: string;
}

interface CourseType {
  id: string;
  level: string;
  course_id: string;
  course: {
    id: string;
    name: string;
  };
}

export default function FeeStructurePage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [courseTypes, setCourseTypes] = useState<CourseType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null);

  const [formData, setFormData] = useState({
    course_type_id: '',
    exam_body: 'internal',
    semester: 1,
    module: 1,
    tuition_fee: 0,
    practical_fee: 0,
    exam_fee: 0,
    registration_fee: 0,
    library_fee: 0,
    lab_fee: 0,
    campus: '',
    academic_year: new Date().getFullYear().toString()
  });

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
      setFormData(prev => ({ ...prev, campus: userCampus }));
      await loadFeeStructures(userCampus);
      await loadCourseTypes();
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadFeeStructures = async (campusFilter: string) => {
    const { data, error } = await supabase
      .from('fee_structure')
      .select('*')
      .eq('campus', campusFilter)
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: true })
      .order('module', { ascending: true });

    if (error) {
      console.error('Error loading fee structures:', error);
    } else {
      setFeeStructures(data || []);
    }
  };

  const loadCourseTypes = async () => {
    const { data, error } = await supabase
      .from('course_types')
      .select(`
        id,
        level,
        course_id,
        courses (
          id,
          name
        )
      `);

    if (error) {
      console.error('Error loading course types:', error);
    } else {
      setCourseTypes(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      tuition_fee: parseFloat(formData.tuition_fee.toString()),
      practical_fee: parseFloat(formData.practical_fee.toString()),
      exam_fee: parseFloat(formData.exam_fee.toString()),
      registration_fee: parseFloat(formData.registration_fee.toString()),
      library_fee: parseFloat(formData.library_fee.toString()),
      lab_fee: parseFloat(formData.lab_fee.toString())
    };

    if (editingFee) {
      const { error } = await supabase
        .from('fee_structure')
        .update(submitData)
        .eq('id', editingFee.id);

      if (error) {
        console.error('Error updating fee structure:', error);
        alert('Error updating fee structure');
      } else {
        alert('Fee structure updated successfully');
        setShowForm(false);
        setEditingFee(null);
        await loadFeeStructures(campus);
      }
    } else {
      const { error } = await supabase
        .from('fee_structure')
        .insert([submitData]);

      if (error) {
        console.error('Error creating fee structure:', error);
        alert('Error creating fee structure');
      } else {
        alert('Fee structure created successfully');
        setShowForm(false);
        await loadFeeStructures(campus);
      }
    }
  };

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee);
    setFormData({
      course_type_id: fee.course_type_id,
      exam_body: fee.exam_body,
      semester: fee.semester,
      module: fee.module,
      tuition_fee: fee.tuition_fee,
      practical_fee: fee.practical_fee,
      exam_fee: fee.exam_fee,
      registration_fee: fee.registration_fee,
      library_fee: fee.library_fee,
      lab_fee: fee.lab_fee,
      campus: fee.campus,
      academic_year: fee.academic_year
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee structure?')) return;

    const { error } = await supabase
      .from('fee_structure')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting fee structure:', error);
      alert('Error deleting fee structure');
    } else {
      alert('Fee structure deleted successfully');
      await loadFeeStructures(campus);
    }
  };

  const resetForm = () => {
    setFormData({
      course_type_id: '',
      exam_body: 'internal',
      semester: 1,
      module: 1,
      tuition_fee: 0,
      practical_fee: 0,
      exam_fee: 0,
      registration_fee: 0,
      library_fee: 0,
      lab_fee: 0,
      campus,
      academic_year: new Date().getFullYear().toString()
    });
    setEditingFee(null);
  };

  const getCourseTypeName = (courseTypeId: string) => {
    const courseType = courseTypes.find(ct => ct.id === courseTypeId);
    if (!courseType) return 'Unknown';
    return `${courseType.course?.name} - ${courseType.level}`;
  };

  const getCampusName = (campus: string) => {
    return campus === 'main' ? 'Main Campus' : 'West Campus';
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
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
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
              <h1 className="text-xl md:text-2xl font-bold text-white">Fee Structure</h1>
            </div>
            <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="mb-6">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 font-semibold"
            >
              Add New Fee Structure
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingFee ? 'Edit Fee Structure' : 'Add New Fee Structure'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Course Type</label>
                      <select
                        value={formData.course_type_id}
                        onChange={(e) => setFormData({ ...formData, course_type_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Course Type</option>
                        {courseTypes.map((ct) => (
                          <option key={ct.id} value={ct.id}>
                            {ct.course?.name} - {ct.level}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exam Body</label>
                      <select
                        value={formData.exam_body}
                        onChange={(e) => setFormData({ ...formData, exam_body: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="internal">Internal</option>
                        <option value="JP">JP International Examinations</option>
                        <option value="CDACC">CDACC Examination Body</option>
                        <option value="KNEC">KNEC</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                      <select
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        {[1, 2, 3, 4, 5, 6].map((s) => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                      <input
                        type="number"
                        value={formData.module}
                        onChange={(e) => setFormData({ ...formData, module: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                      <input
                        type="text"
                        value={formData.academic_year}
                        onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="2024-2025"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tuition Fee</label>
                      <input
                        type="number"
                        value={formData.tuition_fee}
                        onChange={(e) => setFormData({ ...formData, tuition_fee: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Practical Fee</label>
                      <input
                        type="number"
                        value={formData.practical_fee}
                        onChange={(e) => setFormData({ ...formData, practical_fee: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exam Fee</label>
                      <input
                        type="number"
                        value={formData.exam_fee}
                        onChange={(e) => setFormData({ ...formData, exam_fee: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee</label>
                      <input
                        type="number"
                        value={formData.registration_fee}
                        onChange={(e) => setFormData({ ...formData, registration_fee: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Library Fee</label>
                      <input
                        type="number"
                        value={formData.library_fee}
                        onChange={(e) => setFormData({ ...formData, library_fee: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lab Fee</label>
                      <input
                        type="number"
                        value={formData.lab_fee}
                        onChange={(e) => setFormData({ ...formData, lab_fee: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors duration-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 font-semibold"
                    >
                      {editingFee ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr className="text-purple-200">
                  <th className="text-left py-3 px-4">Course</th>
                  <th className="text-left py-3 px-4">Exam Body</th>
                  <th className="text-left py-3 px-4">Semester</th>
                  <th className="text-left py-3 px-4">Module</th>
                  <th className="text-left py-3 px-4">Tuition</th>
                  <th className="text-left py-3 px-4">Practical</th>
                  <th className="text-left py-3 px-4">Exam</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {feeStructures.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-purple-200">
                      No fee structures configured yet.
                    </td>
                  </tr>
                ) : (
                  feeStructures.map((fee) => {
                    const total = fee.tuition_fee + fee.practical_fee + fee.exam_fee + 
                                fee.registration_fee + fee.library_fee + fee.lab_fee;
                    return (
                      <tr key={fee.id} className="text-white border-t border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4">{getCourseTypeName(fee.course_type_id)}</td>
                        <td className="py-3 px-4">{fee.exam_body}</td>
                        <td className="py-3 px-4">{fee.semester}</td>
                        <td className="py-3 px-4">{fee.module}</td>
                        <td className="py-3 px-4">KES {fee.tuition_fee.toLocaleString()}</td>
                        <td className="py-3 px-4">KES {fee.practical_fee.toLocaleString()}</td>
                        <td className="py-3 px-4">KES {fee.exam_fee.toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold">KES {total.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(fee)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(fee.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
