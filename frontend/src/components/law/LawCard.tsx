"use client";

import Link from "next/link";
import { useState, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";

import { ROUTES } from "@/constants/routes";
import { getLawTree } from "@/lib/api";
import { getSortedArticles } from "@/lib/tree";
import { notify } from "@/lib/toast";
import type { Law, TreeNode } from "@/types";
import styles from "./LawCard.module.scss";
import { LawCardStat } from "./LawCardStat";
import { LawCardArticlesList } from "./LawCardArticlesList";

const CARD_HEIGHT = 148;
const BACK_HEIGHT = 460;
const PAGE_SIZE = 5;

function normalizeArticleNumberQuery(value: string) {
  return value.toLowerCase().replace(/ст\.?/giu, "").replace(/\s+/g, "").trim();
}

export function LawCard({ law, index }: { law: Law; index: number }) {
  const [flipped, setFlipped] = useState(false);
  const [allArticles, setAllArticles] = useState<TreeNode[]>([]);
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

            const arts: TreeNode[] = getSortedArticles(elements);
            setAllArticles(arts);

            const uniqueSubjectIds = new Set(
              elements.flatMap(
                (el) => el.subjects?.map((s) => s.subject_id) ?? [],
              ),
            );
            setSubjectCount(uniqueSubjectIds.size);
          })
          .catch(() => {
            fetched.current = false;
            notify.error("Не вдалося завантажити статті закону");
          })
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
      whileHover={!flipped ? { y: -3 } : {}}
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
              <LawCardStat value={law.totalSections} label="розділів" />
              <LawCardStat value={law.totalArticles} label="статей" />
              {law.totalParagraphs ? (
                <LawCardStat value={law.totalParagraphs} label="абзаців" />
              ) : null}
            </div>
          </div>

          {(law.adoptedDate || (law.documentType && law.documentType.length > 0)) ? (
            <div className={styles.frontMeta}>
              {law.adoptedDate ? (
                <span className={styles.metaDate}>
                  {new Date(law.adoptedDate).toLocaleDateString("uk-UA")}
                </span>
              ) : null}
              {law.documentType && law.documentType.length > 0 ? (
                <span className={styles.metaDocType}>{law.documentType[0]}</span>
              ) : null}
            </div>
          ) : null}
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
                  {" · "}
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
          <LawCardArticlesList
            loading={loadingArticles}
            visible={visible}
            isEmpty={filtered.length === 0}
            lawId={law._id}
            query={query}
          />

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
