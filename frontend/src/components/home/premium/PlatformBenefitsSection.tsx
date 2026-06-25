"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { platformBenefits } from "@/constants/premiumLandingContent";
import {
  SearchIcon,
  LexAiIcon,
  AnalyticsBarsIcon,
  DiffDocsIcon,
  BellIcon,
  ShieldCheckIcon,
} from "./icons";
import styles from "./PlatformBenefitsSection.module.scss";

const ICON_MAP: Record<
  string,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  search: SearchIcon,
  lexai: LexAiIcon,
  analytics: AnalyticsBarsIcon,
  diff: DiffDocsIcon,
  bell: BellIcon,
  shield: ShieldCheckIcon,
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.48, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export function PlatformBenefitsSection() {
  return (
    <section className={`sectionLast ${styles.section}`}>
      <div className={styles.sectionGlow} aria-hidden="true" />

      <div className="container">
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
        >
          <div className={`mono ${styles.sectionNum}`}>02 —</div>
          <h2 className={`titleH2 ${styles.h2}`}>Що дає платформа</h2>
          <p className={styles.subtitle}>
            Інтелектуальні можливості для кращих рішень та економії вашого часу.
          </p>
        </motion.div>

        <div className={styles.grid}>
          {platformBenefits.map((item, index) => {
            const Icon = ICON_MAP[item.iconId];
            return (
              <motion.div
                key={item.iconId}
                className={styles.card}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.08 }}
                variants={fadeUp}
              >
                <div className={styles.cardGlow} />
                <div className={styles.iconWrap}>
                  {Icon && <Icon size={34} />}
                </div>
                <h3 className={`display ${styles.cardTitle}`}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.desc}</p>
                <Link href={item.href} className={styles.cardLink}>
                  <ArrowRight size={14} className={styles.arrowIcon} />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
