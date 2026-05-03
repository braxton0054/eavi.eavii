'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Student {
  id: string;
  full_name: string;
  admission_number: string;
  phone: string;
  email: string;
  campus: string;
  course_id: string;
  course: string;
  course_type: string;
  department: string;
  status: 'enrolled' | 'pending' | 'rejected';
  kcse_grade: string;
  exam_body: string;
  gender: string;
  date_of_birth: string;
  nationality: string;
  national_id: string;
  county: string;
  sub_county: string;
  town: string;
  postal_address: string;
  application_date: string;
  intake: string;
  current_module: number;
  current_semester: number;
  class_name: string;
  financial_hold: boolean;
  total_balance: number;
  credit_balance: number;
  student_status: string;
  sponsorship_type: string;
  sponsor_name: string;
  sponsor_phone: string;
  previous_school: string;
  previous_qualification: string;
  enrollment_type: string;
  has_spring_file: boolean;
  has_rem_paper: boolean;
  has_kcse_photocopy: boolean;
  has_kcpe_photocopy: boolean;
  created_at: string;
}

interface Guardian {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  relationship: string;
  is_emergency_contact: boolean;
}

interface FeePayment {
  id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  payment_date: string;
  receipt_number: string;
  notes: string;
  created_at: string;
}

interface FeeStructure {
  id: string;
  semester_index: number;
  module_index: number;
  fee: number;
  practical_fee: number;
  exam_fee: number;
}

type TabType = 'personal' | 'guardian' | 'fees' | 'payments' | 'documents';

export default function StudentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [supabase, setSupabase] = useState<any>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('personal');

  // Tab data
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Form states
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState<Partial<Student>>({});
  const [newPayment, setNewPayment] = useState({
    amount: '',
    payment_type: 'tuition',
    payment_method: 'cash',
    receipt_number: '',
    notes: ''
  });
  const [newGuardian, setNewGuardian] = useState({
    full_name: '',
    phone: '',
    email: '',
    relationship: '',
    is_emergency_contact: false
  });
  const [documentChecklist, setDocumentChecklist] = useState({
    has_spring_file: false,
    has_rem_paper: false,
    has_kcse_photocopy: false,
    has_kcpe_photocopy: false
  });

  useEffect(() => {
    setSupabase(createClient());
  }, []);

  useEffect(() => {
    if (!supabase || !studentId) return;
    fetchStudent();
  }, [supabase, studentId]);

  useEffect(() => {
    if (!supabase || !studentId) return;
    loadTabData();
  }, [activeTab, supabase, studentId]);

  const fetchStudent = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`*, courses(name, departments(name)), course_types(level)`)
        .eq('id', studentId)
        .single();

      if (error) throw error;

      const enrichedStudent = {
        ...data,
        course: data.courses?.name,
        department: data.courses?.departments?.name,
        course_type: data.course_types?.level
      };

      setStudent(enrichedStudent);
      setPersonalForm(enrichedStudent);
      setDocumentChecklist({
        has_spring_file: data.has_spring_file || false,
        has_rem_paper: data.has_rem_paper || false,
        has_kcse_photocopy: data.has_kcse_photocopy || false,
        has_kcpe_photocopy: data.has_kcpe_photocopy || false
      });
    } catch (err) {
      console.error('Failed to fetch student:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!supabase || !studentId) return;
    setLoadingTab(true);

    try {
      if (activeTab === 'guardian') {
        const { data } = await supabase
          .from('guardians')
          .select('*')
          .eq('application_id', studentId)
          .order('created_at', { ascending: false });
        setGuardians(data || []);
      }

      if (activeTab === 'payments') {
        const { data } = await supabase
          .from('fee_payments')
          .select('*')
          .eq('application_id', studentId)
          .order('payment_date', { ascending: false });
        setPayments(data || []);
      }

      if (activeTab === 'fees' && student?.course_id) {
        const { data } = await supabase
          .from('semesters')
          .select('*')
          .eq('course_id', student.course_id)
          .order('module_index', { ascending: true })
          .order('semester_index', { ascending: true });
        setFeeStructures(data || []);
      }
    } catch (err) {
      console.error('Failed to load tab data:', err);
    } finally {
      setLoadingTab(false);
    }
  };

  const savePersonalInfo = async () => {
    try {
      const { error } = await supabase
        .from('applications')
        .update(personalForm)
        .eq('id', studentId);

      if (error) throw error;

      setEditingPersonal(false);
      fetchStudent();
      alert('Personal information updated!');
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    }
  };

  const addPayment = async () => {
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const { error } = await supabase
        .from('fee_payments')
        .insert([{
          application_id: studentId,
          amount: parseFloat(newPayment.amount),
          payment_type: newPayment.payment_type,
          payment_method: newPayment.payment_method,
          receipt_number: newPayment.receipt_number || null,
          notes: newPayment.notes || null,
          payment_date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;

      setNewPayment({
        amount: '',
        payment_type: 'tuition',
        payment_method: 'cash',
        receipt_number: '',
        notes: ''
      });

      fetchStudent();
      loadTabData();
      alert('Payment recorded successfully!');
    } catch (err: any) {
      alert('Failed to record payment: ' + err.message);
    }
  };

  const addGuardian = async () => {
    if (!newGuardian.full_name || !newGuardian.phone) {
      alert('Please enter name and phone');
      return;
    }

    try {
      const { error } = await supabase
        .from('guardians')
        .insert([{
          application_id: studentId,
          full_name: newGuardian.full_name,
          phone: newGuardian.phone,
          email: newGuardian.email || null,
          relationship: newGuardian.relationship || null,
          is_emergency_contact: newGuardian.is_emergency_contact
        }]);

      if (error) throw error;

      setNewGuardian({
        full_name: '',
        phone: '',
        email: '',
        relationship: '',
        is_emergency_contact: false
      });

      loadTabData();
      alert('Guardian added successfully!');
    } catch (err: any) {
      alert('Failed to add guardian: ' + err.message);
    }
  };

  const deleteGuardian = async (guardianId: string) => {
    if (!confirm('Are you sure you want to delete this guardian?')) return;

    try {
      const { error } = await supabase
        .from('guardians')
        .delete()
        .eq('id', guardianId);

      if (error) throw error;
      loadTabData();
    } catch (err: any) {
      alert('Failed to delete guardian: ' + err.message);
    }
  };

  const updateDocumentChecklist = async () => {
    try {
      const { error } = await supabase
        .from('applications')
        .update(documentChecklist)
        .eq('id', studentId);

      if (error) throw error;
      alert('Document checklist updated!');
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    }
  };

  const toggleFinancialHold = async () => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ financial_hold: !student?.financial_hold })
        .eq('id', studentId);

      if (error) throw error;
      fetchStudent();
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Loading student details...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-500">Student not found</div>
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = (student.total_balance || 0) - totalPaid;

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'guardian', label: 'Guardian', icon: '👨‍👩‍👧' },
    { id: 'fees', label: 'Fees', icon: '💰' },
    { id: 'payments', label: 'Payments', icon: '💳' },
    { id: 'documents', label: 'Documents', icon: '📄' },
  ];

  const renderField = (key: keyof Student, label: string, type: string = 'text', options?: string[]) => {
    const value = personalForm[key] ?? '';

    if (!editingPersonal) {
      return (
        <div key={key} className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-500 text-xs uppercase">{label}</p>
          <p className="text-gray-900">{value || '-'}</p>
        </div>
      );
    }

    if (type === 'select' && options) {
      return (
        <div key={key} className="bg-gray-50 rounded-lg p-4">
          <label className="text-gray-500 text-xs uppercase block mb-1">{label}</label>
          <select
            value={value as string}
            onChange={(e) => setPersonalForm({ ...personalForm, [key]: e.target.value })}
            className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm"
          >
            <option value="">Select...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    }

    return (
      <div key={key} className="bg-gray-50 rounded-lg p-4">
        <label className="text-gray-500 text-xs uppercase block mb-1">{label}</label>
        <input
          type={type}
          value={value as string}
          onChange={(e) => setPersonalForm({ ...personalForm, [key]: e.target.value })}
          className="w-full px-2 py-1 bg-white border border-gray-300 rounded text-gray-900 text-sm"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <Link href="/admin/students" className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block">
            ← Back to Students
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">{student.full_name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">{student.admission_number}</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">{student.campus}</span>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">{student.course}</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              student.status === 'enrolled' ? 'bg-green-100 text-green-800' :
              student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
            }`}>
              {student.status}
            </span>
            {student.financial_hold && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Financial Hold</span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {loadingTab ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <>
            {/* Personal Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                    <button
                      onClick={() => editingPersonal ? savePersonalInfo() : setEditingPersonal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                      {editingPersonal ? 'Save' : 'Edit'}
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {renderField('full_name', 'Full Name')}
                      {renderField('admission_number', 'Admission Number')}
                      {renderField('phone', 'Phone', 'tel')}
                      {renderField('email', 'Email', 'email')}
                      {renderField('gender', 'Gender', 'select', ['male', 'female', 'other'])}
                      {renderField('date_of_birth', 'Date of Birth', 'date')}
                      {renderField('national_id', 'National ID')}
                      {renderField('nationality', 'Nationality')}
                      {renderField('county', 'County')}
                      {renderField('sub_county', 'Sub County')}
                      {renderField('town', 'Town')}
                      {renderField('postal_address', 'Postal Address')}
                      {renderField('kcse_grade', 'KCSE Grade')}
                      {renderField('exam_body', 'Exam Body')}
                      {renderField('course', 'Course')}
                      {renderField('course_type', 'Course Type')}
                      {renderField('department', 'Department')}
                      {renderField('current_module', 'Current Module')}
                      {renderField('current_semester', 'Current Semester')}
                      {renderField('class_name', 'Class')}
                      {renderField('intake', 'Intake')}
                      {renderField('enrollment_type', 'Enrollment Type')}
                      {renderField('student_status', 'Student Status')}
                    </div>
                  </div>
                </div>

                {/* Sponsorship */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Sponsorship</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {renderField('sponsorship_type', 'Type', 'select', ['self', 'government', 'bursary', 'scholarship', 'employer'])}
                      {renderField('sponsor_name', 'Sponsor Name')}
                      {renderField('sponsor_phone', 'Sponsor Phone', 'tel')}
                    </div>
                  </div>
                </div>

                {/* Education History */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Education History</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField('previous_school', 'Previous School')}
                      {renderField('previous_qualification', 'Previous Qualification')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Guardian Tab */}
            {activeTab === 'guardian' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Add Guardian</h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <input type="text" placeholder="Full Name" value={newGuardian.full_name} onChange={(e) => setNewGuardian({...newGuardian, full_name: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <input type="tel" placeholder="Phone" value={newGuardian.phone} onChange={(e) => setNewGuardian({...newGuardian, phone: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <input type="email" placeholder="Email" value={newGuardian.email} onChange={(e) => setNewGuardian({...newGuardian, email: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <input type="text" placeholder="Relationship" value={newGuardian.relationship} onChange={(e) => setNewGuardian({...newGuardian, relationship: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    <div className="mt-4 flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={newGuardian.is_emergency_contact} onChange={(e) => setNewGuardian({...newGuardian, is_emergency_contact: e.target.checked})} className="rounded" />
                        <span className="text-sm text-gray-700">Emergency Contact</span>
                      </label>
                      <button onClick={addGuardian} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Add Guardian</button>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Guardians ({guardians.length})</h2>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {guardians.length === 0 ? (
                      <p className="p-6 text-gray-500">No guardians added yet.</p>
                    ) : (
                      guardians.map((guardian) => (
                        <div key={guardian.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{guardian.full_name}</p>
                            <p className="text-sm text-gray-500">{guardian.phone} {guardian.relationship && `• ${guardian.relationship}`}</p>
                            {guardian.is_emergency_contact && <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Emergency Contact</span>}
                          </div>
                          <button onClick={() => deleteGuardian(guardian.id)} className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium">Delete</button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fees Tab */}
            {activeTab === 'fees' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Fee Summary</h2>
                    <button onClick={toggleFinancialHold} className={`px-4 py-2 rounded-lg text-sm font-medium ${student.financial_hold ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
                      {student.financial_hold ? 'Remove Hold' : 'Place Hold'}
                    </button>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500 text-xs uppercase">Total Fees</p>
                        <p className="text-gray-900 font-semibold text-lg">KES {(student.total_balance || 0).toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500 text-xs uppercase">Paid</p>
                        <p className="text-green-600 font-semibold text-lg">KES {totalPaid.toLocaleString()}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-500 text-xs uppercase">Balance</p>
                        <p className={`font-semibold text-lg ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>KES {balance.toLocaleString()}</p>
                      </div>
                    </div>
                    {student.financial_hold && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-600 text-sm font-medium">⚠️ Financial hold active - results blocked</p></div>}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Fee Structure</h2></div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Module</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Semester</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Tuition</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Practical</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Exam</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {feeStructures.length === 0 ? <tr><td colSpan={6} className="p-6 text-gray-500">No fee structure available.</td></tr> :
                          feeStructures.map((fee) => (
                            <tr key={fee.id} className={student.current_module === fee.module_index && student.current_semester === fee.semester_index ? 'bg-blue-50' : ''}>
                              <td className="py-3 px-6 text-gray-900 text-sm">{fee.module_index}</td>
                              <td className="py-3 px-6 text-gray-900 text-sm">{fee.semester_index}</td>
                              <td className="py-3 px-6 text-gray-600 text-sm">KES {(fee.fee || 0).toLocaleString()}</td>
                              <td className="py-3 px-6 text-gray-600 text-sm">KES {(fee.practical_fee || 0).toLocaleString()}</td>
                              <td className="py-3 px-6 text-gray-600 text-sm">KES {(fee.exam_fee || 0).toLocaleString()}</td>
                              <td className="py-3 px-6 text-gray-900 text-sm font-medium">KES {((fee.fee || 0) + (fee.practical_fee || 0) + (fee.exam_fee || 0)).toLocaleString()}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Record Payment</h2></div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <input type="number" placeholder="Amount (KES)" value={newPayment.amount} onChange={(e) => setNewPayment({...newPayment, amount: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <select value={newPayment.payment_type} onChange={(e) => setNewPayment({...newPayment, payment_type: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="tuition">Tuition</option>
                        <option value="exam">Exam Fee</option>
                        <option value="practical">Practical Fee</option>
                        <option value="registration">Registration</option>
                        <option value="other">Other</option>
                      </select>
                      <select value={newPayment.payment_method} onChange={(e) => setNewPayment({...newPayment, payment_method: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                        <option value="cash">Cash</option>
                        <option value="bank_transfer">Bank Transfer</option>
                        <option value="mpesa">M-Pesa</option>
                        <option value="cheque">Cheque</option>
                      </select>
                      <input type="text" placeholder="Receipt Number" value={newPayment.receipt_number} onChange={(e) => setNewPayment({...newPayment, receipt_number: e.target.value})} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                      <button onClick={addPayment} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">Record Payment</button>
                    </div>
                    <textarea placeholder="Notes (optional)" value={newPayment.notes} onChange={(e) => setNewPayment({...newPayment, notes: e.target.value})} className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" rows={2} />
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Payment History ({payments.length})</h2></div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Date</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Amount</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Type</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Method</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Receipt</th>
                          <th className="text-left py-3 px-6 text-gray-500 font-medium text-xs uppercase">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {payments.length === 0 ? <tr><td colSpan={6} className="p-6 text-gray-500">No payments recorded yet.</td></tr> :
                          payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="py-3 px-6 text-gray-900 text-sm">{payment.payment_date}</td>
                              <td className="py-3 px-6 text-green-600 text-sm font-medium">KES {payment.amount.toLocaleString()}</td>
                              <td className="py-3 px-6 text-gray-600 text-sm capitalize">{payment.payment_type}</td>
                              <td className="py-3 px-6 text-gray-600 text-sm capitalize">{payment.payment_method.replace('_', ' ')}</td>
                              <td className="py-3 px-6 text-gray-600 text-sm">{payment.receipt_number || '-'}</td>
                              <td className="py-3 px-6 text-gray-600 text-sm">{payment.notes || '-'}</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200"><h2 className="text-lg font-semibold text-gray-900">Document Checklist</h2></div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[{ key: 'has_spring_file', label: 'Spring File' }, { key: 'has_rem_paper', label: 'REM Paper' }, { key: 'has_kcse_photocopy', label: 'KCSE Photocopy' }, { key: 'has_kcpe_photocopy', label: 'KCPE Photocopy' }].map((doc) => (
                      <label key={doc.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                        <span className="text-gray-900 font-medium">{doc.label}</span>
                        <input type="checkbox" checked={documentChecklist[doc.key as keyof typeof documentChecklist]} onChange={(e) => setDocumentChecklist({...documentChecklist, [doc.key]: e.target.checked})} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      </label>
                    ))}
                  </div>
                  <button onClick={updateDocumentChecklist} className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Save Document Checklist</button>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
