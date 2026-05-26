"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";

import { ROUTES } from "@/constants/routes";
import type { Law } from "@/types";
import styles from "./LawCard.module.scss";
import { LawCardStat } from "./LawCardStat";

const CARD_HEIGHT = 148;
const BACK_HEIGHT = 280;

export function LawCard({ law, index }: { law: Law; index: number }) {
  const [flipped, setFlipped] = useState(false);

  const handleFlip = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFlipped((prev) => !prev);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!flipped ? { y: -3 } : {}}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={styles.cardWrapper}
      style={{
        height: flipped ? BACK_HEIGHT : CARD_HEIGHT,
        transition: "height 0.45s cubic-bezier(0.25,0.1,0.25,1)",
      }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }}
        className={styles.cardInner}
      >
        {/* ── FRONT ── */}
        <div onClick={handleFlip} className={styles.cardFront}>
          <div className={styles.frontHeader}>
            <h2 className={`display ${styles.frontTitle}`}>{law.title}</h2>
            <span className={`mono ${styles.lawCodeBadge}`}>{law.code}</span>
          </div>

          <div className={styles.frontStats}>
            <div className={styles.statsGroup}>
              <LawCardStat value={law.totalSections} label="розділів" />
              <LawCardStat value={law.totalArticles} label="статей" />
              {law.totalParagraphs ? (
                <LawCardStat value={law.totalParagraphs} label="абзаців" />
              ) : null}
            </div>
          </div>

          {law.adoptedDate ||
          (law.documentType && law.documentType.length > 0) ? (
            <div className={styles.frontMeta}>
              {law.adoptedDate ? (
                <span className={styles.metaDate}>
                  {new Date(law.adoptedDate).toLocaleDateString("uk-UA")}
                </span>
              ) : null}
              {law.documentType && law.documentType.length > 0 ? (
                <span className={styles.metaDocType}>
                  {law.documentType[0]}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* ── BACK ── */}
        <div className={styles.cardBack}>
          {/* Back header */}
          <div className={styles.backHeader}>
            <div className={styles.backTitleWrap}>
              <span className={`display ${styles.backTitle}`}>{law.title}</span>
            </div>
            <button onClick={handleFlip} className={styles.collapseBtn}>
              ↩ Згорнути
            </button>
          </div>

          {/* Back stats */}
          <div className={styles.backStats}>
            <div className={styles.backStatRow}>
              <span className={styles.backStatLabel}>Розділів</span>
              <span className={styles.backStatValue}>{law.totalSections}</span>
            </div>
            <div className={styles.backStatRow}>
              <span className={styles.backStatLabel}>Статей</span>
              <span className={styles.backStatValue}>{law.totalArticles}</span>
            </div>
            {law.totalParagraphs ? (
              <div className={styles.backStatRow}>
                <span className={styles.backStatLabel}>Абзаців</span>
                <span className={styles.backStatValue}>
                  {law.totalParagraphs}
                </span>
              </div>
            ) : null}
            {law.adoptedDate ? (
              <div className={styles.backStatRow}>
                <span className={styles.backStatLabel}>Прийнято</span>
                <span className={styles.backStatValue}>
                  {new Date(law.adoptedDate).toLocaleDateString("uk-UA")}
                </span>
              </div>
            ) : null}
            {law.documentType && law.documentType.length > 0 ? (
              <div className={styles.backStatRow}>
                <span className={styles.backStatLabel}>Тип</span>
                <span className={styles.backStatValue}>
                  {law.documentType[0]}
                </span>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <Link href={ROUTES.law(law._id)} className={styles.allArticlesLink}>
              <motion.div
                whileHover={{ x: 4 }}
                className={styles.allArticlesBtn}
              >
                Всі статті закону ({law.totalArticles}) →
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
