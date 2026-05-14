"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import styles from "@/app/laws/[id]/articles/[num]/page.module.scss";

interface ArticleLawCardProps {
  lawTitle: string;
  lawCode: string;
  lawId: string | undefined;
}

export function ArticleLawCard({
  lawTitle,
  lawCode,
  lawId,
}: ArticleLawCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={styles.lawCard}
    >
      <span className={`mono ${styles.lawCardLabel}`}>Закон</span>
      <span className={styles.lawCardTitle}>{lawTitle}</span>
      {lawCode && (
        <span className={`mono ${styles.lawCardCode}`}>{lawCode}</span>
      )}

      {/* Open full law link */}
      {lawId && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          <Link
            href={ROUTES.law(lawId)}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.lawLink}
          >
            <div className={styles.lawLinkLeft}>
              <span className={`mono ${styles.lawLinkLabel}`}>
                Повний закон
              </span>
            </div>
            <span className={styles.lawLinkArrow}>↗</span>
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
