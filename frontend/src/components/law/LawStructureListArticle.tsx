"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  countNestedNodes,
  getArticleBadge,
  getArticleRouteNumber,
  getArticleTitle,
  type TreeBranch,
} from "@/lib/lawTree";
import { ROUTES } from "@/constants/routes";
import { NestedNodeList } from "./LawStructureListNodes";

export function ArticleEntry({
  article,
  lawId,
  highlightSubjectId,
}: {
  article: TreeBranch;
  lawId: string;
  highlightSubjectId?: string | null;
}) {
  const [open, setOpen] = useState(!!highlightSubjectId);
  const [prevHighlightId, setPrevHighlightId] = useState(highlightSubjectId);

  if (highlightSubjectId !== prevHighlightId) {
    setPrevHighlightId(highlightSubjectId);
    if (highlightSubjectId) {
      setOpen(true);
    }
  }
  const nestedCount = countNestedNodes(article);
  const routeNumber = getArticleRouteNumber(article);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2 }}
      className="law-structure-article"
    >
      <motion.div layout="position" className="law-structure-article-head">
        <div className="law-structure-article-main">
          <div className="law-structure-article-label mono">
            {getArticleBadge(article)}
          </div>
          {routeNumber ? (
            <Link
              className="law-structure-article-link display"
              href={ROUTES.article(lawId, routeNumber)}
            >
              {getArticleTitle(article)}
            </Link>
          ) : (
            <div className="law-structure-article-link display">
              {getArticleTitle(article)}
            </div>
          )}
        </div>

        {nestedCount > 0 ? (
          <button
            type="button"
            className="law-structure-toggle"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <span>{open ? "Сховати структуру" : "Показати структуру"}</span>
            <span className="mono">{nestedCount} ел.</span>
          </button>
        ) : null}
      </motion.div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="law-structure-branch"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <NestedNodeList
              nodes={article.children}
              highlightSubjectId={highlightSubjectId}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}
