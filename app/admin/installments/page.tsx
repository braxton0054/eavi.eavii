'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import { createInstallmentPlan, checkOverdueInstallments } from '@/lib/fee-calculation';
import MpesaPayButton from '@/components/payhero/MpesaPayButton';

export const dynamic = 'force-dynamic';

interface PaymentInstallment {
  id: string; application_id: string; installment_number: number; due_date: string;
  amount: number; status: string; paid_date: string; late_fee: number;
  application: { full_name: string; admission_number: string };
}
interface Application { id: string; full_name: string; admission_number: string; course_id: string; }

export default function InstallmentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({ application_id: '', total_amount: 0, number_of_installments: 2, start_date: new Date().toISOString().split('T')[0] });
  const [payheroConfigs, setPayheroConfigs] = useState<Record<string, { paybill_no: string; is_active: boolean }>>({});

  useEffect(() => { setSupabase(createClient()); }, []);

  useEffect(() => {
    if (!supabase) return;
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login/admin'); return; }
      if (session.user?.user_metadata?.role !== 'admin') { router.push('/login/admin'); return; }
      const uc = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(uc);
      await loadInstallments();
      await loadApplications(uc);
      setLoading(false);
    };
    checkAuth();
  }, [supabase, router]);

  /* load payhero config (single global config) */
  useEffect(() => {
    if (!supabase) return;
    supabase.from('payhero_config').select('paybill_no, is_active').single().then(({ data }: { data: any }) => {
      if (data) {
        setPayheroConfigs({ global: { paybill_no: data.paybill_no, is_active: data.is_active } });
      }
    });
  }, [supabase]);

  const loadInstallments = async () => {
    const { data, error } = await supabase.from('payment_installments').select('*, applications(full_name, admission_number)').order('due_date', { ascending: true });
    if (error) console.error(error); else setInstallments(data || []);
  };

  const loadApplications = async (cf: string) => {
    let q = supabase.from('applications').select('id, full_name, admission_number, course_id').eq('status', 'enrolled').order('full_name', { ascending: true });
    if (cf && cf !== 'all') {
      const variants = [cf, cf === 'main' ? 'Main Campus' : cf === 'west' ? 'West Campus' : cf, cf === 'Main Campus' ? 'main' : cf === 'West Campus' ? 'west' : cf];
      q = q.in('campus', variants);
    }
    const { data, error } = await q;
    if (error) console.error(error); else setApplications(data || []);
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await createInstallmentPlan(formData.application_id, parseFloat(formData.total_amount.toString()), parseInt(formData.number_of_installments.toString()), formData.start_date);
    alert(r.message);
    if (r.success) { setShowForm(false); setFormData({ application_id: '', total_amount: 0, number_of_installments: 2, start_date: new Date().toISOString().split('T')[0] }); await loadInstallments(); }
  };
  const handleCheckOverdue = async () => { const r = await checkOverdueInstallments(); alert(`Updated ${r.updated} records.`); await loadInstallments(); };
  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase.from('payment_installments').update({ status: 'paid', paid_date: new Date().toISOString().split('T')[0] }).eq('id', id);
    if (error) alert('Error'); else { alert('Marked as paid'); await loadInstallments(); }
  };
  const handleWaive = async (id: string) => {
    const reason = prompt('Enter reason:'); if (!reason) return;
    const { error } = await supabase.from('payment_installments').update({ status: 'waived', waiver_reason: reason }).eq('id', id);
    if (error) alert('Error'); else { alert('Waived'); await loadInstallments(); }
  };

  const filtered = filterStatus === 'all' ? installments : installments.filter(i => i.status === filterStatus);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#1a1a1a]">
      <header className="sticky top-0 z-40 bg-gray-50 border-b border-[#e5e5e2] h-14">
        <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/admin/dashboard')} className="text-sm text-[#666] hover:text-[#1a1a1a]">← Dashboard</button>
            <h1 className="font-bold text-sm tracking-tight">Payment Installments</h1>
          </div>
          <p className="text-xs text-gray-500">{campus === 'main' ? 'Main Campus' : campus === 'west' ? 'West Campus' : campus}</p>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button onClick={() => setShowForm(true)} className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors">Create Plan</button>
            <button onClick={handleCheckOverdue} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">Check Overdue</button>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]">
              <option value="all">All</option><option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="waived">Waived</option>
            </select>
          </div>
        </div>

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-gray-200 shadow-lg">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Create Installment Plan</h2>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Student</label>
                  <select value={formData.application_id} onChange={e => setFormData({ ...formData, application_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]" required>
                    <option value="">Select student…</option>
                    {applications.map(a => <option key={a.id} value={a.id}>{a.full_name} — {a.admission_number}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Total Amount (KES)</label>
                  <input type="number" value={formData.total_amount} onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]" min="0" step="0.01" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Installments</label>
                  <select value={formData.number_of_installments} onChange={e => setFormData({ ...formData, number_of_installments: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]" required>
                    <option value={1}>1 (Full)</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                  <input type="date" value={formData.start_date} onChange={e => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]" required />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold">Create Plan</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left py-3 px-4 font-medium">Student</th>
                <th className="text-left py-3 px-4 font-medium">#</th>
                <th className="text-left py-3 px-4 font-medium">Due Date</th>
                <th className="text-left py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Late Fee</th>
                <th className="text-left py-3 px-4 font-medium">Total</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No installments found.</td></tr>
              ) : filtered.map(inst => {
                const total = inst.amount + inst.late_fee;
                return (
                  <tr key={inst.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{inst.application?.full_name}</div>
                      <div className="text-xs text-gray-400">{inst.application?.admission_number}</div>
                    </td>
                    <td className="py-3 px-4">#{inst.installment_number}</td>
                    <td className="py-3 px-4">{new Date(inst.due_date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">KES {inst.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">{inst.late_fee > 0 ? <span className="text-red-600">KES {inst.late_fee.toLocaleString()}</span> : <span className="text-gray-300">-</span>}</td>
                    <td className="py-3 px-4 font-bold">KES {total.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inst.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        inst.status === 'overdue' ? 'bg-red-50 text-red-700 border border-red-200' :
                        inst.status === 'waived' ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>{inst.status}</span>
                    </td>
                    <td className="py-3 px-4">
                      {inst.status === 'pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => handleMarkPaid(inst.id)} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-colors">Mark Paid</button>
                          <button onClick={() => handleWaive(inst.id)} className="px-3 py-1 border border-gray-300 text-gray-600 hover:bg-gray-50 rounded text-xs font-medium transition-colors">Waive</button>
                          {payheroConfigs.global?.is_active && (
                            <MpesaPayButton
                              applicationId={inst.application_id}
                              installmentId={inst.id}
                              amount={total}
                              studentName={inst.application?.full_name || ''}
                              paybillNo={payheroConfigs.global.paybill_no}
                              onPaymentSuccess={() => loadInstallments()}
                            />
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
