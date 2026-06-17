"use client";

import type React from "react";
import { motion } from "framer-motion";
import { SparklineChart } from "../SparklineChart/SparklineChart";
import styles from "./MetricCard.module.scss";

interface MetricCardProps {
  label: string;
  value: number | string;
  note?: string;
  trend?: number[];
  delta?: { value: number; positive: boolean };
  color?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function MetricCard({
  label,
  value,
  note,
  trend,
  delta,
  color = "#c8a843",
  icon,
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <article className={styles.card}>
        <motion.div
          className={styles.skeleton}
          animate={{ opacity: [0.35, 0.65, 0.35] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className={styles.skeletonLabel} />
          <div className={styles.skeletonValue} />
          <div className={styles.skeletonBar} />
        </motion.div>
      </article>
    );
  }

  return (
    <motion.article
      className={styles.card}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {icon && (
        <span
          className={styles.iconBadge}
          style={{ background: `${color}1f`, color }}
        >
          {icon}
        </span>
      )}
      <span className={styles.label}>{label}</span>
      <div className={styles.valueRow}>
        <strong className={styles.value}>{value}</strong>
        {delta !== undefined && (
          <span
            className={`${styles.delta} ${delta.positive ? styles.deltaPos : styles.deltaNeg}`}
          >
            {delta.positive ? "↑" : "↓"} {Math.abs(delta.value)}
          </span>
        )}
      </div>
      {trend && trend.length > 1 && (
        <div className={styles.sparkline}>
          <SparklineChart data={trend} color={color} height={44} />
        </div>
      )}
      {note && <p className={styles.note}>{note}</p>}
    </motion.article>
  );
}
