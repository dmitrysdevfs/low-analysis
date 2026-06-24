"use client";

import { Handle, Position } from "@xyflow/react";
import { getLawTypeColor } from "../../lib/buildGraph";
import type { GraphLaw } from "../../types/graph.types";
import styles from "./LawNode.module.scss";

interface LawNodeProps {
  data: GraphLaw;
  selected?: boolean;
}

export function LawNode({ data, selected }: LawNodeProps) {
  const accentColor = getLawTypeColor(data.lawType);
  const truncatedLabel =
    data.label.length > 60 ? data.label.slice(0, 57) + "..." : data.label;

  return (
    <div
      className={styles.node}
      data-selected={selected || undefined}
      style={{ "--accent": accentColor } as React.CSSProperties}
    >
      <Handle type="target" position={Position.Top} className={styles.handle} />

      <div className={styles.stripe} style={{ background: accentColor }} />

      <div className={styles.body}>
        <p className={styles.title} title={data.label}>
          {truncatedLabel}
        </p>

        <div className={styles.meta}>
          <span className={styles.code}>{data.code}</span>
          {data.adoptedYear && (
            <span className={styles.year}>{data.adoptedYear}</span>
          )}
        </div>

        <div className={styles.footer}>
          <span className={styles.badge}>{data.lawType}</span>
          <span className={styles.articles}>{data.totalArticles} ст.</span>
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
