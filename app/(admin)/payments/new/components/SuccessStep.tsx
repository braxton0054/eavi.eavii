'use client'
import React from 'react'
import styles from './styles.module.css'
import { FeePayment } from '../types'

export default function SuccessStep({ form, onRecordAnother }:{ form: Omit<FeePayment,'id'|'created_at'|'updated_at'>, onRecordAnother:()=>void }){
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:48, color:'var(--success)' }}>✓</div>
      <h3>Payment recorded</h3>
      <div style={{ marginTop:8 }}>Receipt: <strong>{form.receipt_number}</strong></div>
      <div style={{ marginTop:16 }}>
        <button className={styles.primary} onClick={onRecordAnother}>Record Another Payment</button>
      </div>
    </div>
  )
}
