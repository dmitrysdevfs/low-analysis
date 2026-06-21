"use client";

import { X, ExternalLink, Crosshair } from "lucide-react";
import type { GraphNode } from "../types/graph.types";
import { getLawTypeColor } from "../lib/buildGraph";
import styles from "./GraphInfoPanel.module.scss";

interface GraphInfoPanelProps {
  node: GraphNode | null;
  onClose: () => void;
  onNavigate: (lawId: string) => void;
}

export function GraphInfoPanel({
  node,
  onClose,
  onNavigate,
}: GraphInfoPanelProps) {
  if (!node) return null;

  const { data } = node;
  const accentColor = getLawTypeColor(data.lawType);

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          aria-label="Закрити"
        >
          <X size={15} />
        </button>
      </div>

      <div className={styles.body}>
        <div
          className={styles.typeBadge}
          style={{
            color: accentColor,
            borderColor: accentColor + "40",
            background: accentColor + "18",
          }}
        >
          {data.lawType}
        </div>

        <h2 className={styles.title}>{data.label}</h2>

        <dl className={styles.meta}>
          {data.adoptedYear && (
            <>
              <dt>Рік прийняття</dt>
              <dd>{data.adoptedYear}</dd>
            </>
          )}
          <dt>Кількість статей</dt>
          <dd>{data.totalArticles}</dd>
          <dt>Код закону</dt>
          <dd className={styles.code}>{data.code}</dd>
        </dl>

        <div className={styles.actions}>
          <button
            className={styles.primaryBtn}
            onClick={() => onNavigate(data.id)}
          >
            <ExternalLink size={13} />
            Відкрити закон
          </button>

          <button className={styles.secondaryBtn} onClick={onClose}>
            <Crosshair size={13} />
            Показати у графі
          </button>
        </div>
      </div>
    </aside>
  );
}
