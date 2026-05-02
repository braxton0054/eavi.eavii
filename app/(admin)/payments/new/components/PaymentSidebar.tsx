'use client'
import React from 'react'
import styles from './styles.module.css'
import { SemesterOption, PaymentHistoryItem } from '../types'
import { fmt, pct, clrColor } from '../utils'

export default function PaymentSidebar({ semesters, outstanding, recent }:{ semesters: SemesterOption[], outstanding:number, recent: PaymentHistoryItem[] }){
  return (
    <div>
      <div className={styles.card}>
        <div className={styles.label}>Semester Overview</div>
        <div style={{ marginTop:10 }}>
          {semesters.map(s => {
            const percent = pct(s.fee||1, s.paid||0)
            const clr = clrColor(percent)
            return (
              <div key={s.id} style={{ marginBottom:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <div className={styles.muted}>{s.module_label} • Sem {s.semester_index}</div>
                  <div style={{ fontWeight:700 }}>{percent}%</div>
                </div>
                <div className={styles.progressTrack} style={{ marginTop:6 }}>
                  <div className={styles.progressFill} style={{ width:`${Math.min(100,percent)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.label}>Outstanding Balance</div>
        <div style={{ marginTop:8, fontSize:24, fontWeight:800, color:'var(--danger)' }}>KES {fmt(outstanding)}</div>
      </div>

      <div className={styles.card}>
        <div className={styles.label}>Recent Payments</div>
        <div style={{ marginTop:8 }}>
          {recent.map(r => (
            <div key={r.receipt_number} className={styles.recentRow}>
              <div style={{ fontWeight:700 }}>{r.receipt_number}</div>
              <div className={styles.muted}>{r.payment_date}</div>
              <div style={{ color:'var(--success)', fontWeight:700 }}>KES {fmt(r.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
