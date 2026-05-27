'use client'
import React from 'react'
import { FeePayment, SemesterOption } from '../types'
import ClearancePreview from './ClearancePreview'
import { fmt } from '../utils'

export default function ConfirmStep({ form, semester, studentName, onEdit, onConfirm, working, error }: {
  form: Omit<FeePayment, 'id' | 'created_at' | 'updated_at'>
  semester?: SemesterOption | undefined
  studentName?: string
  onEdit: () => void
  onConfirm: () => void
  working?: boolean
  error?: string
}) {
  const rows: [string, string][] = [
    ['Student', studentName || form.application_id],
    ['Semester', semester ? `${semester.module_label} — Sem ${semester.semester_index}` : form.semester_id || '-'],
    ['Amount', `KES ${fmt(form.amount)}`],
    ['Type', form.payment_type],
    ['Method', form.payment_method],
    ['Reference', form.transaction_id || '-'],
    ['Date', form.payment_date],
    ['Receipt', form.receipt_number || '-'],
    ['Status', form.status],
    ['Notes', form.notes || '-'],
  ]

  return (
    <div>
      <div className="text-xs text-purple-300/60 uppercase tracking-wider font-semibold mb-4">Review & Confirm</div>
      <div className="glass-neu-inset p-4">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map(([label, val], i) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="py-2.5 pr-4 text-xs text-purple-300/50 w-32">{label}</td>
                <td className="py-2.5 text-sm text-white font-medium">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <ClearancePreview fee={semester?.fee ?? 0} paid={Number(form.amount || 0)} />
      </div>

      {error && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-5">
        <button onClick={onEdit} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-purple-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          Edit
        </button>
        <button onClick={onConfirm} disabled={working} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {working ? 'Saving...' : 'Confirm & Save'}
        </button>
      </div>
    </div>
  )
}
