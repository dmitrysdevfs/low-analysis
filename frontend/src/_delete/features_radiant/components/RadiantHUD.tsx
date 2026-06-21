"use client";

import { Search, RotateCcw, ArrowLeft } from "lucide-react";
import { LAW_CLUSTERS, getLawColor } from "../lib/colorScheme";
import styles from "./RadiantHUD.module.scss";

interface RadiantHUDProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalLaws: number;
  totalLinks: number;
  onResetCamera: () => void;
  onBack: () => void;
}

const LEGEND_CLUSTERS = [
  "кодекс",
  "кримінальний",
  "цивільний",
  "адміністративний",
  "трудовий",
  "господарський",
  "земельний",
  "сімейний",
  "податковий",
];

export function RadiantHUD({
  searchQuery,
  onSearchChange,
  totalLaws,
  totalLinks,
  onResetCamera,
  onBack,
}: RadiantHUDProps) {
  return (
    <div className={styles.hud}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          <ArrowLeft size={14} />
          Назад
        </button>

        <div className={styles.brand}>
          <span className={styles.brandTitle}>РАДІАНТ</span>
          <span className={styles.brandSubtitle}>
            3D-візуалізація законодавчої бази України
          </span>
        </div>

        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Пошук закону..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <span className={styles.counter}>
          {totalLaws} законів · {totalLinks} зв'язків
        </span>

        <button
          type="button"
          className={styles.resetBtn}
          onClick={onResetCamera}
        >
          <RotateCcw size={13} />
          Скинути вид
        </button>
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.legend}>
          {LEGEND_CLUSTERS.map((cluster) => (
            <div key={cluster} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: getLawColor(cluster) }}
              />
              <span className={styles.legendLabel}>
                {LAW_CLUSTERS[cluster] ?? cluster}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
