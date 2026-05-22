"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type TreeBranch } from "@/lib/tree";
import styles from "./LawStructureList.module.scss";
import { ArticleEntry } from "./LawStructureListArticle";
import { NestedNodeList } from "./LawStructureListNodes";
import type { Subject } from "@/types";

export function SectionBlock({
  section,
  lawId,
  lawTitle,
  index,
  highlightSubjectId,
  subjectsMap,
}: {
  section: TreeBranch;
  lawId: string;
  lawTitle?: string;
  index: number;
  highlightSubjectId?: string | null;
  subjectsMap?: Map<string, Subject>;
}) {
  const [open, setOpen] = useState(!!highlightSubjectId);

  useEffect(() => {
    if (highlightSubjectId) {
      setOpen(true);
    }
  }, [highlightSubjectId]);

  const articles = section.children.filter((node) => node.type === "article");
  const otherChildren = section.children.filter((node) => node.type !== "article");
  const hasArticles = articles.length > 0;

  return (
    <motion.section
      layout
      className="panel law-structure-section"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
    >
      <div className="law-structure-section-head">
        <div className={styles.sectionHead}>
          <div className="law-structure-section-kicker mono">
            {section.number ? `Розділ ${section.number}` : "Структура"}
          </div>
          <h2 className="display law-structure-section-title">
            {section.title ?? "Без назви розділу"}
          </h2>
        </div>
        <div className="law-structure-section-count mono">
          {hasArticles ? (
            <>
              {articles.length} {articles.length === 1 ? "стаття" : "статей"}
            </>
          ) : (
            <button
              type="button"
              className="law-structure-toggle"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
            >
              <span>{open ? "Сховати структуру" : "Показати структуру"}</span>
              <span className="mono">{section.children.length} ел.</span>
            </button>
          )}
        </div>
      </div>

      {hasArticles ? (
        <motion.div layout className="law-structure-articles">
          <AnimatePresence mode="popLayout">
            {articles.map((article) => (
              <ArticleEntry
                key={article.key}
                article={article}
                lawId={lawId}
                lawTitle={lawTitle}
                highlightSubjectId={highlightSubjectId}
                subjectsMap={subjectsMap}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : null}

      {!hasArticles && otherChildren.length > 0 ? (
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              className="law-structure-branch"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="law-structure-nested-list" style={{ paddingLeft: 0 }}>
                <NestedNodeList
                  nodes={otherChildren}
                  highlightSubjectId={highlightSubjectId}
                  subjectsMap={subjectsMap}
                  lawId={lawId}
                  lawTitle={lawTitle}
                />
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : null}
    </motion.section>
  );
}
