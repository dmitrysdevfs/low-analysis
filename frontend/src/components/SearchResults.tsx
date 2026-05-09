"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import type { Law } from "@/types";
import styles from "./SearchResults.module.scss";

interface SearchResultsProps {
  results: Law[];
  loading: boolean;
  error: string | null;
  searched: boolean;
  query: string;
}

const skeletonItem = (index: number) => (
  <motion.div
    key={index}
    animate={{ opacity: [0.3, 0.6, 0.3] }}
    transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.1 }}
    className={`panel-muted ${styles.skeletonItem}`}
  >
    <div className={styles.skeletonGrid}>
      <div className={styles.skeletonDot} />
      <div className={styles.skeletonLines}>
        <div className={styles.skeletonLineTitle} />
        <div className={styles.skeletonLineSub} />
      </div>
    </div>
  </motion.div>
);

export function SearchResults({
  results,
  loading,
  error,
  searched,
  query,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-label="Завантаження результатів пошуку"
        className={styles.skeletonList}
      >
        {Array.from({ length: 4 }).map((_, i) => skeletonItem(i))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorBox}>
        <div className={styles.errorIcon}>⚠</div>
        <div className={`mono ${styles.errorText}`}>{error}</div>
      </div>
    );
  }

  if (!searched) {
    return (
      <div className={styles.emptyBox}>
        <div className={styles.emptyIcon}>§</div>
        <div className={`mono ${styles.emptyHint}`}>
          Введіть запит і натисніть «Знайти»
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={styles.emptyBox}>
        <div className={styles.emptyIconSearch}>⌕</div>
        <div className={`display ${styles.emptyTitle}`}>Нічого не знайдено</div>
        <div className={`mono ${styles.emptySubtext}`}>
          За запитом «{query}» результатів немає
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={`mono ${styles.countLine}`}>
        Знайдено: {results.length}{" "}
        {results.length === 1
          ? "закон"
          : results.length < 5
            ? "закони"
            : "законів"}
      </div>

      <AnimatePresence>
        <ol className={`directory-list ${styles.list}`}>
          {results.map((law, index) => (
            <motion.li
              key={law._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link href={ROUTES.law(law._id)} className="directory-link">
                <span className="directory-index mono">{index + 1}.</span>
                <span className="directory-body">
                  <span className="directory-title">{law.title}</span>
                  <span className="directory-meta">
                    <span className="directory-chip mono">{law.code}</span>
                    <span className="mono">
                      {law.totalSections} розд. · {law.totalArticles} статей
                    </span>
                  </span>
                </span>
                <span className="directory-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </motion.li>
          ))}
        </ol>
      </AnimatePresence>
    </div>
  );
}
