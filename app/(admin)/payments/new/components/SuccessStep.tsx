'use client'
import React from 'react'
import { FeePayment } from '../types'

export default function SuccessStep({ form, onRecordAnother }: { form: Omit<FeePayment, 'id' | 'created_at' | 'updated_at'>, onRecordAnother: () => void }) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
      <h3 className="text-xl font-bold text-white mb-2">Payment Recorded</h3>
      <p className="text-purple-300/50 text-sm mb-6">Receipt: <span className="font-mono text-indigo-300">{form.receipt_number}</span></p>
      <button onClick={onRecordAnother} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
        Record Another Payment
      </button>
    </div>
  )
}
