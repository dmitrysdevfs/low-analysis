"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getRoleLabel, getRoleColor, hexToRgb } from "@/lib/tree";
import styles from "./ArticleSubjectsSidebar.module.scss";

interface Subject {
  _id: string;
  canonical_name: string;
  legal_status: string;
  aliases: string[];
  createdAt: string;
}

interface ArticleSubject {
  subject_id: string;
  role: string;
  subject: Subject;
}

interface Props {
  subjects: ArticleSubject[];
  activeSubjectId: string | null;
  onSelect: (id: string | null) => void;
  loading: boolean;
}

const MOBILE_PREVIEW = 9;

export function ArticleSubjectsSidebar({
  subjects,
  activeSubjectId,
  onSelect,
  loading,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubjects = searchQuery
    ? subjects.filter((s) =>
        s.subject.canonical_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : subjects;

  const visibleSubjects =
    !showAll && !searchQuery && filteredSubjects.length > MOBILE_PREVIEW
      ? filteredSubjects.slice(0, MOBILE_PREVIEW)
      : filteredSubjects;

  const hasMore = !searchQuery && subjects.length > MOBILE_PREVIEW;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <span>Суб&apos;єкти · {loading ? "…" : subjects.length}</span>
        <div className={styles.searchPill}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Пошук..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className={styles.skeletonList}>
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.1 }}
              className={styles.skeletonItem}
            />
          ))}
        </div>
      )}

      {!loading && subjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={styles.emptyState}
        >
          <span className={styles.emptyIcon}>ℹ</span>
          <p className={styles.emptyText}>
            Суб&apos;єктів не знайдено.
            <br />
            AI-аналіз статті ще не виконано.
          </p>
        </motion.div>
      )}

      {!loading && subjects.length > 0 && (
        <>
          <ul className={styles.list}>
            <AnimatePresence initial={false}>
              {visibleSubjects.map(({ subject_id, role, subject }, index) => {
                const isActive = activeSubjectId === subject_id;
                const color = getRoleColor(role);
                const rgb = hexToRgb(color);

                return (
                  <motion.li
                    key={subject_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className={styles.listItem}
                  >
                    <button
                      onClick={() => onSelect(subject_id)}
                      className={`${styles.itemButton} ${isActive ? styles.itemButtonActive : ""}`}
                      style={
                        isActive
                          ? {
                              background: `rgba(${rgb}, 0.12)`,
                              borderColor: `rgba(${rgb}, 0.4)`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className={`${styles.itemName} ${isActive ? styles.itemNameActive : ""}`}
                        style={isActive ? { color } : undefined}
                      >
                        {subject.canonical_name}
                      </span>
                      <span
                        className={styles.roleBadge}
                        style={{
                          color,
                          background: `rgba(${rgb}, 0.1)`,
                          border: `1px solid rgba(${rgb}, 0.25)`,
                        }}
                      >
                        {getRoleLabel(role)}
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {searchQuery && filteredSubjects.length === 0 && (
            <p className={styles.emptyText} style={{ padding: "8px 0" }}>
              Нічого не знайдено
            </p>
          )}

          <div className={styles.footer}>
            {hasMore && !showAll && (
              <button
                type="button"
                className={styles.showAllBtn}
                onClick={() => setShowAll(true)}
              >
                Показати всі · {subjects.length}
              </button>
            )}

            {activeSubjectId && (
              <button
                type="button"
                className={styles.resetButton}
                onClick={() => onSelect(null)}
              >
                ✕ скинути
              </button>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
