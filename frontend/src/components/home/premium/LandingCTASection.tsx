"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ScalesIcon } from "./icons";
import styles from "./LandingCTASection.module.scss";

export function LandingCTASection() {
  return (
    <section className={styles.section}>
      <motion.div
        className={styles.banner}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left: scales illustration */}
        <div className={styles.illustrationWrap}>
          <div className={styles.orbBg} aria-hidden="true" />
          <ScalesIcon size={80} className={styles.scales} />
        </div>

        {/* Center: text */}
        <div className={styles.copy}>
          <h2 className={`display ${styles.headline}`}>
            Рішення починаються з аналізу права
          </h2>
          <p className={styles.sub}>
            Отримайте доступ до найповнішої правової бази та інтелектуальних
            інструментів для впевнених юридичних рішень.
          </p>
        </div>

        {/* Right: CTA */}
        <div className={styles.ctaWrap}>
          <Link href="/auth/register" className={styles.ctaBtn}>
            Розпочати аналіз
          </Link>
          <span className={styles.ctaNote}>Безкоштовний тестовий доступ</span>
        </div>
      </motion.div>
    </section>
  );
}
