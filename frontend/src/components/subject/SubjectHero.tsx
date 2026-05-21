"use client";

import { getLegalStatusColor, getLegalStatusLabel } from "@/lib/tree";
import type { Subject } from "@/types";
import styles from "./SubjectHero.module.scss";

interface SubjectHeroProps {
  subject: Subject;
  lawsCount: number;
  normsCount: number;
  rolesCount: number;
}

export function SubjectHero({
  subject,
  lawsCount,
  normsCount,
  rolesCount,
}: SubjectHeroProps) {
  const sc = getLegalStatusColor(subject.legal_status);

  return (
    <div className={styles.hero}>
      <span
        className={`mono ${styles.statusBadge}`}
        style={{ "--sc": sc } as React.CSSProperties}
      >
        {getLegalStatusLabel(subject.legal_status)}
      </span>

      <h1 className={`display ${styles.heading}`}>{subject.canonical_name}</h1>

      {subject.description ? (
        <p className={styles.description}>{subject.description}</p>
      ) : null}

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{lawsCount}</span>
          <span className={styles.statLabel}>законів</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{normsCount}</span>
          <span className={styles.statLabel}>норм</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statNum}>{rolesCount}</span>
          <span className={styles.statLabel}>ролі</span>
        </div>
      </div>

      <div className={styles.aliasesLabel}>Псевдоніми / синоніми</div>
      {subject.aliases.length > 0 ? (
        <div className={styles.aliasesFlex}>
          {subject.aliases.map((alias) => (
            <span key={alias} className={styles.aliasBadge}>
              {alias}
            </span>
          ))}
        </div>
      ) : (
        <span className={styles.aliasesEmpty}>Псевдонімів не зазначено</span>
      )}
    </div>
  );
}
