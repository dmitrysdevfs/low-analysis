'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TreeNode as TreeNodeModel } from '@/types';
import styles from './TreeNode.module.scss';

interface Props {
  node: TreeNodeModel;
  children?: TreeNodeModel[];
  activeCode: string | null;
  onSelect: (node: TreeNodeModel) => void;
}

export function TreeNode({ node, children = [], activeCode, onSelect }: Props) {
  const [open, setOpen] = useState(true);

  if (node.type === 'section') {
    return (
      <div>
        <button onClick={() => setOpen(value => !value)} className={styles.sectionBtn}>
          <motion.span
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.2 }}
            className={`mono ${styles.sectionArrow}`}
          >
            ▶
          </motion.span>
          <span className={`display ${styles.sectionTitle}`}>{node.title}</span>
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={styles.sectionChildren}
            >
              {children.map(child => (
                <LeafNode
                  key={child.code}
                  node={child}
                  activeCode={activeCode}
                  onSelect={onSelect}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  return <LeafNode node={node} activeCode={activeCode} onSelect={onSelect} />;
}

function LeafNode({
  node,
  activeCode,
  onSelect,
}: {
  node: TreeNodeModel;
  activeCode: string | null;
  onSelect: (node: TreeNodeModel) => void;
}) {
  const isActive = activeCode === node.code;

  return (
    <button
      onClick={() => onSelect(node)}
      className={`${styles.leafBtn} ${isActive ? styles.leafBtnActive : ''}`}
    >
      <span className={`mono ${styles.leafCode}`}>{node.code}</span>
      <span className={`${styles.leafText} ${isActive ? styles.leafTextActive : ''}`}>
        {node.title ?? node.text ?? node.code}
      </span>
    </button>
  );
}
