'use client'
import { useEffect, useState } from 'react'

export default function HealthDashboard() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = () => {
    setLoading(true)
    fetch('/api/db-health')
      .then(r => r.json())
      .then(data => { setHealth(data); setLoading(false) })
  }

  useEffect(() => { fetchHealth() }, [])

  if (loading) return <p style={{ fontSize: 13, color: '#6b7280', padding: '1rem' }}>Scanning database...</p>
  if (!health) return null

  const { summary, issues } = health
  const scoreColor = summary.score >= 80 ? '#3B6D11' : summary.score >= 50 ? '#854F0B' : '#A32D2D'

  return (
    <div style={{ padding: '1rem', fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ fontWeight: 500, margin: 0 }}>Database health</p>
        <button onClick={fetchHealth} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}>
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Health score', value: summary.score, color: scoreColor },
          { label: 'Tables', value: summary.totalTables, color: '#111' },
          { label: 'No RLS', value: summary.tablesWithoutRls, color: '#854F0B' },
          { label: 'Open issues', value: summary.issueCount, color: '#A32D2D' },
        ].map(m => (
          <div key={m.label} style={{ background: '#f8f8f8', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: '#888' }}>{m.label}</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 600, color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {issues.length === 0 ? (
        <p style={{ color: '#3B6D11', background: '#EAF3DE', padding: '8px 12px', borderRadius: 6 }}>
          No issues found — database is clean
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {issues.map((issue, i) => (
            <div key={i} style={{ background: 'white', border: '1px solid #f0f0f0', borderRadius: 8, padding: '10px 12px' }}>
              <span style={{
                fontSize: 11, padding: '2px 6px', borderRadius: 4, fontWeight: 500, marginRight: 8,
                background: issue.severity === 'high' ? '#FCEBEB' : '#FAEEDA',
                color: issue.severity === 'high' ? '#A32D2D' : '#854F0B',
              }}>
                {issue.severity.toUpperCase()}
              </span>
              <span style={{ color: '#333' }}>{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
