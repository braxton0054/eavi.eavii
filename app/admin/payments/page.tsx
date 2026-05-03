'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  ArrowLeft, 
  User, 
  CreditCard, 
  Calendar, 
  Receipt, 
  Wallet, 
  CheckCircle, 
  AlertCircle,
  Building,
  GraduationCap,
  FileText,
  ChevronRight,
  Loader2
} from 'lucide-react';

export const dynamic = 'force-dynamic';

// Payment type options matching database enum
const PAYMENT_TYPES = [
  { id: 'tuition', label: 'Tuition Fee', icon: GraduationCap },
  { id: 'practical', label: 'Practical Fee', icon: Building },
  { id: 'exam', label: 'Exam Fee', icon: FileText },
  { id: 'attachment', label: 'Attachment Fee', icon: Building },
  { id: 'registration', label: 'Registration Fee', icon: Receipt },
  { id: 'penalty', label: 'Penalty/Fine', icon: AlertCircle },
];

// Payment methods matching database enum
const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa', color: 'bg-green-100 text-green-700' },
  { value: 'bank_transfer', label: 'Bank Transfer', color: 'bg-blue-100 text-blue-700' },
  { value: 'equity_bank', label: 'Equity Bank', color: 'bg-red-100 text-red-700' },
  { value: 'kcb_bank', label: 'KCB Bank', color: 'bg-amber-100 text-amber-700' },
  { value: 'cash', label: 'Cash', color: 'bg-gray-100 text-gray-700' },
];

// Interfaces for data types
interface StudentProfile {
  id: string;
  full_name: string;
  admission_number: string;
  course_name: string;
  course_level: string;
  current_module_label: string;
  campus: string;
  financial_hold: boolean;
  total_balance: number;
  total_expected: number;
  total_paid: number;
  last_payment_date: string | null;
  course_id: string;
  course_type_id: string;
  current_module: number;
  current_semester: number;
}

interface FeeSummary {
  semester_id: string;
  module_id: string;
  semester_index: number;
  module_index: number;
  module_label: string;
  total_expected: number;
  total_paid: number;
  balance: number;
  tuition_fee: number;
  practical_fee: number;
  additional_fees: number;
}

interface PaymentHistory {
  id: string;
  receipt_number: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  module_label: string;
  semester_number: number;
}

interface Module {
  id: string;
  module_index: number;
  label: string;
  exam_body: string;
}

interface Semester {
  id: string;
  semester_index: number;
  module_index: number;
  module_id: string;
}

interface PaymentFormData {
  application_id: string;
  semester_id: string;
  module_id: string;
  payment_type: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  receipt_number: string;
  payment_date: string;
  notes: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  
  // Section 1: Student Lookup
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentProfile[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  
  // Section 2: Semester Balance & History
  const [feeSummary, setFeeSummary] = useState<FeeSummary[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  
  // Section 3: Payment Form
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [availableSemesters, setAvailableSemesters] = useState<Semester[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState<PaymentFormData>({
    application_id: '',
    semester_id: '',
    module_id: '',
    payment_type: 'tuition',
    amount: 0,
    payment_method: 'cash',
    transaction_id: '',
    receipt_number: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Generate receipt number: RCP-YYYYMMDD-XXX
  const generateReceiptNumber = useCallback(() => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 900 + 100).toString();
    return `RCP-${dateStr}-${random}`;
  }, []);

  // Initialize Supabase and check auth
  useEffect(() => {
    const client = createClient();
    setSupabase(client);

    const checkAuth = async () => {
      const { data: { session } } = await client.auth.getSession();
      if (!session) { router.push('/login/admin'); return; }
      const userRole = session.user?.user_metadata?.role;
      if (userRole !== 'admin') { router.push('/login/admin'); return; }
      const userCampus = session.user?.user_metadata?.campus || localStorage.getItem('adminCampus');
      setCampus(userCampus);
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  // Search students as user types
  useEffect(() => {
    if (!supabase || searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchStudents = async () => {
      const { data, error } = await supabase
        .from('applications')
        .select('id, full_name, admission_number, courses(name), course_types(level), current_module, campus, financial_hold, status')
        .eq('status', 'enrolled')
        .or(`full_name.ilike.%${searchQuery}%,admission_number.ilike.%${searchQuery}%`)
        .limit(10);

      if (!error && data) {
        const mapped = data.map((app: any) => ({
          id: app.id,
          full_name: app.full_name,
          admission_number: app.admission_number,
          course_name: app.courses?.name || '',
          course_level: app.course_types?.level || '',
          current_module_label: `Module ${app.current_module}`,
          campus: app.campus,
          financial_hold: app.financial_hold,
        }));
        setSearchResults(mapped as StudentProfile[]);
        setShowSearchResults(true);
      }
    };

    const timeout = setTimeout(searchStudents, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, supabase]);

  // Load student profile and fee data
  const selectStudent = async (student: StudentProfile) => {
    if (!supabase) return;
    
    setSelectedStudent(student);
    setSearchQuery(student.full_name);
    setShowSearchResults(false);
    setShowSuccess(false);
    
    // Load full profile from v_student_profile
    const { data: profile } = await supabase
      .from('v_student_profile')
      .select('*')
      .eq('admission_number', student.admission_number)
      .single();
    
    if (profile) {
      setSelectedStudent({ ...student, ...profile });
    }
    
    // Load fee summary from v_student_fee_summary
    const { data: summary } = await supabase
      .from('v_student_fee_summary')
      .select('*')
      .eq('application_id', student.id)
      .order('module_index', { ascending: true })
      .order('semester_index', { ascending: true });
    
    setFeeSummary(summary || []);
    
    // Load payment history from v_student_payment_history
    const { data: history } = await supabase
      .from('v_student_payment_history')
      .select('*')
      .eq('application_id', student.id)
      .order('payment_date', { ascending: false })
      .limit(20);
    
    setPaymentHistory(history || []);
    
    // Load modules for course
    const { data: modules } = await supabase
      .from('modules')
      .select('id, module_index, label, exam_body')
      .eq('course_type_id', student.course_type_id || profile?.course_type_id)
      .order('module_index', { ascending: true });
    
    setAvailableModules(modules || []);
    
    // Pre-fill form
    setFormData(prev => ({
      ...prev,
      application_id: student.id,
      receipt_number: generateReceiptNumber()
    }));
    
    // Load semesters for first module
    if (modules && modules.length > 0) {
      loadSemestersForModule(modules[0].id);
    }
  };

  // Load semesters when module changes
  const loadSemestersForModule = async (moduleId: string) => {
    if (!supabase || !moduleId) return;
    
    const { data } = await supabase
      .from('semesters')
      .select('id, semester_index, module_index, module_id')
      .eq('module_id', moduleId)
      .order('semester_index', { ascending: true });
    
    setAvailableSemesters(data || []);
  };

  // Handle form field changes
  const handleChange = (field: keyof PaymentFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Select semester from fee summary
  const selectSemester = (summary: FeeSummary) => {
    setFormData(prev => ({
      ...prev,
      semester_id: summary.semester_id,
      module_id: summary.module_id,
      amount: summary.balance > 0 ? summary.balance : 0
    }));
    
    // Scroll to payment form
    document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.application_id) {
      newErrors.application_id = 'Please select a student';
    }
    if (!formData.semester_id && !formData.module_id) {
      newErrors.semester_id = 'Please select a semester or module';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.receipt_number) {
      newErrors.receipt_number = 'Receipt number is required';
    }
    if (!formData.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    } else {
      const paymentDate = new Date(formData.payment_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (paymentDate > today) {
        newErrors.payment_date = 'Payment date cannot be in the future';
      }
    }
    if (formData.payment_method === 'mpesa' && !formData.transaction_id) {
      newErrors.transaction_id = 'M-Pesa transaction ID is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !supabase) return;
    
    setSubmitting(true);
    
    // Check receipt number uniqueness
    const { data: existing } = await supabase
      .from('fee_payments')
      .select('id')
      .eq('receipt_number', formData.receipt_number)
      .single();
    
    if (existing) {
      setErrors(prev => ({ ...prev, receipt_number: 'Receipt number already exists' }));
      setSubmitting(false);
      return;
    }
    
    // Submit to API
    const submitData = {
      application_id: formData.application_id,
      payment_type: formData.payment_type,
      amount: formData.amount,
      payment_method: formData.payment_method,
      transaction_id: formData.transaction_id || null,
      payment_date: formData.payment_date,
      status: 'completed',
      receipt_number: formData.receipt_number,
      notes: formData.notes || null,
      semester_id: formData.semester_id || null,
      module_id: formData.module_id || null
    };
    
    const { error } = await supabase.from('fee_payments').insert([submitData]);
    
    if (error) {
      alert('Error recording payment: ' + error.message);
      setSubmitting(false);
      return;
    }
    
    // Update financial hold if balance is cleared
    const currentBalance = feeSummary.find(s => s.semester_id === formData.semester_id);
    if (currentBalance && currentBalance.balance - formData.amount <= 0 && selectedStudent?.financial_hold) {
      await supabase
        .from('applications')
        .update({ financial_hold: false })
        .eq('id', formData.application_id);
    }
    
    // Show success and refresh
    setShowSuccess(true);
    setSubmitting(false);
    
    // Reload data
    if (selectedStudent) {
      selectStudent(selectedStudent);
    }
    
    // Reset form with new receipt number
    setFormData(prev => ({
      ...prev,
      amount: 0,
      transaction_id: '',
      notes: '',
      receipt_number: generateReceiptNumber()
    }));
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format currency
  const formatKES = (amount: number) => `KES ${amount.toLocaleString()}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading payment system...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('/admin/dashboard')} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Fee Payment</h1>
                <p className="text-sm text-slate-500">Record and manage student payments</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
              <Building className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                {campus === 'main' ? 'Main Campus' : 'West Campus'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section 1: Student Lookup - Professional Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Search className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Student Search</h2>
              <p className="text-sm text-slate-500">Find student by admission number or name</p>
            </div>
          </div>
          
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by admission number or full name..."
              className="block w-full pl-11 pr-4 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 text-slate-900 placeholder:text-slate-400"
            />
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 max-h-72 overflow-auto">
                {searchResults.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => selectStudent(student)}
                    className="w-full text-left px-4 py-3.5 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                        {getInitials(student.full_name)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{student.full_name}</div>
                        <div className="text-sm text-slate-500">
                          {student.admission_number} • {student.course_name}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Student Profile - Professional Card */}
          {selectedStudent && (
            <div className="mt-8 p-6 bg-gradient-to-r from-indigo-50/50 to-slate-50/50 rounded-xl border border-indigo-100">
              <div className="flex items-start gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200 flex-shrink-0">
                  {getInitials(selectedStudent.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{selectedStudent.full_name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono font-medium">
                          {selectedStudent.admission_number}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-sm text-slate-600">{selectedStudent.campus}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-2 flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        {selectedStudent.course_name}
                        <span className="text-slate-400">•</span>
                        {selectedStudent.course_level}
                      </p>
                    </div>
                    {selectedStudent.financial_hold && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Financial Hold
                      </span>
                    )}
                  </div>
                  
                  {/* Professional Metrics Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Total Expected</div>
                      <div className="text-lg font-bold text-slate-900">
                        {formatKES(selectedStudent.total_expected || 0)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Total Paid</div>
                      <div className="text-lg font-bold text-emerald-600">
                        {formatKES(selectedStudent.total_paid || 0)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Balance</div>
                      <div className={`text-lg font-bold ${(selectedStudent.total_balance || 0) > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatKES(selectedStudent.total_balance || 0)}
                      </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1">Last Payment</div>
                      <div className="text-lg font-bold text-slate-700">
                        {selectedStudent.last_payment_date 
                          ? new Date(selectedStudent.last_payment_date).toLocaleDateString() 
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sections 2 & 3: Two Column Layout */}
        {selectedStudent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section 2: Semester Balance & History */}
            <div className="space-y-6">
              {/* Fee Summary - Professional Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Semester Balances</h2>
                    <p className="text-sm text-slate-500">Outstanding fees by semester</p>
                  </div>
                </div>
                
                {feeSummary.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <p className="text-slate-500">No fee summary available.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feeSummary.map((summary) => (
                      <div 
                        key={summary.semester_id} 
                        className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                              {summary.module_label}
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                              <span className="text-slate-600">Semester {summary.semester_index}</span>
                            </h4>
                            <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                Tuition {formatKES(summary.tuition_fee)}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                                Practical {formatKES(summary.practical_fee)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${summary.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {summary.balance > 0 ? formatKES(summary.balance) : 'Paid'}
                            </div>
                            <button
                              onClick={() => selectSemester(summary)}
                              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Select
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment History - Professional Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Receipt className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Payment History</h2>
                    <p className="text-sm text-slate-500">Recent transactions</p>
                  </div>
                </div>
                
                {paymentHistory.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl">
                    <p className="text-slate-500">No payments recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-auto pr-1">
                    {paymentHistory.map((payment) => {
                      const methodStyle = PAYMENT_METHODS.find(m => m.value === payment.payment_method)?.color || 'bg-gray-100 text-gray-700';
                      return (
                        <div key={payment.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                <CreditCard className="w-5 h-5 text-slate-400" />
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">{formatKES(payment.amount)}</div>
                                <div className="text-sm text-slate-500">
                                  {payment.module_label} • Semester {payment.semester_number}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {new Date(payment.payment_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{payment.receipt_number}</div>
                              <span className={`inline-block mt-2 px-2.5 py-1 rounded-lg text-xs font-medium ${methodStyle}`}>
                                {payment.payment_method}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Payment Form - Professional Card */}
            <div id="payment-form" className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Record Payment</h2>
                  <p className="text-sm text-slate-500">Enter payment details</p>
                </div>
              </div>
              
              {showSuccess && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-900">Payment recorded successfully!</p>
                    <p className="text-sm text-emerald-700">Receipt: {formData.receipt_number}</p>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Receipt Number */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Receipt Number <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Receipt className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.receipt_number}
                      onChange={(e) => handleChange('receipt_number', e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 ${errors.receipt_number ? 'border-red-300' : 'border-slate-300'}`}
                      placeholder="RCP-YYYYMMDD-XXX"
                    />
                  </div>
                  {errors.receipt_number && <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{errors.receipt_number}</p>}
                </div>

                {/* Payment Date & Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Date <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="date"
                        value={formData.payment_date}
                        onChange={(e) => handleChange('payment_date', e.target.value)}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 ${errors.payment_date ? 'border-red-300' : 'border-slate-300'}`}
                      />
                    </div>
                    {errors.payment_date && <p className="mt-1.5 text-sm text-red-600">{errors.payment_date}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Amount (KES) <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-medium">KES</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.amount || ''}
                        onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                        className={`w-full pl-14 pr-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 ${errors.amount ? 'border-red-300' : 'border-slate-300'}`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.amount && <p className="mt-1.5 text-sm text-red-600">{errors.amount}</p>}
                  </div>
                </div>

                {/* Payment Type & Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Type <span className="text-red-500">*</span></label>
                    <select
                      value={formData.payment_type}
                      onChange={(e) => handleChange('payment_type', e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      {PAYMENT_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Payment Method <span className="text-red-500">*</span></label>
                    <select
                      value={formData.payment_method}
                      onChange={(e) => handleChange('payment_method', e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      {PAYMENT_METHODS.map(method => (
                        <option key={method.value} value={method.value}>{method.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Transaction ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Transaction ID {formData.payment_method === 'mpesa' && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.transaction_id}
                    onChange={(e) => handleChange('transaction_id', e.target.value)}
                    placeholder={formData.payment_method === 'mpesa' ? 'M-Pesa confirmation code' : formData.payment_method === 'cash' ? 'Not required for cash' : 'Bank reference number'}
                    disabled={formData.payment_method === 'cash'}
                    className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 ${
                      errors.transaction_id ? 'border-red-300' : 'border-slate-300'
                    } ${formData.payment_method === 'cash' ? 'bg-slate-100 text-slate-500' : ''}`}
                  />
                  {errors.transaction_id && <p className="mt-1.5 text-sm text-red-600">{errors.transaction_id}</p>}
                </div>

                {/* Module & Semester */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Module</label>
                    <select
                      value={formData.module_id}
                      onChange={(e) => {
                        handleChange('module_id', e.target.value);
                        loadSemestersForModule(e.target.value);
                      }}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Select module...</option>
                      {availableModules.map(mod => (
                        <option key={mod.id} value={mod.id}>{mod.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
                    <select
                      value={formData.semester_id}
                      onChange={(e) => handleChange('semester_id', e.target.value)}
                      className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white ${errors.semester_id ? 'border-red-300' : 'border-slate-300'}`}
                    >
                      <option value="">Select semester...</option>
                      {availableSemesters.map(sem => (
                        <option key={sem.id} value={sem.id}>Semester {sem.semester_index}</option>
                      ))}
                    </select>
                    {errors.semester_id && <p className="mt-1.5 text-sm text-red-600">{errors.semester_id}</p>}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 resize-none"
                    placeholder="Add any additional notes about this payment..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Recording Payment...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Record Payment & Generate Receipt
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!selectedStudent && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Student Selected</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Search for a student above to view their fee details, payment history, and record new payments.</p>
          </div>
        )}
      </main>
    </div>
  );
}
