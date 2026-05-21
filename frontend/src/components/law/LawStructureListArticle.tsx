"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  countNestedNodes,
  getArticleBadge,
  getArticleRouteNumber,
  getArticleTitle,
  type TreeBranch,
} from "@/lib/tree";
import { ROUTES } from "@/constants/routes";
import { NestedNodeList } from "./LawStructureListNodes";
import { useNotes } from "@/hooks/useNotes";

export function ArticleEntry({
  article,
  lawId,
  lawTitle,
  highlightSubjectId,
}: {
  article: TreeBranch;
  lawId: string;
  lawTitle?: string;
  highlightSubjectId?: string | null;
}) {
  const [open, setOpen] = useState(!!highlightSubjectId);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (highlightSubjectId) {
      setOpen(true);
    }
  }, [highlightSubjectId]);

  const { hasArticleNote } = useNotes();
  const nestedCount = countNestedNodes(article);
  const routeNumber = getArticleRouteNumber(article);
  const hasNote = hasArticleNote(lawId, String(routeNumber ?? ""));

  // Native addEventListener bypasses Framer Motion's pointer capture
  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    el.setAttribute("draggable", "true");

    function handleDragStart(e: DragEvent) {
      if (!e.dataTransfer) return;
      e.dataTransfer.setData(
        "application/law-article",
        JSON.stringify({
          lawId,
          lawTitle: lawTitle ?? "",
          articleNum: String(routeNumber ?? ""),
          articleTitle: article.title ?? "",
        }),
      );
      e.dataTransfer.effectAllowed = "copy";
    }

    el.addEventListener("dragstart", handleDragStart);
    return () => {
      el.removeEventListener("dragstart", handleDragStart);
    };
  }, [lawId, lawTitle, routeNumber, article.title]);

  return (
    <motion.article
      ref={articleRef}
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
              {hasNote ? (
                <span
                  title="Є нотатка"
                  style={{ marginLeft: 6, fontSize: "0.75rem" }}
                >
                  📝
                </span>
              ) : null}
            </Link>
          ) : (
            <div className="law-structure-article-link display">
              {getArticleTitle(article)}
              {hasNote ? (
                <span
                  title="Є нотатка"
                  style={{ marginLeft: 6, fontSize: "0.75rem" }}
                >
                  📝
                </span>
              ) : null}
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
