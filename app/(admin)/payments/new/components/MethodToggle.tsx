'use client'
import React from 'react'
import styles from './styles.module.css'

const METHODS = ['mpesa','bank','cash','card'] as const

export default function MethodToggle({ value, onChange }:{ value:string, onChange:(m:string)=>void }){
  return (
    <div>
      <div className={styles.label}>Payment Method</div>
      <div className={styles.methodGrid} style={{ marginTop:8 }}>
        {METHODS.map(m => (
          <button key={m} type="button" onClick={() => onChange(m)} className={`${styles.methodBtn} ${value===m?styles.methodActive:styles.methodInactive}`}>
            {m.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )
}
