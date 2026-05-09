'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Layout } from '@/components/Layout';
import { ROUTES } from '@/constants/routes';
import { useSubjectDetail } from '@/hooks/useSubjectDetail';

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const subjectId = params?.id;
  const { subject, elements, loading, error } = useSubjectDetail(subjectId);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ borderBottom: '1px solid #1C3260', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, background: 'rgba(13,28,58,0.9)', backdropFilter: 'blur(6px)' }}
      >
        <Breadcrumb
          items={[
            { label: "Суб'єкти", href: ROUTES.subjects },
            { label: subject?.name ?? subjectId ?? '…' },
          ]}
        />
      </motion.div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 100px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.15 }}
                  style={{ height: index === 0 ? 48 : 22, width: index === 0 ? '60%' : `${45 + index * 15}%`, background: '#0D1C3A', borderRadius: 4 }}
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 6, padding: '16px 20px', color: '#FCA5A5', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
            >
              {error}
            </motion.div>
          ) : null}

          {!loading && !error && subject ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h1 className="display" style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', color: '#FFFFFF', margin: '0 0 24px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {subject.name}
              </h1>

              {subject.aliases.length > 0 ? (
                <div style={{ marginBottom: 40 }}>
                  <div className="mono" style={{ fontSize: '0.62rem', color: '#7A98C0', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Псевдоніми / синоніми
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {subject.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="mono"
                        style={{ fontSize: '0.72rem', color: '#C8A843', background: 'rgba(200,168,67,0.08)', border: '1px solid rgba(200,168,67,0.25)', borderRadius: 4, padding: '4px 12px' }}
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <h2 className="display" style={{ fontSize: '1.3rem', color: '#FFFFFF', margin: '0 0 16px' }}>
                  Пов&apos;язані елементи законів
                </h2>

                {elements.length === 0 ? (
                  <div style={{ background: 'rgba(74,128,212,0.07)', border: '1px solid rgba(74,128,212,0.2)', borderRadius: 6, padding: '18px 22px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ color: '#4A80D4', fontSize: '1rem', flexShrink: 0 }}>ℹ</span>
                    <p style={{ fontSize: '0.88rem', color: '#A8BEDD', margin: 0, lineHeight: 1.6 }}>
                      Елементи ще не прив&apos;язані. Pipeline AI-аналізу в розробці.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {elements.map((element, index) => (
                      <motion.div
                        key={element._id ?? element.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        style={{ background: '#0D1C3A', border: '1px solid #1C3260', borderRadius: 6, padding: '14px 18px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: element.title || element.text ? 8 : 0 }}>
                          <span className="mono" style={{ fontSize: '0.62rem', color: '#4A80D4', background: 'rgba(74,128,212,0.1)', border: '1px solid rgba(74,128,212,0.25)', borderRadius: 3, padding: '2px 7px', flexShrink: 0 }}>
                            {element.code}
                          </span>
                        </div>
                        {element.title ? (
                          <p style={{ fontSize: '0.88rem', fontWeight: 600, color: '#FFFFFF', margin: '0 0 4px' }}>
                            {element.title}
                          </p>
                        ) : null}
                        {element.text ? (
                          <p style={{ fontSize: '0.85rem', color: '#A8BEDD', margin: 0, lineHeight: 1.65 }}>
                            {element.text}
                          </p>
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
