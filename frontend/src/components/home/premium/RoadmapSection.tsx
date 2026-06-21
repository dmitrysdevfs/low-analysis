"use client";

import { motion, type Variants } from "framer-motion";
import { CheckCircle2, Star } from "lucide-react";
import { premiumRoadmap } from "@/constants/premiumLandingContent";
import styles from "./RoadmapSection.module.scss";

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.42, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

const fadeRight: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.06, duration: 0.42, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export function PremiumRoadmapSection() {
  const done = premiumRoadmap.filter((i) => i.done);
  const pending = premiumRoadmap.filter((i) => !i.done);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
        >
          <div className={`mono ${styles.sectionNum}`}>03 —</div>
          <h2 className={`display ${styles.h2}`}>Що зроблено і що далі</h2>
        </motion.div>

        {/* Three-column layout: done | orb | pending */}
        <div className={styles.columns}>
          {/* Left — Done */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <CheckCircle2 size={16} className={styles.panelIconDone} />
              <span className={`mono ${styles.panelTitle}`}>Вже зроблено</span>
            </div>
            <div className={styles.list}>
              {done.map((item, idx) => (
                <motion.div
                  key={item.text}
                  className={`${styles.item} ${styles.itemDone}`}
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.05 }}
                  variants={fadeLeft}
                >
                  <CheckCircle2 size={14} className={styles.checkDone} />
                  <span className={styles.itemText}>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Center orb */}
          <div className={styles.orbCol}>
            <motion.div
              className={styles.orb}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className={styles.orbRing1} />
              <div className={styles.orbRing2} />
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 11h14M11 4l7 7-7 7"
                  stroke="#D8A735"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
          </div>

          {/* Right — Pending */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <Star size={14} className={styles.panelIconPending} />
              <span className={`mono ${styles.panelTitle}`}>У планах</span>
            </div>
            <div className={styles.list}>
              {pending.map((item, idx) => (
                <motion.div
                  key={item.text}
                  className={`${styles.item} ${styles.itemPending}`}
                  custom={idx}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.05 }}
                  variants={fadeRight}
                >
                  <span className={styles.itemText}>{item.text}</span>
                  <span className={styles.badge}>{item.badgeLabel}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
