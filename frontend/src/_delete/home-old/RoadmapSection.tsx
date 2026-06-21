"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { roadmap } from "@/constants/homeContent";
import { ROUTES } from "@/constants/routes";
import type { Law } from "@/types";
import styles from "./RoadmapSection.module.scss";

export function RoadmapSection({
  laws,
  loading,
  error,
}: {
  laws: Law[];
  loading: boolean;
  error?: string | null;
}) {
  const done = roadmap.filter((item) => item.done);
  const pending = roadmap.filter((item) => !item.done);
  const progress = Math.round((done.length / roadmap.length) * 100);

  return (
    <section className={styles.section}>
      <div className={styles.inner}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className={styles.header}
        >
          <div className={styles.label}>Дорожня карта</div>
          <h2 className={`display ${styles.h2}`}>Що зроблено і що далі</h2>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className={styles.progressWrap}
        >
          <div className={styles.progressMeta}>
            <span className={styles.progressLabel}>
              {done.length} з {roadmap.length} завдань виконано
            </span>
            <span className={styles.progressPct}>{progress}%</span>
          </div>
          <div className={styles.progressTrack}>
            <motion.div
              className={styles.progressFill}
              initial={{ width: 0 }}
              whileInView={{ width: `${progress}%` }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{
                delay: 0.4,
                duration: 1.1,
                ease: [0.25, 0.1, 0.25, 1],
              }}
            />
          </div>
        </motion.div>

        {/* Two-column list */}
        <div className={styles.columns}>
          {/* Done */}
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <span className={styles.columnDot} />
              <span className={styles.columnTitle}>Вже доступно</span>
            </div>
            <div className={styles.list}>
              {done.map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: index * 0.07, duration: 0.38 }}
                  className={`${styles.item} ${styles.itemDone}`}
                >
                  <span className={styles.checkDone}>✓</span>
                  <span className={styles.itemText}>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Pending */}
          <div className={styles.column}>
            <div className={styles.columnHeader}>
              <span className={styles.columnDotPending} />
              <span className={styles.columnTitle}>Незабаром</span>
            </div>
            <div className={styles.list}>
              {pending.map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: index * 0.1, duration: 0.38 }}
                  className={`${styles.item} ${styles.itemPending}`}
                >
                  <span className={styles.checkPending}>○</span>
                  <span className={styles.itemTextPending}>{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer counter */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className={styles.footer}
        >
          <div>
            <p className={`display ${styles.footerTitle}`}>
              {loading
                ? "Завантаження…"
                : error
                  ? "Не вдалося завантажити"
                  : `${laws.length} закон${laws.length === 1 ? "" : "ів"} у базі`}
            </p>
            <p className={`mono ${styles.footerMono}`}>
              {loading
                ? "…"
                : error
                  ? "—"
                  : laws.map((law) => law.code).join(" · ")}
            </p>
          </div>
          <Link href={ROUTES.laws} className={styles.footerLink}>
            Відкрити закони →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
