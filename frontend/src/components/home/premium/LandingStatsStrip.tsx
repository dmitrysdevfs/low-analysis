"use client";

import { motion } from "framer-motion";
import { landingStats } from "@/constants/premiumLandingContent";
import { LaurelIcon, ExpertsIcon, ActsIcon } from "./icons";
import styles from "./LandingStatsStrip.module.scss";

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  laurel: LaurelIcon,
  experts: ExpertsIcon,
  acts: ActsIcon,
};

export function LandingStatsStrip() {
  return (
    <div className={styles.strip}>
      {landingStats.map((stat, idx) => {
        const Icon = ICON_MAP[stat.iconId];
        return (
          <motion.div
            key={stat.iconId}
            className={styles.stat}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ delay: idx * 0.12, duration: 0.45 }}
          >
            {Icon && <Icon size={40} className={styles.statIcon} />}
            <div className={styles.statBody}>
              <div className={`mono ${styles.statValue}`}>{stat.value}</div>
              <div className={`mono ${styles.statLabel}`}>{stat.label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
