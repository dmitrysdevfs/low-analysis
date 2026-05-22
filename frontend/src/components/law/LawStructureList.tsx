"use client";

import { type TreeBranch } from "@/lib/tree";
import { SectionBlock } from "./LawStructureListSection";
import { ArticleEntry } from "./LawStructureListArticle";
import { AnimatePresence, motion } from "framer-motion";
import type { Subject } from "@/types";

export function LawStructureList({
  sections,
  lawId,
  lawTitle,
  highlightSubjectId,
  subjectsMap,
  flatArticles,
}: {
  sections: TreeBranch[];
  lawId: string;
  lawTitle?: string;
  highlightSubjectId?: string | null;
  subjectsMap?: Map<string, Subject>;
  flatArticles?: TreeBranch[] | null;
}) {
  if (flatArticles) {
    if (flatArticles.length === 0) {
      return (
        <div className="law-structure-list">
          <div
            className="panel law-structure-section"
            style={{
              color: "var(--color-smoke)",
              fontSize: "0.88rem",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            Жодної статті не відповідає фільтру
          </div>
        </div>
      );
    }
    return (
      <motion.div layout className="law-structure-list">
        <div className="panel law-structure-section">
          <div className="law-structure-articles">
            <AnimatePresence mode="popLayout">
              {flatArticles.map((article) => (
                <ArticleEntry
                  key={article._id ?? article.key}
                  article={article}
                  lawId={lawId}
                  lawTitle={lawTitle}
                  highlightSubjectId={highlightSubjectId}
                  subjectsMap={subjectsMap}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  const sectionsToRender = sections.filter(
    (section) => section.children.length > 0,
  );

  return (
    <motion.div layout className="law-structure-list">
      <AnimatePresence mode="popLayout">
        {sectionsToRender.map((section, index) => (
          <SectionBlock
            key={section.key}
            section={section}
            lawId={lawId}
            lawTitle={lawTitle}
            index={index}
            highlightSubjectId={highlightSubjectId}
            subjectsMap={subjectsMap}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
