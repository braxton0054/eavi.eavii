'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import PaymentReceipt from '@/components/PaymentReceipt';

export const dynamic = 'force-dynamic';

interface FeePayment {
  id: string;
  payment_type: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  semester: number;
  module: number;
  status: string;
  receipt_number: string;
}

interface FeeStructure {
  tuition_fee: number;
  practical_fee: number;
  exam_fee: number;
  registration_fee: number;
  library_fee: number;
  lab_fee: number;
}

interface PaymentInstallment {
  id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_date: string;
  late_fee: number;
}

export default function StudentPaymentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [currentFees, setCurrentFees] = useState<FeeStructure | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login/student');
        return;
      }

      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'student') {
        router.push('/login/student');
        return;
      }

      await loadStudentData();
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadStudentData = async () => {
    // Get student info
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: studentData } = await supabase
      .from('applications')
      .select('*')
      .eq('email', user.email)
      .single();

    if (studentData) {
      setStudent(studentData);
      await loadPayments(studentData.id);
      await loadInstallments(studentData.id);
      await loadCurrentFees(studentData);
      
      // Calculate current balance
      const { calculateStudentBalance } = await import('@/lib/fee-calculation');
      const balanceResult = await calculateStudentBalance(studentData.id);
      setTotalDue(balanceResult.totalInvoiced);
      setTotalPaid(balanceResult.totalPaid);
    }
  };

  const loadPayments = async (applicationId: string) => {
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*')
      .eq('application_id', applicationId)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error loading payments:', error);
    } else {
      setPayments(data || []);
      const paid = data?.reduce((sum: number, p: FeePayment) => sum + p.amount, 0) || 0;
      setTotalPaid(paid);
    }
  };

  const loadInstallments = async (applicationId: string) => {
    const { data, error } = await supabase
      .from('payment_installments')
      .select('*')
      .eq('application_id', applicationId)
      .order('installment_number', { ascending: true });

    if (error) {
      console.error('Error loading installments:', error);
    } else {
      setInstallments(data || []);
    }
  };

  const loadCurrentFees = async (student: any) => {
    const { data, error } = await supabase
      .from('fee_structure')
      .select('*')
      .eq('course_type_id', student.course_type_id)
      .eq('exam_body', student.exam_body)
      .eq('semester', student.current_semester)
      .eq('module', student.current_module)
      .eq('campus', student.campus)
      .single();

    if (error) {
      console.error('Error loading fees:', error);
    } else if (data) {
      setCurrentFees(data);
      const total = data.tuition_fee + data.practical_fee + data.exam_fee + 
                  data.registration_fee + data.library_fee + data.lab_fee;
      setTotalDue(total);
    }
  };

  const handleViewReceipt = (payment: FeePayment) => {
    setSelectedPayment(payment);
    setShowReceipt(true);
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
                onClick={() => router.push('/student/dashboard')}
                className="text-purple-200 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-white">My Payments</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-purple-200 text-sm mb-2">Current Semester Fees</h3>
              <p className="text-white text-3xl font-bold">KES {totalDue.toLocaleString()}</p>
              <p className="text-purple-300 text-sm mt-1">Semester {student?.current_semester}, Module {student?.current_module}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <h3 className="text-purple-200 text-sm mb-2">Total Paid</h3>
              <p className="text-white text-3xl font-bold">KES {totalPaid.toLocaleString()}</p>
              <p className="text-purple-300 text-sm mt-1">{payments.length} payment(s)</p>
            </div>
            <div className={`bg-white/10 backdrop-blur-md rounded-xl p-6 border ${totalDue - totalPaid > 0 ? 'border-red-500/50' : 'border-green-500/50'}`}>
              <h3 className="text-purple-200 text-sm mb-2">Balance Due</h3>
              <p className={`text-3xl font-bold ${totalDue - totalPaid > 0 ? 'text-red-300' : 'text-green-300'}`}>
                KES {Math.max(0, totalDue - totalPaid).toLocaleString()}
              </p>
              <p className="text-purple-300 text-sm mt-1">
                {totalDue - totalPaid > 0 ? 'Payment pending' : 'Fully paid'}
              </p>
              {totalDue - totalPaid > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((totalPaid / totalDue) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-purple-200 text-xs mt-1">{Math.round((totalPaid / totalDue) * 100)}% paid</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Hold Warning */}
          {student?.financial_hold && (
            <div className="bg-red-500/20 backdrop-blur-md rounded-xl p-6 border border-red-500/50 mb-8">
              <div className="flex items-center gap-4">
                <div className="text-red-300">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-red-300 font-bold text-lg">Financial Hold Active</h3>
                  <p className="text-white text-sm">
                    Your transcript and exam results are locked due to outstanding balance of KES {student.total_balance?.toLocaleString() || (totalDue - totalPaid).toLocaleString()}.
                    Please clear your balance to access your academic records.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/student/payments')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold"
                >
                  Pay Now
                </button>
              </div>
            </div>
          )}

          {/* Fee Breakdown */}
          {currentFees && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Current Semester Fee Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">Tuition Fee</p>
                  <p className="text-white text-xl font-bold">KES {currentFees.tuition_fee.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">Practical Fee</p>
                  <p className="text-white text-xl font-bold">KES {currentFees.practical_fee.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">Exam Fee</p>
                  <p className="text-white text-xl font-bold">KES {currentFees.exam_fee.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">Registration Fee</p>
                  <p className="text-white text-xl font-bold">KES {currentFees.registration_fee.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">Library Fee</p>
                  <p className="text-white text-xl font-bold">KES {currentFees.library_fee.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-purple-200 text-sm">Lab Fee</p>
                  <p className="text-white text-xl font-bold">KES {currentFees.lab_fee.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Installments */}
          {installments.length > 0 && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 mb-8">
              <h2 className="text-xl font-bold text-white mb-4">Payment Installments</h2>
              <div className="space-y-3">
                {installments.map((installment) => (
                  <div key={installment.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div>
                      <p className="text-white font-medium">Installment {installment.installment_number}</p>
                      <p className="text-purple-200 text-sm">Due: {new Date(installment.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">KES {installment.amount.toLocaleString()}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        installment.status === 'paid' ? 'bg-green-500/20 text-green-300' :
                        installment.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                        'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {installment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <p className="text-purple-200 text-center py-8">No payments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between bg-white/5 rounded-lg p-4">
                    <div>
                      <p className="text-white font-medium capitalize">{payment.payment_type}</p>
                      <p className="text-purple-200 text-sm">
                        {new Date(payment.payment_date).toLocaleDateString()} • {payment.receipt_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">KES {payment.amount.toLocaleString()}</p>
                      <button
                        onClick={() => handleViewReceipt(payment)}
                        className="text-purple-300 text-sm hover:text-white underline"
                      >
                        View Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && selectedPayment && student && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Payment Receipt</h2>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  setSelectedPayment(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <PaymentReceipt
              receiptNumber={selectedPayment.receipt_number}
              studentName={student.full_name}
              admissionNumber={student.admission_number}
              paymentDate={selectedPayment.payment_date}
              amount={selectedPayment.amount}
              paymentType={selectedPayment.payment_type}
              paymentMethod={selectedPayment.payment_method}
              semester={selectedPayment.semester}
              module={selectedPayment.module}
            />
          </div>
        </div>
      )}
    </div>
  );
}
