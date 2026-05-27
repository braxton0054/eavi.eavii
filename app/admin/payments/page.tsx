'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import MpesaPayButton from '@/components/payhero/MpesaPayButton';

export const dynamic = 'force-dynamic';

const fmt = (n: number) => `KES ${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const genReceipt = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RCP-${d}-${Math.floor(Math.random() * 90000 + 10000)}`;
};

export default function PaymentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [student, setStudent] = useState<any>(null);
  const [feeLines, setFeeLines] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [payheroCfg, setPayheroCfg] = useState<{ paybill_no: string; is_active: boolean } | null>(null);

  const [form, setForm] = useState({
    payment_type: 'tuition' as string,
    amount: 0,
    payment_method: 'cash' as string,
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    receipt_number: genReceipt(),
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /* auth */
  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    client.auth.getSession().then(({ data }: any) => {
      const s = data.session;
      if (!s || s.user?.user_metadata?.role !== 'admin') { router.push('/login/admin'); return; }
      setLoading(false);
    });
  }, [router]);

  /* search — enrolled only */
  useEffect(() => {
    if (query.length < 2 || !supabase) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('applications')
        .select('id, full_name, admission_number, campus, total_balance, financial_hold, status')
        .eq('status', 'enrolled')
        .or(`full_name.ilike.%${query}%,admission_number.ilike.%${query}%`)
        .order('full_name')
        .limit(10);
      setResults(data || []);
      setShowResults((data?.length || 0) > 0);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, supabase]);

  /* select student */
  const selectStudent = async (s: any) => {
    setShowResults(false);
    setQuery(s.full_name);
    setStudent(null); setFeeLines([]); setHistory([]); setSuccess(false);
    setForm(f => ({ ...f, receipt_number: genReceipt(), amount: 0 }));

    const { data: profile } = await supabase!
      .from('applications')
      .select('id, full_name, admission_number, campus, total_balance, credit_balance, financial_hold, status')
      .eq('id', s.id).single();
    if (!profile) return;
    setStudent(profile);

    /* payhero config — single global config */
    const { data: ph } = await supabase!.from('payhero_config').select('paybill_no, channel_id, is_active').single();
    setPayheroCfg(ph && ph.is_active && ph.channel_id > 0 ? { paybill_no: ph.paybill_no, is_active: ph.is_active } : null);

    const [{ data: fees }, { data: hist }] = await Promise.all([
      supabase!.from('v_student_fee_summary').select('*').eq('application_id', profile.id),
      supabase!.from('v_student_payment_history').select('*').eq('application_id', profile.id).order('payment_date', { ascending: false }).limit(20),
    ]);
    setFeeLines(fees || []);
    setHistory(hist || []);
  };

  /* submit manual payment */
  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;
    const errs: Record<string, string> = {};
    if (!form.amount || form.amount <= 0) errs.amount = 'Enter amount > 0';
    if (form.payment_method !== 'cash' && !form.transaction_id.trim()) errs.transaction_id = 'Reference required';
    setFormErrors(errs);
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    const { error } = await supabase.from('fee_payments').insert({
      application_id: student.id, payment_type: form.payment_type, amount: Number(form.amount),
      payment_method: form.payment_method, transaction_id: form.transaction_id || null,
      payment_date: form.payment_date, status: 'completed', receipt_number: form.receipt_number, notes: form.notes || null,
    });
    if (error) { alert('Error: ' + error.message); setSubmitting(false); return; }

    setSuccess(true); setSubmitting(false);
    setForm(f => ({ ...f, payment_type: 'tuition', amount: 0, transaction_id: '', receipt_number: genReceipt(), notes: '' }));
    const [{ data: fees }, { data: hist }, { data: prof }] = await Promise.all([
      supabase.from('v_student_fee_summary').select('*').eq('application_id', student.id),
      supabase.from('v_student_payment_history').select('*').eq('application_id', student.id).order('payment_date', { ascending: false }).limit(20),
      supabase.from('applications').select('id, full_name, admission_number, campus, total_balance, credit_balance, financial_hold, status').eq('id', student.id).single(),
    ]);
    setFeeLines(fees || []); setHistory(hist || []);
    if (prof) setStudent(prof);
  };

  /* pay hero success */
  const onPayHeroSuccess = async () => {
    setSuccess(true);
    if (!student || !supabase) return;
    const [{ data: fees }, { data: hist }, { data: prof }] = await Promise.all([
      supabase.from('v_student_fee_summary').select('*').eq('application_id', student.id),
      supabase.from('v_student_payment_history').select('*').eq('application_id', student.id).order('payment_date', { ascending: false }).limit(20),
      supabase.from('applications').select('id, full_name, admission_number, campus, total_balance, credit_balance, financial_hold, status').eq('id', student.id).single(),
    ]);
    setFeeLines(fees || []); setHistory(hist || []);
    if (prof) setStudent(prof);
  };

  /* ── render ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#666] font-medium">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#1a1a1a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-50 border-b border-[#e5e5e2] h-14">
        <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center gap-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">← Dashboard</button>
          <h1 className="font-bold text-sm tracking-tight">Fee Payments</h1>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ════ LEFT ════ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search enrolled student by name or admission number..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]" />
            </div>
            {showResults && (
              <div className="mt-2 border border-gray-200 rounded-lg bg-white shadow-sm max-h-60 overflow-y-auto">
                {results.map((r: any) => (
                  <button key={r.id} onClick={() => selectStudent(r)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs">
                      {r.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{r.full_name}</p>
                      <p className="text-xs text-gray-400">{r.admission_number} · {r.campus}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-semibold ${(r.total_balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(r.total_balance || 0)}</p>
                      {r.financial_hold && <p className="text-[10px] text-amber-600 mt-0.5">HOLD</p>}
                    </div>
                  </button>
                ))}
                {results.length === 0 && <p className="px-3 py-3 text-sm text-gray-400">No enrolled students found</p>}
              </div>
            )}
          </div>

          {/* Student Profile */}
          {student && (
            <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">{student.full_name}</h2>
                <p className="text-xs text-gray-500">{student.admission_number} · {student.campus}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Outstanding</p>
                <p className={`text-2xl font-bold ${(student.total_balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(student.total_balance || 0)}</p>
                {student.financial_hold && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Financial Hold</span>
                )}
              </div>
            </div>
          )}

          {/* Fee Lines */}
          {student && feeLines.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Fee Structure</p>
              <div className="space-y-2">
                {feeLines.map((fee: any, i: number) => {
                  const pct = fee.total_expected > 0 ? Math.min(Math.round((Number(fee.total_paid) / Number(fee.total_expected)) * 100), 100) : 0;
                  const cleared = Number(fee.balance) <= 0;
                  return (
                    <div key={fee.semester_id || fee.module_id || i} className={`bg-white rounded-lg border p-4 ${cleared ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-800 text-sm">
                          {fee.payment_mode === 'per_module' ? `Stage ${fee.module_index}` : `Module ${fee.module_index} · Sem ${fee.semester_index}`}
                          {fee.module_label && <span className="text-gray-400 font-normal ml-2">({fee.module_label})</span>}
                        </span>
                        <span className={`font-bold text-sm ${cleared ? 'text-emerald-600' : 'text-red-600'}`}>
                          {cleared ? 'Cleared' : fmt(Number(fee.balance))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span>Expected: {fmt(Number(fee.total_expected))} · Paid: {fmt(Number(fee.total_paid))}</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                        <div className={`h-full rounded-full ${cleared ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {student && feeLines.length === 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm">No fee structure found for this student's course.</p>
              <p className="text-gray-300 text-xs mt-1">Fees may not be configured in course setup yet.</p>
            </div>
          )}

          {/* Payment History */}
          {history.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payment History</p>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                      <th className="text-left py-2.5 px-3 font-medium">Receipt</th>
                      <th className="text-left py-2.5 px-3 font-medium">Date</th>
                      <th className="text-left py-2.5 px-3 font-medium">Type</th>
                      <th className="text-left py-2.5 px-3 font-medium">Method</th>
                      <th className="text-right py-2.5 px-3 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p: any) => (
                      <tr key={p.id} className="border-t border-gray-100 text-gray-700">
                        <td className="py-2.5 px-3 font-mono text-xs">{p.receipt_number}</td>
                        <td className="py-2.5 px-3">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</td>
                        <td className="py-2.5 px-3 capitalize">{p.payment_type}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.payment_method === 'mpesa' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            p.payment_method === 'bank_transfer' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            p.payment_method === 'cash' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}>{p.payment_method}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">{fmt(Number(p.amount))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ════ RIGHT — Payment Form ════ */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20 space-y-4">
            <h2 className="font-bold text-gray-900">Record Payment</h2>

            {!student && <p className="text-xs text-gray-400">Search and select an enrolled student first.</p>}

            {success && (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="font-semibold text-emerald-600 text-sm mb-1">Payment Recorded</p>
                <p className="text-xs text-gray-400">Data refreshed from server</p>
              </div>
            )}

            {student && !success && (
              <form onSubmit={submitManual} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Payment Type</label>
                  <select value={form.payment_type} onChange={e => setForm(f => ({ ...f, payment_type: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] bg-white">
                    {['tuition','practical','exam','registration','library','other'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount (KES)</label>
                  <input type="number" value={form.amount || ''} onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] ${formErrors.amount ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="0" />
                  {formErrors.amount && <p className="text-xs text-red-500 mt-1">{formErrors.amount}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Method</label>
                  <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value, transaction_id: '' }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] bg-white">
                    {[{v:'cash',l:'Cash'},{v:'bank_transfer',l:'Bank Transfer'},{v:'card',l:'Card'}].map(m => (
                      <option key={m.v} value={m.v}>{m.l}</option>
                    ))}
                  </select>
                </div>

                {form.payment_method !== 'cash' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Reference</label>
                    <input type="text" value={form.transaction_id} onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))}
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] ${formErrors.transaction_id ? 'border-red-400' : 'border-gray-300'}`}
                      placeholder="Transaction reference" />
                    {formErrors.transaction_id && <p className="text-xs text-red-500 mt-1">{formErrors.transaction_id}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a]" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] resize-none"
                    placeholder="Optional..." />
                </div>

                <button type="submit" disabled={submitting}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 transition-colors">
                  {submitting ? 'Recording…' : 'Record Payment'}
                </button>

                {/* Pay Hero separator + button */}
                {payheroCfg && (
                  <>
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                      <div className="relative flex justify-center"><span className="px-3 text-xs text-gray-400 bg-white">or pay via M-Pesa</span></div>
                    </div>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-center">
                      <p className="text-[10px] text-gray-400 mb-1">Paybill Number</p>
                      <p className="text-xl font-bold text-gray-900 font-mono mb-3">{payheroCfg.paybill_no}</p>
                      <MpesaPayButton
                        applicationId={student.id}
                        amount={Number(student.total_balance) || 0}
                        studentName={student.full_name}
                        paybillNo={payheroCfg.paybill_no}
                        onPaymentSuccess={onPayHeroSuccess}
                      />
                    </div>
                  </>
                )}

                {!payheroCfg && (
                  <p className="text-[10px] text-gray-400 text-center">M-Pesa not configured. Set up channel_id and paybill in admin settings.</p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
