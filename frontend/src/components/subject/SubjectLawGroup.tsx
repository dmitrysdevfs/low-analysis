"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  getRoleColor,
  getRoleLabel,
  getTypeLabel,
  parseElementCode,
} from "@/lib/tree";
import { ROUTES } from "@/constants/routes";
import type { Law, TreeNode } from "@/types";
import styles from "./SubjectLawGroup.module.scss";

interface SubjectLawGroupProps {
  lawId: string;
  law: Law | undefined;
  elements: TreeNode[];
  subjectId: string;
  defaultOpen?: boolean;
}

export function SubjectLawGroup({
  lawId,
  law,
  elements,
  subjectId,
  defaultOpen,
}: SubjectLawGroupProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());

  const toggleText = (key: string) => {
    setExpandedTexts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className={styles.group}>
      <div className={styles.header} onClick={() => setOpen((v) => !v)}>
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ""}`}>
          ▶
        </span>
        <span className={styles.lawCode}>{law?.code ?? lawId}</span>
        <span className={styles.lawTitle}>{law?.title ?? ""}</span>
        <span className={styles.counter}>{elements.length} норм</span>
        <Link
          href={ROUTES.law(lawId)}
          className={styles.lawLink}
          onClick={(e) => e.stopPropagation()}
        >
          → до закону
        </Link>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className={styles.body}>
              {elements.map((el) => {
                const key = el._id ?? el.code;
                const parsed = parseElementCode(el.code);
                const role = el.subjects?.find(
                  (s) => s.subject_id === subjectId,
                )?.role;
                const isExpanded = expandedTexts.has(key);

                return (
                  <div key={key} className={styles.elementCard}>
                    <div className={styles.breadcrumb}>
                      {parsed.sectionLabel && (
                        <span className={styles.sectionLabel}>
                          {parsed.sectionLabel}
                        </span>
                      )}
                      {parsed.sectionLabel && parsed.articleNumber && (
                        <span className={styles.sep}>›</span>
                      )}
                      {parsed.articleNumber && (
                        <Link
                          href={ROUTES.article(lawId, parsed.articleNumber)}
                          className={styles.articleLink}
                        >
                          Стаття {parsed.articleNumber}
                        </Link>
                      )}
                    </div>

                    {el.title && (
                      <p className={styles.elementTitle}>{el.title}</p>
                    )}

                    {el.text && (
                      <>
                        <p
                          className={`${styles.elementText} ${isExpanded ? "" : styles.textClamped}`}
                        >
                          {el.text}
                        </p>
                        <button
                          className={styles.expandBtn}
                          onClick={() => toggleText(key)}
                        >
                          {isExpanded ? "Згорнути" : "Показати повністю"}
                        </button>
                      </>
                    )}

                    <div className={styles.footerBadges}>
                      {role && (
                        <span
                          className={styles.roleBadge}
                          style={
                            {
                              "--rc": getRoleColor(role),
                            } as React.CSSProperties
                          }
                        >
                          {getRoleLabel(role)}
                        </span>
                      )}
                      {el.type && (
                        <span className={styles.typeBadge}>
                          {getTypeLabel(el.type)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
