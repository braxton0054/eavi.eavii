export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0e0020' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '48px', height: '48px', border: '3px solid rgba(201,168,76,0.3)', borderTopColor: '#c9a84c', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#c9a84c', fontSize: '14px', fontWeight: 500, letterSpacing: '0.05em' }}>LOADING...</p>
      </div>
    </div>
  );
}