'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import type { Law } from '@/types';

export function LawCard({ law, index }: { law: Law; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
    >
      <Link
        href={ROUTES.law(law._id)}
        style={{
          display: 'block',
          textDecoration: 'none',
          background: '#0D1C3A',
          border: '1px solid #1C3260',
          borderLeft: '2px solid #C8A843',
          borderRadius: 10,
          padding: '22px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            marginBottom: 14,
          }}
        >
          <h2
            className="display"
            style={{ margin: 0, fontSize: '1.6rem', lineHeight: 1.15, color: '#FFFFFF' }}
          >
            {law.title}
          </h2>
          <span
            className="mono"
            style={{
              whiteSpace: 'nowrap',
              color: '#C8A843',
              background: 'rgba(200,168,67,0.1)',
              border: '1px solid rgba(200,168,67,0.2)',
              borderRadius: 999,
              padding: '3px 8px',
              fontSize: '0.66rem',
            }}
          >
            {law.code}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Stat value={law.totalSections} label="розділів" />
          <Stat value={law.totalArticles} label="статей" />
          {law.totalParagraphs ? <Stat value={law.totalParagraphs} label="абзаців" /> : null}
        </div>
      </Link>
    </motion.div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mono" style={{ color: '#FFFFFF', fontSize: '1rem' }}>
        {value}
      </div>
      <div
        className="mono"
        style={{ color: '#7A98C0', fontSize: '0.62rem', textTransform: 'uppercase' }}
      >
        {label}
      </div>
    </div>
  );
}
