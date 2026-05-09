import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0e0020',
      color: '#e2dcc8',
      fontFamily: 'system-ui, sans-serif',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '96px',
        fontWeight: 900,
        color: '#c9a84c',
        lineHeight: 1,
        marginBottom: '8px',
      }}>404</div>
      <p style={{
        fontSize: '18px',
        color: '#c9a84c',
        letterSpacing: '0.05em',
        marginBottom: '24px',
      }}>Page not found</p>
      <p style={{
        fontSize: '14px',
        color: 'rgba(226,220,200,0.6)',
        marginBottom: '32px',
        maxWidth: '400px',
      }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 28px',
        background: '#c9a84c',
        color: '#0e0020',
        borderRadius: '8px',
        fontWeight: 600,
        fontSize: '14px',
        textDecoration: 'none',
      }}>
        ← Back to Home
      </Link>
    </div>
  );
}
