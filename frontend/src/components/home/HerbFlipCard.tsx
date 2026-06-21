"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TryzubMark } from "@/components/ui/TryzubMark";
import { rights } from "@/constants/homeContent";
import styles from "./HerbFlipCard.module.scss";

export function HerbFlipCard({
  width = 300,
  height = 360,
}: {
  width?: number;
  height?: number;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((value) => !value)}
      className={styles.flipCardOuter}
      style={{ width, height }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        className={styles.flipCardInner}
      >
        <div className={`panel ${styles.flipFront}`}>
          <motion.div
            animate={{ scale: flipped ? 0.95 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <TryzubMark size={108} />
          </motion.div>
          <div className={styles.flipFrontTextCenter}>
            <div className={`display ${styles.flipFrontTitle}`}>
              Малий герб України
            </div>
            <div className={`mono ${styles.flipFrontMono}`}>
              Тризуб · державний символ
            </div>
          </div>
        </div>

        <div className={`panel ${styles.flipBack}`}>
          <div className={`mono ${styles.flipBackLabel}`}>
            Конституція України · Розділ II
          </div>
          <div className={`display ${styles.flipBackTitle}`}>
            Права і свободи людини
          </div>
          <div className={styles.flipBackRights}>
            {rights.map((right, index) => (
              <motion.div
                key={right.art}
                initial={{ opacity: 0, x: 12 }}
                animate={flipped ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
                transition={{
                  delay: flipped ? index * 0.07 : 0,
                  duration: 0.3,
                }}
                className={styles.flipBackRightRow}
              >
                <span className={`mono ${styles.flipBackArticleBadge}`}>
                  ст.{right.art}
                </span>
                <span className={styles.flipBackRightText}>{right.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
