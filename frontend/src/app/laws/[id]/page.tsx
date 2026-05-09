'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Layout } from '@/components/Layout';
import { TreeNode } from '@/components/TreeNode';
import { ROUTES } from '@/constants/routes';
import { useLawTree } from '@/hooks/useLawTree';
import { useLaws } from '@/hooks/useLaws';
import type { TreeNode as TreeNodeModel } from '@/types';

function SidebarSkeleton() {
  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 7 }).map((_, index) => (
        <motion.div
          key={index}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.12 }}
          style={{ height: 13, width: index % 2 === 0 ? '78%' : '55%', background: '#1C3260', borderRadius: 3 }}
        />
      ))}
    </div>
  );
}

export default function LawTreePage() {
  const params = useParams<{ id: string }>();
  const lawId = params?.id;
  const { laws } = useLaws();
  const { tree, loading, error } = useLawTree(lawId);
  const [activeNode, setActiveNode] = useState<TreeNodeModel | null>(null);

  const law = laws.find((item) => item._id === lawId);

  const sections = useMemo(() => {
    const grouped: { section: TreeNodeModel; children: TreeNodeModel[] }[] = [];
    let current: { section: TreeNodeModel; children: TreeNodeModel[] } | null = null;

    for (const node of tree) {
      if (node.type === 'section') {
        current = { section: node, children: [] };
        grouped.push(current);
      } else if (current) {
        current.children.push(node);
      }
    }

    return grouped;
  }, [tree]);

  return (
    <Layout fullHeight>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ borderBottom: '1px solid #1C3260', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: 'rgba(13,28,58,0.9)', backdropFilter: 'blur(6px)' }}
      >
        <Breadcrumb
          items={[
            { label: 'Закони', href: ROUTES.laws },
            { label: law?.title ?? lawId ?? '…' },
            ...(activeNode ? [{ label: activeNode.code }] : []),
          ]}
        />
        {law ? (
          <span className="mono" style={{ marginLeft: 'auto', fontSize: '0.62rem', color: '#C8A843', background: 'rgba(200,168,67,0.08)', border: '1px solid rgba(200,168,67,0.2)', borderRadius: 4, padding: '2px 8px' }}>
            {law.code}
          </span>
        ) : null}
      </motion.div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          style={{ width: 300, flexShrink: 0, borderRight: '1px solid #1C3260', overflowY: 'auto', background: 'linear-gradient(180deg, #0D1C3A 0%, #080F20 100%)' }}
        >
          {loading ? <SidebarSkeleton /> : null}
          {!loading && error ? (
            <div style={{ padding: 16, color: '#FCA5A5', fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>
              {error}
            </div>
          ) : null}
          {!loading && !error
            ? sections.map(({ section, children }) => (
                <TreeNode
                  key={section.code}
                  node={section}
                  children={children}
                  activeCode={activeNode?.code ?? null}
                  onSelect={setActiveNode}
                />
              ))
            : null}
        </motion.aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px', position: 'relative' }}>
          <AnimatePresence mode="wait">
            {activeNode ? (
              <motion.div
                key={activeNode.code}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span className="mono" style={{ fontSize: '0.68rem', color: '#4A80D4', background: 'rgba(74,128,212,0.1)', border: '1px solid rgba(74,128,212,0.25)', borderRadius: 4, padding: '2px 8px', display: 'inline-block', marginBottom: 14 }}>
                  {activeNode.code}
                </span>

                {activeNode.title ? (
                  <h1 className="display" style={{ fontSize: '1.55rem', color: '#FFFFFF', margin: '0 0 18px', lineHeight: 1.2 }}>
                    {activeNode.title}
                  </h1>
                ) : null}

                {activeNode.text ? (
                  <p style={{ fontSize: '1rem', color: '#A8BEDD', lineHeight: 1.8, margin: 0, maxWidth: 680, borderLeft: '3px solid rgba(200,168,67,0.3)', paddingLeft: 20 }}>
                    {activeNode.text}
                  </p>
                ) : (
                  <p style={{ fontSize: '0.9rem', color: '#7A98C0', margin: 0, maxWidth: 680 }}>
                    Для цього вузла немає окремого текстового фрагмента. Оберіть інший елемент дерева.
                  </p>
                )}

                {activeNode.type === 'article' && lawId && activeNode.number ? (
                  <div style={{ marginTop: 24 }}>
                    <Link
                      href={ROUTES.article(lawId, activeNode.number)}
                      style={{ textDecoration: 'none', color: '#C8A843', border: '1px solid #C8A843', borderRadius: 999, padding: '10px 14px', display: 'inline-flex' }}
                    >
                      Відкрити статтю
                    </Link>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '55vh', gap: 10, userSelect: 'none' }}
              >
                <span style={{ fontSize: '2.5rem', color: '#1C3260' }}>§</span>
                <span className="mono" style={{ fontSize: '0.75rem', color: '#7A98C0' }}>
                  Оберіть статтю у дереві
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </Layout>
  );
}
