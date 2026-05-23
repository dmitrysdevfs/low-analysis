"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/constants/routes";
import { formatCitation } from "@/lib/tree";
import { notify } from "@/lib/toast";
import type { AnalysisElementRecord } from "../types";
import styles from "../Analysis.module.scss";

function resolveRiskClass(riskLevel: AnalysisElementRecord["riskLevel"]) {
  if (riskLevel === "red") return styles.riskRed;
  if (riskLevel === "yellow") return styles.riskYellow;
  return styles.riskGreen;
}

function resolveFactorClass(factorBand: AnalysisElementRecord["factorBand"]) {
  if (factorBand === "high") return styles.factorHigh;
  if (factorBand === "medium") return styles.factorMedium;
  return styles.factorLow;
}

export function AnalysisRegistry({
  lawId,
  lawTitle,
  records,
  selectedId,
}: {
  lawId: string;
  lawTitle: string;
  records: AnalysisElementRecord[];
  selectedId?: string | null;
}) {
  async function copyDirectLink(record: AnalysisElementRecord) {
    const anchor = `${window.location.origin}${ROUTES.article(
      lawId,
      record.articleNumber ?? "1",
    )}#${record.code.replace(/[.:]/g, "-")}`;
    try {
      await navigator.clipboard.writeText(anchor);
      notify.success("Пряме посилання на елемент скопійовано.");
    } catch {
      notify.error("Не вдалося скопіювати посилання.");
    }
  }

  async function copyLegalCitation(record: AnalysisElementRecord) {
    const citation = formatCitation({
      badge: record.badge,
      text: record.text,
      charCount: record.charsCount,
      subjectLinks: record.subjectLinks.map((item) => ({
        id: item.id,
        name: item.name,
      })),
      lawId,
      articleNum: record.articleNumber ?? "1",
      lawTitle,
      code: record.code,
    });

    try {
      await navigator.clipboard.writeText(citation);
      notify.success("Юридичне посилання скопійовано.");
    } catch {
      notify.error("Не вдалося скопіювати юридичне посилання.");
    }
  }

  return (
    <div className={styles.registryViewport}>
      {records.map((record, index) => (
        <motion.article
          key={record.id}
          id={`analysis-record-${record.id}`}
          className={`${styles.registryRow} ${selectedId === record.id ? styles.registryRowActive : ""}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, delay: index * 0.01 }}
        >
          <div className={styles.registryHead}>
            <div className={styles.registryHeading}>
              <span className={styles.registryBadge}>{record.badge}</span>
              <span className={styles.registryArticle}>{record.articleLabel}</span>
              <span className={`${styles.riskPill} ${resolveRiskClass(record.riskLevel)}`}>
                {record.riskLevel === "red"
                  ? "Високий ризик"
                  : record.riskLevel === "yellow"
                    ? "Середній ризик"
                    : "Норма"}
              </span>
              <span
                className={`${styles.factorPill} ${resolveFactorClass(record.factorBand)}`}
              >
                factor {record.factor}
              </span>
            </div>

            <div className={styles.registryActions}>
              {record.articleNumber ? (
                <Link
                  href={ROUTES.article(lawId, record.articleNumber)}
                  className={styles.actionButton}
                >
                  Відкрити
                </Link>
              ) : null}
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => copyDirectLink(record)}
              >
                URL
              </button>
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => copyLegalCitation(record)}
              >
                Цитата
              </button>
            </div>
          </div>

          <div className={styles.registryText}>{record.text}</div>

          <div className={styles.registryStats}>
            <span>{record.sectionLabel}</span>
            <span>{record.charsCount} символів</span>
            <span>{record.subjectsCount} суб'єктів</span>
            <span>z-score {record.zScore.toFixed(2)}</span>
          </div>

          {record.subjectLinks.length ? (
            <div className={styles.subjectChips}>
              {record.subjectLinks.map((subject) => (
                <Link
                  key={`${record.id}-${subject.id}-${subject.role}`}
                  href={ROUTES.subject(subject.id)}
                  className={styles.subjectChip}
                  style={{
                    borderColor: `${subject.color}66`,
                    color: subject.color,
                  }}
                >
                  {subject.name}
                </Link>
              ))}
            </div>
          ) : null}
        </motion.article>
      ))}
    </div>
  );
}
