'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { ROUTES } from '@/constants/routes';
import { useSubjects } from '@/hooks/useSubjects';

export default function SubjectsPage() {
  const { subjects, loading, error } = useSubjects();

  return (
    <Layout>
      <div style={{ position: 'relative', overflow: 'hidden', flex: 1 }}>
        <div style={{ position: 'absolute', top: -160, left: -160, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,168,67,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(26,62,138,0.25) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 860, margin: '0 auto', padding: '56px 24px 100px' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ marginBottom: 36 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,168,67,0.08)', border: '1px solid rgba(200,168,67,0.2)', borderRadius: 4, padding: '4px 12px', marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8A843', display: 'inline-block' }} />
              <span className="mono" style={{ fontSize: '0.65rem', color: '#C8A843', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Суб&apos;єкти регулювання
              </span>
            </div>

            <h1 className="display" style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', margin: '0 0 14px', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
              Суб&apos;єкти
              <br />
              <span style={{ color: '#C8A843' }}>регулювання</span>
            </h1>

            <p style={{ fontSize: '0.95rem', color: '#7A98C0', margin: 0, maxWidth: 460, lineHeight: 1.65 }}>
              Фізичні та юридичні особи, права та обов&apos;язки яких регулюються законодавством України.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!loading && !error ? (
              <motion.div
                key={`count-${subjects.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mono"
                style={{ fontSize: '0.68rem', color: '#7A98C0', marginBottom: 16, letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                {subjects.length} суб&apos;єктів у базі
              </motion.div>
            ) : null}
          </AnimatePresence>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }}
                  style={{ height: 90, background: '#0D1C3A', border: '1px solid #1C3260', borderRadius: 6 }}
                />
              ))}
            </div>
          ) : null}

          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 6, padding: '16px 20px', color: '#FCA5A5', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
            >
              {error}
            </motion.div>
          ) : null}

          {!loading && !error && subjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ textAlign: 'center', padding: '60px 0', color: '#7A98C0', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            >
              <div style={{ fontSize: '2rem', marginBottom: 12, color: '#1C3260' }}>§</div>
              Суб&apos;єктів ще немає в базі
            </motion.div>
          ) : null}

          {!loading && !error && subjects.length > 0 ? (
            <AnimatePresence>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {subjects.map((subject, index) => (
                  <motion.div
                    key={subject._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07, duration: 0.4 }}
                    whileHover={{ y: -3 }}
                  >
                    <Link
                      href={ROUTES.subject(subject._id)}
                      style={{ background: '#0D1C3A', border: '1px solid #1C3260', borderLeft: '2px solid #C8A843', borderRadius: 6, padding: '22px 26px', cursor: 'pointer', position: 'relative', overflow: 'hidden', textDecoration: 'none', display: 'block' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <h2 className="display" style={{ fontSize: '1.5rem', color: '#FFFFFF', margin: 0 }}>
                          {subject.name}
                        </h2>
                        <span style={{ color: '#1C3260', fontSize: '1.1rem' }}>→</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {subject.aliases.map((alias) => (
                          <span
                            key={alias}
                            className="mono"
                            style={{ fontSize: '0.6rem', color: '#C8A843', background: 'rgba(200,168,67,0.08)', border: '1px solid rgba(200,168,67,0.2)', borderRadius: 3, padding: '2px 7px' }}
                          >
                            {alias}
                          </span>
                        ))}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
