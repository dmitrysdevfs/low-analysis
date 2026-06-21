"use client";

import { useCountUp } from "@/hooks/useCountUp";
import styles from "@/app/page.module.scss";

export function StatItem({
  value,
  label,
  active,
}: {
  value: number;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, 1200, active);

  return (
    <div className={styles.statItem}>
      <div className={`mono ${styles.statValue}`}>{count.toLocaleString()}</div>
      <div className={`mono ${styles.statLabel}`}>{label}</div>
    </div>
  );
}
