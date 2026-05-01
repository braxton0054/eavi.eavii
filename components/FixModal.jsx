'use client'
import { useState } from 'react'

export default function FixModal({ fix, onClose, onApplied }) {
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [error, setError] = useState('')

  const applyFix = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/execute-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: fix.sql }),
      })
      const data = await res.json()
      if (data.ok) {
        setStatus('success')
        setTimeout(() => { onApplied(); onClose() }, 1500)
      } else {
        setError(data.error)
        setStatus('error')
      }
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '1rem',
    }}>
      <div style={{
        background: 'white', borderRadius: 12, padding: '1.5rem',
        maxWidth: 540, width: '100%', fontFamily: 'sans-serif',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: '#111' }}>Apply fix</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>{fix.issue}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#9ca3af' }}>×</button>
        </div>

        {/* SQL preview */}
        <div style={{ background: '#f8f8f8', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: '#888', fontWeight: 500 }}>SQL to execute</p>
          <pre style={{ margin: 0, fontSize: 12, color: '#111', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
            {fix.sql}
          </pre>
        </div>

        {/* Impact */}
        <div style={{ background: '#EAF3DE', borderRadius: 8, padding: '10px 14px', marginBottom: 10 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#3B6D11' }}>
            <strong>What this does:</strong> {fix.impact}
          </p>
        </div>

        {/* Risk */}
        <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '10px 14px', marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#854F0B' }}>
            <strong>Risk:</strong> {fix.risk}
          </p>
        </div>

        {/* Error */}
        {status === 'error' && (
          <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#A32D2D' }}>{error}</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <div style={{ background: '#EAF3DE', borderRadius: 8, padding: '10px 14px', marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 12, color: '#3B6D11' }}>Fix applied successfully!</p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={status === 'loading'}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            onClick={applyFix}
            disabled={status === 'loading' || status === 'success'}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: status === 'success' ? '#3B6D11' : '#111',
              color: 'white', cursor: 'pointer', fontSize: 13,
            }}
          >
            {status === 'loading' ? 'Applying...' : status === 'success' ? 'Applied!' : 'Apply fix'}
          </button>
        </div>
      </div>
    </div>
  )
}
