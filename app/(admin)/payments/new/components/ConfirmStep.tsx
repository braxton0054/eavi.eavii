'use client'
import React from 'react'
import styles from './styles.module.css'
import { FeePayment, SemesterOption } from '../types'
import ClearancePreview from './ClearancePreview'
import { fmt } from '../utils'

export default function ConfirmStep({ form, semester, onEdit, onConfirm, working, error }:{ form: Omit<FeePayment,'id'|'created_at'|'updated_at'>, semester?: SemesterOption | undefined, onEdit:()=>void, onConfirm:()=>void, working?:boolean, error?:string }){
  return (
    <div>
      <div className={styles.label}>Review & Confirm</div>
      <div style={{ marginTop:12 }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <tbody>
            <tr><td className={styles.muted}>Student</td><td>{form.application_id}</td></tr>
            <tr><td className={styles.muted}>Semester</td><td>{semester ? `${semester.module_label} — Sem ${semester.semester_index}` : form.semester_id}</td></tr>
            <tr><td className={styles.muted}>Amount</td><td>KES {fmt(form.amount)}</td></tr>
            <tr><td className={styles.muted}>Payment Type</td><td>{form.payment_type}</td></tr>
            <tr><td className={styles.muted}>Method</td><td>{form.payment_method}</td></tr>
            <tr><td className={styles.muted}>Transaction</td><td>{form.transaction_id || '-'}</td></tr>
            <tr><td className={styles.muted}>Date</td><td>{form.payment_date}</td></tr>
            <tr><td className={styles.muted}>Receipt</td><td>{form.receipt_number}</td></tr>
            <tr><td className={styles.muted}>Status</td><td>{form.status}</td></tr>
            <tr><td className={styles.muted}>Notes</td><td>{form.notes || '-'}</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop:12 }}>
        <ClearancePreview fee={semester?.fee ?? 0} paid={Number(form.amount || 0)} />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        <button className={styles.secondary} onClick={onEdit}>Edit</button>
        <button className={styles.primary} onClick={onConfirm} disabled={working}>{working ? 'Saving...' : 'Confirm & Save'}</button>
      </div>
    </div>
  )
}
