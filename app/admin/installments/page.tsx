'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import { createInstallmentPlan, checkOverdueInstallments } from '@/lib/fee-calculation';

export const dynamic = 'force-dynamic';

interface PaymentInstallment {
  id: string;
  application_id: string;
  installment_number: number;
  due_date: string;
  amount: number;
  status: string;
  paid_date: string;
  late_fee: number;
  application: {
    full_name: string;
    admission_number: string;
  };
}

interface Application {
  id: string;
  full_name: string;
  admission_number: string;
  course_id: string;
}

export default function InstallmentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    application_id: '',
    total_amount: 0,
    number_of_installments: 2,
    start_date: new Date().toISOString().split('T')[0]
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
      await loadInstallments(userCampus);
      await loadApplications(userCampus);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

  const loadInstallments = async (campusFilter: string) => {
    const { data, error } = await supabase
      .from('payment_installments')
      .select(`
        *,
        applications (
          full_name,
          admission_number
        )
      `)
      .eq('campus', campusFilter)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error loading installments:', error);
    } else {
      setInstallments(data || []);
    }
  };

  const loadApplications = async (campusFilter: string) => {
    const { data, error } = await supabase
      .from('applications')
      .select('id, full_name, admission_number, course_id')
      .eq('campus', campusFilter)
      .eq('status', 'enrolled')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error loading applications:', error);
    } else {
      setApplications(data || []);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createInstallmentPlan(
      formData.application_id,
      parseFloat(formData.total_amount.toString()),
      parseInt(formData.number_of_installments.toString()),
      formData.start_date
    );

    if (result.success) {
      alert(result.message);
      setShowForm(false);
      setFormData({
        application_id: '',
        total_amount: 0,
        number_of_installments: 2,
        start_date: new Date().toISOString().split('T')[0]
      });
      await loadInstallments(campus);
    } else {
      alert(result.message);
    }
  };

  const handleCheckOverdue = async () => {
    const result = await checkOverdueInstallments();
    alert(`Checked overdue installments. Updated ${result.updated} records.`);
    await loadInstallments(campus);
  };

  const handleMarkPaid = async (installmentId: string) => {
    const { error } = await supabase
      .from('payment_installments')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', installmentId);

    if (error) {
      console.error('Error marking as paid:', error);
      alert('Error marking as paid');
    } else {
      alert('Installment marked as paid');
      await loadInstallments(campus);
    }
  };

  const handleWaive = async (installmentId: string) => {
    const reason = prompt('Enter reason for waiver:');
    if (!reason) return;

    const { error } = await supabase
      .from('payment_installments')
      .update({
        status: 'waived',
        waiver_reason: reason
      })
      .eq('id', installmentId);

    if (error) {
      console.error('Error waiving installment:', error);
      alert('Error waiving installment');
    } else {
      alert('Installment waived');
      await loadInstallments(campus);
    }
  };

  const getCampusName = (campus: string) => {
    return campus === 'main' ? 'Main Campus' : 'West Campus';
  };

  const filteredInstallments = filterStatus === 'all' 
    ? installments 
    : installments.filter(i => i.status === filterStatus);

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
              <h1 className="text-xl md:text-2xl font-bold text-white">Payment Installments</h1>
            </div>
            <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-300 font-semibold"
              >
                Create Installment Plan
              </button>
              <button
                onClick={handleCheckOverdue}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors duration-300 font-semibold"
              >
                Check Overdue
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-white text-sm">Filter:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="waived">Waived</option>
              </select>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Installment Plan</h2>
                <form onSubmit={handleCreatePlan} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                    <select
                      value={formData.application_id}
                      onChange={(e) => setFormData({ ...formData, application_id: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount (KES)</label>
                    <input
                      type="number"
                      value={formData.total_amount}
                      onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of Installments</label>
                    <select
                      value={formData.number_of_installments}
                      onChange={(e) => setFormData({ ...formData, number_of_installments: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    >
                      <option value={1}>1 (Full Payment)</option>
                      <option value={2}>2 Installments</option>
                      <option value={3}>3 Installments</option>
                      <option value={4}>4 Installments</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
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
                      Create Plan
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
                  <th className="text-left py-3 px-4">Student</th>
                  <th className="text-left py-3 px-4">Installment</th>
                  <th className="text-left py-3 px-4">Due Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Late Fee</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstallments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-purple-200">
                      No installments found.
                    </td>
                  </tr>
                ) : (
                  filteredInstallments.map((installment) => {
                    const total = installment.amount + installment.late_fee;
                    return (
                      <tr key={installment.id} className="text-white border-t border-white/10 hover:bg-white/5">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{installment.application?.full_name}</div>
                            <div className="text-purple-200 text-sm">{installment.application?.admission_number}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">#{installment.installment_number}</td>
                        <td className="py-3 px-4">{new Date(installment.due_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">KES {installment.amount.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          {installment.late_fee > 0 ? (
                            <span className="text-red-300">KES {installment.late_fee.toLocaleString()}</span>
                          ) : (
                            <span className="text-purple-200">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-bold">KES {total.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            installment.status === 'paid' ? 'bg-green-500/20 text-green-300' :
                            installment.status === 'overdue' ? 'bg-red-500/20 text-red-300' :
                            installment.status === 'waived' ? 'bg-gray-500/20 text-gray-300' :
                            'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {installment.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            {installment.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleMarkPaid(installment.id)}
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                                >
                                  Mark Paid
                                </button>
                                <button
                                  onClick={() => handleWaive(installment.id)}
                                  className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                                >
                                  Waive
                                </button>
                              </>
                            )}
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
