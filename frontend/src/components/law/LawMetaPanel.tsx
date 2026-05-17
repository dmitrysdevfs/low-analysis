"use client";

import { motion } from "framer-motion";
import type { Law } from "@/types";
import {
  ARTICLE_LIMIT_OPTIONS,
  getNextLimitValue,
  parseLimitValue,
  toLimitParam,
} from "@/lib/pageLimits";
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
  lawSubjects: Array<{ subject_id: string; name: string; status: string }>;
  selectedSubjectId: string | null;
  onSubjectSelect: (value: string | null) => void;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
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
  isSidebarOpen,
  onSidebarToggle,
}: LawMetaPanelProps) {
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
              {"Суб'єкти (актори)"} · {lawSubjects.length}
            </div>
            <button
              type="button"
              className={`btn btn-ghost ${styles.subjectsToggle}`}
              onClick={onSidebarToggle}
            >
              {isSidebarOpen ? "Сховати список" : "Розгорнути список"}
            </button>
          </div>
          <div className={styles.subjectsList}>
            {lawSubjects.map(({ subject_id, name }) => (
              <button
                key={subject_id}
                type="button"
                className={`directory-chip mono ${styles.subjectChip} ${
                  selectedSubjectId === subject_id ? styles.subjectChipActive : ""
                }`}
                onClick={() =>
                  onSubjectSelect(selectedSubjectId === subject_id ? null : subject_id)
                }
              >
                {name}
              </button>
            ))}
          </div>
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
