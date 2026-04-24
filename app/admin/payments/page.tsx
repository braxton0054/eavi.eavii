'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface FeePayment {
  id: string;
  application_id: string;
  payment_type: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  payment_date: string;
  semester: number;
  module: number;
  status: string;
  receipt_number: string;
  notes: string;
  application: {
    full_name: string;
    admission_number: string;
    course_id: string;
  };
}

interface Application {
  id: string;
  full_name: string;
  admission_number: string;
  course_id: string;
  current_semester: number;
  current_module: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    application_id: '',
    payment_type: 'tuition',
    amount: 0,
    payment_method: 'cash',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    semester: 1,
    module: 1,
    notes: ''
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
      await loadPayments(userCampus);
      await loadApplications(userCampus);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadPayments = async (campusFilter: string) => {
    let query = supabase
      .from('fee_payments')
      .select(`
        *,
        application:applications!inner (
          full_name,
          admission_number,
          course_id,
          campus
        )
      `)
      .order('payment_date', { ascending: false });

    if (campusFilter && campusFilter !== 'all') {
      query = query.eq('applications.campus', campusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading payments:', error);
    } else {
      setPayments(data || []);
    }
  };

  const loadApplications = async (campusFilter: string) => {
    const { data, error } = await supabase
      .from('applications')
      .select('id, full_name, admission_number, course_id, current_semester, current_module')
      .eq('campus', campusFilter)
      .eq('status', 'enrolled')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error loading applications:', error);
    } else {
      setApplications(data || []);
    }
  };

  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RCP${year}${month}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const receiptNumber = generateReceiptNumber();
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount.toString()),
      semester: parseInt(formData.semester.toString()),
      module: parseInt(formData.module.toString()),
      receipt_number: receiptNumber,
      status: 'completed'
    };

    const { error } = await supabase
      .from('fee_payments')
      .insert([submitData]);

    if (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment');
    } else {
      alert(`Payment recorded successfully. Receipt Number: ${receiptNumber}`);
      
      // Update financial hold status after payment
      const { updateFinancialHoldAfterPayment } = await import('@/lib/fee-calculation');
      await updateFinancialHoldAfterPayment(formData.application_id);
      
      setShowForm(false);
      setFormData({
        application_id: '',
        payment_type: 'tuition',
        amount: 0,
        payment_method: 'cash',
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        semester: 1,
        module: 1,
        notes: ''
      });
      await loadPayments(campus);
    }
  };

  const handleApplicationChange = (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (application) {
      setFormData({
        ...formData,
        application_id: applicationId,
        semester: application.current_semester,
        module: application.current_module
      });
    }
  };

  const getCampusName = (campus: string) => {
    return campus === 'main' ? 'Main Campus' : 'West Campus';
  };

  const filteredPayments = filterStatus === 'all' 
    ? payments 
    : payments.filter(p => p.status === filterStatus);

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
              <h1 className="text-xl md:text-2xl font-bold text-white">Fee Payments</h1>
            </div>
            <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 font-semibold"
            >
              Record Payment
            </button>
            <div className="flex items-center gap-2">
              <label className="text-white text-sm">Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Record Payment</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                      <select
                        value={formData.application_id}
                        onChange={(e) => handleApplicationChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Student</option>
                        {applications.map((app) => (
                          <option key={app.id} value={app.id}>
                            {app.full_name} - {app.admission_number}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                      <select
                        value={formData.payment_type}
                        onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="tuition">Tuition Fee</option>
                        <option value="practical">Practical Fee</option>
                        <option value="exam">Exam Fee</option>
                        <option value="registration">Registration Fee</option>
                        <option value="library">Library Fee</option>
                        <option value="lab">Lab Fee</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={formData.payment_method}
                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="card">Card</option>
                        <option value="mpesa">M-Pesa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                      <input
                        type="text"
                        value={formData.transaction_id}
                        onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="For bank transfer or M-Pesa"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                      <input
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                      <input
                        type="number"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        min="1"
                        max="6"
                        required
                      />
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        placeholder="Optional notes about this payment"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors duration-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 font-semibold"
                    >
                      Record Payment
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
                  <th className="text-left py-3 px-4">Receipt #</th>
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Method</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Sem/Mod</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-purple-200">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="text-white border-t border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 font-mono text-sm">{payment.receipt_number}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{payment.application?.full_name}</div>
                          <div className="text-purple-200 text-sm">{payment.application?.admission_number}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize">{payment.payment_type}</td>
                      <td className="py-3 px-4 font-bold">KES {payment.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 capitalize">{payment.payment_method}</td>
                      <td className="py-3 px-4">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">S{payment.semester} M{payment.module}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          payment.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
