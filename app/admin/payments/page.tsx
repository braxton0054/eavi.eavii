'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/client';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

const DEFAULT_FEE_TYPES = [
  { id: 'tuition', label: 'Tuition Fee', icon: '🎓', amount: 0 },
  { id: 'practical', label: 'Practical Fee', icon: '🔬', amount: 0 },
  { id: 'exam', label: 'Exam Fee', icon: '📝', amount: 0 },
  { id: 'other', label: 'Other Fee', icon: '💼', amount: 0 },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'bank_transfer', label: 'Bank', icon: '🏦' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'mpesa', label: 'M-Pesa', icon: '📱' },
];

interface Application {
  id: string;
  full_name: string;
  admission_number: string;
  course_id: string;
  current_semester: number;
  current_module: number;
  course_type_id: string;
  total_balance: number;
  exam_body: string;
  courses?: {
    name: string;
  };
  course_types?: {
    level: string;
  };
}

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

export default function PaymentsPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [campus, setCampus] = useState('');
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [feeTypes, setFeeTypes] = useState(DEFAULT_FEE_TYPES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamBody, setSelectedExamBody] = useState<string>('all');
  type PaymentFormData = {
    application_id: string;
    payment_type: 'tuition' | 'practical' | 'exam' | 'other';
    amount: number;
    payment_method: 'cash' | 'bank_transfer' | 'card' | 'mpesa';
    transaction_id: string;
    payment_date: string;
    semester: number;
    module: number;
    notes: string;
  };

  const [formData, setFormData] = useState<PaymentFormData>({
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
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const generateReceiptNumber = useCallback(() => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REC-${year}-${random}`;
  }, []);

  const loadPayments = useCallback(async (campusFilter: string) => {
    if (!supabase) return;
    let query = supabase
      .from('fee_payments')
      .select(`*,application:applications!inner(full_name,admission_number,course_id,campus)`)
      .order('payment_date', { ascending: false });
    if (campusFilter && campusFilter !== 'all') {
      query = query.eq('applications.campus', campusFilter);
    }
    const { data, error } = await query;
    if (error) { console.error('Error loading payments:', error); }
    else { setPayments(data || []); }
  }, [supabase]);

  const loadApplications = useCallback(async (campusFilter: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('applications')
      .select('id, full_name, admission_number, course_id, current_semester, current_module, course_type_id, total_balance, exam_body, courses(name), course_types(level)')
      .eq('campus', campusFilter)
      .eq('status', 'enrolled')
      .order('full_name', { ascending: true });
    if (error) { console.error('Error loading applications:', error); }
    else { setApplications(data || []); }
  }, [supabase]);

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

      await loadPayments(userCampus);
      await loadApplications(userCampus);
      setLoading(false);
    };
    checkAuth();
  }, [router, loadPayments, loadApplications]);

  const handleApplicationChange = async (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId);
    if (application) {
      setSelectedApplication(application);
      setFormData({
        ...formData,
        application_id: applicationId,
        semester: application.current_semester,
        module: application.current_module
      });

      // Load student's course fee structure
      try {
        const { data: student } = await supabase
          .from('applications')
          .select('course_type_id, current_semester, current_module')
          .eq('id', applicationId)
          .single();

        if (student) {
          // Get course type info
          const { data: courseType } = await supabase
            .from('course_types')
            .select('*, courses(*)')
            .eq('id', student.course_type_id)
            .single();

          if (courseType) {
            const examBody = courseType.courses?.exam_body || 'internal';

            // Get module and semester data
            const { data: module } = await supabase
              .from('modules')
              .select('*, semesters(*)')
              .eq('course_type_id', student.course_type_id)
              .eq('module_index', student.current_module)
              .single();

            if (module) {
              let tuitionAmount = 0;
              let practicalAmount = 0;
              let examAmount = 0;

              if (examBody === 'internal' && courseType.study_mode === 'short-course') {
                // Short course - use course_id link
                const { data: shortCourse } = await supabase
                  .from('short_courses')
                  .select('*')
                  .eq('course_id', courseType.course_id)
                  .single();
                if (shortCourse) {
                  tuitionAmount = shortCourse.first_installment + shortCourse.subsequent_installment;
                  practicalAmount = shortCourse.practical_fee;
                }
              } else if (examBody === 'CDACC' && module.semesters && module.semesters.length === 0) {
                // CDACC once_per_stage
                tuitionAmount = module.fee;
                examAmount = module.exam_fee;
              } else {
                // Standard modular courses
                const semester = module.semesters?.find((s: any) => s.semester_index === student.current_semester);
                if (semester) {
                  tuitionAmount = semester.fee;
                  practicalAmount = semester.practical_fee;
                  examAmount = module.exam_fee;
                  // JP: add course-level exam fee
                  if (examBody === 'JP') {
                    examAmount += courseType.exam_fee || 0;
                  }
                }
              }

              // Update FEE_TYPES with actual amounts
              const updatedFeeTypes = [
                { id: 'tuition', label: 'Tuition Fee', icon: '🎓', amount: tuitionAmount },
                { id: 'practical', label: 'Practical Fee', icon: '🔬', amount: practicalAmount },
                { id: 'exam', label: 'Exam Fee', icon: '📝', amount: examAmount },
                { id: 'other', label: 'Other Fee', icon: '💼', amount: 0 },
              ];
              setFeeTypes(updatedFeeTypes);
            }
          }
        }
      } catch (err) {
        console.error('Error loading fee structure:', err);
      }
    }
  };

  const getTransactionIdHint = () => {
    if (formData.payment_method === 'mpesa') return 'Enter M-Pesa confirmation code (e.g., QHG2XXXXX)';
    if (formData.payment_method === 'bank_transfer') return 'Enter bank transfer reference number';
    if (formData.payment_method === 'card') return 'Enter card transaction ID';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const receiptNum = generateReceiptNumber();
    setReceiptNumber(receiptNum);
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount.toString()),
      semester: parseInt(formData.semester.toString()),
      module: parseInt(formData.module.toString()),
      receipt_number: receiptNum,
      status: 'completed' as const
    };
    const { error } = await supabase.from('fee_payments').insert([submitData]);
    if (error) { console.error('Error recording payment:', error); } 
    else {
      const { updateFinancialHoldAfterPayment } = await import('@/lib/fee-calculation');
      await updateFinancialHoldAfterPayment(formData.application_id);
      setShowReceipt(true);
      await loadPayments(campus);
    }
  };

  const handleNewPayment = () => {
    setShowReceipt(false); setShowForm(false); setSelectedApplication(null);
    setFeeTypes(DEFAULT_FEE_TYPES);
    setSelectedExamBody('all');
    setSearchQuery('');
    setFormData({ application_id: '', payment_type: 'tuition', amount: 0, payment_method: 'cash', transaction_id: '', payment_date: new Date().toISOString().split('T')[0], semester: 1, module: 1, notes: '' });
  };

  const getCampusName = (c: string) => c === 'main' ? 'Main Campus' : 'West Campus';
  const filteredPayments = filterStatus === 'all' ? payments : payments.filter(p => p.status === filterStatus);
  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchQuery ||
      app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.admission_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.courses?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExamBody = selectedExamBody === 'all' || app.exam_body === selectedExamBody;
    return matchesSearch && matchesExamBody;
  });

  if (loading) {
    return <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 flex items-center justify-center"><div className="text-white text-xl">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      <div className="relative z-10 w-full">
        <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/admin/dashboard')} className="text-purple-200 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h1 className="text-xl md:text-2xl font-bold text-white">Fee Payments</h1>
            </div>
            <p className="text-purple-200 text-sm">{getCampusName(campus)}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <button onClick={() => setShowForm(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-300 font-semibold">Record Payment</button>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-white text-sm">Exam Body:</label>
              <button
                onClick={() => setSelectedExamBody('all')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'all' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedExamBody('KNEC')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'KNEC' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                KNEC
              </button>
              <button
                onClick={() => setSelectedExamBody('CDACC')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'CDACC' ? 'bg-green-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                CDACC
              </button>
              <button
                onClick={() => setSelectedExamBody('JP')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'JP' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                JP
              </button>
              <button
                onClick={() => setSelectedExamBody('internal')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'internal' ? 'bg-pink-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
              >
                Short Course
              </button>
              <div className="w-px h-6 bg-white/30 mx-2"></div>
              <label className="text-white text-sm">Status:</label>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="all">All Status</option><option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Record Payment</h2>
                  {receiptNumber && <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-mono font-bold">{receiptNumber}</span>}
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exam Body Filter</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedExamBody('all')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExamBody('KNEC')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'KNEC' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        KNEC
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExamBody('CDACC')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'CDACC' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        CDACC
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExamBody('JP')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'JP' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        JP
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedExamBody('internal')}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedExamBody === 'internal' ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        Short Course
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, admission number, or course..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                    <select value={formData.application_id} onChange={(e) => handleApplicationChange(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base" required>
                      <option value="">Choose a student...</option>
                      {filteredApplications.map((app) => <option key={app.id} value={app.id}>{app.full_name} - {app.admission_number} - {app.courses?.name}</option>)}
                    </select>
                  </div>

                  {selectedApplication && (
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">{selectedApplication.full_name.split(' ').map(n => n[0]).join('')}</div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-800">{selectedApplication.full_name}</div>
                          <div className="text-sm text-purple-600 font-mono">Reg: {selectedApplication.admission_number}</div>
                          <div className="text-xs text-gray-500">Course: {selectedApplication.courses?.name}</div>
                          <div className="text-xs text-gray-500">Level: {selectedApplication.course_types?.level}</div>
                          <div className="text-xs text-gray-500">Module: {selectedApplication.current_module} | Semester: {selectedApplication.current_semester}</div>
                          <div className="text-sm font-bold text-red-600 mt-1">Balance: KES {selectedApplication.total_balance?.toLocaleString() || 0}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Fee Type</label>
                    <div className="grid grid-cols-4 gap-3">
                      {feeTypes.map((fee) => (
                        <button key={fee.id} type="button" onClick={() => setFormData({ ...formData, payment_type: fee.id as 'tuition' | 'practical' | 'exam' | 'other', amount: fee.amount })}
                          className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all duration-200 text-center ${formData.payment_type === fee.id ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 text-gray-600'}`}>
                          <span className="text-2xl">{fee.icon}</span><span className="text-xs font-medium">{fee.label}</span>
                          {fee.amount > 0 && <span className="text-xs text-purple-600 font-bold">KES {fee.amount.toLocaleString()}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">KES</span>
                      <input type="number" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        className="w-full pl-14 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xl font-bold" min="0" step="0.01" required placeholder="0.00" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                       <select value={formData.payment_method} onChange={(e) => {
                         const val = e.target.value as 'cash' | 'bank_transfer' | 'card' | 'mpesa';
                         setFormData({ 
                           ...formData, 
                           payment_method: val,
                           transaction_id: val === 'cash' ? '' : formData.transaction_id 
                         })
                       }}
                         className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base" required>
                         {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                       </select>
                     </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{formData.payment_method === 'cash' ? 'Transaction ID' : 'Transaction Reference'}</label>
                      {formData.payment_method === 'cash' ? (
                        <input type="text" value="N/A - Cash Payment" disabled className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 text-base" />
                      ) : (
                        <>
                          <input type="text" value={formData.transaction_id} onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base" placeholder={getTransactionIdHint()} />
                          <p className="text-xs text-gray-400 mt-1">{getTransactionIdHint()}</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                      <input type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                      <input type="number" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base" min="1" max="6" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
                      <input type="number" value={formData.module} onChange={(e) => setFormData({ ...formData, module: parseInt(e.target.value) || 1 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base" min="1" required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base" rows={3} placeholder="Additional notes..." />
                  </div>

                  {(selectedApplication || formData.amount > 0) && (
                    <div className="bg-gray-900 text-white rounded-xl p-4 border border-gray-700">
                      <div className="text-sm text-gray-400 mb-2">PAYMENT SUMMARY</div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        {selectedApplication && (
                          <div><div className="text-gray-500">Student</div><div className="font-medium truncate">{selectedApplication.full_name}</div></div>
                        )}
                        <div><div className="text-gray-500">Fee Type</div><div className="font-medium capitalize">{formData.payment_type}</div></div>
                        <div><div className="text-gray-500">Method</div><div className="font-medium capitalize">{formData.payment_method}</div></div>
                        <div><div className="text-gray-500">Date</div><div className="font-medium">{new Date(formData.payment_date).toLocaleDateString()}</div></div>
                        <div className="text-right"><div className="text-gray-500">Total</div><div className="text-xl font-bold text-green-400">KES {formData.amount.toLocaleString()}</div></div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button type="button" onClick={() => { setShowForm(false); setShowReceipt(false); setSelectedApplication(null); setReceiptNumber(''); setFeeTypes(DEFAULT_FEE_TYPES); setSelectedExamBody('all'); setSearchQuery(''); }}
                      className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors duration-200 font-semibold">Cancel
                    </button>
                    <button type="submit" className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-200 font-semibold shadow-lg shadow-purple-500/20">
                      Record Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {showReceipt && selectedApplication && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Recorded Successfully!</h2>
                  <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-mono font-bold inline-block">{receiptNumber}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><span className="text-xs text-gray-500">Student</span><div className="font-medium">{selectedApplication.full_name}</div><div className="text-sm text-gray-500 font-mono">{selectedApplication.admission_number}</div></div>
                    <div><span className="text-xs text-gray-500">Fee Type</span><div className="font-medium capitalize">{formData.payment_type}</div></div>
                    <div><span className="text-xs text-gray-500">Amount</span><div className="font-bold text-lg">KES {formData.amount.toLocaleString()}</div></div>
                    <div><span className="text-xs text-gray-500">Payment Method</span><div className="font-medium capitalize">{formData.payment_method}</div></div>
                    <div><span className="text-xs text-gray-500">Date</span><div className="font-medium">{new Date(formData.payment_date).toLocaleDateString()}</div></div>
                    <div><span className="text-xs text-gray-500">Sem/Mod</span><div className="font-medium">S{formData.semester} M{formData.module}</div></div>
                    {formData.transaction_id && formData.transaction_id !== 'N/A - Cash Payment' && (
                      <div className="col-span-2"><span className="text-xs text-gray-500">Transaction Reference</span><div className="font-mono font-medium">{formData.transaction_id}</div></div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleNewPayment} className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors duration-200 font-semibold">Record Another Payment</button>
                  <button onClick={() => { setShowReceipt(false); setShowForm(false); setSelectedApplication(null); setReceiptNumber(''); }}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors duration-200 font-semibold">Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5"><tr className="text-purple-200">
                <th className="text-left py-3 px-4">Receipt #</th><th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Type</th><th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Method</th><th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Sem/Mod</th><th className="text-left py-3 px-4">Status</th>
              </tr></thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-purple-200">No payments recorded yet.</td></tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment.id} className="text-white border-t border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 font-mono text-sm">{payment.receipt_number}</td>
                      <td className="py-3 px-4"><div><div className="font-medium">{payment.application?.full_name}</div><div className="text-purple-200 text-sm">{payment.application?.admission_number}</div></div></td>
                      <td className="py-3 px-4 capitalize">{payment.payment_type}</td>
                      <td className="py-3 px-4 font-bold">KES {payment.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 capitalize">{payment.payment_method}</td>
                      <td className="py-3 px-4">{new Date(payment.payment_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">S{payment.semester} M{payment.module}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs font-medium ${payment.status === 'completed' ? 'bg-green-500/20 text-green-300' : payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' : payment.status === 'failed' ? 'bg-red-500/20 text-red-300' : 'bg-gray-500/20 text-gray-300'}`}>{payment.status}</span></td>
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
