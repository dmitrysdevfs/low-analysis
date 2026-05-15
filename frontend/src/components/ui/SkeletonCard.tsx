"use client";

import { motion } from "framer-motion";
import styles from "../SkeletonCard.module.scss";

export function SkeletonCard() {
  return (
    <div className={`panel ${styles.card}`}>
      {[72, 48, 60].map((width, index) => (
        <motion.div
          key={width}
          animate={{ opacity: [0.3, 0.65, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.12 }}
          className={styles.line}
          style={{
            width: `${width}%`,
            height: index === 0 ? 22 : 12,
          }}
        />
      ))}
    </div>
  );
}
