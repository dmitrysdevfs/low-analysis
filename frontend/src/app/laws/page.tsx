"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { LawCard } from "@/components/law/LawCard";
import { LawParseForm } from "@/components/parse/LawParseForm";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useLaws } from "@/hooks/useLaws";
import styles from "./page.module.scss";

export default function LawsPage() {
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const { laws, loading, error } = useLaws(query, refreshKey);

  return (
    <Layout>
      <div className={styles.wrapper}>
        <div className={styles.blobGold} />
        <div className={styles.blobBlue} />

        <div className={`section-pad ${styles.sectionInner}`}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className={styles.heroMotion}
          >
            <h1 className={`display ${styles.heading}`}>
              Закони
              <br />
              <span className={styles.headingAccent}>України</span>
            </h1>

            <p className={styles.subtitle}>
              Структуровані тексти законів України — від лінійного полотна до
              ієрархічної бази атомарних елементів.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={styles.searchWrapper}
          >
            <span className={styles.searchIcon}>⌕</span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук за назвою закону…"
              className={`form-control ${styles.searchInput}`}
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                className={styles.clearButton}
              >
                ✕
              </button>
            ) : null}
          </motion.div>

          <LawParseForm onSuccess={() => setRefreshKey((prev) => prev + 1)} />

          <AnimatePresence mode="wait">
            {!loading && !error ? (
              <motion.div
                key={`count-${laws.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`mono ${styles.countLine}`}
              >
                {query
                  ? `${laws.length} результат${laws.length === 1 ? "" : "ів"} для «${query}»`
                  : `${laws.length} документ${laws.length === 1 ? "" : "ів"} у базі`}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {loading ? (
            <div className={styles.skeletonList}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : null}

          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.errorBox}
            >
              {error}
            </motion.div>
          ) : null}

          {!loading && !error && laws.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.emptyState}
            >
              <div className={styles.emptyIcon}>§</div>
              {query
                ? `Нічого не знайдено за запитом «${query}»`
                : "Нічого не знайдено"}
            </motion.div>
          ) : null}

          {!loading && !error && laws.length > 0 ? (
            <AnimatePresence>
              <div className={styles.lawsList}>
                {laws.map((law, index) => (
                  <LawCard key={law._id} law={law} index={index} />
                ))}
              </div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
