'use client'
import React, { useState } from 'react'
import styles from './styles.module.css'
import { StudentProfile, SemesterOption, PaymentHistoryItem, FeePayment } from '../types'
import { genReceipt, fmt, pct, clrColor } from '../utils'
import SemesterSelector from './SemesterSelector'
import PaymentDetails from './PaymentDetails'
import ConfirmStep from './ConfirmStep'
import SuccessStep from './SuccessStep'
import PaymentSidebar from './PaymentSidebar'
import { recordPayment } from '../actions'

type Props = {
  student: StudentProfile
  semesters: SemesterOption[]
  recentPayments: PaymentHistoryItem[]
}

export default function FeePaymentForm({ student, semesters, recentPayments }: Props) {
  const [step, setStep] = useState<number>(1)

  const initial: Omit<FeePayment, 'id' | 'created_at' | 'updated_at'> = {
    application_id: student.id,
    semester_id: '',
    module_id: '',
    payment_type: 'tuition',
    amount: 0,
    payment_method: 'mpesa',
    transaction_id: '',
    payment_date: new Date().toISOString().split('T')[0],
    status: 'completed',
    receipt_number: genReceipt(),
    notes: ''
  }

  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [working, setWorking] = useState(false)

  function update(changes: Partial<typeof form>) {
    setForm(prev => ({ ...prev, ...changes }))
  }

  function validate() {
    const e: Record<string,string> = {}
    if (!form.semester_id) e.semester_id = 'Select a semester'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter an amount > 0'
    if (form.payment_method !== 'cash' && (!form.transaction_id || form.transaction_id.trim() === '')) e.transaction_id = 'Transaction reference is required'
    if (!form.payment_date) e.payment_date = 'Payment date required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onConfirm() {
    if (!validate()) return setStep(2)
    setWorking(true)
    try {
      const res = await recordPayment(form)
      if (res?.success) {
        setStep(4)
      } else {
        setErrors({ submit: res?.error ?? 'Unknown error' })
      }
    } catch (err: any) {
      setErrors({ submit: err?.message ?? String(err) })
    } finally { setWorking(false) }
  }

  function reset() {
    setForm({ ...initial, receipt_number: genReceipt() })
    setStep(1)
    setErrors({})
  }

  // selected semester data
  const selectedSemester = semesters.find(s => s.id === form.semester_id)

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1 }}>
        <div className={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{student.full_name} — Payment</h3>
            <div className={styles.muted}>Steps: Semester → Details → Confirm → Done</div>
          </div>

          {step === 1 && (
            <SemesterSelector
              semesters={semesters}
              selected={form.semester_id ?? undefined}
              onSelect={(id, moduleId) => { update({ semester_id: id, module_id: moduleId }); setStep(2) }}
            />
          )}

          {step === 2 && (
            <PaymentDetails
              form={form}
              update={update}
              errors={errors}
              onBack={() => setStep(1)}
              onNext={() => { if (validate()) setStep(3) }}
            />
          )}

          {step === 3 && (
            <ConfirmStep
              form={form}
              semester={selectedSemester}
              onEdit={() => setStep(2)}
              onConfirm={onConfirm}
              working={working}
              error={errors.submit}
            />
          )}

          {step === 4 && (
            <SuccessStep form={form} onRecordAnother={reset} />
          )}
        </div>
      </div>

      <div className={styles.sidebar}>
        <PaymentSidebar semesters={semesters} outstanding={student.total_balance} recent={recentPayments} />
      </div>
    </div>
  )
}
