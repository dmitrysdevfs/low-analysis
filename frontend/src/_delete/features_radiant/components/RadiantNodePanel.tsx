"use client";

import { X, BookOpen, Calendar, Hash, ExternalLink } from "lucide-react";
import type { RadiantNode } from "../types/radiant.types";
import { LAW_CLUSTERS } from "../lib/colorScheme";
import styles from "./RadiantNodePanel.module.scss";

interface RadiantNodePanelProps {
  node: RadiantNode | null;
  onClose: () => void;
  onNavigate: (lawId: string) => void;
}

export function RadiantNodePanel({
  node,
  onClose,
  onNavigate,
}: RadiantNodePanelProps) {
  if (!node) return null;

  const clusterLabel =
    LAW_CLUSTERS[node.cluster] ??
    LAW_CLUSTERS[node.lawType.toLowerCase()] ??
    node.lawType;

  return (
    <div className={styles.panel}>
      <div className={styles.header} style={{ borderColor: node.color }}>
        <h2 className={styles.title}>{node.name}</h2>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Закрити"
        >
          <X size={16} />
        </button>
      </div>

      <div className={styles.body}>
        <span
          className={styles.badge}
          style={{
            background: node.color + "22",
            borderColor: node.color + "55",
            color: node.color,
          }}
        >
          {clusterLabel}
        </span>

        <dl className={styles.meta}>
          {node.adoptedYear && (
            <div className={styles.metaRow}>
              <dt>
                <Calendar size={13} />
                Рік прийняття
              </dt>
              <dd>{node.adoptedYear}</dd>
            </div>
          )}

          <div className={styles.metaRow}>
            <dt>
              <BookOpen size={13} />
              Кількість статей
            </dt>
            <dd>{node.totalArticles}</dd>
          </div>

          <div className={styles.metaRow}>
            <dt>
              <Hash size={13} />
              Код закону
            </dt>
            <dd className={styles.code}>{node.code}</dd>
          </div>
        </dl>

        <button
          type="button"
          className={styles.navigateBtn}
          onClick={() => onNavigate(node.id)}
        >
          <ExternalLink size={14} />
          Відкрити закон
        </button>
      </div>
    </div>
  );
}
