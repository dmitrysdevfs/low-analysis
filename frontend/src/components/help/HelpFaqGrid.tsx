"use client";

import { useState, useMemo } from "react";
import type { FaqItem } from "@/content/help/types";
import { HelpFaqCard } from "./HelpFaqCard";
import styles from "./help.module.scss";

interface HelpFaqGridProps {
  items: FaqItem[];
  articleBasePath: string;
}

export function HelpFaqGrid({ items, articleBasePath }: HelpFaqGridProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))),
    [items],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === null || item.category === activeCategory;
      const matchesQuery =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [items, query, activeCategory]);

  return (
    <div>
      <div className={styles.faqSearch}>
        <input
          type="search"
          placeholder="Пошук по питаннях..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={styles.faqSearchInput}
        />
      </div>

      <div className={styles.categories}>
        <button
          type="button"
          className={`${styles.categoryChip} ${activeCategory === null ? styles.categoryChipActive : ""}`}
          onClick={() => setActiveCategory(null)}
        >
          Всі
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`${styles.categoryChip} ${activeCategory === cat ? styles.categoryChipActive : ""}`}
            onClick={() =>
              setActiveCategory(cat === activeCategory ? null : cat)
            }
          >
            {cat}
          </button>
        ))}
      </div>

      <div className={styles.faqGrid}>
        {filtered.length === 0 ? (
          <p className={styles.emptyHint}>Нічого не знайдено</p>
        ) : (
          filtered.map((item, i) => (
            <HelpFaqCard
              key={`${item.slug}-${i}`}
              item={item}
              articleHref={`${articleBasePath}/${item.slug}`}
            />
          ))
        )}
      </div>
    </div>
  );
}
