"use client";

import { motion } from "framer-motion";
import styles from "./SkeletonCard.module.scss";

interface SkeletonCardProps {
  lines?: number;
  height?: number;
}

export function SkeletonCard({ lines = 3, height }: SkeletonCardProps) {
  return (
    <motion.div
      className={styles.card}
      style={height ? { height } : undefined}
      animate={{ opacity: [0.35, 0.65, 0.35] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className={styles.header} />
      <div className={styles.value} />
      {Array.from({ length: lines - 2 }).map((_, i) => (
        <div
          key={i}
          className={styles.line}
          style={{ width: `${70 + (i % 3) * 10}%` }}
        />
      ))}
    </motion.div>
  );
}
