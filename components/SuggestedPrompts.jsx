const SUGGESTIONS = [
  'Analyze my schema for design issues',
  'Find tables missing indexes',
  'Check which tables have no RLS policies',
  'Why might my queries be slow?',
  'Are my foreign keys set up correctly?',
]

export default function SuggestedPrompts({ onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '8px 0' }}>
      {SUGGESTIONS.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 20, border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer' }}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
