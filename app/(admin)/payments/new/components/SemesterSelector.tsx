'use client'
import React from 'react'
import { SemesterOption } from '../types'
import SemesterCard from './SemesterCard'

export default function SemesterSelector({ semesters, selected, onSelect }: { semesters: SemesterOption[]; selected?: string; onSelect: (id: string, moduleId: string) => void }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Semester</p>
      <div className="space-y-2">
        {semesters.map(s => (
          <div key={s.id} onClick={() => onSelect(s.id, s.module_id)}>
            <SemesterCard semester={s} active={s.id === selected} />
          </div>
        ))}
      </div>
    </div>
  )
}
