"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getRoleLabel, getRoleColor } from "@/lib/tree";
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

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "122,152,192";
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ].join(",");
}

export function ArticleSubjectsSidebar({
  subjects,
  activeSubjectId,
  onSelect,
  loading,
}: Props) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        Суб&apos;єкти · {loading ? "…" : subjects.length}
      </div>

      {loading && (
        <div className={styles.skeletonList}>
          {[70, 55, 80].map((width, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.15 }}
              className={styles.skeletonItem}
              style={{ width: `${width}%` }}
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
        <AnimatePresence>
          <ul className={styles.list}>
            {subjects.map(({ subject_id, role, subject }, index) => {
              const isActive = activeSubjectId === subject_id;
              const color = getRoleColor(role);
              const rgb = hexToRgb(color);

              return (
                <motion.li
                  key={subject_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.25 }}
                >
                  <button
                    onClick={() => onSelect(subject_id)}
                    className={`${styles.itemButton} ${isActive ? styles.itemButtonActive : ""}`}
                    style={
                      isActive
                        ? {
                            background: `rgba(${rgb}, 0.1)`,
                            borderColor: `rgba(${rgb}, 0.35)`,
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
          </ul>
        </AnimatePresence>
      )}

      {activeSubjectId && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => onSelect(null)}
          className={styles.resetButton}
        >
          ✕ скинути вибір
        </motion.button>
      )}
    </aside>
  );
}
