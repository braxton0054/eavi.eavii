'use client'
import { useState } from 'react'
import FixModal from './FixModal'

export default function FixCard({ fix, onApplied }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div style={{
        border: '1px solid #e5e7eb', borderRadius: 10,
        padding: '12px 14px', marginTop: 10, background: 'white',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 500, color: '#111' }}>
              {fix.issue}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
              {fix.impact}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              marginLeft: 12, padding: '6px 14px', borderRadius: 8,
              background: '#111', color: 'white', border: 'none',
              cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap',
            }}
          >
            Apply fix
          </button>
        </div>
      </div>

      {showModal && (
        <FixModal
          fix={fix}
          onClose={() => setShowModal(false)}
          onApplied={onApplied}
        />
      )}
    </>
  )
}
