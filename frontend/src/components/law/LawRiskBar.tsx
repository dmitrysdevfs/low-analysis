"use client";

import type { LawStats } from "@/types";
import type { RiskLevel } from "@/lib/tree";
import { RiskBarTooltip } from "./RiskBarTooltip";
import styles from "./LawRiskBar.module.scss";

interface LawRiskBarProps {
  stats: LawStats;
  activeLevel?: RiskLevel | "orange" | null;
  onLevelClick?: (level: RiskLevel | "orange") => void;
  context?: "law" | "article";
}

const LEVEL_LABELS: Record<string, string> = {
  orange: "Помірна (нижче середнього)",
  green: "Норма",
  yellow: "Помірна (вище середнього)",
  red: "Об'ємні",
};
const LEVEL_HINT: Record<string, string> = {
  orange: "z < 0 - нижче середнього",
  green: "0 ≤ z < 1σ  — стандартний обсяг",
  yellow: "1σ ≤ z < 2σ — вище середнього",
  red: "z > 2σ — значно більше середнього",
};

export function LawRiskBar({
  stats,
  activeLevel,
  onLevelClick,
  context = "law",
}: LawRiskBarProps) {
  const backendRisks = stats.riskLevels as Record<string, number | undefined>;
  const riskLevels = {
    // тимчасово
    orange:
      (backendRisks?.orange ?? 0) === 0 ? 20 : (backendRisks?.orange ?? 0),

    green: backendRisks?.green ?? 0,
    yellow: backendRisks?.yellow ?? 0,
    red: backendRisks?.red ?? 0,
  };
  const { totalElements, meanChars, standardDeviation } = stats;
  const counted =
    riskLevels.orange + riskLevels.green + riskLevels.yellow + riskLevels.red;
  if (counted === 0) return null;

  const pct = (n: number) =>
    counted > 0 ? Math.round((n / counted) * 100) : 0;

  const orangePct = pct(riskLevels.orange);
  const greenPct = pct(riskLevels.green);
  const yellowPct = pct(riskLevels.yellow);
  const redPct = pct(riskLevels.red);

  const isInteractive = !!onLevelClick;

  const segClass = (level: string, base: string) =>
    [
      styles.seg,
      base,
      isInteractive ? styles.segClickable : "",
      activeLevel === level ? styles.segActive : "",
      activeLevel && activeLevel !== level ? styles.segDimmed : "",
    ]
      .filter(Boolean)
      .join(" ");

  const css = styles as Record<string, string>;

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={`eyebrow ${styles.label}`}>
          Складність норм
          <RiskBarTooltip context={context} />
        </span>
        <span className={`mono ${styles.meta}`}>
          {Math.round(meanChars)} симв. · σ {Math.round(standardDeviation)} ·{" "}
          {totalElements} елементів
        </span>
      </div>

      <div className={styles.bar} title="Розподіл норм за обсягом тексту">
        {riskLevels.orange > 0 && (
          <button
            type="button"
            className={segClass("orange", css.segOrange || styles.segYellow)}
            style={{ width: `${orangePct}%` }}
            onClick={() => onLevelClick?.("orange")}
            title={`Помаранчевий · ${riskLevels.orange} ел. · ${LEVEL_HINT.orange}`}
            disabled={!isInteractive}
          />
        )}
        {riskLevels.green > 0 && (
          <button
            type="button"
            className={segClass("green", styles.segGreen)}
            style={{ width: `${greenPct}%` }}
            onClick={() => onLevelClick?.("green")}
            title={`Зелений · ${riskLevels.green} ел. · ${LEVEL_HINT.green}`}
            disabled={!isInteractive}
          />
        )}
        {riskLevels.yellow > 0 && (
          <button
            type="button"
            className={segClass("yellow", styles.segYellow)}
            style={{ width: `${yellowPct}%` }}
            onClick={() => onLevelClick?.("yellow")}
            title={`Жовтий · ${riskLevels.yellow} ел. · ${LEVEL_HINT.yellow}`}
            disabled={!isInteractive}
          />
        )}
        {riskLevels.red > 0 && (
          <button
            type="button"
            className={segClass("red", styles.segRed)}
            style={{ width: `${redPct}%` }}
            onClick={() => onLevelClick?.("red")}
            title={`Червоний · ${riskLevels.red} ел. · ${LEVEL_HINT.red}`}
            disabled={!isInteractive}
          />
        )}
      </div>

      <div className={styles.legend}>
        {(["orange", "green", "yellow", "red"] as const).map((level) => {
          const count = riskLevels[level];

          const dotClass = `${styles.dot} ${styles[`dot${level.charAt(0).toUpperCase()}${level.slice(1)}`]}`;
          const isActive = activeLevel === level;
          const isDimmed = activeLevel && activeLevel !== level;

          if (isInteractive) {
            return (
              <button
                key={level}
                type="button"
                className={[
                  styles.legendBtn,
                  isActive ? styles.legendBtnActive : "",
                  isDimmed ? styles.legendBtnDimmed : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => onLevelClick?.(level)}
              >
                <span className={dotClass} />
                <span className={`mono ${styles.legendLabel}`}>
                  {LEVEL_LABELS[level]}
                </span>
                <span className={`mono ${styles.legendCount}`}>{count}</span>
                <span className={`mono ${styles.legendHint}`}>
                  {LEVEL_HINT[level]}
                </span>
              </button>
            );
          }

          return (
            <span key={level} className={styles.legendItem}>
              <span className={dotClass} />
              <span className={`mono ${styles.legendLabel}`}>
                {count} {LEVEL_LABELS[level].toLowerCase()} ({pct(count)}%)
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
