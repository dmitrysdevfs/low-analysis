export default function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid #1C3260',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
        background: 'rgba(8, 15, 32, 0.96)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: '#7A98C0',
        }}
      >
        Low Analysis · Система аналізу законодавства України
      </span>
      <a
        href="/api-docs"
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: '#C8A843',
          textDecoration: 'none',
        }}
      >
        Документація API
      </a>
    </footer>
  );
}
