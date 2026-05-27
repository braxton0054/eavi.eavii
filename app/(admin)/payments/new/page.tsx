import React from 'react'
import FeePaymentForm from './components/FeePaymentForm'
import { getStudentProfile, getSemestersForStudent, getRecentPayments } from './actions'

export default async function Page({ searchParams }: { searchParams?: Promise<{ student?: string }> }) {
  const params = await searchParams;
  const adm = params?.student;
  if (!adm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center max-w-md">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Record Fee Payment</h2>
          <p className="text-gray-500 text-sm">Provide a student admission number via <code className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs">?student=ADM-2025-0042</code></p>
        </div>
      </div>
    );
  }

  const student = await getStudentProfile(adm);
  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center max-w-md">
          <h2 className="text-lg font-bold text-red-600 mb-2">Student Not Found</h2>
          <p className="text-gray-500 text-sm">No student found for: <code className="text-gray-700">{adm}</code></p>
        </div>
      </div>
    );
  }

  const semesters = await getSemestersForStudent(student.id);
  const recent = await getRecentPayments(student.admission_number);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#1a1a1a]">
      <header className="sticky top-0 z-40 bg-gray-50 border-b border-[#e5e5e2] h-14">
        <div className="h-full max-w-screen-xl mx-auto px-4 flex items-center gap-4">
          <button onClick={() => window.history.back()} className="text-sm text-[#666] hover:text-[#1a1a1a]">← Back</button>
          <h1 className="font-bold text-sm tracking-tight">Record Payment — {student.full_name}</h1>
        </div>
      </header>
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <FeePaymentForm student={student} semesters={semesters} recentPayments={recent} />
      </div>
    </div>
  );
}
