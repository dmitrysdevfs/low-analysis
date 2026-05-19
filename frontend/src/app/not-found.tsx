"use client";

import Link from "next/link";
import { useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import styles from "./not-found.module.scss";
import { FloatingFragment } from "@/components/ui/FloatingFragment";
import { GridBackground } from "@/components/ui/GridBackground";

const LEGAL_FRAGMENTS = [
  { text: "Ст. 1", x: "8%", y: "18%", delay: 0 },
  { text: "§ 248", x: "82%", y: "14%", delay: 0.3 },
  { text: "Ч. 3", x: "14%", y: "72%", delay: 0.6 },
  { text: "п. 4.1", x: "76%", y: "68%", delay: 0.9 },
  { text: "розд. II", x: "48%", y: "8%", delay: 0.15 },
  { text: "Ст. 61", x: "91%", y: "42%", delay: 0.45 },
  { text: "§ 17", x: "3%", y: "44%", delay: 0.75 },
  { text: "п. 2б", x: "55%", y: "88%", delay: 0.2 },
  { text: "Ч. 1", x: "28%", y: "90%", delay: 0.55 },
  { text: "§ 94", x: "65%", y: "82%", delay: 0.85 },
];

export default function NotFound() {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  const rotateY = useTransform(springX, [-1, 1], [-18, 18]);
  const rotateX = useTransform(springY, [-1, 1], [12, -12]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX.set((e.clientX - cx) / (rect.width / 2));
      mouseY.set((e.clientY - cy) / (rect.height / 2));
    },
    [mouseX, mouseY],
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <GridBackground />

      {LEGAL_FRAGMENTS.map((f) => (
        <FloatingFragment key={f.text} {...f} />
      ))}

      <div className={styles.content}>
        <motion.div
          className={styles.perspectiveWrapper}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <motion.div
            className={styles.transform3d}
            style={{ rotateX, rotateY }}
          >
            <div className={styles.numberWrapper}>
              <div className={`display ${styles.numberMain}`}>404</div>

              <div className={`display ${styles.numberShadow}`}>404</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
        >
          <span className={`mono ${styles.statusLabel}`}>
            Стаття · Не знайдена
          </span>

          <h1 className={`display ${styles.heading}`}>Сторінку не знайдено</h1>

          <p className={styles.description}>
            Схоже, цей розділ законодавства не існує або був переміщений до
            іншого реєстру.
          </p>

          <div className={styles.buttonsRow}>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href={ROUTES.home} className={styles.btnPrimary}>
                ← На головну
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Link href={ROUTES.laws} className={styles.btnSecondary}>
                § Закони
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className={styles.orbitGold}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      <motion.div
        className={styles.orbitBlue}
        animate={{ rotate: [360, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
