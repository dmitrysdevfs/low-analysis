"use client";

import { useDeferredValue, useMemo } from "react";
import type { Law } from "@/types";
import styles from "../Analysis.module.scss";

interface AnalysisLawPickerProps {
  laws: Law[];
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (law: Law) => void;
  label?: string;
  hint?: string;
}

export function AnalysisLawPicker({
  laws,
  query,
  onQueryChange,
  onSelect,
  label = "Обрати закон",
  hint = "Швидкий перехід до аналітики конкретного закону за назвою або кодом.",
}: AnalysisLawPickerProps) {
  const deferredQuery = useDeferredValue(query);

  const filteredLaws = useMemo(() => {
    const value = deferredQuery.trim().toLowerCase();
    const base = [...laws].sort((left, right) => {
      const leftWeight =
        left.totalArticles * 3 + left.totalSections + (left.totalParagraphs ?? 0);
      const rightWeight =
        right.totalArticles * 3 +
        right.totalSections +
        (right.totalParagraphs ?? 0);
      return rightWeight - leftWeight;
    });

    if (!value) {
      return base.slice(0, 6);
    }

    return base
      .filter((law) =>
        `${law.title} ${law.code}`.toLowerCase().includes(value),
      )
      .slice(0, 8);
  }, [deferredQuery, laws]);

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.panelEyebrow}>Навігатор</span>
          <h3 className={styles.panelTitle}>{label}</h3>
          <p className={styles.panelDescription}>{hint}</p>
        </div>
      </div>

      <div className={styles.searchField}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Пошук закону за назвою або кодом…"
          className={styles.searchInput}
          aria-label="Пошук закону"
        />
        {query ? (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => onQueryChange("")}
            aria-label="Очистити пошук"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className={styles.lawPickerList}>
        {filteredLaws.map((law) => (
          <button
            key={law._id}
            type="button"
            className={styles.lawPickerRow}
            onClick={() => onSelect(law)}
          >
            <span className={styles.lawPickerBody}>
              <span className={styles.lawPickerTitle}>{law.title}</span>
              <span className={styles.lawPickerMeta}>
                {law.code} · {law.totalArticles} статей · {law.totalSections} розділів
              </span>
            </span>
            <span className={styles.lawPickerArrow}>→</span>
          </button>
        ))}
      </div>
    </section>
  );
}
