"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useLaws } from "@/hooks/useLaws";
import { useCountUp } from "@/hooks/useCountUp";
import styles from "./Footer.module.scss";

function StatCounter({
  value,
  label,
  active,
}: {
  value: number;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, 1400, active);
  return (
    <div className={styles.statItem}>
      <div className={`mono ${styles.statValue}`}>
        {count.toLocaleString("uk-UA")}
      </div>
      <div className={`mono ${styles.statLabel}`}>{label}</div>
    </div>
  );
}

const HIDDEN_ON = ["/"];

export function FooterStats() {
  const pathname = usePathname();
  const { laws, loading, error } = useLaws();
  const statsRef = useRef<HTMLDivElement>(null);
  const inView = useInView(statsRef, { once: true, amount: 0.4 });

  if (HIDDEN_ON.includes(pathname)) return null;

  const stats = [
    { value: laws.length, label: "законів у базі" },
    { value: laws.reduce((s, l) => s + l.totalSections, 0), label: "розділів" },
    { value: laws.reduce((s, l) => s + l.totalArticles, 0), label: "статей" },
  ];

  return (
    <div ref={statsRef} className={styles.statsBand}>
      <div className={styles.statsInner}>
        {error ? (
          <div
            className={`mono ${styles.statsLoading}`}
            style={{ color: "rgba(200,100,100,0.7)", fontSize: "0.75rem" }}
          >
            Не вдалося завантажити статистику
          </div>
        ) : loading ? (
          <div className={styles.statsLoading}>
            {[90, 60, 72].map((w, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
                className={styles.statSkeleton}
                style={{ width: w }}
              />
            ))}
          </div>
        ) : (
          <motion.div
            className={styles.statsRow}
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.4 }}
          >
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <StatCounter value={s.value} label={s.label} active={inView} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
