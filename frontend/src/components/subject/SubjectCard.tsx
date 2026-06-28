"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { ROUTES } from "@/constants/routes";
import { getLegalStatusColor, getLegalStatusLabel } from "@/lib/tree";
import { useTaxonomies } from "@/hooks/useTaxonomies";
import type { Subject } from "@/types";
import styles from "./SubjectCard.module.scss";

const FRONT_H = 140;

export function SubjectCard({
  subject,
  index,
}: {
  subject: Subject;
  index: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const { taxonomyMap } = useTaxonomies();

  const resolvedTaxonomies = useMemo(
    () =>
      (subject.taxonomies ?? [])
        .map((id) => taxonomyMap[id])
        .filter((t): t is NonNullable<typeof t> => t != null),
    [subject.taxonomies, taxonomyMap],
  );

  const backH = resolvedTaxonomies.length > 0 ? 300 : 260;

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFlipped((p) => !p);
  };

  const cssVars = {
    height: flipped ? backH : FRONT_H,
    "--sc": getLegalStatusColor(subject.legal_status),
  } as React.CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!flipped ? { y: -3 } : {}}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={styles.wrapper}
      style={cssVars}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }}
        className={styles.inner}
      >
        {/* FRONT */}
        <div className={styles.front}>
          <div className={styles.topRow}>
            <span className={`mono ${styles.statusBadge}`}>
              {getLegalStatusLabel(subject.legal_status)}
            </span>
            <button className={styles.flipBtn} onClick={toggle}>
              ↺
            </button>
          </div>
          <h2 className={`display ${styles.name}`}>{subject.canonical_name}</h2>
          {subject.description ? (
            <p className={styles.description}>{subject.description}</p>
          ) : null}
          {subject.laws_count != null || subject.elements_count != null ? (
            <div className={`mono ${styles.footer}`}>
              {subject.laws_count != null
                ? `${subject.laws_count} законів`
                : null}
              {subject.laws_count != null && subject.elements_count != null
                ? " · "
                : null}
              {subject.elements_count != null
                ? `${subject.elements_count} норм`
                : null}
            </div>
          ) : null}
        </div>

        {/* BACK */}
        <div className={styles.back}>
          <div className={styles.topRow}>
            <span className={styles.backName}>{subject.canonical_name}</span>
            <button className={styles.flipBtn} onClick={toggle}>
              ↩ Згорнути
            </button>
          </div>
          <div className={styles.aliasSection}>
            <span className={`mono ${styles.aliasLabel}`}>Псевдоніми:</span>
            {subject.aliases.length > 0 ? (
              <div className={styles.aliasRow}>
                {subject.aliases.map((a) => (
                  <span key={a} className={`mono ${styles.aliasChip}`}>
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <span className={`mono ${styles.aliasEmpty}`}>
                Псевдонімів не зазначено
              </span>
            )}
          </div>
          {resolvedTaxonomies.length > 0 ? (
            <div className={styles.aliasSection}>
              <span className={`mono ${styles.aliasLabel}`}>Категорії:</span>
              <div className={styles.aliasRow}>
                {resolvedTaxonomies.map((t) => (
                  <span key={t._id} className={`mono ${styles.taxonomyChip}`}>
                    {t.name}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          {subject.description ? (
            <p className={styles.backDescription}>{subject.description}</p>
          ) : null}
          <div className={styles.backLinks}>
            <Link
              href={ROUTES.subject(subject._id)}
              className={styles.detailLink}
            >
              Переглянути деталі →
            </Link>
            <Link
              href={`${ROUTES.laws}?subjectId=${subject._id}`}
              className={styles.lawsLink}
            >
              {subject.laws_count != null
                ? `${subject.laws_count} законів →`
                : "Пов'язані закони →"}
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
