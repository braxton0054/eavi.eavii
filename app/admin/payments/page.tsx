'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import { Search, Loader2, CheckCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

const fmt = (n: number) => `KES ${(n || 0).toLocaleString()}`;
const genReceipt = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RCP-${d}-${Math.floor(Math.random() * 90000 + 10000)}`;
};

const PAYMENT_TYPES = [
  { value: 'tuition', label: 'Tuition' },
  { value: 'practical', label: 'Practical' },
  { value: 'exam', label: 'Exam' },
  { value: 'registration', label: 'Registration' },
  { value: 'library', label: 'Library' },
  { value: 'other', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa', needsRef: true },
  { value: 'bank_transfer', label: 'Bank Transfer', needsRef: true },
  { value: 'cash', label: 'Cash', needsRef: false },
  { value: 'card', label: 'Card', needsRef: true },
];

const feeLabel = (mode: string, modIdx: number, semIdx: number) =>
  mode === 'per_module' ? `Stage ${modIdx}` : `Module ${modIdx} · Semester ${semIdx}`;

export default function PaymentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Student data
  const [student, setStudent] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [feeLines, setFeeLines] = useState<any[]>([]);
  const [selectedFee, setSelectedFee] = useState<any>(null);

  // Payment form
  const [form, setForm] = useState({
    payment_type: 'tuition',
    amount: 0,
    payment_method: 'mpesa',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    receipt_number: genReceipt(),
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    client.auth.getSession().then(({ data }: any) => {
      const s = data.session;
      if (!s || s.user?.user_metadata?.role !== 'admin') {
        router.push('/login/admin');
        return;
      }
      setLoading(false);
    });
  }, [router]);

  // Search
  useEffect(() => {
    if (query.length < 2 || !supabase) { setResults([]); setShowResults(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('applications')
        .select('id, full_name, admission_number, campus, courses!inner(name)')
        .eq('status', 'enrolled')
        .or(`full_name.ilike.%${query}%,admission_number.ilike.%${query}%`)
        .limit(8);
      setResults(data || []);
      setShowResults((data?.length || 0) > 0);
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, supabase]);

  const selectStudent = async (s: any) => {
    setShowResults(false);
    setQuery(s.full_name);
    setStudent(s);
    setStudentProfile(null);
    setFeeLines([]);
    setSelectedFee(null);
    setSuccess(false);
    setHistory([]);
    setForm(f => ({ ...f, receipt_number: genReceipt() }));

    // Profile
    const { data: profile } = await supabase!
      .from('applications')
      .select('id, full_name, admission_number, campus, total_balance, credit_balance, financial_hold, transcript_unlocked')
      .eq('id', s.id)
      .single();
    setStudentProfile(profile);

    // Fee summary from backend view — handles ALL calculations
    const { data: fees } = await supabase!
      .from('v_student_fee_summary')
      .select('*')
      .eq('application_id', s.id);
    setFeeLines(fees || []);

    // Payment history
    const { data: hist } = await supabase!
      .from('v_student_payment_history')
      .select('*')
      .eq('application_id', s.id)
      .limit(10);
    setHistory(hist || []);
  };

  const selectFeeLine = (fee: any) => {
    if (fee.balance <= 0) return;
    setSelectedFee(fee);
    setForm(f => ({
      ...f,
      amount: fee.balance,
      receipt_number: genReceipt(),
    }));
    setErrors({});
    setSuccess(false);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!selectedFee) e._ = 'Select a fee line';
    if (!form.amount || form.amount <= 0) e.amount = 'Enter valid amount';
    const method = PAYMENT_METHODS.find(m => m.value === form.payment_method);
    if (method?.needsRef && !form.transaction_id.trim()) e.transaction_id = 'Transaction ref required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !student || !selectedFee || !supabase) return;
    setSubmitting(true);

    const isPerModule = selectedFee.payment_mode === 'per_module';
    const insertSemesterId = isPerModule ? null : selectedFee.semester_id || null;
    const insertModuleId = isPerModule ? selectedFee.module_id : selectedFee.module_id || null;

    const { error } = await supabase.from('fee_payments').insert({
      application_id: student.id,
      payment_type: form.payment_type,
      amount: Number(form.amount),
      payment_method: form.payment_method,
      transaction_id: form.transaction_id || null,
      payment_date: form.payment_date,
      status: 'completed',
      receipt_number: form.receipt_number,
      notes: form.notes || null,
      semester_id: insertSemesterId,
      module_id: insertModuleId,
    });

    if (error) {
      alert('Error: ' + error.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    setForm(f => ({
      ...f,
      payment_type: 'tuition',
      amount: 0,
      transaction_id: '',
      receipt_number: genReceipt(),
      notes: '',
    }));

    // Refresh data
    const { data: fees } = await supabase.from('v_student_fee_summary').select('*').eq('application_id', student.id);
    setFeeLines(fees || []);
    const { data: hist } = await supabase.from('v_student_payment_history').select('*').eq('application_id', student.id).limit(10);
    setHistory(hist || []);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/admin/dashboard')} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>
          <h1 className="text-lg font-bold text-slate-900">Fee Payments</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── LEFT: Search + Fee Summary ─── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Search */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search student by name or admission number..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
            </div>
            {showResults && (
              <div className="mt-2 border border-slate-200 rounded-lg bg-white shadow-sm max-h-60 overflow-y-auto">
                {results.map((r: any) => (
                  <button
                    key={r.id}
                    onClick={() => selectStudent(r)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs">
                      {r.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{r.full_name}</p>
                      <p className="text-xs text-slate-400">{r.admission_number} · {r.courses?.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Student Info */}
          {studentProfile && (
            <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">{studentProfile.full_name}</h2>
                <p className="text-xs text-slate-500">{studentProfile.admission_number} · {studentProfile.campus}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Balance</p>
                <p className={`text-lg font-bold ${(studentProfile.total_balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {fmt(studentProfile.total_balance ?? 0)}
                </p>
              </div>
            </div>
          )}

          {/* Fee Lines */}
          {student && feeLines.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-400">
              No fee lines found for this student.
            </div>
          )}
          {feeLines.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Fee Lines</p>
              <div className="space-y-1.5">
                {feeLines.map((fee: any, i: number) => {
                  const pct = fee.total_expected > 0 ? Math.min(Math.round((fee.total_paid / fee.total_expected) * 100), 100) : 0;
                  const cleared = pct >= 95;
                  const sel = selectedFee?.semester_id === fee.semester_id && selectedFee?.module_id === fee.module_id;
                  return (
                    <button
                      key={fee.semester_id || fee.module_id || i}
                      onClick={() => selectFeeLine(fee)}
                      disabled={fee.balance <= 0}
                      className={`w-full text-left p-3.5 rounded-lg border transition-all text-sm ${
                        sel
                          ? 'border-indigo-500 bg-indigo-50'
                          : cleared
                          ? 'border-emerald-200 bg-emerald-50'
                          : fee.balance <= 0
                          ? 'border-slate-200 bg-slate-50 opacity-60'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-800">
                          {feeLabel(fee.payment_mode, fee.module_index, fee.semester_index || 0)}
                        </span>
                        <span className={`font-bold text-sm ${fee.balance > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {fee.balance > 0 ? fmt(fee.balance) : 'Cleared'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Expected: {fmt(fee.total_expected)} · Paid: {fmt(fee.total_paid)}
                      </p>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div className={`h-full rounded-full ${cleared ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment History */}
          {history.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Payments</p>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr className="text-slate-500">
                      <th className="text-left py-2.5 px-3 font-medium">Receipt</th>
                      <th className="text-left py-2.5 px-3 font-medium">Date</th>
                      <th className="text-left py-2.5 px-3 font-medium">Type</th>
                      <th className="text-right py-2.5 px-3 font-medium">Amount</th>
                      <th className="text-left py-2.5 px-3 font-medium">Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((p: any) => (
                      <tr key={p.id} className="border-t border-slate-100 text-slate-700">
                        <td className="py-2.5 px-3 font-mono">{p.receipt_number}</td>
                        <td className="py-2.5 px-3">{new Date(p.payment_date).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 capitalize">{p.payment_type}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">{fmt(p.amount)}</td>
                        <td className="py-2.5 px-3 capitalize">{p.payment_method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT: Payment Form ─── */}
        <div>
          <div className="bg-white rounded-lg border border-slate-200 p-4 sticky top-6">
            <h2 className="font-bold text-slate-900 mb-4">Record Payment</h2>

            {!student && (
              <p className="text-xs text-slate-400">Search and select a student first.</p>
            )}

            {success && (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-semibold text-emerald-600 text-sm mb-1">Payment Recorded</p>
                <p className="text-xs text-slate-400">Receipt: {form.receipt_number}</p>
              </div>
            )}

            {student && !success && (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Selected fee line */}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Fee Line</label>
                  <select
                    value={selectedFee?.semester_id || ''}
                    onChange={e => {
                      const fee = feeLines.find((f: any) => f.semester_id === e.target.value || f.module_id === e.target.value);
                      if (fee) selectFeeLine(fee);
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select fee line...</option>
                    {feeLines.map((fee: any, i: number) => (
                      <option key={fee.semester_id || `mod-${i}`} value={fee.semester_id || fee.module_id}
                        disabled={fee.balance <= 0}>
                        {feeLabel(fee.payment_mode, fee.module_index, fee.semester_index || 0)}
                        {fee.balance > 0 ? ` — ${fmt(fee.balance)} due` : ' — Cleared'}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedFee && (
                  <>
                    {/* Type + Amount */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                        <select value={form.payment_type}
                          onChange={e => setForm(f => ({ ...f, payment_type: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                          {PAYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Amount (KES)</label>
                        <input type="number" value={form.amount}
                          onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.amount ? 'border-red-400' : 'border-slate-200'}`} />
                        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                      </div>
                    </div>

                    {/* Method */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Method</label>
                      <select value={form.payment_method}
                        onChange={e => setForm(f => ({ ...f, payment_method: e.target.value, transaction_id: '' }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                        {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                    </div>

                    {/* Transaction ref */}
                    {PAYMENT_METHODS.find(m => m.value === form.payment_method)?.needsRef && (
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">
                          {form.payment_method === 'mpesa' ? 'M-Pesa Code' : 'Reference'}
                        </label>
                        <input type="text" value={form.transaction_id}
                          onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))}
                          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.transaction_id ? 'border-red-400' : 'border-slate-200'}`}
                          placeholder={form.payment_method === 'mpesa' ? 'e.g. QJ98ABC0P1' : 'e.g. Bank ref'} />
                        {errors.transaction_id && <p className="text-xs text-red-500 mt-1">{errors.transaction_id}</p>}
                      </div>
                    )}

                    {/* Date */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Date</label>
                      <input type="date" value={form.payment_date}
                        onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Notes (optional)</label>
                      <textarea value={form.notes} rows={2}
                        onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Optional notes..." />
                    </div>

                    {/* Preview */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-400 space-y-1">
                      <p>Receipt: <span className="font-mono text-slate-700">{form.receipt_number}</span></p>
                      <p>Status: <span className="text-emerald-600 font-medium">Completed</span></p>
                      <p className="italic">DB triggers handle clearance automatically.</p>
                    </div>

                    <button type="submit" disabled={submitting}
                      className="w-full py-2.5 rounded-lg font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:text-slate-500 transition-colors">
                      {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Recording...</span> : 'Record Payment'}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
