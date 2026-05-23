"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import type { AnalysisHeatmapArticle } from "../types";
import styles from "../Analysis.module.scss";

function resolveCellColor(factor: number) {
  if (factor >= 68) return "#e9774b";
  if (factor >= 38) return "#c8a843";
  return "#4a80d4";
}

export function AnalysisHeatmap({
  lawId,
  rows,
  selectedId,
  onSelect,
}: {
  lawId: string;
  rows: AnalysisHeatmapArticle[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  return (
    <div className={styles.heatmapRows}>
      {rows.map((row, rowIndex) => (
        <motion.div
          key={row.id}
          className={styles.heatmapRow}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: rowIndex * 0.03, duration: 0.24 }}
        >
          <div className={styles.heatmapMeta}>
            <div className={styles.heatmapLabel}>{row.label}</div>
            <div className={styles.heatmapHint}>
              Фактор {row.averageFactor} · {row.cells.length} елементів
            </div>
            {row.routeNumber ? (
              <Link
                href={ROUTES.article(lawId, row.routeNumber)}
                className={styles.inlineLink}
              >
                Відкрити статтю
              </Link>
            ) : null}
          </div>

          <div className={styles.heatmapCells}>
            {row.cells.map((cell) => (
              <button
                key={cell.id}
                type="button"
                className={`${styles.heatmapCell} ${selectedId === cell.id ? styles.heatmapCellActive : ""}`}
                style={{ backgroundColor: resolveCellColor(cell.factor) }}
                onClick={() => onSelect?.(cell.id)}
                title={`${row.label} · ${cell.badge} · фактор ${cell.factor}`}
                aria-label={`${row.label} ${cell.badge}, фактор ${cell.factor}`}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
