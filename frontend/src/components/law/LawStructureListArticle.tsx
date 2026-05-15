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
}: {
  article: TreeBranch;
  lawId: string;
}) {
  const [open, setOpen] = useState(false);
  const nestedCount = countNestedNodes(article);
  const routeNumber = getArticleRouteNumber(article);

  return (
    <article className="law-structure-article">
      <div className="law-structure-article-head">
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
      </div>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            className="law-structure-branch"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
          >
            <NestedNodeList nodes={article.children} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
