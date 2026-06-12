"use client";

import type { RiskLevel } from "@/lib/tree";
import styles from "./RiskFilterHint.module.scss";

const COLORS: Record<RiskLevel, string> = {
  orange: "#e67e22",
  green: "#4a9e6b",
  yellow: "#c8a843",
  red: "#c0392b",
};

const LABELS: Record<RiskLevel, string> = {
  orange: "Помірна (нижче середнього)",
  green: "Норма",
  yellow: "Помірна (вище середнього)",
  red: "Об'ємні",
};

function pluralArticles(n: number) {
  if (n === 1) return "стаття";
  if (n < 5) return "статті";
  return "статей";
}

interface RiskFilterHintProps {
  activeLevel: RiskLevel;
  count: number;
  context: "law" | "article";
  onReset: () => void;
}

export function RiskFilterHint({
  activeLevel,
  count,
  context,
  onReset,
}: RiskFilterHintProps) {
  const label = LABELS[activeLevel];
  const suffix =
    context === "law"
      ? `${count} ${pluralArticles(count)}`
      : `${count} елементів`;

  return (
    <div className={styles.hint}>
      <span
        className={styles.dot}
        style={{ background: COLORS[activeLevel] }}
      />
      <span className={`mono ${styles.label}`}>
        {label} · {suffix}
      </span>
      <button type="button" className={styles.reset} onClick={onReset}>
        ✕ Скинути
      </button>
    </div>
  );
}
