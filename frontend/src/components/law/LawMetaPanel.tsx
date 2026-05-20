"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Law } from "@/types";
import {
  ARTICLE_LIMIT_OPTIONS,
  getNextLimitValue,
  parseLimitValue,
  toLimitParam,
} from "@/lib/utils/pageLimits";
import { getRoleColor } from "@/lib/tree";
import styles from "./LawMetaPanel.module.scss";

interface LawMetaPanelProps {
  law: Law | null;
  sectionsCount: number;
  articleCount: number;
  showLimitControls: boolean;
  visibleArticleCount: number;
  canLoadMore: boolean;
  selectedLimit: number | "all";
  onLimitChange: (value: number | "all") => void;
  lawSubjects: Array<{ subject_id: string; name: string; role: string; count: number }>;
  selectedSubjectId: string | null;
  onSubjectSelect: (value: string | null) => void;
}

export function LawMetaPanel({
  law,
  sectionsCount,
  articleCount,
  showLimitControls,
  visibleArticleCount,
  canLoadMore,
  selectedLimit,
  onLimitChange,
  lawSubjects,
  selectedSubjectId,
  onSubjectSelect,
}: LawMetaPanelProps) {
  const [subjectsQuery, setSubjectsQuery] = useState("");
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: 0.05 }}
      className={`panel ${styles.lawMeta}`}
    >
      <span className="eyebrow">Структура закону</span>
      <h1 className={`display ${styles.lawTitle}`}>
        {law?.title ?? "Завантажуємо структуру закону"}
      </h1>
      {law?.signatory && (
        <div className={styles.lawSignatory}>{law.signatory}</div>
      )}
      <div className="law-structure-summary">
        {law ? <span className="directory-chip mono">{law.code}</span> : null}
        <span className="mono law-structure-inline-note">
          {sectionsCount} розділів · {articleCount} статей
        </span>
      </div>
      {law?.status && (
        <div className={styles.lawStatus}>
          {law.status.charAt(0).toUpperCase() +
            law.status.slice(1).toLowerCase()}
        </div>
      )}
      {lawSubjects.length > 0 && (
        <div className={styles.subjectsBlock}>
          <div className={styles.subjectsHeader}>
            <div className={`eyebrow ${styles.subjectsLabel}`}>
              Суб&apos;єкти · {lawSubjects.length}
            </div>
            <div className={styles.subjectsHeaderActions}>
              <button
                type="button"
                className={styles.showAllSubjectsBtn}
                onClick={() => setShowAllSubjects((v) => !v)}
              >
                {showAllSubjects ? "Скасувати" : `Показати всі · ${lawSubjects.length}`}
              </button>
              <div className={styles.subjectsSearchPill}>
                <span className={styles.subjectsSearchIcon}>⌕</span>
                <input
                  type="text"
                  className={styles.subjectsSearchInput}
                  placeholder="Пошук..."
                  value={subjectsQuery}
                  onChange={(e) => setSubjectsQuery(e.target.value)}
                />
                {subjectsQuery && (
                  <button
                    type="button"
                    className={styles.subjectsSearchClear}
                    onClick={() => setSubjectsQuery("")}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
          {(() => {
            const DEFAULT_N = 8;
            const filtered = subjectsQuery
              ? lawSubjects.filter((s) =>
                  s.name.toLowerCase().includes(subjectsQuery.toLowerCase())
                )
              : lawSubjects;
            const visible =
              !showAllSubjects && !subjectsQuery ? filtered.slice(0, DEFAULT_N) : filtered;
            return (
              <>
                <div className={styles.subjectsGrid}>
                  {visible.map(({ subject_id, name, role }) => {
                    const c = getRoleColor(role);
                    const isActive = selectedSubjectId === subject_id;
                    return (
                      <button
                        key={subject_id}
                        type="button"
                        className={`directory-chip mono ${styles.subjectChip} ${isActive ? styles.subjectChipActive : ""}`}
                        style={{
                          color: isActive ? c : c,
                          background: isActive ? `${c}20` : `${c}0d`,
                          borderColor: isActive ? `${c}c0` : `${c}40`,
                        }}
                        onClick={() =>
                          onSubjectSelect(selectedSubjectId === subject_id ? null : subject_id)
                        }
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                {subjectsQuery && filtered.length === 0 && (
                  <p className={styles.subjectsEmpty}>Нічого не знайдено</p>
                )}
                {selectedSubjectId && (
                  <div className={styles.subjectsActions}>
                    <button
                      type="button"
                      className={styles.scrollToArticlesBtn}
                      onClick={() => {
                        const el = document.querySelector(".law-structure-list");
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      Перейти ↓
                    </button>
                    <button
                      type="button"
                      className={styles.resetSubjectBtn}
                      onClick={() => onSubjectSelect(null)}
                    >
                      ✕ скинути фільтр
                    </button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
      <p className={styles.lawDesc}>
        Список статей формується напряму з дерева закону. Клік по назві статті
        відкриває повну сторінку, а кнопка праворуч показує вкладену структуру
        частин, пунктів і абзаців.
      </p>

      {showLimitControls ? (
        <div className={styles.controls}>
          <div className={styles.controlsCopy}>
            <div className={`mono ${styles.controlsLabel}`}>
              Показано {visibleArticleCount} із {articleCount} статей
            </div>
            <p className={styles.controlsHint}>
              Довгі закони можна переглядати частинами, щоб сторінка не
              перетворювалася на довгий суцільний список.
            </p>
          </div>

          <div className={styles.controlsActions}>
            <label className={styles.limitField}>
              <span className={`mono ${styles.limitLabel}`}>Показувати</span>
              <select
                aria-label="Показувати статей"
                className={`form-control form-select ${styles.limitSelect}`}
                value={toLimitParam(selectedLimit)}
                onChange={(event) =>
                  onLimitChange(parseLimitValue(event.target.value))
                }
              >
                {ARTICLE_LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
                <option value="all">Всі</option>
              </select>
            </label>

            {canLoadMore ? (
              <button
                type="button"
                className={`btn btn-ghost ${styles.loadMoreButton}`}
                onClick={() => onLimitChange(getNextLimitValue(selectedLimit))}
              >
                {getNextLimitValue(selectedLimit) === "all"
                  ? "Показати всі"
                  : "Показати ще"}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </motion.section>
  );
}
