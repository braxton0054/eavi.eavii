'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface PaymentHistory {
  receipt_number: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  payment_type: string;
  status: string;
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
  results_pending: string;
}

interface StudentBalance {
  total_balance: number;
  current_semester_fee: number;
  amount_paid_current: number;
  clearance_pct: number;
  amount_needed_for_95: number;
  is_cleared: boolean;
}

export default function StudentFeesPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState<any>(null);
  
  // Data from database views
  const [balance, setBalance] = useState<StudentBalance | null>(null);
  const [clearanceStatus, setClearanceStatus] = useState<ClearanceStatus[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  
  // Selected semester for detail view
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  useEffect(() => {
    const client = createClient();
    setSupabase(client);

    const checkAuth = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (!session) { 
        router.push('/login'); 
        return; 
      }
      
      const userRole = session.user?.user_metadata?.role;
      const admissionNumber = session.user?.user_metadata?.admission_number;
      
      if (userRole !== 'student' || !admissionNumber) { 
        router.push('/login'); 
        return; 
      }
      
      // Load all student data
      await loadStudentData(client, admissionNumber);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  const loadStudentData = async (client: any, admissionNumber: string) => {
    try {
      // Get student basic info
      const { data: student } = await client
        .from('applications')
        .select('id, full_name, admission_number, course_id, current_semester, current_module, campus, total_balance, courses(name)')
        .eq('admission_number', admissionNumber)
        .single();
      
      if (student) {
        setStudentData(student);
        
        // Get all payments for this student directly from fee_payments table
        const { data: payments, error: paymentsError } = await client
          .from('fee_payments')
          .select('id, amount, payment_method, transaction_id, receipt_number, payment_date, payment_type, status, semester_id, semesters(semester_index)')
          .eq('application_id', student.id)
          .eq('status', 'completed')
          .order('payment_date', { ascending: false });
        
        if (paymentsError) {
          console.error('Error loading payments:', paymentsError);
        }
        
        // Format payment history
        const formattedPayments: PaymentHistory[] = (payments || []).map((p: any) => ({
          receipt_number: p.receipt_number || `PAY-${p.id?.slice(-6) || '000000'}`,
          amount: p.amount || 0,
          payment_method: p.payment_method || 'cash',
          payment_date: p.payment_date || new Date().toISOString(),
          payment_type: p.payment_type || 'tuition',
          status: p.status || 'completed'
        }));
        setPaymentHistory(formattedPayments);
        
        // Calculate clearance status per semester
        const semestersMap = new Map<number, { amountPaid: number; semester: number }>();
        
        for (const payment of (payments || [])) {
          const sem = payment.semesters?.semester_index || 1;
          const existing = semestersMap.get(sem);
          if (existing) {
            existing.amountPaid += (payment.amount || 0);
          } else {
            semestersMap.set(sem, { amountPaid: payment.amount || 0, semester: sem });
          }
        }
        
        // Build clearance status for all semesters (1-6)
        const clearanceData: ClearanceStatus[] = [];
        const currentSemester = student.current_semester || 1;
        
        for (let sem = 1; sem <= 6; sem++) {
          const semPayments = semestersMap.get(sem);
          const amountPaid = semPayments?.amountPaid || 0;
          
          // Estimate semester fee (simplified - use total_balance + payments for current sem)
          const estimatedSemesterFee = sem === currentSemester 
            ? (student.total_balance || 0) + amountPaid
            : amountPaid; // For past semesters, assume they paid what they paid
          
          const balance = Math.max(0, estimatedSemesterFee - amountPaid);
          const paidPct = estimatedSemesterFee > 0 ? (amountPaid / estimatedSemesterFee) * 100 : 0;
          const isCleared = paidPct >= 95;
          
           clearanceData.push({
             admission_number: student.admission_number,
             full_name: student.full_name,
             current_semester: sem,
             module_index: student.current_module || 1,
             semester_fee: estimatedSemesterFee,
             amount_paid: amountPaid,
             balance: balance,
             paid_pct: paidPct,
             clearance_status: isCleared ? 'cleared' : 'pending',
             results_released: isCleared,
             results_pending: ''
           });
        }
        
        setClearanceStatus(clearanceData);
        
        // Calculate current balance info
        const currentSemData = clearanceData.find(c => c.current_semester === currentSemester) || clearanceData[0];
        const semesterFee = currentSemData?.semester_fee || 0;
        const amountPaid = currentSemData?.amount_paid || 0;
        const totalPaidAllSemesters = formattedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const requiredFor95 = semesterFee * 0.95;
        const amountNeeded = Math.max(0, requiredFor95 - amountPaid);
        const isCleared = amountNeeded <= 0;
        
        setBalance({
          total_balance: Math.max(0, (student.total_balance || 0)),
          current_semester_fee: semesterFee,
          amount_paid_current: amountPaid,
          clearance_pct: currentSemData?.paid_pct || 0,
          amount_needed_for_95: amountNeeded,
          is_cleared: isCleared
        });
        
        setSelectedSemester(currentSemester);
      }
    } catch (err) {
      console.error('Error loading student data:', err);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'mpesa': return '📱';
      case 'bank_transfer': return '🏦';
      case 'card': return '💳';
      case 'cash': return '💵';
      default: return '💰';
    }
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'tuition': return 'Tuition Fee';
      case 'practical': return 'Practical Fee';
      case 'exam': return 'Exam Fee';
      case 'extra': return 'Other Fee';
      default: return type;
    }
  };

  const selectedSemesterData = clearanceStatus.find(c => c.current_semester === selectedSemester);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading Your Fee Information...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/student/dashboard" className="text-purple-200 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <h1 className="text-xl md:text-2xl font-bold text-white">My Fees & Payments</h1>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{studentData?.full_name}</div>
                <div className="text-purple-300 text-sm font-mono">{studentData?.admission_number}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
          {/* Warning Banner if not cleared */}
          {balance && !balance.is_cleared && balance.amount_needed_for_95 > 0 && (
            <div className="mb-6 p-4 bg-orange-500/20 border border-orange-500/50 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="text-orange-300 font-semibold">Fee Clearance Required for Results</div>
                  <div className="text-orange-200 text-sm mt-1">
                    You need to pay <strong>KES {balance.amount_needed_for_95.toLocaleString()}</strong> more to reach 95% clearance. 
                    Your results will be released automatically once you reach this threshold.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner if cleared */}
          {balance?.is_cleared && (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
              <div className="flex items-start gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <div className="text-green-300 font-semibold">Fee Cleared!</div>
                  <div className="text-green-200 text-sm mt-1">
                    You have reached {balance.clearance_pct.toFixed(1)}% payment. Your results are cleared for release.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Balance Card */}
          {balance && (
            <div className="mb-8 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Current Semester Balance</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-purple-300 text-xs mb-1">Total Balance</div>
                    <div className="text-2xl font-bold text-white">KES {balance.total_balance.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-purple-300 text-xs mb-1">Semester Fee</div>
                    <div className="text-2xl font-bold text-white">KES {balance.current_semester_fee.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-purple-300 text-xs mb-1">Amount Paid</div>
                    <div className="text-2xl font-bold text-green-400">KES {balance.amount_paid_current.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="text-purple-300 text-xs mb-1">Clearance</div>
                    <div className={`text-2xl font-bold ${balance.is_cleared ? 'text-green-400' : 'text-orange-400'}`}>
                      {balance.clearance_pct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-purple-300 mb-2">
                    <span>Payment Progress</span>
                    <span>Target: 95%</span>
                  </div>
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        balance.clearance_pct >= 95 ? 'bg-green-500' : 
                        balance.clearance_pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(balance.clearance_pct, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    {balance.amount_needed_for_95 > 0 ? (
                      <span className="text-orange-300 text-sm">
                        You need <strong>KES {balance.amount_needed_for_95.toLocaleString()}</strong> more to reach 95%
                      </span>
                    ) : (
                      <span className="text-green-400 text-sm">
                        ✅ You have reached 95% clearance!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Semester Selection */}
          {clearanceStatus.length > 0 && (
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3">View by Semester</h3>
              <div className="flex flex-wrap gap-2">
                {clearanceStatus.map((sem) => (
                  <button
                    key={sem.current_semester}
                    onClick={() => setSelectedSemester(sem.current_semester)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSemester === sem.current_semester
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-purple-200 hover:bg-white/20'
                    }`}
                  >
                    Semester {sem.current_semester} 
                    <span className={`ml-2 text-xs ${sem.clearance_status === 'cleared' ? 'text-green-400' : 'text-orange-400'}`}>
                      ({sem.paid_pct?.toFixed(0)}%)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Semester Detail */}
          {selectedSemesterData && (
            <div className="mb-8 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
              <h3 className="text-white font-semibold mb-4">
                Semester {selectedSemesterData.current_semester} Details (Module {selectedSemesterData.module_index})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-purple-300 text-xs">Semester Fee</div>
                  <div className="text-lg font-medium text-white">
                    KES {selectedSemesterData.semester_fee?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-purple-300 text-xs">Amount Paid</div>
                  <div className="text-lg font-medium text-green-400">
                    KES {selectedSemesterData.amount_paid?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-purple-300 text-xs">Balance</div>
                  <div className="text-lg font-medium text-red-400">
                    KES {selectedSemesterData.balance?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-purple-300 text-xs">Results Status</div>
                  <div className={`text-lg font-medium ${
                    selectedSemesterData.results_released ? 'text-green-400' : 'text-orange-400'
                  }`}>
                    {selectedSemesterData.results_released ? 'Released' : selectedSemesterData.results_pending}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/20">
              <h3 className="text-lg font-semibold text-white">Payment History</h3>
              <p className="text-purple-300 text-sm mt-1">Your recorded payments and receipts</p>
            </div>
            <div className="overflow-x-auto">
              {paymentHistory.length === 0 ? (
                <div className="px-6 py-8 text-center text-purple-300">
                  <div className="text-4xl mb-2">📝</div>
                  <p>No payments recorded yet</p>
                  <p className="text-sm mt-1">Contact finance office if you have made payments</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Receipt #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-200 uppercase">Method</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-purple-200 uppercase">Amount</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-purple-200 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {paymentHistory.map((payment, index) => (
                      <tr key={index} className="hover:bg-white/5">
                        <td className="px-6 py-4 text-purple-200">
                          {new Date(payment.payment_date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="px-6 py-4 text-white font-mono text-sm">
                          {payment.receipt_number}
                        </td>
                        <td className="px-6 py-4 text-purple-200">
                          {getPaymentTypeLabel(payment.payment_type)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-1 text-purple-200">
                            <span>{getPaymentMethodIcon(payment.payment_method)}</span>
                            <span className="capitalize">{payment.payment_method}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-white font-semibold">
                          KES {payment.amount?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            payment.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : payment.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            {paymentHistory.length > 0 && (
              <div className="px-6 py-4 border-t border-white/20 bg-white/5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-purple-300">Total Payments:</span>
                  <span className="text-white font-semibold">
                    KES {paymentHistory.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
            <h4 className="text-white font-medium mb-2">Need Help?</h4>
            <p className="text-purple-300 text-sm">
              If you have questions about your fees, payments, or need a receipt, 
              please visit the Finance Office or contact your campus administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
