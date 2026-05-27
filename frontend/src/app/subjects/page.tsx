"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { useSubjects } from "@/hooks/useSubjects";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import { getLegalStatusLabel } from "@/lib/tree";
import { SubjectCard } from "@/components/subject/SubjectCard";
import { ExpandingSearch } from "@/components/ui/ExpandingSearch";
import styles from "./page.module.scss";

const ALL_FILTER = "Всі";
const TOP_LIMIT = 10;

export default function SubjectsPage() {
  const { subjects, loading, error } = useSubjects();
  const { taxonomies } = useTaxonomies();
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);
  const [activeTaxonomy, setActiveTaxonomy] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const filterTypes = useMemo(() => {
    const unique = Array.from(
      new Set(subjects.map((s) => s.legal_status).filter(Boolean)),
    );
    return [ALL_FILTER, ...unique];
  }, [subjects]);

  const sortedByFrequency = useMemo(
    () =>
      [...subjects].sort(
        (a, b) => (b.elements_count ?? 0) - (a.elements_count ?? 0),
      ),
    [subjects],
  );

  const availableTaxonomies = useMemo(() => {
    const ids = new Set(subjects.flatMap((s) => s.taxonomies ?? []));
    return taxonomies.filter((t) => ids.has(t._id));
  }, [subjects, taxonomies]);

  const filteredSubjects = useMemo(() => {
    let base =
      activeFilter === ALL_FILTER
        ? sortedByFrequency
        : sortedByFrequency.filter((s) => s.legal_status === activeFilter);
    if (activeTaxonomy) {
      base = base.filter((s) => s.taxonomies?.includes(activeTaxonomy));
    }
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter((s) => s.canonical_name.toLowerCase().includes(q));
  }, [sortedByFrequency, activeFilter, activeTaxonomy, query]);

  const isSearchActive = query.trim().length > 0;
  const hasMore = !isSearchActive && filteredSubjects.length > TOP_LIMIT;
  const displayedSubjects =
    isSearchActive || showAll
      ? filteredSubjects
      : filteredSubjects.slice(0, TOP_LIMIT);

  const countLabel = useMemo(() => {
    if (isSearchActive) return `${filteredSubjects.length} результатів пошуку`;
    if (showAll) return `${filteredSubjects.length} суб’єктів у базі`;
    return `Топ ${Math.min(TOP_LIMIT, filteredSubjects.length)} · найчастіше зустрічаються`;
  }, [isSearchActive, showAll, filteredSubjects.length]);

  const handleFilterChange = (type: string) => {
    setActiveFilter(type);
    setActiveTaxonomy(null);
    setShowAll(false);
    setQuery("");
  };

  const handleTaxonomyChange = (id: string | null) => {
    setActiveTaxonomy((prev) => (prev === id ? null : id));
    setShowAll(false);
  };

  return (
    <Layout>
      <div className={styles.wrapper}>
        <div className={styles.blobGold} />
        <div className={styles.blobBlue} />

        <div className={styles.inner}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className={styles.heroMotion}
          >
            <h1 className={`display ${styles.heading}`}>
              Суб&apos;єкти
              <br />
              <span className={styles.headingAccent}>регулювання</span>
            </h1>
            <p className={styles.subtitle}>
              Фізичні та юридичні особи, права та обов&apos;язки яких
              регулюються законодавством України.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!loading && !error ? (
              <motion.div
                key={countLabel}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`mono ${styles.countLine}`}
              >
                {countLabel}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {!loading && !error && filterTypes.length > 1 ? (
            <div className={styles.chipBar}>
              {filterTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleFilterChange(type)}
                  className={`mono ${styles.chip} ${activeFilter === type ? styles.chipActive : ""}`}
                >
                  {type === ALL_FILTER ? type : getLegalStatusLabel(type)}
                </button>
              ))}
            </div>
          ) : null}

          {!loading && !error && availableTaxonomies.length > 0 ? (
            <div className={styles.taxonomyBar}>
              <span className={`mono ${styles.taxonomyLabel}`}>Категорія:</span>
              {availableTaxonomies.map((t) => (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => handleTaxonomyChange(t._id)}
                  className={`mono ${styles.taxonomyChip} ${activeTaxonomy === t._id ? styles.taxonomyChipActive : ""}`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          ) : null}

          {!loading && !error ? (
            <div className={styles.searchRow}>
              <ExpandingSearch
                value={query}
                onChange={setQuery}
                placeholder="Пошук суб'єкта..."
              />
            </div>
          ) : null}

          {loading ? (
            <div className={styles.skeletonList}>
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.15,
                  }}
                  className={styles.skeletonItem}
                />
              ))}
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

          {!loading && !error && filteredSubjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.emptyState}
            >
              <div className={styles.emptyIcon}>§</div>
              {isSearchActive
                ? "Нічого не знайдено"
                : "Суб’єктів ще немає в базі"}
            </motion.div>
          ) : null}

          {!loading && !error && hasMore ? (
            <div className={styles.showAllWrap}>
              <div className={styles.showAllDivider} />
              <button
                className={`mono ${styles.showAllBtn}`}
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? "Сховати ↑"
                  : `Показати всі ${filteredSubjects.length} суб’єктів ↓`}
              </button>
              <div className={styles.showAllDivider} />
            </div>
          ) : null}

          {!loading && !error && displayedSubjects.length > 0 ? (
            <AnimatePresence>
              <div className={styles.cardList}>
                {displayedSubjects.map((subject, index) => (
                  <SubjectCard
                    key={subject._id}
                    subject={subject}
                    index={index}
                  />
                ))}
              </div>
            </AnimatePresence>
          ) : null}

          {!loading && !error && hasMore ? (
            <div className={styles.showAllWrap}>
              <div className={styles.showAllDivider} />
              <button
                className={`mono ${styles.showAllBtn}`}
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll
                  ? "Сховати ↑"
                  : `Показати всі ${filteredSubjects.length} суб’єктів ↓`}
              </button>
              <div className={styles.showAllDivider} />
            </div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
