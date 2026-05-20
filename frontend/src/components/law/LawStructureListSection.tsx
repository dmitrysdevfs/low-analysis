"use client";

import { motion, AnimatePresence } from "framer-motion";
import { type TreeBranch } from "@/lib/tree";
import styles from "./LawStructureList.module.scss";
import { ArticleEntry } from "./LawStructureListArticle";

export function SectionBlock({
  section,
  lawId,
  lawTitle,
  index,
  highlightSubjectId,
}: {
  section: TreeBranch;
  lawId: string;
  lawTitle?: string;
  index: number;
  highlightSubjectId?: string | null;
}) {
  const articles = section.children.filter((node) => node.type === "article");

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
          {articles.length} {articles.length === 1 ? "стаття" : "статей"}
        </div>
      </div>

      {articles.length > 0 ? (
        <motion.div layout className="law-structure-articles">
          <AnimatePresence mode="popLayout">
            {articles.map((article) => (
              <ArticleEntry
                key={article.key}
                article={article}
                lawId={lawId}
                lawTitle={lawTitle}
                highlightSubjectId={highlightSubjectId}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </motion.section>
  );
}
