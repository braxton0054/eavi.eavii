'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface AcademicCalendar {
  id: string;
  academic_year: string;
  term: number;
  semester: number;
  term_name: string;
  term_start_date: string;
  term_end_date: string;
  intake_start_date: string;
  intake_end_date: string;
  bridge_trigger_day: number;
  cat_opening_date: string;
  cat_closing_date: string;
  end_term_exam_date: string;
  mock_exam_available: boolean;
  mock_exam_date: string | null;
  campus: string;
}

export default function AcademicCalendar() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [calendars, setCalendars] = useState<AcademicCalendar[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<AcademicCalendar | null>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);
  const [formData, setFormData] = useState({
    academic_year: '',
    term: 1,
    semester: 1,
    term_name: '',
    term_start_date: '',
    term_end_date: '',
    intake_start_date: '',
    intake_end_date: '',
    bridge_trigger_day: 45,
    cat_opening_date: '',
    cat_closing_date: '',
    end_term_exam_date: '',
    mock_exam_available: false,
    mock_exam_date: '',
    campus: ''
  });

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
      setFormData(prev => ({ ...prev, campus: userCampus }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      mock_exam_date: formData.mock_exam_available ? formData.mock_exam_date : null
    };

    if (editingCalendar) {
      const { error } = await supabase
        .from('academic_calendar')
        .update(submitData)
        .eq('id', editingCalendar.id);

      if (error) {
        console.error('Error updating calendar:', error);
        alert('Error updating calendar');
      } else {
        alert('Calendar updated successfully');
        setShowForm(false);
        setEditingCalendar(null);
        await loadCalendars(campus);
      }
    } else {
      const { error } = await supabase
        .from('academic_calendar')
        .insert([submitData]);

      if (error) {
        console.error('Error creating calendar:', error);
        alert('Error creating calendar');
      } else {
        alert('Calendar created successfully');
        setShowForm(false);
        resetForm();
        await loadCalendars(campus);
      }
    }
  };

  const handleEdit = (calendar: AcademicCalendar) => {
    setEditingCalendar(calendar);
    setFormData({
      academic_year: calendar.academic_year,
      term: calendar.term,
      semester: calendar.semester,
      term_name: calendar.term_name,
      term_start_date: calendar.term_start_date,
      term_end_date: calendar.term_end_date,
      intake_start_date: calendar.intake_start_date,
      intake_end_date: calendar.intake_end_date,
      bridge_trigger_day: calendar.bridge_trigger_day,
      cat_opening_date: calendar.cat_opening_date,
      cat_closing_date: calendar.cat_closing_date,
      end_term_exam_date: calendar.end_term_exam_date,
      mock_exam_available: calendar.mock_exam_available,
      mock_exam_date: calendar.mock_exam_date || '',
      campus: calendar.campus
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this calendar entry?')) return;

    const { error } = await supabase
      .from('academic_calendar')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting calendar:', error);
      alert('Error deleting calendar');
    } else {
      alert('Calendar deleted successfully');
      await loadCalendars(campus);
    }
  };

  const resetForm = () => {
    setFormData({
      academic_year: '',
      term: 1,
      semester: 1,
      term_name: '',
      term_start_date: '',
      term_end_date: '',
      intake_start_date: '',
      intake_end_date: '',
      bridge_trigger_day: 45,
      cat_opening_date: '',
      cat_closing_date: '',
      end_term_exam_date: '',
      mock_exam_available: false,
      mock_exam_date: '',
      campus
    });
    setEditingCalendar(null);
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
              <Link href="/admin/dashboard" className="text-purple-200 hover:text-white transition-colors">
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
                <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
              </div>
            </div>
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
              Add New Term
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  {editingCalendar ? 'Edit Term' : 'Add New Term'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
                      <select
                        value={formData.term}
                        onChange={(e) => setFormData({ ...formData, term: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value={1}>Term 1</option>
                        <option value={2}>Term 2</option>
                        <option value={3}>Term 3</option>
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
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
                        <option value={3}>Semester 3</option>
                        <option value={4}>Semester 4</option>
                        <option value={5}>Semester 5</option>
                        <option value={6}>Semester 6</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Term Name</label>
                      <input
                        type="text"
                        value={formData.term_name}
                        onChange={(e) => setFormData({ ...formData, term_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="January Term"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                      <select
                        value={formData.campus}
                        onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="west">West Campus</option>
                        <option value="main">Main Campus</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Term Start Date</label>
                      <input
                        type="date"
                        value={formData.term_start_date}
                        onChange={(e) => setFormData({ ...formData, term_start_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Term End Date</label>
                      <input
                        type="date"
                        value={formData.term_end_date}
                        onChange={(e) => setFormData({ ...formData, term_end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Intake Start Date</label>
                      <input
                        type="date"
                        value={formData.intake_start_date}
                        onChange={(e) => setFormData({ ...formData, intake_start_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Intake End Date</label>
                      <input
                        type="date"
                        value={formData.intake_end_date}
                        onChange={(e) => setFormData({ ...formData, intake_end_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bridge Trigger Day</label>
                      <input
                        type="number"
                        value={formData.bridge_trigger_day}
                        onChange={(e) => setFormData({ ...formData, bridge_trigger_day: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">Day number when bridge stream opens (e.g., 45)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CAT Opening Date</label>
                      <input
                        type="date"
                        value={formData.cat_opening_date}
                        onChange={(e) => setFormData({ ...formData, cat_opening_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CAT Closing Date</label>
                      <input
                        type="date"
                        value={formData.cat_closing_date}
                        onChange={(e) => setFormData({ ...formData, cat_closing_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Term Exam Date</label>
                      <input
                        type="date"
                        value={formData.end_term_exam_date}
                        onChange={(e) => setFormData({ ...formData, end_term_exam_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="mock_exam_available"
                        checked={formData.mock_exam_available}
                        onChange={(e) => setFormData({ ...formData, mock_exam_available: e.target.checked })}
                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="mock_exam_available" className="text-sm font-medium text-gray-700">Mock Exam Available</label>
                    </div>
                    {formData.mock_exam_available && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mock Exam Date</label>
                        <input
                          type="date"
                          value={formData.mock_exam_date}
                          onChange={(e) => setFormData({ ...formData, mock_exam_date: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          required
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 font-semibold"
                    >
                      {editingCalendar ? 'Update' : 'Create'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="flex-1 px-6 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors duration-300 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {calendars.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
                <p className="text-purple-200">No academic calendar entries found. Click "Add New Term" to create one.</p>
              </div>
            ) : (
              calendars.map((calendar) => (
                <div key={calendar.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{calendar.academic_year} - {calendar.term_name}</h3>
                      <p className="text-purple-200 text-sm">Term {calendar.term}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(calendar)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(calendar.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-purple-300 text-sm mb-1">Term Period</p>
                      <p className="text-white font-semibold">{formatDate(calendar.term_start_date)} - {formatDate(calendar.term_end_date)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-purple-300 text-sm mb-1">CAT Period</p>
                      <p className="text-white font-semibold">{formatDate(calendar.cat_opening_date)} - {formatDate(calendar.cat_closing_date)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-purple-300 text-sm mb-1">End Term Exam</p>
                      <p className="text-white font-semibold">{formatDate(calendar.end_term_exam_date)}</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-purple-300 text-sm mb-1">Mock Exam</p>
                      <p className="text-white font-semibold">
                        {calendar.mock_exam_available ? `Yes - ${formatDate(calendar.mock_exam_date || '')}` : 'No'}
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
