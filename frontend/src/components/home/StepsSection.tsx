"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { steps } from "@/constants/homeContent";
import styles from "@/app/page.module.scss";

export function StepsSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className={styles.stepsSection}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.4 }}
        className={styles.stepsSectionHeader}
      >
        <div className={`mono ${styles.stepsSectionLabel}`}>Як це працює</div>
        <h2 className={`display ${styles.stepsSectionH2}`}>
          Від HTML до структури
        </h2>
      </motion.div>

      <div className={styles.stepsGrid}>
        {steps.map((step, index) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 24 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.12, duration: 0.45 }}
            whileHover={{ y: -4, borderColor: "rgba(200,168,67,0.4)" }}
            className={styles.stepCard}
          >
            <div className={`mono ${styles.stepCardNum}`}>{step.num}</div>
            <div className={`mono ${styles.stepCardIcon}`}>{step.icon}</div>
            <h3 className={`display ${styles.stepCardTitle}`}>
              {step.title}
            </h3>
            <p className={styles.stepCardDesc}>{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
