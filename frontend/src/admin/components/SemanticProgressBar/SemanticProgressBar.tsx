"use client";

import {
  THRESHOLD_WARNING,
  THRESHOLD_CRITICAL,
} from "../../config/adminConfig";
import styles from "./SemanticProgressBar.module.scss";

interface SemanticProgressBarProps {
  value: number;
  max: number;
  label?: string;
  meta?: string;
  showThresholdMarkers?: boolean;
}

function getColor(pct: number): string {
  if (pct >= THRESHOLD_CRITICAL) return "#c0392b";
  if (pct >= THRESHOLD_WARNING) return "#c8a843";
  return "#4a9e6b";
}

export function SemanticProgressBar({
  value,
  max,
  label,
  meta,
  showThresholdMarkers = true,
}: SemanticProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = getColor(pct);

  return (
    <div className={styles.row}>
      {label && (
        <div className={styles.topRow}>
          <span className={styles.label}>{label}</span>
          <span className={styles.count}>
            {value}/{max}
          </span>
        </div>
      )}
      <div className={styles.track}>
        <span
          className={styles.fill}
          style={{ width: `${pct}%`, background: color }}
        />
        {showThresholdMarkers && (
          <>
            <span
              className={styles.marker}
              style={{ left: `${THRESHOLD_WARNING}%` }}
            />
            <span
              className={styles.marker}
              style={{ left: `${THRESHOLD_CRITICAL}%` }}
            />
          </>
        )}
      </div>
      {meta && <div className={styles.meta}>{meta}</div>}
    </div>
  );
}
