"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { StickyNote } from "lucide-react";

import type { Graph1Node, Graph1NodeData } from "../../types/graph1.types";
import styles from "./Law1Node.module.scss";

const LAW_TYPE_COLORS: Record<string, string> = {
  кодекс: "#c8a843",
  кримінальний: "#e05252",
  цивільний: "#4a80d4",
  адміністративний: "#7a98c0",
  трудовий: "#52b788",
  господарський: "#f4a261",
};

function getLawTypeColor(lawType: string): string {
  const lower = lawType.toLowerCase();
  for (const [key, color] of Object.entries(LAW_TYPE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#9eb5d9";
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function Law1NodeInner({ data, selected }: NodeProps<Graph1Node>) {
  const {
    label,
    code,
    lawType,
    totalArticles,
    adoptedYear,
    isPath,
    isHighlighted,
    note,
  } = data as Graph1NodeData;

  const typeColor = getLawTypeColor(lawType);

  return (
    <div
      className={styles.node}
      data-selected={selected ? "true" : undefined}
      data-path={isPath ? "true" : undefined}
      data-highlighted={isHighlighted ? "true" : undefined}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle}
      />

      <div className={styles.topBar} style={{ background: typeColor }} />

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <p className={styles.title}>{truncate(label, 55)}</p>
          {note && (
            <span className={styles.noteIcon} title={note}>
              <StickyNote size={11} />
            </span>
          )}
        </div>

        <div className={styles.meta}>
          <span className={styles.code}>{code}</span>
          {adoptedYear && (
            <span className={styles.year}>{adoptedYear}</span>
          )}
        </div>

        <div className={styles.footer}>
          <span
            className={styles.badge}
            style={{ "--badge-color": typeColor } as React.CSSProperties}
          >
            {lawType}
          </span>
          <span className={styles.articles}>
            {totalArticles} ст.
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle}
      />
    </div>
  );
}

export const Law1Node = memo(Law1NodeInner);
