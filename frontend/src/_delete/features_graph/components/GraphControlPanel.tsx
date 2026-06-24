"use client";

import { Network, Search, RotateCcw, List } from "lucide-react";
import styles from "./GraphControlPanel.module.scss";

const LEGEND_ITEMS = [
  { label: "Кодекс", color: "#c8a843" },
  { label: "Цивільний", color: "#4a80d4" },
  { label: "Кримінальний", color: "#e05252" },
  { label: "Господарський", color: "#f4a261" },
  { label: "Трудовий", color: "#52b788" },
  { label: "Адмін.", color: "#7a98c0" },
  { label: "Інший", color: "#9eb5d9" },
];

interface GraphControlPanelProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalNodes: number;
  totalEdges: number;
  onResetView: () => void;
  showFallback: boolean;
  onToggleFallback: () => void;
}

export function GraphControlPanel({
  searchQuery,
  onSearchChange,
  totalNodes,
  totalEdges,
  onResetView,
  showFallback,
  onToggleFallback,
}: GraphControlPanelProps) {
  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <Network size={16} className={styles.headerIcon} />
        <span className={styles.headerTitle}>ГРАФ ЗАКОНІВ</span>
      </div>

      <div className={styles.searchWrapper}>
        <Search size={14} className={styles.searchIcon} />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Пошук закону..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className={styles.stats}>
        <span>Вузлів: {totalNodes}</span>
        <span className={styles.statsDivider}>|</span>
        <span>Зв'язків: {totalEdges}</span>
      </div>

      <div className={styles.actions}>
        <button className={styles.btn} onClick={onResetView}>
          <RotateCcw size={13} />
          Скинути вид
        </button>

        <button
          className={`${styles.btn} ${showFallback ? styles.btnActive : ""}`}
          onClick={onToggleFallback}
        >
          <List size={13} />
          Текстовий режим
        </button>
      </div>

      <div className={styles.legend}>
        <p className={styles.legendTitle}>Типи законів</p>
        {LEGEND_ITEMS.map((item) => (
          <div key={item.label} className={styles.legendItem}>
            <span
              className={styles.legendDot}
              style={{ background: item.color }}
            />
            <span className={styles.legendLabel}>{item.label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
