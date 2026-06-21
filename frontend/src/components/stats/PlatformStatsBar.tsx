"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useLaws } from "@/hooks/useLaws";
import { useCountUp } from "@/hooks/useCountUp";
import {
  LaurelIcon,
  ExpertsIcon,
  ActsIcon,
} from "@/components/home/premium/icons";
import styles from "./PlatformStatsBar.module.scss";

function StatCounter({
  Icon,
  value,
  label,
  active,
}: {
  Icon: React.ElementType;
  value: number;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, 1400, active);
  return (
    <div className={styles.stat}>
      <Icon size={40} className={styles.statIcon} />
      <div className={styles.statBody}>
        <div className={`mono ${styles.statValue}`}>
          {count.toLocaleString("uk-UA")}
        </div>
        <div className={`mono ${styles.statLabel}`}>{label}</div>
      </div>
    </div>
  );
}

export function PlatformStatsBar() {
  const { laws, loading, error } = useLaws();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });

  const stats = [
    { Icon: LaurelIcon, value: laws.length, label: "законів у базі" },
    {
      Icon: ExpertsIcon,
      value: laws.reduce((s, l) => s + l.totalSections, 0),
      label: "розділів",
    },
    {
      Icon: ActsIcon,
      value: laws.reduce((s, l) => s + l.totalArticles, 0),
      label: "статей",
    },
  ];

  return (
    <div ref={ref} className={styles.strip}>
      {error ? (
        <div className={`mono ${styles.errorMsg}`}>
          Не вдалося завантажити статистику
        </div>
      ) : loading ? (
        <>
          {[0, 1, 2].map((i) => (
            <div key={i} className={styles.stat}>
              <motion.div
                className={styles.skeleton}
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.15,
                }}
              />
            </div>
          ))}
        </>
      ) : (
        <>
          {stats.map(({ Icon, value, label }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
            >
              <StatCounter
                Icon={Icon}
                value={value}
                label={label}
                active={inView}
              />
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}
