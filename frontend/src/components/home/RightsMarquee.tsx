"use client";

import { motion } from "framer-motion";
import { rights } from "@/constants/homeContent";
import styles from "./RightsMarquee.module.scss";

export function RightsMarquee() {
  const doubled = [...rights, ...rights];

  return (
    <div className={styles.wrapper}>
      <div className={styles.fadeLeft} />
      <div className={styles.fadeRight} />
      <motion.div
        className={styles.track}
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 32, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((right, i) => (
          <div key={i} className={styles.item}>
            <span className={styles.art}>Ст.{right.art}</span>
            <span className={styles.text}>{right.text}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
