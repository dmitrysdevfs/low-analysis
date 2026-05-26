"use client";

import styles from "../Analysis.module.scss";
import type { RiskLevel } from "@/lib/tree";
import type { FactorBand } from "../types";

const RISK_FILTERS: Array<{ label: string; value: "all" | RiskLevel }> = [
  { label: "Всі", value: "all" },
  { label: "Норма", value: "green" },
  { label: "Увага", value: "yellow" },
  { label: "Викид", value: "red" },
];

const FACTOR_FILTERS: Array<{ label: string; value: "all" | FactorBand }> = [
  { label: "Весь factor", value: "all" },
  { label: "Низький", value: "low" },
  { label: "Середній", value: "medium" },
  { label: "Високий", value: "high" },
];

interface AnalysisFilterPanelProps {
  query: string;
  onQueryChange: (value: string) => void;
  risk: "all" | RiskLevel;
  onRiskChange: (value: "all" | RiskLevel) => void;
  factorBand: "all" | FactorBand;
  onFactorBandChange: (value: "all" | FactorBand) => void;
  article: "all" | string;
  articleOptions: string[];
  onArticleChange: (value: string) => void;
  subjectsThreshold: number;
  onSubjectsThresholdChange: (value: number) => void;
}

export function AnalysisFilterPanel({
  query,
  onQueryChange,
  risk,
  onRiskChange,
  factorBand,
  onFactorBandChange,
  article,
  articleOptions,
  onArticleChange,
  subjectsThreshold,
  onSubjectsThresholdChange,
}: AnalysisFilterPanelProps) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelEyebrow}>Фільтри</span>
          <h2 className={styles.panelTitle}>Точне налаштування зрізу</h2>
        </div>
      </div>

      <div className={styles.filterBlock}>
        <span className={styles.filterHeading}>Пошук по елементах</span>
        <div className={styles.searchField}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Код, текст, суб'єкт…"
            aria-label="Пошук по елементах"
          />
          {query ? (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => onQueryChange("")}
              aria-label="Очистити фільтр елементів"
            >
              ×
            </button>
          ) : null}
        </div>
      </div>

      <div className={styles.filterBlock}>
        <span className={styles.filterHeading}>Рівень ризику</span>
        <div className={styles.filterChips}>
          {RISK_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.filterChip} ${risk === item.value ? styles.filterChipActive : ""}`}
              onClick={() => onRiskChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterBlock}>
        <span className={styles.filterHeading}>Factor</span>
        <div className={styles.filterChips}>
          {FACTOR_FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`${styles.filterChip} ${factorBand === item.value ? styles.filterChipActive : ""}`}
              onClick={() => onFactorBandChange(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterBlock}>
        <span className={styles.filterHeading}>Стаття</span>
        <select
          className={`form-control form-select ${styles.select}`}
          value={article}
          onChange={(event) => onArticleChange(event.target.value)}
          aria-label="Фільтр за статтею"
        >
          <option value="all">Усі статті</option>
          {articleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterBlock}>
        <span className={styles.filterHeading}>Суб'єкти в елементі</span>
        <select
          className={`form-control form-select ${styles.select}`}
          value={subjectsThreshold}
          onChange={(event) =>
            onSubjectsThresholdChange(Number(event.target.value))
          }
          aria-label="Мінімум суб'єктів"
        >
          <option value={0}>Без порогу</option>
          <option value={1}>Від 1 суб&apos;єкта</option>
          <option value={2}>Від 2 суб&apos;єктів</option>
          <option value={3}>Від 3 суб&apos;єктів</option>
        </select>
      </div>
    </section>
  );
}
