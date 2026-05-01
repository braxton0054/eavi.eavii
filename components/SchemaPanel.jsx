'use client'
import { useEffect, useState } from 'react'

export default function SchemaPanel() {
  const [schema, setSchema] = useState([])
  const [open, setOpen] = useState(null)

  useEffect(() => {
    fetch('/api/schema').then(r => r.json()).then(setSchema)
  }, [])

  return (
    <div style={{ width: 220, borderRight: '1px solid #e5e7eb', overflowY: 'auto', padding: '1rem', fontSize: 13 }}>
      <p style={{ fontWeight: 500, marginBottom: 12 }}>Database tables</p>
      {schema.map(t => (
        <div key={t.table} style={{ marginBottom: 8 }}>
          <button
            onClick={() => setOpen(open === t.table ? null : t.table)}
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: '4px 0' }}
          >
            {open === t.table ? '▾' : '▸'} {t.table}
          </button>
          {open === t.table && (
            <div style={{ paddingLeft: 12, color: '#6b7280' }}>
              {t.columns.map(c => (
                <div key={c.name} style={{ padding: '2px 0' }}>
                  {c.name}
                  <span style={{ marginLeft: 6, fontSize: 11, background: '#f3f4f6', borderRadius: 4, padding: '1px 5px' }}>{c.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
