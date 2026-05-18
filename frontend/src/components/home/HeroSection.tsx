"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { HerbFlipCard } from "@/components/HerbFlipCard";
import { ROUTES } from "@/constants/routes";
import { fadeUp, stagger, childFade } from "@/constants/animations";
import styles from "@/app/page.module.scss";

export function HeroSection({ w }: { w: number }) {
  return (
    <section className={styles.heroSection}>
      <div className={styles.blobTopRight} />
      <div className={styles.blobBottomLeft} />

      <div
        className={styles.heroInner}
        style={{
          flexDirection: w < 768 ? "column" : "row",
          gap: w < 768 ? 32 : 64,
        }}
      >
        <motion.div
          className={styles.heroText}
          variants={stagger}
          initial="initial"
          animate="animate"
        >
          <motion.h1
            variants={childFade}
            className={`display ${styles.heroH1}`}
          >
            Law Analysis
          </motion.h1>

          <motion.p
            variants={childFade}
            className={`display ${styles.heroSubtitle}`}
          >
            Перетворення текстів законів на структуру
          </motion.p>

          <motion.p variants={childFade} className={styles.heroDesc}>
            Закони України існують як неструктуровані текстові полотна. Law
            Analysis розбиває кожен закон на атомарні одиниці — розділ → стаття
            → абзац — де кожен елемент має унікальний ієрархічний код і
            зв&apos;язок із батьківським елементом.
          </motion.p>

          <motion.div variants={childFade} className={styles.heroBtns}>
            <Link
              href={ROUTES.laws}
              className={`btn btn-outline ${styles.btnWithIcon}`}
            >
              Переглянути закони
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                →
              </motion.span>
            </Link>
            <Link href={ROUTES.subjects} className="btn btn-outline">
              Суб&apos;єкти
            </Link>
            <Link
              href={ROUTES.search}
              className={`btn btn-outline ${styles.btnWithIconSm}`}
            >
              ⌕ Пошук
            </Link>
          </motion.div>
        </motion.div>

        <motion.div {...fadeUp(0.3)} className={styles.heroCardWrapper}>
          <HerbFlipCard width={300} height={360} />
        </motion.div>
      </div>
    </section>
  );
}
