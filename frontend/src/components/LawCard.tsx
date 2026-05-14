"use client";

import Link from "next/link";
import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { ROUTES } from "@/constants/routes";
import { getLawTree } from "@/lib/api";
import {
  getArticleTitle,
  getNodeLabel,
  getSortedArticles,
} from "@/lib/lawTree";
import type { Law, TreeNode } from "@/types";
import styles from "./LawCard.module.scss";

const CARD_HEIGHT = 148;
const BACK_HEIGHT = 460;
const PAGE_SIZE = 5;

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.26,
      delay: i * 0.05,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  }),
};

function SkeletonLine({ width }: { width: string }) {
  return (
    <motion.div
      animate={{ opacity: [0.2, 0.45, 0.2] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      className={styles.skeletonLine}
      style={{ width }}
    />
  );
}

function normalizeArticleNumberQuery(value: string) {
  return value.toLowerCase().replace(/ст\.?/giu, "").replace(/\s+/g, "").trim();
}

type ArticleItem = TreeNode;

export function LawCard({ law, index }: { law: Law; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [allArticles, setAllArticles] = useState<ArticleItem[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [query, setQuery] = useState("");
  const [subjectCount, setSubjectCount] = useState(0);
  const fetched = useRef(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return allArticles;
    const q = normalizeArticleNumberQuery(query);
    if (!q) return allArticles;

    return allArticles.filter((a) =>
      (a.number ?? "").toLowerCase().replace(/\s+/g, "").includes(q),
    );
  }, [allArticles, query]);

  const visible = filtered.slice(0, PAGE_SIZE);

  const handleFlip = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!flipped && !fetched.current) {
        fetched.current = true;
        setLoadingArticles(true);
        getLawTree(law._id)
          .then((data) => {
            const elements = data.elements;

            const arts: ArticleItem[] = getSortedArticles(elements);
            setAllArticles(arts);

            const uniqueSubjectIds = new Set(
              elements.flatMap(
                (el) => el.subjects?.map((s) => s.subject_id) ?? [],
              ),
            );
            setSubjectCount(uniqueSubjectIds.size);
          })
          .catch(() => {})
          .finally(() => setLoadingArticles(false));
      }

      setFlipped((prev) => !prev);
    },
    [flipped, law._id],
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      className={styles.cardWrapper}
      style={{
        height: flipped ? BACK_HEIGHT : CARD_HEIGHT,
        transition: "height 0.45s cubic-bezier(0.25,0.1,0.25,1)",
      }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.52, ease: [0.25, 0.1, 0.25, 1] }}
        className={styles.cardInner}
      >
        {/* ── FRONT ── */}
        <div onClick={handleFlip} className={styles.cardFront}>
          <div className={styles.frontHeader}>
            <h2 className={`display ${styles.frontTitle}`}>{law.title}</h2>
            <span className={`mono ${styles.lawCodeBadge}`}>{law.code}</span>
          </div>

          <div className={styles.frontStats}>
            <div className={styles.statsGroup}>
              <Stat value={law.totalSections} label="розділів" />
              <Stat value={law.totalArticles} label="статей" />
              {law.totalParagraphs ? (
                <Stat value={law.totalParagraphs} label="абзаців" />
              ) : null}
            </div>
            <span className={`mono ${styles.expandHint}`}>
              Натисни щоб розгорнути ↻
            </span>
          </div>
        </div>

        {/* ── BACK ── */}
        <div className={styles.cardBack}>
          {/* Back header */}
          <div className={styles.backHeader}>
            <div className={styles.backTitleWrap}>
              <span className={`display ${styles.backTitle}`}>{law.title}</span>
              <span className={`mono ${styles.backSubtitle}`}>
                Статті закону · {allArticles.length || law.totalArticles} всього
              </span>
              {subjectCount > 0 && (
                <span className={`mono ${styles.backSubtitle}`}>
                  {subjectCount} {"суб'єктів"}
                </span>
              )}
            </div>
            <button onClick={handleFlip} className={styles.collapseBtn}>
              ↩ Згорнути
            </button>
          </div>

          {/* Search input */}
          <div className={styles.searchRow}>
            <span className={styles.searchIcon}>⌕</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук за номером статті..."
              className={styles.searchInput}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className={styles.searchClear}
              >
                ✕
              </button>
            )}
          </div>

          {/* Articles list — no scrollbar */}
          <div className={styles.articlesList}>
            <AnimatePresence mode="wait">
              {loadingArticles ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.skeletonContainer}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={styles.skeletonItem}>
                      <SkeletonLine width={`${50 + (i % 3) * 15}%`} />
                      <SkeletonLine width={`${30 + (i % 4) * 10}%`} />
                    </div>
                  ))}
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={styles.emptyState}
                >
                  Нічого не знайдено
                </motion.div>
              ) : (
                <motion.div
                  key={`list-${query}`}
                  initial="hidden"
                  animate="visible"
                  className={styles.articleListCol}
                >
                  {visible.map((article, i) => (
                    <motion.div
                      key={article._id}
                      custom={i}
                      variants={itemVariants}
                    >
                      <Link
                        href={
                          article.number
                            ? ROUTES.article(law._id, article.number)
                            : ROUTES.law(law._id)
                        }
                        className={styles.articleLink}
                      >
                        <div className={styles.articleRow}>
                          <div className={styles.articleInfo}>
                            <span className={styles.articleTitle}>
                              {getNodeLabel(article)}
                            </span>

                            {getArticleTitle(article) && (
                              <span className={styles.articlePreview}>
                                {getArticleTitle(article)}
                              </span>
                            )}
                          </div>
                          <span className={styles.articleArrow}>→</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className={styles.cardFooter}>
            <Link href={ROUTES.law(law._id)} className={styles.allArticlesLink}>
              <motion.div
                whileHover={{ x: 4 }}
                className={styles.allArticlesBtn}
              >
                Всі статті закону ({law.totalArticles}) →
              </motion.div>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className={`mono ${styles.statValue}`}>{value}</div>
      <div className={`mono ${styles.statLabel}`}>{label}</div>
    </div>
  );
}
