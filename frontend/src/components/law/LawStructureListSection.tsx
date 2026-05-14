"use client";

import { motion } from "framer-motion";
import { type TreeBranch } from "@/lib/lawTree";
import styles from "./LawStructureList.module.scss";
import { ArticleEntry } from "./LawStructureListArticle";

export function SectionBlock({
  section,
  lawId,
  index,
}: {
  section: TreeBranch;
  lawId: string;
  index: number;
}) {
  const articles = section.children.filter((node) => node.type === "article");

  return (
    <motion.section
      className="panel law-structure-section"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
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
        <div className="law-structure-articles">
          {articles.map((article) => (
            <ArticleEntry key={article.key} article={article} lawId={lawId} />
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
