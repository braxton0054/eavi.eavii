'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import {
  Search, ArrowLeft, User, CreditCard, Calendar, Receipt,
  Wallet, CheckCircle, AlertCircle, Building, GraduationCap,
  FileText, ChevronRight, Loader2, Shield, BookOpen,
  TrendingUp, Clock, Banknote, Smartphone, X, RefreshCw, Beaker,
  Plus, Lock, Unlock, DollarSign
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// ─── CONSTANTS matching exact DB values ──────────────────────────────────────
const PAYMENT_TYPES = [
  { id: 'tuition',      label: 'Tuition Fee',           icon: GraduationCap },
  { id: 'practical',    label: 'Practical Fee',          icon: Building },
  { id: 'exam',         label: 'Exam Fee',               icon: FileText },
  { id: 'registration', label: 'Registration Fee',       icon: Receipt },
  { id: 'library',      label: 'Library Fee',            icon: BookOpen },
  { id: 'lab',          label: 'Lab Fee',                 icon: Beaker },
  { id: 'other',        label: 'Other / Miscellaneous',   icon: AlertCircle },
];

// payment_method values in fee_payments table
const PAYMENT_METHODS = [
  { value: 'mpesa',         label: 'M-Pesa',        icon: Smartphone,  ref: true  },
  { value: 'bank_transfer', label: 'Bank Transfer',  icon: Banknote,    ref: true  },
  { value: 'card',          label: 'Card Payment',   icon: CreditCard,  ref: true  },
  { value: 'cash',          label: 'Cash',           icon: Wallet,      ref: false },
];

const STATUSES = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending',   label: 'Pending'   },
  { value: 'failed',    label: 'Failed'    },
];

// ─── TYPES matching exact DB / view columns ───────────────────────────────────

// v_student_profile columns
interface StudentProfile {
  application_id:   string;
  admission_number: string;
  full_name:        string;
  phone:            string;
  campus:           string;
  intake:           string;
  stream_type:      string;
  current_module:   number;
  current_semester: number;
  financial_hold:   boolean;
  total_balance:    number;
  credit_balance:   number;
  student_status:   string;
  sponsorship_type: string;
  sponsor_name:     string;
  last_payment_date: string | null;
  course_id:        string;
  course_type_id:   string;
  course_name:      string;
  course_exam_body: string;
  department_name:  string;
  course_level:     string;
  module_id:        string;
  module_index:     number;
  module_label:     string;
  payment_mode:     string;
  module_fee:       number;
  exam_fee:         number;
  has_attachment:   boolean;
  is_attachment_stage: boolean;
  semester_id:      string;
  semester_index:   number;
  semester_fee:     number;
  practical_fee:    number;
  total_expected:   number;
  total_paid:       number;
  transcript_unlocked: boolean;
  is_final_period:  boolean;
}

// v_student_fee_summary columns
interface FeeSummary {
  application_id:       string;
  admission_number:     string;
  module_id:            string;
  module_index:         number;
  module_label:         string;
  payment_mode:         string;
  exam_fee:             number;
  module_exam_body:     string;
  semester_id:          string;
  semester_index:       number;
  tuition_fee:          number;
  practical_fee:        number;
  additional_fees:      number;
  installment_amount:   number;
  installment_status:   string;
  total_paid:           number;
  balance:              number;
  due_date:             string | null;
  attempt_number:       number;
}

// v_student_payment_history columns
interface PaymentHistory {
  id:              string;
  application_id:  string;
  receipt_number:  string;
  payment_date:    string;
  amount:          number;
  payment_method:  string;
  payment_type:    string;
  payment_status:  string;
  transaction_id:  string | null;
  notes:           string | null;
  created_at:      string;
  module_index:    number;
  module_label:    string;
  payment_mode:    string;
  semester_number: number;
  semester_fee:    number;
}

// v_fee_clearance_status columns
interface ClearanceStatus {
  admission_number:  string;
  student_name:      string;
  campus:            string;
  course_name:       string;
  module_index:      number;
  semester:          number;
  semester_id:       string;
  paid_pct:          number;
  fee_cleared:       boolean;
  clearance_status:  string;
  total_units:       number;
  results_released:  number;
  results_pending:   number;
}

// fee_payments insert shape — matches table exactly
interface PaymentFormData {
  application_id: string;
  semester_id:    string;   // uuid — required for 95% clearance trigger
  module_id:      string;   // uuid — auto-filled from semester selection
  payment_type:   string;   // NOT NULL
  amount:         number;   // NOT NULL
  payment_method: string;   // NOT NULL
  transaction_id: string;   // nullable
  payment_date:   string;   // date NOT NULL
  status:         string;   // default: completed
  receipt_number: string;   // nullable but we always generate
  notes:          string;   // nullable
}

// Simple search result from applications table
interface SearchResult {
  id:               string;
  full_name:        string;
  admission_number: string;
  course_name:      string;
  course_level:     string;
  campus:           string;
  financial_hold:   boolean;
  current_module:   number;
  current_semester: number;
  course_type_id:   string;
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => `KES ${Number(n || 0).toLocaleString()}`;
const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
const genReceipt = () => {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `RCP-${d}-${Math.floor(Math.random() * 900 + 100)}`;
};
const pctColor = (pct: number) =>
  pct >= 95 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500';
const pctBg = (pct: number) =>
  pct >= 95
    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
    : pct >= 50
    ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
    : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800';

// ─── CLEARANCE PREVIEW ────────────────────────────────────────────────────────
function ClearancePreview({
  summary,
  newAmount,
}: {
  summary: FeeSummary | null;
  newAmount: number;
}) {
  if (!summary || !newAmount) return null;
  const total    = summary.tuition_fee + summary.practical_fee + summary.additional_fees;
  const newPaid  = summary.total_paid + newAmount;
  const newPct   = Math.min((newPaid / total) * 100, 100);
  const oldPct   = total > 0 ? Math.min((summary.total_paid / total) * 100, 100) : 0;
  const willClear = newPct >= 95;

  return (
    <div className={`rounded-xl border p-4 text-sm ${pctBg(newPct)}`}>
      <div className="flex justify-between mb-2 text-slate-500 dark:text-slate-400">
        <span>Before payment</span>
        <span className={`font-bold ${pctColor(oldPct)}`}>{oldPct.toFixed(1)}%</span>
      </div>
      <div className="flex justify-between mb-3 text-slate-500 dark:text-slate-400">
        <span>After payment</span>
        <span className={`font-bold ${pctColor(newPct)}`}>{newPct.toFixed(1)}%</span>
      </div>
      {/* Progress */}
      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            willClear ? 'bg-emerald-500' : newPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
          }`}
          style={{ width: `${newPct}%` }}
        />
      </div>
      <p className={`font-semibold text-sm ${willClear ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
        {willClear
          ? '✓ Results will unlock automatically after saving'
          : `⚠ Pay ${fmt(total * 0.95 - newPaid)} more to unlock results`}
      </p>
    </div>
  );
}

// ─── SEMESTER CARD ────────────────────────────────────────────────────────────
function SemesterCard({
  summary,
  selected,
  onClick,
  locked,
}: {
  summary: FeeSummary;
  selected: boolean;
  onClick: () => void;
  locked?: boolean;
}) {
  const total = summary.tuition_fee + summary.practical_fee + summary.additional_fees;
  const pct   = total > 0 ? Math.min(Math.round((summary.total_paid / total) * 100), 100) : 0;
  const cleared = pct >= 95;

  if (locked && !cleared) {
    return (
      <div className="w-full text-left p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gray-100 dark:bg-slate-900/30 opacity-50 cursor-not-allowed">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-slate-500 dark:text-slate-500 text-sm">
              {summary.module_label && summary.module_label !== `Module ${summary.module_index}`
                ? `${summary.module_label} – `
                : summary.module_index > 0
                ? `Module ${summary.module_index} – `
                : ''}Semester {summary.semester_index}
            </p>
            <p className="text-xs text-slate-400 mt-1">🔒 Pay previous semester first</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl border transition-all ${
        selected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-400'
          : cleared
          ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800'
          : 'border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white text-sm">
            {summary.module_label && summary.module_label !== `Module ${summary.module_index}`
              ? `${summary.module_label} – `
              : summary.module_index > 0
              ? `Module ${summary.module_index} – `
              : ''}Semester {summary.semester_index}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-mono">
            Tuition {fmt(summary.tuition_fee)}
            {summary.practical_fee > 0 && ` + Practical ${fmt(summary.practical_fee)}`}
            {summary.additional_fees > 0 && ` + Extra ${fmt(summary.additional_fees)}`}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-sm font-bold ${cleared ? 'text-emerald-600' : 'text-red-500'}`}>
            {cleared ? 'Cleared' : fmt(summary.balance)}
          </p>
          <p className={`text-xs font-semibold mt-0.5 ${pctColor(pct)}`}>{pct}% paid</p>
        </div>
      </div>
      {/* mini progress */}
      <div className="mt-3 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            cleared ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [campus, setCampus]     = useState('');

  // Search
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchResults, setSearchResults]       = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searching, setSearching]               = useState(false);

  // Student data
  const [selectedStudent, setSelectedStudent]   = useState<StudentProfile | null>(null);
  const [feeSummary, setFeeSummary]             = useState<FeeSummary[]>([]);
  const [paymentHistory, setPaymentHistory]     = useState<PaymentHistory[]>([]);
  const [clearanceStatus, setClearanceStatus]   = useState<ClearanceStatus[]>([]);
  const [loadingStudent, setLoadingStudent]     = useState(false);

  // Form
  const [selectedSemSummary, setSelectedSemSummary] = useState<FeeSummary | null>(null);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReceipt, setLastReceipt] = useState('');
  const [showFeeAdjustModal, setShowFeeAdjustModal] = useState(false);
  const [adjustSemesterId, setAdjustSemesterId] = useState('');
  const [adjustNewAmount, setAdjustNewAmount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const [form, setForm] = useState<PaymentFormData>({
    application_id: '',
    semester_id:    '',
    module_id:      '',
    payment_type:   'tuition',
    amount:         0,
    payment_method: 'mpesa',
    transaction_id: '',
    payment_date:   new Date().toISOString().split('T')[0],
    status:         'completed',
    receipt_number: genReceipt(),
    notes:          '',
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    const checkAuth = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (!session) { router.push('/login/admin'); return; }
      if (session.user?.user_metadata?.role !== 'admin') { router.push('/login/admin'); return; }
      const c = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus') || '';
      setCampus(c);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // ── Search ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from('applications')
        .select(`
          id, full_name, admission_number, campus,
          financial_hold, current_module, current_semester, course_type_id,
          courses(name), course_types(level)
        `)
        .eq('status', 'enrolled')
        .or(`full_name.ilike.%${searchQuery}%,admission_number.ilike.%${searchQuery}%`)
        .limit(8);

      if (data) {
        setSearchResults(data.map((a: any) => ({
          id:               a.id,
          full_name:        a.full_name,
          admission_number: a.admission_number,
          course_name:      a.courses?.name || '',
          course_level:     a.course_types?.level || '',
          campus:           a.campus,
          financial_hold:   a.financial_hold,
          current_module:   a.current_module,
          current_semester: a.current_semester,
          course_type_id:   a.course_type_id,
        })));
        setShowSearchResults(true);
      }
      setSearching(false);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, supabase]);

  // ── Select student ────────────────────────────────────────────────────────
  const selectStudent = async (s: SearchResult) => {
    if (!supabase) return;
    setShowSearchResults(false);
    setSearchQuery(s.full_name);
    setLoadingStudent(true);
    setShowSuccess(false);
    setSelectedSemSummary(null);

    // Student profile from applications table directly
    const { data: profile } = await supabase
      .from('applications')
      .select('id, full_name, phone, email, course_id, admission_number, campus, current_module, current_semester, total_balance, credit_balance, financial_hold, transcript_unlocked, status, enrollment_type, class_id')
      .eq('admission_number', s.admission_number)
      .single();

    setSelectedStudent(profile || null);

    // Fee summary — get semesters for this student's course
    const { data: courseTypes } = await supabase
      .from('course_types')
      .select('id')
      .eq('course_id', profile?.course_id || '')
      .limit(1);

    let feeSumm: FeeSummary[] = [];
    if (courseTypes && courseTypes.length > 0) {
      // Get modules for this course type
      const { data: mods } = await supabase
        .from('modules')
        .select('id, module_index, label')
        .eq('course_type_id', courseTypes[0].id)
        .order('module_index');

      if (mods && mods.length > 0) {
        const moduleIds = mods.map((m: any) => m.id);
        const { data: sems } = await supabase
          .from('semesters')
          .select('id, semester_index, fee, practical_fee, module_id')
          .in('module_id', moduleIds)
          .order('semester_index');

        // Get actual payments for this student
        const { data: payments } = await supabase
          .from('fee_payments')
          .select('amount, semester_id')
          .eq('application_id', s.id)
          .eq('status', 'completed');

        // Build payment lookup by semester_id
        const paidBySem: Record<string, number> = {};
        if (payments) {
          for (const p of payments) {
            if (p.semester_id) {
              paidBySem[p.semester_id] = (paidBySem[p.semester_id] || 0) + parseFloat(p.amount);
            }
          }
        }

        // Get all modules for this course type (used for label context)
        const allCourseMods = mods || [];

        // Filter semesters to only show the student's current module
        const currentModuleId = allCourseMods.find((m: any) => m.module_index === (s.current_module || 1))?.id;
        feeSumm = (sems || [])
          .filter((sem: any) => !currentModuleId || sem.module_id === currentModuleId)
          .map((sem: any) => {
          const tuition = parseFloat(sem.fee) || 0;
          const practical = parseFloat(sem.practical_fee) || 0;
          const total = tuition + practical;
          const paid = paidBySem[sem.id] || 0;
          return {
            application_id: s.id || '',
            admission_number: s.admission_number || '',
            module_id: sem.module_id || '',
            module_index: mods.find((m: any) => m.id === sem.module_id)?.module_index || 0,
            module_label: mods.find((m: any) => m.id === sem.module_id)?.label || '',
            payment_mode: 'per_semester',
            exam_fee: 0,
            module_exam_body: '',
            semester_id: sem.id || '',
            semester_index: sem.semester_index,
            tuition_fee: tuition,
            practical_fee: practical,
            additional_fees: 0,
            installment_amount: 0,
            installment_status: '',
            total_paid: paid,
            balance: total - paid,
            due_date: null,
            attempt_number: 0,
          };
        });
      }
    }
    setFeeSummary(feeSumm);

    // Payment history from fee_payments
    const { data: history } = await supabase
      .from('fee_payments')
      .select('id, amount, payment_method, transaction_id, payment_date, status, receipt_number, notes')
      .eq('application_id', s.id)
      .order('payment_date', { ascending: false })
      .limit(20);

    setPaymentHistory(history || []);

    // Clearance: check if student has completed payments
    const { data: clearance } = await supabase
      .from('applications')
      .select('id, total_balance, financial_hold, current_module, current_semester')
      .eq('admission_number', s.admission_number)
      .single();

    setClearanceStatus(clearance ? [{
      admission_number: s.admission_number || '',
      student_name: profile?.full_name || '',
      campus: profile?.campus || '',
      course_name: profile?.course_id || '',
      module_index: clearance.current_module,
      semester: clearance.current_semester,
      semester_id: '',
      paid_pct: clearance.financial_hold ? 0 : 100,
      fee_cleared: !clearance.financial_hold,
      clearance_status: clearance.financial_hold ? 'On Hold' : 'Cleared',
      total_units: 0,
      results_released: 0,
      results_pending: 0,
    }] : []);

    setForm(prev => ({
      ...prev,
      application_id: s.id,
      receipt_number: genReceipt(),
    }));

    setLoadingStudent(false);
  };

  // ── Semester click from fee summary ──────────────────────────────────────
  const handleSemesterClick = (summary: FeeSummary) => {
    setSelectedSemSummary(summary);
    setForm(prev => ({
      ...prev,
      semester_id: summary.semester_id,
      module_id:   summary.module_id,
      amount:      summary.balance > 0 ? Math.round(summary.balance) : 0,
    }));
    document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Field change ──────────────────────────────────────────────────────────
  const setField = (field: keyof PaymentFormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.application_id)          e.application_id = 'Select a student';
    if (!form.semester_id)             e.semester_id    = 'Select a semester';
    if (!form.amount || form.amount <= 0) e.amount      = 'Enter a valid amount';
    if (!form.receipt_number)          e.receipt_number = 'Receipt number required';
    if (!form.payment_date)            e.payment_date   = 'Select a date';
    else if (new Date(form.payment_date) > new Date())
                                       e.payment_date   = 'Date cannot be in the future';
    const method = PAYMENT_METHODS.find(m => m.value === form.payment_method);
    if (method?.ref && !form.transaction_id) e.transaction_id = 'Reference number required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !supabase) return;
    setSubmitting(true);

    // Receipt number is auto-generated with timestamp+random — collisions are effectively impossible

    // Insert — fee_payments exact columns
    const { error } = await supabase.from('fee_payments').insert([{
      application_id: form.application_id,
      payment_type:   form.payment_type,
      amount:         Number(form.amount),
      payment_method: form.payment_method,
      transaction_id: form.transaction_id || null,
      payment_date:   form.payment_date,
      status:         form.status,
      receipt_number: form.receipt_number,
      notes:          form.notes || null,
      semester_id:    form.semester_id || null,
      module_id:      form.module_id   || null,
    }]);

    if (error) {
      alert('Error: ' + error.message);
      setSubmitting(false);
      return;
    }

    // DB trigger fn_trigger_clearance_on_payment fires automatically here
    // It calculates % paid, sets fee_cleared = true if >= 95%
    // If is_submitted = true → results_released = true automatically
    // No extra calls needed

    setLastReceipt(form.receipt_number);
    setShowSuccess(true);
    setSubmitting(false);

    // Refresh student data
    if (selectedStudent) {
      selectStudent({
        id: selectedStudent.application_id,
        full_name: selectedStudent.full_name,
        admission_number: selectedStudent.admission_number,
        course_name: selectedStudent.course_name,
        course_level: selectedStudent.course_level,
        campus: selectedStudent.campus,
        financial_hold: selectedStudent.financial_hold,
        current_module: selectedStudent.current_module,
        current_semester: selectedStudent.current_semester,
        course_type_id: selectedStudent.course_type_id,
      });
    }

    // Reset form fields
    setForm(prev => ({
      ...prev,
      amount: 0,
      transaction_id: '',
      notes: '',
      receipt_number: genReceipt(),
      semester_id: '',
      module_id: '',
    }));
    setSelectedSemSummary(null);
  };

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="font-medium">Loading payment system...</span>
        </div>
      </div>
    );
  }

  // ── Current semester clearance for selected student ───────────────────────
  const currentClearance = clearanceStatus.find(
    c => selectedStudent && c.module_index === selectedStudent.current_module
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0C0C14] transition-colors">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-gray-50 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Fee Payment</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight">Record & manage student payments</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {campus === 'main' ? 'Main Campus' : campus === 'west' ? 'West Campus' : campus || 'All Campuses'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── STUDENT SEARCH ───────────────────────────────────────────────── */}
        <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-visible">
          <div className="p-6">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center">
                <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Student Lookup</h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">Search by admission number or name</p>
              </div>
            </div>

            {/* Search input */}
            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                {searching
                  ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  : <Search className="w-4 h-4 text-slate-400" />}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                placeholder="Search by admission number or full name..."
                className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setShowSearchResults(false); }}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Dropdown results */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1.5 w-full bg-gray-50 dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-72 overflow-y-auto">
                  {searchResults.map(s => (
                    <button
                      key={s.id}
                      onClick={() => selectStudent(s)}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials(s.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{s.full_name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {s.admission_number} · {s.course_name} · {s.campus}
                        </p>
                      </div>
                      {s.financial_hold && (
                        <span className="ml-auto flex-shrink-0 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full">
                          Hold
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── STUDENT PROFILE CARD ──────────────────────────────────────── */}
            {loadingStudent && (
              <div className="mt-6 flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              </div>
            )}

            {selectedStudent && !loadingStudent && (
              <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                      {initials(selectedStudent.full_name)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{selectedStudent.full_name}</h3>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className="font-mono text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                              {selectedStudent.admission_number}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{selectedStudent.campus}</span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{selectedStudent.intake}</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-2">
                            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              {selectedStudent.course_name}
                              <span className="mx-1 text-slate-400">·</span>
                              {selectedStudent.course_level}
                              <span className="mx-1 text-slate-400">·</span>
                              {selectedStudent.course_exam_body}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedStudent.financial_hold && (
                            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Financial Hold
                            </span>
                          )}
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                            selectedStudent.student_status === 'enrolled'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                          }`}>
                            {selectedStudent.student_status}
                          </span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-5">
                        {[
                          {
                            label: 'Total Expected',
                            value: fmt(selectedStudent.total_expected),
                            color: 'text-slate-700 dark:text-slate-300',
                          },
                          {
                            label: 'Total Paid',
                            value: fmt(selectedStudent.total_paid),
                            color: 'text-emerald-600 dark:text-emerald-400',
                          },
                          {
                            label: 'Balance',
                            value: fmt(selectedStudent.total_balance),
                            color: selectedStudent.total_balance > 0
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-emerald-600 dark:text-emerald-400',
                          },
                          {
                            label: 'Credit Balance',
                            value: fmt(selectedStudent.credit_balance || 0),
                            color: (selectedStudent.credit_balance || 0) > 0
                              ? 'text-indigo-600 dark:text-indigo-400'
                              : 'text-slate-400',
                          },
                          {
                            label: 'Last Payment',
                            value: selectedStudent.last_payment_date
                              ? new Date(selectedStudent.last_payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '—',
                            color: 'text-slate-600 dark:text-slate-400',
                          },
                        ].map(m => (
                          <div key={m.label} className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 shadow-sm">
                            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium mb-1">{m.label}</p>
                            <p className={`text-sm font-bold font-mono ${m.color}`}>{m.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Current module/semester info */}
                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          Semester {selectedStudent.current_semester}
                        </span>
                        {selectedStudent.sponsorship_type && selectedStudent.sponsorship_type !== 'self' && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            {selectedStudent.sponsor_name || selectedStudent.sponsorship_type}
                          </span>
                        )}
                        {currentClearance && (
                          <span className={`flex items-center gap-1 font-semibold ${pctColor(Number(currentClearance.paid_pct))}`}>
                            <TrendingUp className="w-3.5 h-3.5" />
                            {Number(currentClearance.paid_pct).toFixed(0)}% cleared this semester
                          </span>
                        )}
                      </div>

                      {/* ── Fee Action Buttons ── */}
                      <div className="mt-4 flex items-center gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to unlock this student\'s transcript? This is gated by full payment. Wait... the transcript is already unlocked by the system when balance is zero.')) return;
                            alert('Transcript unlock is automatic when all fees are cleared (balance = 0).');
                          }}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors"
                        >
                          {selectedStudent.transcript_unlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {selectedStudent.transcript_unlocked ? 'Transcript Unlocked' : 'Locked Transcript'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowFeeAdjustModal(true)}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Fee Adjustment
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── MAIN 2-COLUMN LAYOUT ─────────────────────────────────────────── */}
        {selectedStudent && !loadingStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* ── LEFT: FEE SUMMARY + PAYMENT HISTORY ────────────────────── */}
            <div className="space-y-6">

              {/* Fee Summary */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm text-slate-900 dark:text-white">Semester Balances</h2>
                    <p className="text-xs text-slate-400 dark:text-slate-500">Click a semester to fill the payment form</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {feeSummary.length === 0 ? (
                    <div className="text-center py-8 text-sm text-slate-400 dark:text-slate-500">
                      No fee summary available
                    </div>
                  ) : (
                    (() => {
                      // Find first unpaid semester — only allow paying that one + cleared past semesters
                      const firstUnpaid = feeSummary.find(s => (s.total_paid || 0) < (s.tuition_fee + s.practical_fee + s.additional_fees) * 0.95);
                      return feeSummary.map(s => {
                        const total = s.tuition_fee + s.practical_fee + s.additional_fees;
                        const pct = total > 0 ? Math.min(Math.round(((s.total_paid || 0) / total) * 100), 100) : 0;
                        const cleared = pct >= 95;
                        // Lock semesters after the first unpaid one
                        const isLocked = firstUnpaid && s.semester_index > firstUnpaid.semester_index && !cleared;
                        return (
                          <SemesterCard
                            key={s.semester_id}
                            summary={s}
                            selected={selectedSemSummary?.semester_id === s.semester_id}
                            onClick={() => !isLocked && handleSemesterClick(s)}
                            locked={isLocked}
                          />
                        );
                      });
                    })()
                  )}
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <Receipt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm text-slate-900 dark:text-white">Payment History</h2>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{paymentHistory.length} transactions</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                  {paymentHistory.length === 0 ? (
                    <div className="text-center py-10 text-sm text-slate-400 dark:text-slate-500">
                      No payments recorded yet
                    </div>
                  ) : (
                    paymentHistory.map(p => {
                      const method = PAYMENT_METHODS.find(m => m.value === p.payment_method);
                      return (
                        <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{fmt(p.amount)}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                              Sem {p.semester_number}
                              {p.transaction_id && ` · ${p.transaction_id}`}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mb-1.5">
                              {p.receipt_number}
                            </p>
                            <div className="flex items-center gap-1.5 justify-end">
                              <span className="text-xs text-slate-400">
                                {new Date(p.payment_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                              </span>
                              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                                p.payment_method === 'mpesa'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                                  : p.payment_method === 'cash'
                                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                  : 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400'
                              }`}>
                                {method?.label || p.payment_method}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: PAYMENT FORM ─────────────────────────────────────── */}
            <div
              id="payment-form"
              className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden self-start sticky top-20"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-slate-900 dark:text-white">Record Payment</h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {selectedSemSummary
                      ? `Semester ${selectedSemSummary.semester_index}`
                      : 'Fill all required fields'}
                  </p>
                </div>
              </div>

              <div className="p-5">
                {/* Success banner */}
                {showSuccess && (
                  <div className="mb-5 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-emerald-900 dark:text-emerald-300">Payment recorded successfully</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-500 mt-0.5 font-mono">Receipt: {lastReceipt}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                        Clearance check ran automatically — results will unlock if ≥ 95% paid.
                      </p>
                    </div>
                    <button onClick={() => setShowSuccess(false)} className="ml-auto text-emerald-500 hover:text-emerald-700 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Selected semester reminder — click a semester card to select */}
                  {selectedSemSummary ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                      <div>
                        <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          Semester {selectedSemSummary.semester_index}
                        </p>
                        <p className="text-xs text-indigo-500 dark:text-indigo-400 font-mono mt-0.5">
                          Outstanding: {fmt(selectedSemSummary.balance)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedSemSummary(null); setField('semester_id', ''); setField('module_id', ''); }}
                        className="text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* ── Payment Method ── */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                      Payment Method <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {PAYMENT_METHODS.map(m => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => { setField('payment_method', m.value); setField('transaction_id', ''); }}
                          className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border text-xs font-semibold transition-all ${
                            form.payment_method === m.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                              : 'border-slate-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <m.icon className="w-4 h-4" />
                          <span className="text-center leading-tight" style={{ fontSize: '10px' }}>
                            {m.value === 'bank_transfer' ? 'Bank' : m.value === 'equity_bank' ? 'Equity' : m.value === 'kcb_bank' ? 'KCB' : m.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Amount + Payment Type ── */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        Amount <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-xs font-bold text-slate-400">KES</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={form.amount || ''}
                          onChange={e => setField('amount', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className={`w-full pl-12 pr-3 py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-mono ${
                            errors.amount ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                      </div>
                      {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        Payment Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={form.payment_type}
                        onChange={e => setField('payment_type', e.target.value)}
                        className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                      >
                        {PAYMENT_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ── Transaction ID ── */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                      {form.payment_method === 'mpesa'         ? 'M-Pesa Code'
                       : form.payment_method === 'bank_transfer' ? 'Bank Reference No.'
                       : form.payment_method === 'equity_bank'   ? 'Equity Reference No.'
                       : form.payment_method === 'kcb_bank'      ? 'KCB Reference No.'
                       : 'Reference'}{' '}
                      {PAYMENT_METHODS.find(m => m.value === form.payment_method)?.ref
                        ? <span className="text-red-500">*</span>
                        : <span className="text-slate-400 normal-case font-normal tracking-normal">(optional)</span>}
                    </label>
                    <input
                      type="text"
                      value={form.transaction_id}
                      onChange={e => setField('transaction_id', e.target.value)}
                      disabled={form.payment_method === 'cash'}
                      placeholder={
                        form.payment_method === 'mpesa'          ? 'e.g. QHJ7X2341'
                        : form.payment_method === 'cash'         ? 'Not required for cash'
                        : 'Reference number'
                      }
                      className={`w-full px-3 py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors font-mono disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-400 ${
                        errors.transaction_id ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                      }`}
                    />
                    {errors.transaction_id && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.transaction_id}</p>}
                  </div>

                  {/* ── Payment Date + Receipt Number ── */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        Payment Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <input
                          type="date"
                          value={form.payment_date}
                          onChange={e => setField('payment_date', e.target.value)}
                          className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                            errors.payment_date ? 'border-red-400' : 'border-slate-300 dark:border-slate-700'
                          }`}
                        />
                      </div>
                      {errors.payment_date && <p className="mt-1 text-xs text-red-500">{errors.payment_date}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                        Receipt No. <span className="text-red-500">*</span>
                        <span className="ml-1 normal-case font-normal tracking-normal text-slate-400">(auto)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Receipt className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          value={form.receipt_number}
                          readOnly
                          placeholder="RCP-YYYYMMDD-XXX"
                          className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-mono cursor-not-allowed"
                        />
                        <button
                          type="button"
                          onClick={() => setField('receipt_number', genReceipt())}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          title="Regenerate"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {errors.receipt_number && <p className="mt-1 text-xs text-red-500">{errors.receipt_number}</p>}
                    </div>
                  </div>

                  {/* ── Status ── */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.status}
                      onChange={e => setField('status', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    >
                      {STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── Notes ── */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                      Notes <span className="text-slate-400 normal-case font-normal tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={e => setField('notes', e.target.value)}
                      rows={2}
                      placeholder="e.g. Paid via KCB Branch, Nairobi..."
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors resize-none"
                    />
                  </div>

                  {/* ── Clearance preview ── */}
                  {selectedSemSummary && form.amount > 0 && (
                    <ClearancePreview summary={selectedSemSummary} newAmount={form.amount} />
                  )}

                  {/* ── Submit ── */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Recording payment...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Record Payment & Generate Receipt
                      </>
                    )}
                  </button>

                  {/* DB note */}
                  <p className="text-center text-xs text-slate-400 dark:text-slate-600">
                    Clearance trigger runs automatically · Results unlock at 95% paid
                  </p>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ── FEE ADJUSTMENT MODAL ── */}
        {showFeeAdjustModal && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Fee Adjustment</h3>
                <button onClick={() => { setShowFeeAdjustModal(false); setAdjustSemesterId(''); setAdjustNewAmount(0); setAdjustReason(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record a fee adjustment for <strong>{selectedStudent.full_name}</strong>. This will be logged in <code>fee_adjustments</code> with the reason provided.
              </p>
              <select
                value={adjustSemesterId}
                onChange={e => setAdjustSemesterId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Select semester...</option>
                {feeSummary.map(s => {
                  const cur = s.tuition_fee + s.practical_fee;
                  return (
                    <option key={s.semester_id} value={s.semester_id}>
                      Semester {s.semester_index} — Current: KES {cur.toLocaleString()}
                    </option>
                  );
                })}
              </select>
              {adjustSemesterId && (() => {
                const sem = feeSummary.find(s => s.semester_id === adjustSemesterId);
                const cur = sem ? sem.tuition_fee + sem.practical_fee : 0;
                return (
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-3 text-xs text-slate-500 dark:text-slate-400">
                    Current fee: <strong className="font-mono">KES {cur.toLocaleString()}</strong>
                  </div>
                );
              })()}
              <input
                type="number"
                min="0"
                value={adjustNewAmount || ''}
                onChange={e => setAdjustNewAmount(parseFloat(e.target.value) || 0)}
                placeholder="New total amount (KES)"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <textarea
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                placeholder="Reason for adjustment (required)"
                rows={2}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              ></textarea>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowFeeAdjustModal(false); setAdjustSemesterId(''); setAdjustNewAmount(0); setAdjustReason(''); }}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={adjustSubmitting || !adjustSemesterId || !adjustReason || adjustNewAmount <= 0}
                  onClick={async () => {
                    if (!supabase) return;
                    setAdjustSubmitting(true);
                    const sem = feeSummary.find(s => s.semester_id === adjustSemesterId);
                    const oldAmount = sem ? sem.tuition_fee + sem.practical_fee : 0;
                    const { error } = await supabase.from('fee_adjustments').insert({
                      application_id: selectedStudent.application_id,
                      old_amount: oldAmount,
                      new_amount: adjustNewAmount,
                      reason: adjustReason,
                      adjusted_at: new Date().toISOString(),
                    });
                    if (error) {
                      alert('Error: ' + error.message);
                    } else {
                      alert(`Adjustment logged! Old: KES ${oldAmount.toLocaleString()} → New: KES ${adjustNewAmount.toLocaleString()}`);
                      setShowFeeAdjustModal(false);
                      setAdjustSemesterId('');
                      setAdjustNewAmount(0);
                      setAdjustReason('');
                    }
                    setAdjustSubmitting(false);
                  }}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${
                    adjustSubmitting || !adjustSemesterId || !adjustReason || adjustNewAmount <= 0
                      ? 'bg-indigo-400 text-white cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {adjustSubmitting ? 'Submitting...' : 'Submit Adjustment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ────────────────────────────────────────────────────── */}
        {!selectedStudent && !loadingStudent && (
          <div className="bg-gray-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No Student Selected</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
              Search for a student above to view their semester balances, payment history and record a new payment.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}