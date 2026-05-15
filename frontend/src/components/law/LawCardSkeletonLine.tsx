"use client";

import { motion } from "framer-motion";
import styles from "./LawCard.module.scss";

export function LawCardSkeletonLine({ width }: { width: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.2, 0.45, 0.2] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      className={styles.skeletonLine}
      style={{ width }}
    />
  );
}
