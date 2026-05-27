'use client'
import React, { useState, useEffect } from 'react'
import { StudentProfile, SemesterOption, PaymentHistoryItem, FeePayment } from '../types'
import { genReceipt, fmt } from '../utils'
import SemesterSelector from './SemesterSelector'
import PaymentDetails from './PaymentDetails'
import ConfirmStep from './ConfirmStep'
import SuccessStep from './SuccessStep'
import PaymentSidebar from './PaymentSidebar'
import { recordPayment } from '../actions'
import MpesaPayButton from '@/components/payhero/MpesaPayButton'

type Props = { student: StudentProfile; semesters: SemesterOption[]; recentPayments: PaymentHistoryItem[] }

export default function FeePaymentForm({ student, semesters, recentPayments }: Props) {
  const [step, setStep] = useState(1)
  const [payheroConfig, setPayheroConfig] = useState<{ paybill_no: string; channel_id: number; is_active: boolean } | null>(null)

  useEffect(() => {
    import('@/lib/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.from('payhero_config').select('paybill_no, channel_id, is_active').single()
        .then(({ data }: { data: any }) => { if (data) setPayheroConfig(data) })
    })
  }, [])

  const initial: Omit<FeePayment, 'id' | 'created_at' | 'updated_at'> = {
    application_id: student.id, semester_id: '', module_id: '', payment_type: 'tuition',
    amount: 0, payment_method: 'cash', transaction_id: '', payment_date: new Date().toISOString().split('T')[0],
    status: 'completed', receipt_number: genReceipt(), notes: ''
  }
  const [form, setForm] = useState(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [working, setWorking] = useState(false)

  function update(changes: Partial<typeof form>) { setForm(prev => ({ ...prev, ...changes })) }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.semester_id) e.semester_id = 'Select a semester'
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter an amount > 0'
    if (form.payment_method !== 'cash' && (!form.transaction_id || !form.transaction_id.trim())) e.transaction_id = 'Reference required'
    if (!form.payment_date) e.payment_date = 'Payment date required'
    setErrors(e); return Object.keys(e).length === 0
  }

  async function onConfirm() {
    if (!validate()) return setStep(2)
    setWorking(true)
    try {
      const res = await recordPayment(form)
      if (res?.success) setStep(4); else setErrors({ submit: res?.error ?? 'Unknown error' })
    } catch (err: any) { setErrors({ submit: err?.message ?? String(err) }) }
    finally { setWorking(false) }
  }

  function reset() { setForm({ ...initial, receipt_number: genReceipt() }); setStep(1); setErrors({}) }

  const selectedSemester = semesters.find(s => s.id === form.semester_id)
  const canPayHero = payheroConfig && payheroConfig.is_active && payheroConfig.channel_id > 0
  const steps = ['Select Semester', 'Payment Details', 'Review & Confirm', 'Done']

  return (
    <div className="flex gap-6">
      <div className="flex-1">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-5">
          {[1,2,3,4].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>{s}</div>
              {s < 4 && <div className={`w-6 h-0.5 ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
          <span className="text-xs text-gray-400 ml-2">{steps[step-1]}</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {step === 1 && <SemesterSelector semesters={semesters} selected={form.semester_id ?? undefined} onSelect={(id, mid) => { update({ semester_id: id, module_id: mid }); setStep(2) }} />}
          {step === 2 && <PaymentDetails form={form} update={update} errors={errors} onBack={() => setStep(1)} onNext={() => { if (validate()) setStep(3) }} />}
          {step === 3 && <ConfirmStep form={form} semester={selectedSemester} studentName={student.full_name} onEdit={() => setStep(2)} onConfirm={onConfirm} working={working} error={errors.submit} />}
          {step === 4 && <SuccessStep form={form} onRecordAnother={reset} />}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <PaymentSidebar semesters={semesters} outstanding={student.total_balance} recent={recentPayments} />

        {selectedSemester && selectedSemester.fee > 0 && canPayHero && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Pay via M-Pesa</p>
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-center mb-3">
              <p className="text-[10px] text-gray-400 mb-1">Paybill</p>
              <p className="text-xl font-bold text-gray-900 font-mono">{payheroConfig.paybill_no}</p>
            </div>
            <MpesaPayButton
              applicationId={student.id}
              amount={selectedSemester.fee - selectedSemester.paid}
              studentName={student.full_name}
              paybillNo={payheroConfig.paybill_no}
              onPaymentSuccess={() => { reset(); window.location.reload() }}
            />
          </div>
        )}

        {!canPayHero && selectedSemester && (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400">{payheroConfig ? 'Pay Hero channel not active' : 'M-Pesa not configured. Set up in admin settings.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
