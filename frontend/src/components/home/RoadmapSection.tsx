"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { roadmap } from "@/constants/homeContent";
import { ROUTES } from "@/constants/routes";
import type { Law } from "@/types";
import styles from "@/app/page.module.scss";

export function RoadmapSection({
  laws,
  loading,
  error,
}: {
  laws: Law[];
  loading: boolean;
  error?: string | null;
}) {
  return (
    <section className={styles.roadmapSection}>
      <div className={styles.roadmapInner}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
          className={styles.roadmapHeader}
        >
          <div className={`mono ${styles.roadmapLabel}`}>Дорожня карта</div>
          <h2 className={`display ${styles.roadmapH2}`}>
            Що зроблено і що далі
          </h2>
        </motion.div>

        <div className={styles.roadmapList}>
          {roadmap.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ delay: index * 0.08, duration: 0.35 }}
              className={`${styles.roadmapItem} ${item.done ? styles.roadmapItemDone : styles.roadmapItemPending}`}
            >
              <span
                className={`mono ${styles.roadmapCheckmark} ${item.done ? styles.roadmapCheckmarkDone : styles.roadmapCheckmarkPending}`}
              >
                {item.done ? "✓" : "○"}
              </span>
              <span
                className={`${styles.roadmapItemText} ${item.done ? styles.roadmapItemTextDone : styles.roadmapItemTextPending}`}
              >
                {item.text}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className={styles.roadmapFooter}
        >
          <div>
            <p className={`display ${styles.roadmapFooterTitle}`}>
              {loading
                ? "Завантаження…"
                : error
                  ? "Не вдалося завантажити"
                  : `${laws.length} закон${laws.length === 1 ? "" : "ів"} у базі`}
            </p>
            <p className={`mono ${styles.roadmapFooterMono}`}>
              {loading ? "…" : error ? "—" : laws.map((law) => law.code).join(" · ")}
            </p>
          </div>
          <Link href={ROUTES.laws} className={styles.roadmapFooterLink}>
            Відкрити закони →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
