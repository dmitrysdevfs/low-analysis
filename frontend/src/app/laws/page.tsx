"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { LawCard } from "@/components/law/LawCard";
import { LawParseForm } from "@/components/parse/LawParseForm";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useLawsPaginated } from "@/hooks/useLawsPaginated";
import { ROUTES } from "@/constants/routes";
import {
  loadRecentlyViewed,
  type RecentLaw,
} from "@/lib/storage/recentlyViewed";
import styles from "./page.module.scss";

const STATUS_OPTIONS = ["Чинний", "Втратив чинність"];

export default function LawsPage() {
  const [query, setQuery] = useState("");
  const [, setRefreshKey] = useState(0);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentLaw[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    laws: filteredLaws,
    pagination,
    loading,
    error,
  } = useLawsPaginated({
    q: query || undefined,
    status: activeStatus ?? undefined,
    page,
    limit: 20,
  });

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const handleStatusChange = (status: string | null) => {
    setActiveStatus(status);
    setPage(1);
  };

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

  const total = pagination?.total ?? filteredLaws.length;

  return (
    <Layout>
      <div className={styles.wrapper}>
        <div className={styles.blobGold} />
        <div className={styles.blobBlue} />

        <div className={`container section ${styles.sectionInner}`}>
          <div className={styles.border}>
                   <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className={styles.heroMotion}
          >
            <h1 className={`title ${styles.heading}`}>
              Закони
          
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
              onChange={(event) => handleQueryChange(event.target.value)}
              placeholder="Пошук за назвою закону…"
              className={`form-control ${styles.searchInput}`}
            />
            {query ? (
              <button
                onClick={() => handleQueryChange("")}
                className={styles.clearButton}
              >
                ✕
              </button>
            ) : null}
          </motion.div>

          {/* Status filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.35 }}
            className={styles.chipsRow}
          >
            <button
              className={`${styles.chip} ${activeStatus === null ? styles.chipActive : ""}`}
              onClick={() => handleStatusChange(null)}
            >
              Всі
            </button>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                className={`${styles.chip} ${activeStatus === status ? styles.chipActive : ""}`}
                onClick={() =>
                  handleStatusChange(activeStatus === status ? null : status)
                }
              >
                {status}
              </button>
            ))}
          </motion.div>
   </div>

          <LawParseForm onSuccess={() => setRefreshKey((prev) => prev + 1)} />

          {/* Recently Viewed */}
          {recentlyViewed.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className={styles.recentSection}
            >
              <div className={styles.recentLabel}>
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
                key={`count-${total}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={styles.countLine}
              >
                {query
                  ? `${total} результат${total === 1 ? "" : "ів"} для «${query}»`
                  : `${total} документ${total === 1 ? "" : "ів"} у базі`}
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

          {pagination && (pagination.hasPrevPage || pagination.hasNextPage) ? (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={!pagination.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </button>
              <span className={styles.pageInfo}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Далі →
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
