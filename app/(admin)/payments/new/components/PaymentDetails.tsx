'use client'
import React from 'react'
import styles from './styles.module.css'
import { FeePayment } from '../types'
import MethodToggle from './MethodToggle'
import ClearancePreview from './ClearancePreview'
import { fmt } from '../utils'

export default function PaymentDetails({ form, update, errors, onBack, onNext }: {
  form: Omit<FeePayment, 'id'|'created_at'|'updated_at'>
  update: (c: Partial<typeof form>) => void
  errors: Record<string, string>
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <div className={styles.label}>Payment Details</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        <div style={{ gridColumn: '1/-1' }}>
          <MethodToggle value={form.payment_method} onChange={(m) => { update({ payment_method: m as any, transaction_id: '' }) }} />
        </div>

        <div>
          <div className={styles.label}>Amount (KES)</div>
          <input className={styles.input} type="number" value={form.amount || ''} onChange={e => update({ amount: parseFloat(e.target.value) || 0 })} placeholder="0" />
          {errors.amount && <div className={styles.error}>{errors.amount}</div>}
        </div>

        <div>
          <div className={styles.label}>Payment Type</div>
          <select className={styles.input} value={form.payment_type} onChange={e => update({ payment_type: e.target.value as any })}>
            <option value="tuition">Tuition</option>
            <option value="practical">Practical</option>
            <option value="exam">Exam</option>
            <option value="extra">Extra</option>
          </select>
        </div>

        {form.payment_method !== 'cash' && (
          <div>
            <div className={styles.label}>Reference</div>
            <input className={styles.input} value={form.transaction_id || ''} onChange={e => update({ transaction_id: e.target.value })} placeholder="Transaction reference" />
            {errors.transaction_id && <div className={styles.error}>{errors.transaction_id}</div>}
          </div>
        )}

        <div>
          <div className={styles.label}>Payment Date</div>
          <input type="date" className={styles.input} value={form.payment_date} onChange={e => update({ payment_date: e.target.value })} />
          {errors.payment_date && <div className={styles.error}>{errors.payment_date}</div>}
        </div>

        <div>
          <div className={styles.label}>Receipt Number</div>
          <input className={styles.input} value={form.receipt_number ?? ''} onChange={e => update({ receipt_number: e.target.value })} />
        </div>

        <div>
          <div className={styles.label}>Status</div>
          <select className={styles.input} value={form.status} onChange={e => update({ status: e.target.value as any })}>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div style={{ gridColumn: '1/-1' }}>
          <div className={styles.label}>Notes</div>
          <textarea className={styles.input} rows={3} value={form.notes ?? ''} onChange={e => update({ notes: e.target.value })} placeholder="Optional notes..." />
        </div>

        <div style={{ gridColumn: '1/-1' }}>
          <ClearancePreview fee={0} paid={Number(form.amount || 0)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className={styles.secondary} onClick={onBack}>Back</button>
        <button className={styles.primary} onClick={onNext}>Review & Confirm</button>
      </div>
    </div>
  )
}
