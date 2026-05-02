'use client'
import React from 'react'
import styles from './styles.module.css'
import { SemesterOption } from '../types'
import { fmt, pct, clrColor } from '../utils'

export default function SemesterCard({ semester, active }: { semester: SemesterOption, active?: boolean }){
  const percent = pct(semester.fee || 1, semester.paid || 0)
  const clr = clrColor(percent)
  return (
    <div className={`${styles.semesterCard} ${active ? styles.semesterCardActive : ''}`}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontWeight:700 }}>{semester.module_label} — Sem {semester.semester_index}</div>
          <div className={styles.muted}>Fee: KES {fmt(semester.fee)} • Paid: KES {fmt(semester.paid)}</div>
        </div>
        <div style={{ width:120 }}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${Math.min(100, percent)}%` }} />
          </div>
          <div style={{ marginTop:8 }} className={styles.muted}>{percent}%</div>
        </div>
      </div>
      <div style={{ marginTop:10 }} className={`${styles.clearPreview} ${clr === 'success' ? styles['clear-success'] : clr === 'warning' ? styles['clear-warning'] : styles['clear-danger']}`}>
        <div style={{ fontWeight:700 }}>{clr === 'success' ? 'Cleared' : clr === 'warning' ? 'Partial' : 'Not Cleared'}</div>
        <div className={styles.muted} style={{ marginLeft:'auto' }}>{clr === 'success' ? 'Good' : 'Action needed'}</div>
      </div>
    </div>
  )
}
