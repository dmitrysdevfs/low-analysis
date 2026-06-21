"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  platformStructure,
  type PlatformStructureItem,
} from "@/constants/premiumLandingContent";
import { TempleIcon, GridIcon, ToolsIcon, ProfileIcon } from "./icons";
import styles from "./PlatformStructureSection.module.scss";

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  temple: TempleIcon,
  grid: GridIcon,
  tools: ToolsIcon,
  profile: ProfileIcon,
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};

export function PlatformStructureSection() {
  const hero = platformStructure.find((i) => i.variant === "hero")!;
  const smalls = platformStructure.filter((i) => i.variant === "small");
  const wide = platformStructure.find((i) => i.variant === "wide")!;

  const HeroIcon = ICON_MAP[hero.iconId];

  return (
    <section className={styles.section}>
      {/* Section glow orb */}
      <div className={styles.sectionGlow} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
        >
          <div className={`mono ${styles.sectionNum}`}>01 —</div>
          <h2 className={`display ${styles.h2}`}>Структура платформи</h2>
          <p className={styles.subtitle}>
            Модульна архітектура, що поєднує дані, аналітику та інструменти для
            ефективної правової роботи.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className={styles.bento}>
          {/* Hero card — large left */}
          <motion.div
            className={`${styles.card} ${styles.cardHero}`}
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.08 }}
            variants={fadeUp}
            whileHover={{ borderColor: "rgba(218,174,72,0.5)" }}
          >
            <div className={styles.bookWrap} aria-hidden="true">
              <iframe
                src="/previews/book-dual.html"
                className={styles.bookFrame}
                title="3D book"
                tabIndex={-1}
              />
            </div>
            <h3 className={`display ${styles.cardTitle}`}>{hero.title}</h3>
            <p className={styles.cardDesc}>{hero.desc}</p>
            {hero.bullets && (
              <ul className={styles.bullets}>
                {hero.bullets.map((b) => (
                  <li key={b} className={styles.bullet}>
                    <CheckCircle2 size={14} className={styles.bulletIcon} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <Link href={hero.href} className={styles.cardArrow}>
              <ArrowRight size={16} className={styles.arrowIcon} />
            </Link>
          </motion.div>

          {/* Small cards */}
          {smalls.map((item, idx) => {
            const Icon = ICON_MAP[item.iconId];
            return (
              <motion.div
                key={item.id}
                className={`${styles.card} ${styles.cardSmall}`}
                custom={idx + 1}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.08 }}
                variants={fadeUp}
                whileHover={{ borderColor: "rgba(218,174,72,0.5)" }}
              >
                <Icon size={32} className={styles.smallIcon} />
                <h3 className={`display ${styles.cardTitle}`}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.desc}</p>
                <Link href={item.href} className={styles.cardArrow}>
                  <ArrowRight size={14} className={styles.arrowIcon} />
                </Link>
              </motion.div>
            );
          })}

          {/* Wide bottom card */}
          {(() => {
            const WideIcon = ICON_MAP[wide.iconId];
            return (
              <motion.div
                className={`${styles.card} ${styles.cardWide}`}
                custom={3}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.08 }}
                variants={fadeUp}
                whileHover={{ borderColor: "rgba(218,174,72,0.5)" }}
              >
                <WideIcon size={32} className={styles.smallIcon} />
                <div className={styles.wideContent}>
                  <h3 className={`display ${styles.cardTitle}`}>
                    {wide.title}
                  </h3>
                  <p className={styles.cardDesc}>{wide.desc}</p>
                </div>
                <Link href={wide.href} className={styles.cardArrow}>
                  <ArrowRight size={14} className={styles.arrowIcon} />
                </Link>
              </motion.div>
            );
          })()}
        </div>
      </div>
    </section>
  );
}
