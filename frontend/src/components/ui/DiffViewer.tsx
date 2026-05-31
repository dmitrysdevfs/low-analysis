"use client";

import { useMemo } from "react";
import { diffWordsWithSpace } from "diff";
import styles from "./DiffViewer.module.scss";

interface DiffViewerProps {
  original?: string | null;
  proposed?: string | null;
  className?: string;
}

export default function DiffViewer({ original, proposed, className }: DiffViewerProps) {
  const diffParts = useMemo(() => {
    return diffWordsWithSpace(original || "", proposed || "");
  }, [original, proposed]);

  return (
    <div className={`${styles.diffWrapper} ${className || ""}`}>
      <div className={styles.pane}>
        <div className={styles.paneTitle}>Оригінал</div>
        <div className={styles.paneContent}>
          {diffParts.map((part, index) => {
            if (part.added) {
              return null; // Skip added parts in original view
            }
            if (part.removed) {
              return (
                <del key={index} className={styles.removed}>
                  {part.value}
                </del>
              );
            }
            return <span key={index}>{part.value}</span>;
          })}
        </div>
      </div>

      <div className={styles.pane}>
        <div className={styles.paneTitle}>Пропозиція</div>
        <div className={styles.paneContent}>
          {diffParts.map((part, index) => {
            if (part.removed) {
              return null; // Skip removed parts in proposed view
            }
            if (part.added) {
              return (
                <ins key={index} className={styles.added}>
                  {part.value}
                </ins>
              );
            }
            return <span key={index}>{part.value}</span>;
          })}
        </div>
      </div>
    </div>
  );
}
