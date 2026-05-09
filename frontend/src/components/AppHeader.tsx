'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { NAV_ITEMS } from '@/constants/navigation';

function TryzubIcon() {
  return (
    <svg
      width="28"
      height="36"
      viewBox="0 0 28 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 2 L14 34 M14 2 L6 10 M14 2 L22 10 M6 10 L6 18 Q6 22 10 22 L14 22 M22 10 L22 18 Q22 22 18 22 L14 22 M8 34 L20 34"
        stroke="#C8A843"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2 L14 10 M10 6 Q14 2 18 6"
        stroke="#C8A843"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ position: 'sticky', top: 0, zIndex: 20 }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1A3E8A 0%, #0D2460 100%)',
          borderBottom: '1px solid rgba(200,168,67,0.3)',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <TryzubIcon />
        <div>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 700,
              lineHeight: 1,
              textDecoration: 'none',
            }}
          >
            Low Analysis
          </Link>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: '#C8A843',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            Система аналізу законодавства України
          </div>
        </div>
      </div>

      <nav
        style={{
          display: 'flex',
          gap: 2,
          padding: '0 24px',
          background: 'rgba(13, 28, 58, 0.92)',
          borderBottom: '1px solid #1C3260',
          backdropFilter: 'blur(10px)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '12px 16px',
                textDecoration: 'none',
                borderBottom: isActive
                  ? '2px solid #C8A843'
                  : '2px solid transparent',
                color: isActive ? '#C8A843' : '#D6E0F0',
                fontSize: '0.88rem',
                fontWeight: 500,
                transition: 'color 0.2s ease, border-color 0.2s ease',
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </motion.header>
  );
}
