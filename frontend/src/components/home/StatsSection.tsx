"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { StatItem } from "@/components/StatItem";
import type { Law } from "@/types";
import styles from "@/app/page.module.scss";

export function StatsSection({
  laws,
  loading,
}: {
  laws: Law[];
  loading: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  const stats = [
    { value: laws.length, label: "законів у базі" },
    {
      value: laws.reduce((sum, law) => sum + law.totalSections, 0),
      label: "розділів",
    },
    {
      value: laws.reduce((sum, law) => sum + law.totalArticles, 0),
      label: "статей",
    },
  ];

  return (
    <div ref={ref} className={styles.statsBand}>
      <div className={styles.statsInner}>
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.statsLoadingRow}
            >
              {[80, 56, 72].map((width, index) => (
                <motion.div
                  key={index}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: index * 0.15,
                  }}
                  className={styles.skeletonBlock}
                  style={{ width }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.statsRow}
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <StatItem
                    value={stat.value}
                    label={stat.label}
                    active={inView}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
