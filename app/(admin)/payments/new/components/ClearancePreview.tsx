'use client'
import React from 'react'
import styles from './styles.module.css'
import { clrColor, pct, fmt } from '../utils'

export default function ClearancePreview({ fee, paid }:{ fee:number, paid:number }){
  const percent = fee ? pct(fee, paid) : 0
  const clr = clrColor(percent)
  const cls = clr === 'success' ? styles['clear-success'] : clr === 'warning' ? styles['clear-warning'] : styles['clear-danger']
  return (
    <div className={`${styles.clearPreview} ${cls}`}>
      <div style={{ fontWeight:700 }}>{percent}% cleared</div>
      <div className={styles.muted} style={{ marginLeft:'auto' }}>Balance: KES {fmt(Math.max(0, fee - paid))}</div>
    </div>
  )
}
