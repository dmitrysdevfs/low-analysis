"use client";

import type { LawStats } from "@/types";
import type { RiskLevel } from "@/lib/tree";
import styles from "./VolumeChipBar.module.scss";

const CHIPS: { level: RiskLevel | null; label: string; hint: string }[] = [
  { level: null,     label: "Всі",      hint: "Скинути фільтр" },
  { level: "green",  label: "Норма",    hint: "z ≤ 1σ" },
  { level: "yellow", label: "Помірна",  hint: "1σ < z < 2σ" },
  { level: "red",    label: "Об'ємна",  hint: "z ≥ 2σ" },
];

interface VolumeChipBarProps {
  stats: LawStats;
  activeLevel: RiskLevel | null;
  onLevelClick: (level: RiskLevel) => void;
}

export function VolumeChipBar({ stats, activeLevel, onLevelClick }: VolumeChipBarProps) {
  const counts: Record<string, number> = {
    green:  stats.riskLevels.green,
    yellow: stats.riskLevels.yellow,
    red:    stats.riskLevels.red,
  };
  const total = counts.green + counts.yellow + counts.red;
  if (total === 0) return null;

  return (
    <div className={styles.wrap}>
      <span className={`mono ${styles.eyebrow}`}>Обсяг норм</span>
      <div className={styles.chips}>
        {CHIPS.map(({ level, label, hint }) => {
          const isAll    = level === null;
          const isActive = isAll ? activeLevel === null : activeLevel === level;
          const count    = isAll ? total : counts[level!];

          return (
            <button
              key={label}
              type="button"
              title={hint}
              className={`mono ${styles.chip} ${isActive ? styles.chipActive : ""}`}
              onClick={() => {
                if (isAll) {
                  if (activeLevel) onLevelClick(activeLevel);
                } else {
                  onLevelClick(level!);
                }
              }}
            >
              {label}
              <span className={styles.count}>{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
