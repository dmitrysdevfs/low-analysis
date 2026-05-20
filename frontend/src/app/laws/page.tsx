"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { LawCard } from "@/components/law/LawCard";
import { LawParseForm } from "@/components/parse/LawParseForm";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useLaws } from "@/hooks/useLaws";
import { ROUTES } from "@/constants/routes";
import styles from "./page.module.scss";

const RECENTLY_VIEWED_KEY = "law-analysis.recently-viewed";

interface RecentLaw {
  _id: string;
  title: string;
  code: string;
}

function loadRecentlyViewed(): RecentLaw[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? (JSON.parse(raw) as RecentLaw[]) : [];
  } catch {
    return [];
  }
}

export default function LawsPage() {
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentLaw[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const { laws, loading, error } = useLaws(query, refreshKey);

  // Load recently viewed on mount (client only)
  useEffect(() => {
    setRecentlyViewed(loadRecentlyViewed());
  }, []);

  // Keyboard shortcut: "/" focuses search input
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "/") return;
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Collect unique statuses from loaded laws
  const statusOptions = Array.from(
    new Set(laws.map((l) => l.status).filter(Boolean) as string[]),
  );

  // Filter laws by active status (client-side)
  const filteredLaws =
    activeStatus === null
      ? laws
      : laws.filter((l) => l.status === activeStatus);

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
              ref={searchRef}
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

          {/* Status filter chips */}
          {!loading && !error && statusOptions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
              className={styles.chipsRow}
            >
              <button
                className={`${styles.chip} ${activeStatus === null ? styles.chipActive : ""}`}
                onClick={() => setActiveStatus(null)}
              >
                Всі
              </button>
              {statusOptions.map((status) => (
                <button
                  key={status}
                  className={`${styles.chip} ${activeStatus === status ? styles.chipActive : ""}`}
                  onClick={() =>
                    setActiveStatus(activeStatus === status ? null : status)
                  }
                >
                  {status}
                </button>
              ))}
            </motion.div>
          ) : null}

          <LawParseForm onSuccess={() => setRefreshKey((prev) => prev + 1)} />

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className={styles.recentSection}
            >
              <div className={`mono ${styles.recentLabel}`}>
                Нещодавно переглянуті
              </div>
              <div className={styles.recentList}>
                {recentlyViewed.map((item) => (
                  <Link
                    key={item._id}
                    href={`${ROUTES.laws}/${item._id}`}
                    className={styles.recentCard}
                  >
                    <span className={styles.recentCode}>{item.code}</span>
                    <span className={styles.recentTitle}>{item.title}</span>
                  </Link>
                ))}
              </div>
            </motion.div>
          ) : null}

          <AnimatePresence mode="wait">
            {!loading && !error ? (
              <motion.div
                key={`count-${filteredLaws.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`mono ${styles.countLine}`}
              >
                {query
                  ? `${filteredLaws.length} результат${filteredLaws.length === 1 ? "" : "ів"} для «${query}»`
                  : `${filteredLaws.length} документ${filteredLaws.length === 1 ? "" : "ів"} у базі`}
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

          {!loading && !error && filteredLaws.length === 0 ? (
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

          {!loading && !error && filteredLaws.length > 0 ? (
            <AnimatePresence>
              <div className={styles.lawsList}>
                {filteredLaws.map((law, index) => (
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
