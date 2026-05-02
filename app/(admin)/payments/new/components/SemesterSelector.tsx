'use client'
import React from 'react'
import styles from './styles.module.css'
import { SemesterOption } from '../types'
import SemesterCard from './SemesterCard'

export default function SemesterSelector({ semesters, selected, onSelect }:{ semesters: SemesterOption[], selected?: string, onSelect:(id:string,moduleId:string)=>void }){
  return (
    <div>
      <div className={styles.label}>Select Semester</div>
      <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
        {semesters.map(s => (
          <div key={s.id} onClick={() => onSelect(s.id, s.module_id)}>
            <SemesterCard semester={s} active={s.id === selected} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16 }}>
        <button className={styles.secondary} onClick={() => {/* noop: continue handled by selection */}}>Continue</button>
      </div>
    </div>
  )
}
