'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ReportingDate {
  id: string;
  month: number;
  year: number;
  reporting_date: string;
  created_at: string;
  updated_at: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ReportingDates() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [reportingDates, setReportingDates] = useState<ReportingDate[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setSupabase(createClient());
  }, []);
  const [formData, setFormData] = useState({
    month: 1,
    year: new Date().getFullYear(),
    reporting_date: ''
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

      await loadReportingDates(selectedYear);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router, selectedYear]);

  const loadReportingDates = async (year: number) => {
    const { data, error } = await supabase
      .from('reporting_dates')
      .select('*')
      .eq('year', year)
      .order('month', { ascending: true });

    if (error) {
      console.error('Error loading reporting dates:', error);
    } else {
      setReportingDates(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: existing } = await supabase
      .from('reporting_dates')
      .select('*')
      .eq('month', formData.month)
      .eq('year', formData.year)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('reporting_dates')
        .update({ 
          reporting_date: formData.reporting_date,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating reporting date:', error);
        alert('Error updating reporting date');
      } else {
        alert('Reporting date updated successfully (This change applies to all campuses)');
        setShowForm(false);
        await loadReportingDates(formData.year);
      }
    } else {
      const { error } = await supabase
        .from('reporting_dates')
        .insert([{
          month: formData.month,
          year: formData.year,
          reporting_date: formData.reporting_date
        }]);

      if (error) {
        console.error('Error creating reporting date:', error);
        alert('Error creating reporting date');
      } else {
        alert('Reporting date created successfully (This change applies to all campuses)');
        setShowForm(false);
        resetForm();
        await loadReportingDates(formData.year);
      }
    }
  };

  const handleEdit = (reportingDate: ReportingDate) => {
    setFormData({
      month: reportingDate.month,
      year: reportingDate.year,
      reporting_date: reportingDate.reporting_date
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reporting date? This will affect all campuses.')) return;

    const { error } = await supabase
      .from('reporting_dates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting reporting date:', error);
      alert('Error deleting reporting date');
    } else {
      alert('Reporting date deleted successfully (This change applies to all campuses)');
      await loadReportingDates(selectedYear);
    }
  };

  const resetForm = () => {
    setFormData({
      month: 1,
      year: selectedYear,
      reporting_date: ''
    });
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

  const isDateInPast = (dateString: string) => {
    if (!dateString) return false;
    const reportingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reportingDate < today;
  };

  const isMonthInPast = (month: number, year: number) => {
    if (year < currentDate.getFullYear()) return true;
    if (year > currentDate.getFullYear()) return false;
    return month < currentDate.getMonth() + 1;
  };

  const isMonthCurrent = (month: number, year: number) => {
    return year === currentDate.getFullYear() && month === currentDate.getMonth() + 1;
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
                <h1 className="text-xl md:text-2xl font-bold text-white">Reporting Dates</h1>
                <p className="text-purple-200 text-sm">{getCampusName(campus)} - Global Settings (All Campuses)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Year Selector */}
          <div className="mb-6 flex items-center gap-4">
            <label className="text-white font-semibold">Select Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Array.from({ length: 55 }, (_, i) => 2026 + i).map(year => (
                <option key={year} value={year} className="text-gray-900">{year}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-300 font-semibold"
            >
              Set Reporting Date
            </button>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                  Set Reporting Date
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    >
                      {MONTH_NAMES.map((name, index) => {
                        const monthNum = index + 1;
                        const isPast = isMonthInPast(monthNum, formData.year);
                        return (
                          <option 
                            key={index} 
                            value={monthNum} 
                            disabled={isPast}
                            className={isPast ? 'text-gray-400' : 'text-gray-900'}
                          >
                            {name} {isPast ? '(Past - Inactive)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    >
                      {Array.from({ length: 55 }, (_, i) => 2026 + i).map(year => {
                        const isPast = year < currentDate.getFullYear();
                        return (
                          <option 
                            key={year} 
                            value={year} 
                            disabled={isPast}
                            className={isPast ? 'text-gray-400' : 'text-gray-900'}
                          >
                            {year} {isPast ? '(Past - Inactive)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reporting Date</label>
                    <input
                      type="date"
                      value={formData.reporting_date}
                      onChange={(e) => setFormData({ ...formData, reporting_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    <p className="font-semibold">Note:</p>
                    <p>This setting is global. Changes will apply to all campuses (Main and West).</p>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors duration-300 font-semibold"
                    >
                      Save
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportingDates.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center col-span-full">
                <p className="text-purple-200">No reporting dates set for {selectedYear}. Click "Set Reporting Date" to add one.</p>
              </div>
            ) : (
              reportingDates.map((reportingDate) => {
                const isInactive = isDateInPast(reportingDate.reporting_date);
                const isPastMonth = isMonthInPast(reportingDate.month, reportingDate.year);
                return (
                  <div key={reportingDate.id} className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border ${isInactive || isPastMonth ? 'border-gray-500 opacity-60' : 'border-white/20'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className={`text-xl font-bold ${isInactive || isPastMonth ? 'text-gray-400' : 'text-white'}`}>
                          {MONTH_NAMES[reportingDate.month - 1]}
                        </h3>
                        <p className={`text-sm ${isInactive || isPastMonth ? 'text-gray-500' : 'text-purple-200'}`}>{reportingDate.year}</p>
                        {isInactive && (
                          <p className="text-red-400 text-xs mt-1">Inactive - Date passed</p>
                        )}
                        {isPastMonth && !isInactive && (
                          <p className="text-red-400 text-xs mt-1">Inactive - Month passed</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(reportingDate)}
                          disabled={isInactive || isPastMonth}
                          className={`p-2 rounded-lg transition-colors duration-300 ${isInactive || isPastMonth ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(reportingDate.id)}
                          disabled={isInactive || isPastMonth}
                          className={`p-2 rounded-lg transition-colors duration-300 ${isInactive || isPastMonth ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-red-600 hover:bg-red-700'} text-white`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className={`bg-white/5 rounded-lg p-4 ${isInactive || isPastMonth ? 'bg-gray-800/30' : ''}`}>
                      <p className={`text-sm mb-1 ${isInactive || isPastMonth ? 'text-gray-500' : 'text-purple-300'}`}>Reporting Date</p>
                      <p className={`font-semibold text-lg ${isInactive || isPastMonth ? 'text-gray-400' : 'text-white'}`}>{formatDate(reportingDate.reporting_date)}</p>
                    </div>
                    <div className={`mt-4 text-xs ${isInactive || isPastMonth ? 'text-gray-500' : 'text-purple-300'}`}>
                      Last updated: {new Date(reportingDate.updated_at).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
