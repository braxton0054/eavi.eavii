'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import { checkAndMergeBridgeStudents, getTimeToSync, getActiveBridgeGroups, applyHolidayBypass, getHolidayPeriods } from '@/lib/bridge-merge';

export const dynamic = 'force-dynamic';

export default function BridgeManagement() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [bridgeGroups, setBridgeGroups] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showHolidays, setShowHolidays] = useState(false);
  const [error, setError] = useState('');

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
      await loadBridgeGroups(userCampus);
      await loadHolidays(userCampus);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadBridgeGroups = async (campusFilter: string) => {
    const groups = await getActiveBridgeGroups(campusFilter);
    setBridgeGroups(groups);
  };

  const loadHolidays = async (campusFilter: string) => {
    const holidayData = await getHolidayPeriods(campusFilter);
    setHolidays(holidayData);
  };

  const handleMerge = async (bridgeGroupId: string) => {
    if (!confirm('Are you sure you want to merge these bridge students into the main intake?')) return;

    const result = await checkAndMergeBridgeStudents(bridgeGroupId);
    
    if (result.success) {
      alert(result.message);
      await loadBridgeGroups(campus);
    } else {
      alert(result.message);
    }
  };

  const handleHolidayBypass = async (bridgeGroupId: string) => {
    const result = await applyHolidayBypass(bridgeGroupId);
    alert(result.message);
    await loadBridgeGroups(campus);
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
              <h1 className="text-xl md:text-2xl font-bold text-white">Bridge Stream Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHolidays(!showHolidays)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-300 font-semibold"
              >
                {showHolidays ? 'Hide Holidays' : 'View Holidays'}
              </button>
              <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {showHolidays && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-6">
              <h2 className="text-xl font-bold text-white mb-4">Holiday Periods</h2>
              {holidays.length === 0 ? (
                <p className="text-purple-200 text-sm">No holiday periods configured.</p>
              ) : (
                <div className="space-y-2">
                  {holidays.map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div>
                        <p className="text-white font-medium">{holiday.name}</p>
                        <p className="text-purple-200 text-sm">
                          {new Date(holiday.start_date).toLocaleDateString()} - {new Date(holiday.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        holiday.is_instructional_for_bridge 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {holiday.is_instructional_for_bridge ? 'Bridge Classes' : 'Holiday'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {bridgeGroups.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 text-center">
              <p className="text-white text-lg">No active bridge groups found.</p>
              <p className="text-purple-200 text-sm mt-2">Bridge groups are automatically created when students enroll after the intake trigger day.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {bridgeGroups.map((group) => {
                const timeToSync = getTimeToSync(group.sync_target_date);
                const studentCount = group.applications?.length || 0;
                
                return (
                  <div key={group.id} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-white">{group.group_name}</h2>
                        <p className="text-purple-200 text-sm">{group.intake}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          timeToSync.isOverdue 
                            ? 'bg-red-500/20 text-red-300' 
                            : 'bg-green-500/20 text-green-300'
                        }`}>
                          {timeToSync.isOverdue ? 'Overdue' : 'Active'}
                        </div>
                        <button
                          onClick={() => handleHolidayBypass(group.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 font-semibold"
                        >
                          Apply Holiday Bypass
                        </button>
                        <button
                          onClick={() => handleMerge(group.id)}
                          disabled={timeToSync.days > 0}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-300 font-semibold"
                        >
                          Merge to Main Intake
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-purple-300 text-sm">Students</p>
                        <p className="text-white text-2xl font-bold">{studentCount}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-purple-300 text-sm">Acceleration</p>
                        <p className="text-white text-2xl font-bold">{group.acceleration_factor}x</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-purple-300 text-sm">Time to Sync</p>
                        <p className="text-white text-2xl font-bold">
                          {timeToSync.isOverdue 
                            ? `${Math.abs(timeToSync.days)}d overdue` 
                            : `${timeToSync.days}d ${timeToSync.hours}h`}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-purple-300 text-sm">Catch-Up Hours</p>
                        <p className="text-white text-2xl font-bold">{group.catch_up_hours_needed || 0}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <p className="text-purple-300 text-sm">Milestone</p>
                        <p className="text-white text-2xl font-bold">
                          M{group.milestone_module} S{group.milestone_semester}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-medium">Holiday Bypass Status</h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          group.holiday_bypass_enabled 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {group.holiday_bypass_enabled ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <p className="text-purple-200 text-sm">
                        {group.holiday_bypass_enabled 
                          ? 'Bridge students will attend classes during holiday periods to catch up.' 
                          : 'Holiday bypass is disabled. Bridge students will not attend classes during holidays.'}
                      </p>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3">Students in Bridge Stream</h3>
                      {studentCount === 0 ? (
                        <p className="text-purple-200 text-sm">No students yet</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-purple-300">
                                <th className="text-left py-2">Name</th>
                                <th className="text-left py-2">Admission No.</th>
                                <th className="text-left py-2">Current Module</th>
                                <th className="text-left py-2">Current Semester</th>
                                <th className="text-left py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.applications.map((student: any) => {
                                const isReady = 
                                  student.current_module >= group.milestone_module &&
                                  student.current_semester >= group.milestone_semester;
                                
                                return (
                                  <tr key={student.id} className="text-white border-t border-white/10">
                                    <td className="py-2">{student.full_name}</td>
                                    <td className="py-2">{student.admission_number}</td>
                                    <td className="py-2">{student.current_module}</td>
                                    <td className="py-2">{student.current_semester}</td>
                                    <td className="py-2">
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        isReady 
                                          ? 'bg-green-500/20 text-green-300' 
                                          : 'bg-yellow-500/20 text-yellow-300'
                                      }`}>
                                        {isReady ? 'Ready to Merge' : 'In Progress'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
