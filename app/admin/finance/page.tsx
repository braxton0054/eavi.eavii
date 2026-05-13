'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface StudentInArrears {
  admission_number: string;
  full_name: string;
  course_name: string;
  campus: string;
  current_semester: number;
  total_balance: number;
  amount_paid: number;
  clearance_pct: number;
}

interface BlockedStudent {
  admission_number: string;
  full_name: string;
  course_name: string;
  current_semester: number;
  paid_pct: number;
  results_released: boolean;
  results_pending: string;
}

interface CampusSummary {
  campus: string;
  total_students: number;
  total_collected: number;
  total_outstanding: number;
}

interface DepartmentSummary {
  department: string;
  total_students: number;
  total_collected: number;
  total_outstanding: number;
}

interface ClearanceStatus {
  admission_number: string;
  full_name: string;
  current_semester: number;
  module_index: number;
  semester_fee: number;
  amount_paid: number;
  balance: number;
  paid_pct: number;
  clearance_status: string;
  results_released: boolean;
}

export default function FinanceDashboardPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  
  // Data from database views
  const [studentsInArrears, setStudentsInArrears] = useState<StudentInArrears[]>([]);
  const [blockedStudents, setBlockedStudents] = useState<BlockedStudent[]>([]);
  const [campusSummary, setCampusSummary] = useState<CampusSummary[]>([]);
  const [departmentSummary, setDepartmentSummary] = useState<DepartmentSummary[]>([]);
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceStatus[]>([]);
  
  // Search/filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'arrears' | 'blocked' | 'clearance' | 'summary'>('summary');

  useEffect(() => {
    const client = createClient();
    setSupabase(client);

    const checkAuth = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (!session) { router.push('/login/admin'); return; }
      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'admin' && userRole !== 'finance') { 
        router.push('/login/admin'); 
        return; 
      }
      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);
      
      await loadAllData(client, userCampus);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadAllData = async (client: any, campusFilter: string) => {
    await Promise.all([
      loadStudentsInArrears(client, campusFilter),
      loadBlockedStudents(client, campusFilter),
      loadCampusSummary(client),
      loadDepartmentSummary(client),
      loadClearanceStatus(client, campusFilter)
    ]);
  };

  const loadStudentsInArrears = async (client: any, campusFilter: string) => {
    try {
      // Query enrolled students with balance > 0
      let query = client
        .from('applications')
        .select('id, full_name, admission_number, course_id, campus, current_semester, total_balance, courses(name)')
        .eq('status', 'enrolled')
        .gt('total_balance', 0);
      
      if (campusFilter && campusFilter !== 'all') {
        const normalizedCampus = campusFilter.toLowerCase().includes('west') ? 'west' : 'main';
        query = query.eq('campus', normalizedCampus);
      }
      
      const { data: students, error } = await query.order('total_balance', { ascending: false });
      if (error) throw error;
      
      // Calculate paid amount and clearance % for each student
      const arrearsData: StudentInArrears[] = [];
      for (const student of (students || [])) {
        // Get total payments for this student
        const { data: payments } = await client
          .from('fee_payments')
          .select('amount')
          .eq('application_id', student.id)
          .eq('status', 'completed');
        
        const amountPaid = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const totalBalance = student.total_balance || 0;
        const clearancePct = totalBalance > 0 ? (amountPaid / (totalBalance + amountPaid)) * 100 : 100;
        
        arrearsData.push({
          admission_number: student.admission_number,
          full_name: student.full_name,
          course_name: student.courses?.name || student.course_id,
          campus: student.campus,
          current_semester: student.current_semester,
          total_balance: totalBalance,
          amount_paid: amountPaid,
          clearance_pct: clearancePct
        });
      }
      
      setStudentsInArrears(arrearsData);
    } catch (err) {
      console.error('Error loading students in arrears:', err);
    }
  };

  const loadBlockedStudents = async (client: any, campusFilter: string) => {
    try {
      // Query enrolled students and calculate who is below 95% clearance
      let query = client
        .from('applications')
        .select('id, full_name, admission_number, course_id, campus, current_semester, total_balance, courses(name)')
        .eq('status', 'enrolled');
      
      if (campusFilter && campusFilter !== 'all') {
        const normalizedCampus = campusFilter.toLowerCase().includes('west') ? 'west' : 'main';
        query = query.eq('campus', normalizedCampus);
      }
      
      const { data: students, error } = await query;
      if (error) throw error;
      
      // Calculate clearance for each and filter those below 95%
      const blockedData: BlockedStudent[] = [];
      for (const student of (students || [])) {
        // Get payments for current semester
        const { data: payments } = await client
          .from('fee_payments')
          .select('amount, semester')
          .eq('application_id', student.id)
          .eq('status', 'completed')
          .eq('semester', student.current_semester);
        
        const amountPaid = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        
        // Estimate semester fee from total_balance (rough calculation)
        const estimatedSemesterFee = (student.total_balance || 0) + amountPaid;
        const paidPct = estimatedSemesterFee > 0 ? (amountPaid / estimatedSemesterFee) * 100 : 0;
        
        // If below 95%, they are blocked
        if (paidPct < 95 && estimatedSemesterFee > 0) {
          blockedData.push({
            admission_number: student.admission_number,
            full_name: student.full_name,
            course_name: student.courses?.name || student.course_id,
            current_semester: student.current_semester,
            paid_pct: paidPct,
            results_released: false,
            results_pending: 'Fee clearance required'
          });
        }
      }
      
      // Sort by lowest paid percentage first
      blockedData.sort((a, b) => a.paid_pct - b.paid_pct);
      setBlockedStudents(blockedData);
    } catch (err) {
      console.error('Error loading blocked students:', err);
    }
  };

  const loadCampusSummary = async (client: any) => {
    try {
      // Get all enrolled students grouped by campus
      const { data: students, error: studentsError } = await client
        .from('applications')
        .select('campus, total_balance, id')
        .eq('status', 'enrolled');
      
      if (studentsError) throw studentsError;
      
      // Get all completed payments
      const { data: payments, error: paymentsError } = await client
        .from('fee_payments')
        .select('amount, application_id')
        .eq('status', 'completed');
      
      if (paymentsError) throw paymentsError;
      
      // Calculate summary per campus
      const summary: Record<string, CampusSummary> = {};
      
      for (const student of (students || [])) {
        const campus = student.campus?.toLowerCase().includes('west') ? 'west' : 'main';
        
        if (!summary[campus]) {
          summary[campus] = {
            campus,
            total_students: 0,
            total_collected: 0,
            total_outstanding: 0
          };
        }
        
        summary[campus].total_students++;
        summary[campus].total_outstanding += (student.total_balance || 0);
      }
      
      // Add collected amounts
      for (const payment of (payments || [])) {
        // Find student's campus from students array
        const student = (students || []).find((s: any) => s.id === payment.application_id);
        if (student) {
          const campus = student.campus?.toLowerCase().includes('west') ? 'west' : 'main';
          if (summary[campus]) {
            summary[campus].total_collected += (payment.amount || 0);
          }
        }
      }
      
      setCampusSummary(Object.values(summary));
    } catch (err) {
      console.error('Error loading campus summary:', err);
    }
  };

  const loadDepartmentSummary = async (client: any) => {
    try {
      // Get all enrolled students with course info
      const { data: students, error: studentsError } = await client
        .from('applications')
        .select('id, total_balance, course_id, courses(departments(name))')
        .eq('status', 'enrolled');
      
      if (studentsError) throw studentsError;
      
      // Get all completed payments with application_id
      const { data: payments, error: paymentsError } = await client
        .from('fee_payments')
        .select('amount, application_id')
        .eq('status', 'completed');
      
      if (paymentsError) throw paymentsError;
      
      // Calculate summary per department
      const summary: Record<string, DepartmentSummary> = {};
      
      for (const student of (students || [])) {
        const dept = student.courses?.departments?.name || 'General';
        
        if (!summary[dept]) {
          summary[dept] = {
            department: dept,
            total_students: 0,
            total_collected: 0,
            total_outstanding: 0
          };
        }
        
        summary[dept].total_students++;
        summary[dept].total_outstanding += (student.total_balance || 0);
      }
      
      // Add collected amounts
      for (const payment of (payments || [])) {
        const student = (students || []).find((s: any) => s.id === payment.application_id);
        if (student) {
          const dept = student.courses?.departments?.name || 'General';
          if (summary[dept]) {
            summary[dept].total_collected += (payment.amount || 0);
          }
        }
      }
      
      setDepartmentSummary(Object.values(summary));
    } catch (err) {
      console.error('Error loading department summary:', err);
    }
  };

  const loadClearanceStatus = async (client: any, campusFilter: string) => {
    try {
      // Query enrolled students
      let query = client
        .from('applications')
        .select('id, full_name, admission_number, current_semester, current_module, campus, total_balance, course_type_id, course_types(level)')
        .eq('status', 'enrolled');
      
      if (campusFilter && campusFilter !== 'all') {
        const normalizedCampus = campusFilter.toLowerCase().includes('west') ? 'west' : 'main';
        query = query.eq('campus', normalizedCampus);
      }
      
      const { data: students, error } = await query.limit(100);
      if (error) throw error;
      
      // Calculate clearance for each student
      const clearanceData: ClearanceStatus[] = [];
      for (const student of (students || [])) {
        // Get payments for current semester
        const { data: payments } = await client
          .from('fee_payments')
          .select('amount')
          .eq('application_id', student.id)
          .eq('semester', student.current_semester)
          .eq('status', 'completed');
        
        const amountPaid = (payments || []).reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        
        // Estimate semester fee (simplified - in real app would query fee_structure)
        const estimatedSemesterFee = (student.total_balance || 0) + amountPaid;
        const balance = Math.max(0, estimatedSemesterFee - amountPaid);
        const paidPct = estimatedSemesterFee > 0 ? (amountPaid / estimatedSemesterFee) * 100 : 0;
        const isCleared = paidPct >= 95;
        
        clearanceData.push({
          admission_number: student.admission_number,
          full_name: student.full_name,
          current_semester: student.current_semester,
          module_index: student.current_module,
          semester_fee: estimatedSemesterFee,
          amount_paid: amountPaid,
          balance: balance,
          paid_pct: paidPct,
          clearance_status: isCleared ? 'cleared' : 'pending',
          results_released: isCleared
        });
      }
      
      // Sort by paid percentage (ascending - lowest first)
      clearanceData.sort((a, b) => a.paid_pct - b.paid_pct);
      setClearanceStatus(clearanceData);
    } catch (err) {
      console.error('Error loading clearance status:', err);
    }
  };

  const getCampusName = (c: string) => {
    if (!c) return 'Unknown';
    return c.toLowerCase().includes('west') ? 'West Campus' : 'Main Campus';
  };

  const filteredArrears = studentsInArrears.filter(s => 
    !searchQuery || 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admission_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBlocked = blockedStudents.filter(s => 
    !searchQuery || 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admission_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.course_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClearance = clearanceStatus.filter(s => 
    !searchQuery || 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admission_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-white text-xl">Loading Finance Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="bg-gray-50/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Link href="/admin/dashboard" className="text-purple-200 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-xl md:text-2xl font-bold text-white">Finance Dashboard</h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-purple-200 text-sm">{getCampusName(campus)}</span>
                <Link 
                  href="/admin/payments" 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  + Record Payment
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-purple-200 text-sm mb-1">Students in Arrears</div>
              <div className="text-3xl font-bold text-white">{studentsInArrears.length}</div>
              <div className="text-red-400 text-xs mt-1">Outstanding balances</div>
            </div>
            <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-purple-200 text-sm mb-1">Results Blocked</div>
              <div className="text-3xl font-bold text-white">{blockedStudents.length}</div>
              <div className="text-orange-400 text-xs mt-1">Below 95% clearance</div>
            </div>
            <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-purple-200 text-sm mb-1">Total Outstanding</div>
              <div className="text-3xl font-bold text-white">
                KES {studentsInArrears.reduce((sum, s) => sum + (s.total_balance || 0), 0).toLocaleString()}
              </div>
              <div className="text-purple-300 text-xs mt-1">Across all semesters</div>
            </div>
            <div className="bg-gray-50/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-purple-200 text-sm mb-1">Campus</div>
              <div className="text-lg font-bold text-white">{getCampusName(campus)}</div>
              <div className="text-purple-300 text-xs mt-1">Current view</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { id: 'summary', label: 'Summary' },
              { id: 'arrears', label: `Students in Arrears (${studentsInArrears.length})` },
              { id: 'blocked', label: `Results Blocked (${blockedStudents.length})` },
              { id: 'clearance', label: 'Clearance Status' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-50/10 text-white hover:bg-gray-50/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, admission number, or course..."
              className="w-full md:w-96 px-4 py-3 bg-gray-50/10 border border-white/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Campus Summary */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/20">
                  <h3 className="text-lg font-semibold text-white">Campus Revenue Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Campus</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Total Students</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Total Collected</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {campusSummary.map((campus) => (
                        <tr key={campus.campus} className="hover:bg-gray-50/5">
                          <td className="px-6 py-4 text-white font-medium">{getCampusName(campus.campus)}</td>
                          <td className="px-6 py-4 text-right text-purple-200">{campus.total_students}</td>
                          <td className="px-6 py-4 text-right text-green-400">KES {campus.total_collected?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-red-400">KES {campus.total_outstanding?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Department Summary */}
              <div className="bg-gray-50/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
                <div className="px-6 py-4 border-b border-white/20">
                  <h3 className="text-lg font-semibold text-white">Department Revenue Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50/5">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Department</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Students</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Collected</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {departmentSummary.map((dept) => (
                        <tr key={dept.department} className="hover:bg-gray-50/5">
                          <td className="px-6 py-4 text-white font-medium">{dept.department}</td>
                          <td className="px-6 py-4 text-right text-purple-200">{dept.total_students}</td>
                          <td className="px-6 py-4 text-right text-green-400">KES {dept.total_collected?.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right text-red-400">KES {dept.total_outstanding?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Students in Arrears Tab */}
          {activeTab === 'arrears' && (
            <div className="bg-gray-50/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Students with Outstanding Balances</h3>
                <p className="text-purple-200 text-sm mt-1">Students who owe fees across all semesters</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Course</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Semester</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Total Balance</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Amount Paid</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Clearance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredArrears.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-purple-300">
                          No students in arrears found
                        </td>
                      </tr>
                    ) : (
                      filteredArrears.map((student) => (
                        <tr key={student.admission_number} className="hover:bg-gray-50/5">
                          <td className="px-6 py-4">
                            <div className="text-white font-medium">{student.full_name}</div>
                            <div className="text-sm text-purple-400 font-mono">{student.admission_number}</div>
                            <div className="text-xs text-purple-300">{getCampusName(student.campus)}</div>
                          </td>
                          <td className="px-6 py-4 text-purple-200">{student.course_name}</td>
                          <td className="px-6 py-4 text-center text-purple-200">{student.current_semester}</td>
                          <td className="px-6 py-4 text-right text-red-400 font-semibold">
                            KES {student.total_balance?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-green-400">
                            KES {student.amount_paid?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              student.clearance_pct >= 95 ? 'bg-green-500/20 text-green-400' :
                              student.clearance_pct >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {student.clearance_pct?.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results Blocked Tab */}
          {activeTab === 'blocked' && (
            <div className="bg-gray-50/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Students Blocked from Results</h3>
                <p className="text-orange-300 text-sm mt-1">
                  These students have NOT reached 95% fee clearance. Results are being held.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Course</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Semester</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Paid %</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Results Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredBlocked.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-green-400">
                          ✅ All students have reached 95% clearance. No results are being held.
                        </td>
                      </tr>
                    ) : (
                      filteredBlocked.map((student) => (
                        <tr key={student.admission_number} className="hover:bg-gray-50/5">
                          <td className="px-6 py-4">
                            <div className="text-white font-medium">{student.full_name}</div>
                            <div className="text-sm text-purple-400 font-mono">{student.admission_number}</div>
                          </td>
                          <td className="px-6 py-4 text-purple-200">{student.course_name}</td>
                          <td className="px-6 py-4 text-center text-purple-200">{student.current_semester}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                              {student.paid_pct?.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400">
                              {student.results_pending}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link 
                              href={`/admin/payments`}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors"
                            >
                              Record Payment
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clearance Status Tab */}
          {activeTab === 'clearance' && (
            <div className="bg-gray-50/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/20">
                <h3 className="text-lg font-semibold text-white">Fee Clearance Status</h3>
                <p className="text-purple-200 text-sm mt-1">
                  Per-semester clearance status for all students. Students need ≥95% to release results.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Student</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Semester</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Semester Fee</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Amount Paid</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Balance</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Paid %</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredClearance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-purple-300">
                          No clearance data found
                        </td>
                      </tr>
                    ) : (
                      filteredClearance.map((student) => (
                        <tr key={`${student.admission_number}-${student.current_semester}`} className="hover:bg-gray-50/5">
                          <td className="px-6 py-4">
                            <div className="text-white font-medium">{student.full_name}</div>
                            <div className="text-sm text-purple-400 font-mono">{student.admission_number}</div>
                          </td>
                          <td className="px-6 py-4 text-center text-purple-200">{student.current_semester}</td>
                          <td className="px-6 py-4 text-right text-purple-200">
                            KES {student.semester_fee?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-green-400">
                            KES {student.amount_paid?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right text-red-400">
                            KES {student.balance?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              student.paid_pct >= 95 ? 'bg-green-500/20 text-green-400' :
                              student.paid_pct >= 70 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {student.paid_pct?.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              student.clearance_status === 'cleared' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-orange-500/20 text-orange-400'
                            }`}>
                              {student.clearance_status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
