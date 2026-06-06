"use client";

import type { TreeNode } from "@/types";
import styles from "@/components/law/VolumeChipBar.module.scss";

export type VolumeBucket = "below" | "normal" | "moderate" | "voluminous";

const BUCKETS: {
  key: VolumeBucket;
  label: string;
  hint: string;
  predicate: (z: number) => boolean;
}[] = [
  {
    key: "below",
    label: "Нижче середнього",
    hint: "z < 0 — коротші за середнє",
    predicate: (z) => z < 0,
  },
  {
    key: "normal",
    label: "Норма",
    hint: "0 ≤ z < 1σ — стандартний обсяг",
    predicate: (z) => z >= 0 && z < 1,
  },
  {
    key: "moderate",
    label: "Помірна",
    hint: "1σ ≤ z < 2σ — вище середнього",
    predicate: (z) => z >= 1 && z < 2,
  },
  {
    key: "voluminous",
    label: "Об'ємна",
    hint: "z ≥ 2σ — значно більше середнього",
    predicate: (z) => z >= 2,
  },
];

interface LegislatorVolumeBarProps {
  tree: TreeNode[];
  activeLevel: VolumeBucket | null;
  onLevelClick: (level: VolumeBucket) => void;
}

export function getLegislatorVolumeBucket(zScore: number): VolumeBucket {
  for (const b of BUCKETS) {
    if (b.predicate(zScore)) return b.key;
  }
  return "normal";
}

export function LegislatorVolumeBar({
  tree,
  activeLevel,
  onLevelClick,
}: LegislatorVolumeBarProps) {
  const counts = BUCKETS.reduce<Record<VolumeBucket, number>>(
    (acc, b) => {
      acc[b.key] = tree.filter((n) => b.predicate(n.z_score ?? 0)).length;
      return acc;
    },
    { below: 0, normal: 0, moderate: 0, voluminous: 0 },
  );

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  if (total === 0) return null;

  return (
    <div className={styles.wrap}>
      <span className={`mono ${styles.eyebrow}`}>Обсяг елементів</span>
      <div className={styles.chips}>
        {/* "Всі" chip */}
        <button
          type="button"
          title="Скинути фільтр"
          className={`mono ${styles.chip} ${activeLevel === null ? styles.chipActive : ""}`}
          onClick={() => activeLevel && onLevelClick(activeLevel)}
        >
          Всі <span className={styles.count}>{total}</span>
        </button>

        {BUCKETS.map(({ key, label, hint }) => (
          <button
            key={key}
            type="button"
            title={hint}
            className={`mono ${styles.chip} ${activeLevel === key ? styles.chipActive : ""}`}
            onClick={() => onLevelClick(key)}
          >
            {label}
            <span className={styles.count}>{counts[key]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
