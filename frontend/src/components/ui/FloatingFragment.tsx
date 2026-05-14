"use client";

import { motion } from "framer-motion";
import styles from "@/app/not-found.module.scss";

export function FloatingFragment({
  text,
  x,
  y,
  delay,
}: {
  text: string;
  x: string;
  y: string;
  delay: number;
}) {
  return (
    <motion.div
      className={styles.floatingFragment}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0, 0.35, 0.18, 0.35],
        y: [0, -14, 0, 14, 0],
        scale: [0.6, 1, 0.95, 1],
      }}
      transition={{
        opacity: { duration: 6, repeat: Infinity, delay, ease: "easeInOut" },
        y: { duration: 8, repeat: Infinity, delay, ease: "easeInOut" },
        scale: { duration: 1.2, delay },
      }}
      style={{ left: x, top: y }}
    >
      {text}
    </motion.div>
  );
}
