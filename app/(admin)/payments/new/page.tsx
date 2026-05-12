import React from 'react'
import FeePaymentForm from './components/FeePaymentForm'
import { getStudentProfile, getSemestersForStudent, getRecentPayments } from './actions'

export default async function Page({ searchParams }:{ searchParams?: Promise<{ student?: string }> }){
  const params = await searchParams;
  const adm = params?.student
  if (!adm) {
    return (
      <div style={{ padding:24 }}>
        <h2>Record Fee Payment</h2>
        <p>Provide a student admission number via <code>?student=ADM-2025-0042</code></p>
      </div>
    )
  }

  const student = await getStudentProfile(adm)
  if (!student) {
    return (
      <div style={{ padding:24 }}>
        <h2>No student found for {adm}</h2>
      </div>
    )
  }

  const semesters = await getSemestersForStudent(student.id)
  const recent = await getRecentPayments(student.admission_number)

  return (
    <div style={{ padding:24 }}>
      <FeePaymentForm student={student} semesters={semesters} recentPayments={recent} />
    </div>
  )
}
