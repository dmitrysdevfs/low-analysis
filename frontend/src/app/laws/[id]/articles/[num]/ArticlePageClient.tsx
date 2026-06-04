"use client";

import Link from "next/link";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { recordWorkspaceView } from "@/lib/auth/clientWorkspace";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Layout } from "@/components/layout/Layout";
import { ArticleLawCard } from "@/components/article/ArticleLawCard";
import { ROUTES } from "@/constants/routes";
import { useLawsMap } from "@/hooks/useLawsMap";
import { useArticle } from "@/hooks/useArticle";
import { useSubjectsMap } from "@/hooks/useSubjectsMap";
import { useAmendments } from "@/hooks/useAmendments";
import type { Amendment } from "@/types/legislator";
import {
  buildTreeBranches,
  getRoleColor,
  computeStatsFromTree,
  type RiskLevel,
} from "@/lib/tree";
import { LawRiskBar } from "@/components/law/LawRiskBar";
import { RiskFilterHint } from "@/components/law/RiskFilterHint";
import styles from "./page.module.scss";
import { NestedNodeList } from "@/components/article/ArticleTreeNode";
import type { Subject } from "@/types";
import { NoteModal } from "@/components/notes/NoteModal";
import SelectionTooltip from "@/components/notes/SelectionTooltip";
import type { NoteDraft } from "@/lib/notes/types";
import { useSidebarData } from "@/components/layout/SidebarDataContext";
import { scrollToHashWithRetry } from "@/lib/utils/scrollToHashWithRetry";

export function ArticlePageClient() {
  const { user } = useAuth();
  const params = useParams<{ id: string; num: string }>();
  const lawId = params?.id;
  const articleNumber = params?.num;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subjectModalId = searchParams.get("subjectModal");
  const { lawsMap } = useLawsMap();
  const { article, children, loading, error } = useArticle(
    lawId,
    articleNumber,
  );
  const law = lawId ? lawsMap.get(lawId) : undefined;

  const { data: amendments } = useAmendments({ lawId });

  const amendmentsMap = useMemo(() => {
    const map = new Map<string, Amendment[]>();
    amendments?.forEach((am) => {
      const list = map.get(am.element_id) || [];
      list.push(am);
      map.set(am.element_id, list);
    });
    return map;
  }, [amendments]);

  const lawTitle = law?.title ?? "Закон";
  const lawCode = law?.code ?? "";

  const [activeRiskLevel, setActiveRiskLevel] = useState<RiskLevel | null>(
    null,
  );

  const filteredChildren = useMemo(() => {
    if (!activeRiskLevel) return children;
    const matchingIds = new Set(
      children
        .filter((c) => c.risk_level === activeRiskLevel)
        .map((c) => c._id)
        .filter(Boolean) as string[],
    );
    if (matchingIds.size === 0) return [];
    const parentMap = new Map<string, string>();
    children.forEach((c) => {
      if (c._id && c.parentId) parentMap.set(c._id, c.parentId);
    });
    const toKeep = new Set<string>(matchingIds);
    matchingIds.forEach((id) => {
      let cur: string | null = id;
      while (cur) {
        const parentId: string | null = parentMap.get(cur) ?? null;
        if (parentId) toKeep.add(parentId);
        cur = parentId;
      }
    });
    return children.filter((c) => c._id && toKeep.has(c._id));
  }, [children, activeRiskLevel]);

  const childTree = useMemo(
    () => buildTreeBranches(filteredChildren),
    [filteredChildren],
  );
  const articleStats = useMemo(
    () => computeStatsFromTree(article ? [article, ...children] : children),
    [article, children],
  );

  const { subjectsMap } = useSubjectsMap();

  const articleSubjects = useMemo(() => {
    const seen = new Set<string>();
    const result: {
      subject_id: string;
      role: string;
      subject: Subject;
      count: number;
    }[] = [];
    const allNodes = article ? [article, ...children] : children;
    const countMap = new Map<string, number>();
    allNodes.forEach((node) => {
      node.subjects?.forEach((s) => {
        countMap.set(s.subject_id, (countMap.get(s.subject_id) ?? 0) + 1);
      });
    });
    allNodes.forEach((node) => {
      node.subjects?.forEach((s) => {
        if (!seen.has(s.subject_id) && subjectsMap.get(s.subject_id)) {
          seen.add(s.subject_id);
          result.push({
            ...s,
            subject: subjectsMap.get(s.subject_id)!,
            count: countMap.get(s.subject_id) ?? 1,
          });
        }
      });
    });
    return result.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  }, [article, children, subjectsMap]);

  const {
    setSubjects,
    setOnSubjectSelect,
    setActiveSubjectId: setSidebarActiveSubjectId,
  } = useSidebarData();

  useEffect(() => {
    if (articleSubjects.length === 0) return;
    setSubjects(
      articleSubjects.map((s) => ({
        id: s.subject_id,
        name: s.subject.canonical_name,
        role: s.role,
        count: s.count,
      })),
    );
    return () => setSubjects([]);
  }, [articleSubjects, setSubjects]);

  const articleTreeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [showAllSubjects, setShowAllSubjects] = useState(false);
  const [subjectsQuery, setSubjectsQuery] = useState("");

  // State для активного суб'єкта (для highlight і dimming)
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [matchIndex, setMatchIndex] = useState(0);

  const handleSubjectSelect = useCallback(
    (id: string | null) => {
      if (id === null) {
        setActiveSubjectId(null);
        setMatchIndex(0);
      } else if (id === activeSubjectId) {
        setMatchIndex((prev) => prev + 1);
      } else {
        setActiveSubjectId(id);
        setMatchIndex(0);
      }
    },
    [activeSubjectId],
  );

  useEffect(() => {
    setOnSubjectSelect(handleSubjectSelect);
    return () => setOnSubjectSelect(null);
  }, [handleSubjectSelect, setOnSubjectSelect]);

  useEffect(() => {
    setSidebarActiveSubjectId(activeSubjectId);
  }, [activeSubjectId, setSidebarActiveSubjectId]);

  // Sync activeSubjectId with URL param (from modal navigation)
  useEffect(() => {
    if (subjectModalId) {
      setActiveSubjectId(subjectModalId);
      setMatchIndex(0);
    } else {
      setActiveSubjectId(null);
      setMatchIndex(0);
    }
  }, [subjectModalId]);

  useEffect(() => {
    if (!activeSubjectId) return;
    const timer = setTimeout(() => {
      const marks = Array.from(
        articleTreeRef.current?.querySelectorAll("mark") ?? [],
      );
      if (!marks.length) return;
      marks[matchIndex % marks.length]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [activeSubjectId, matchIndex]);

  // Scroll to hash on load and when children change (to handle async content)
  useEffect(() => {
    const hash = window.location.hash;

    if (!hash || children.length === 0) return;

    scrollToHashWithRetry(hash);
  }, [children]);

  useEffect(() => {
    if (!user?.id || !lawId) return;
    recordWorkspaceView(user.id, {
      lawId,
      lawTitle: law?.title ?? "",
      articleNum: articleNumber ?? "",
      articleTitle: article?.title ?? "",
    });
  }, [user?.id, lawId, articleNumber, law?.title, article?.title]);

  // Терміни та колір для highlight: canonical_name + aliases + role color активного суб'єкта
  const highlightTerms = useMemo(() => {
    if (!activeSubjectId) return [];
    const active = articleSubjects.find(
      (s) => s.subject_id === activeSubjectId,
    );
    if (!active) return [];
    return [
      active.subject.canonical_name,
      ...(active.subject.aliases ?? []),
    ].filter(Boolean);
  }, [activeSubjectId, articleSubjects]);

  const highlightColor = useMemo(() => {
    if (!activeSubjectId) return "#c8a843";
    const active = articleSubjects.find(
      (s) => s.subject_id === activeSubjectId,
    );
    return active ? getRoleColor(active.role) : "#c8a843";
  }, [activeSubjectId, articleSubjects]);

  return (
    <Layout>
      {/* Sticky breadcrumb */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={styles.breadcrumbBar}
      >
        <Breadcrumb
          items={[
            { label: "Закони", href: ROUTES.laws },
            lawId
              ? { label: law?.title ?? lawId ?? "…", href: ROUTES.law(lawId) }
              : { label: law?.title ?? "…" },
            { label: `Стаття ${articleNumber ?? ""}` },
          ]}
        />
      </motion.div>

      <main className={styles.page}>
        <div className={styles.container}>
          {lawId && (
            <Link href={ROUTES.law(lawId)} className={styles.backLink}>
              ← Структура закону
            </Link>
          )}
          {/* Контент */}
          <div ref={containerRef}>
            <AnimatePresence mode="wait">
              {/* Loading skeleton */}
              {loading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.loadingList}
                >
                  {[85, 60, 75, 45, 68].map((width, index) => (
                    <motion.div
                      key={index}
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.12,
                      }}
                      className={styles.skeletonItem}
                      style={{
                        height: index === 0 ? 32 : index === 1 ? 20 : 14,
                        width: `${width}%`,
                      }}
                    />
                  ))}
                </motion.div>
              ) : null}

              {/* Error */}
              {!loading && error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={styles.errorState}
                >
                  <span className={styles.errorIcon}>!</span>
                  <span className={`mono ${styles.errorText}`}>{error}</span>
                </motion.div>
              ) : null}

              {/* Empty */}
              {!loading && !error && !article ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={styles.emptyState}
                >
                  <span className={styles.emptyIcon}>§</span>
                  <span className={`mono ${styles.emptyText}`}>
                    Статтю не знайдено
                  </span>
                </motion.div>
              ) : null}

              {/* Article content */}
              {!loading && !error && article ? (
                <motion.div
                  key={article.code}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  {/* Law context chip */}
                  <ArticleLawCard
                    lawTitle={lawTitle}
                    lawCode={lawCode}
                    lawId={lawId}
                  />

                  {/* Article block */}
                  <div className={styles.articleBlock}>
                    {article.title && (
                      <h1 className={`display ${styles.articleTitle}`}>
                        {article.title}
                      </h1>
                    )}

                    {!article.title && !article.number && (
                      <h1 className={`display ${styles.articleTitle}`}>
                        Стаття {articleNumber}
                      </h1>
                    )}

                    {/* Compact subjects block */}
                    {articleSubjects.length > 0 && (
                      <div
                        id="articleSubjectsBlock"
                        className={styles.articleSubjectsBlock}
                      >
                        <div className={styles.articleSubjectsHeader}>
                          <span className={styles.articleSubjectsLabel}>
                            СУБ&apos;ЄКТИ · {articleSubjects.length}
                          </span>
                          <div className={styles.articleSubjectsSearch}>
                            <span className={styles.articleSubjectsSearchIcon}>
                              ⌕
                            </span>
                            <input
                              type="text"
                              className={styles.articleSubjectsSearchInput}
                              placeholder="Пошук..."
                              value={subjectsQuery}
                              onChange={(e) => setSubjectsQuery(e.target.value)}
                            />
                            {subjectsQuery && (
                              <button
                                type="button"
                                className={styles.articleSubjectsSearchClear}
                                onClick={() => setSubjectsQuery("")}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {!subjectsQuery && (
                            <button
                              type="button"
                              className={styles.articleSubjectsToggleBtn}
                              onClick={() => setShowAllSubjects((v) => !v)}
                            >
                              {showAllSubjects
                                ? "Скасувати"
                                : `Показати всі · ${articleSubjects.length}`}
                            </button>
                          )}
                        </div>

                        {activeSubjectId && (
                          <div className={styles.articleSubjectsActions}>
                            <button
                              type="button"
                              className={styles.articleSubjectsActionBtn}
                              onClick={() => {
                                const marks = Array.from(
                                  articleTreeRef.current?.querySelectorAll(
                                    "mark",
                                  ) ?? [],
                                );
                                if (marks.length)
                                  marks[
                                    matchIndex % marks.length
                                  ]?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "center",
                                  });
                              }}
                            >
                              ↓ Перейти
                            </button>
                            <button
                              type="button"
                              className={styles.articleSubjectsActionBtn}
                              onClick={() => {
                                handleSubjectSelect(null);
                                setSubjectsQuery("");
                              }}
                            >
                              ✕ скинути фільтр
                            </button>
                          </div>
                        )}

                        <div className={styles.articleSubjectsChips}>
                          {(subjectsQuery
                            ? articleSubjects.filter((s) =>
                                s.subject.canonical_name
                                  .toLowerCase()
                                  .includes(subjectsQuery.toLowerCase()),
                              )
                            : showAllSubjects
                              ? articleSubjects
                              : articleSubjects.slice(0, 4)
                          ).map((s) => {
                            const c = getRoleColor(s.role);
                            const isActive = activeSubjectId === s.subject_id;
                            return (
                              <button
                                key={s.subject_id}
                                type="button"
                                className={`directory-chip mono ${isActive ? styles.articleSubjectsChipActive : ""}`}
                                style={{
                                  color: c,
                                  background: isActive ? `${c}20` : `${c}0d`,
                                  borderColor: isActive ? `${c}c0` : `${c}40`,
                                }}
                                onClick={() => {
                                  router.push(
                                    `${pathname}?subjectModal=${s.subject_id}&mentionIdx=0`,
                                  );
                                  setSubjectsQuery("");
                                }}
                              >
                                {s.subject.canonical_name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {articleStats && (
                      <LawRiskBar
                        stats={articleStats}
                        activeLevel={activeRiskLevel}
                        context="article"
                        onLevelClick={(level) =>
                          setActiveRiskLevel((prev) =>
                            prev === level ? null : level,
                          )
                        }
                      />
                    )}
                    {activeRiskLevel && (
                      <RiskFilterHint
                        activeLevel={activeRiskLevel}
                        count={filteredChildren.length}
                        context="article"
                        onReset={() => setActiveRiskLevel(null)}
                      />
                    )}

                    {article.text ? (
                      <div className={styles.articleBodyWrap}>
                        <p className={styles.articleBody}>{article.text}</p>
                        <span className={`mono ${styles.articleBodyCount}`}>
                          {article.text.length}
                        </span>
                      </div>
                    ) : null}

                    {/* Children / paragraphs */}
                    {children.length > 0 ? (
                      <motion.div
                        ref={articleTreeRef}
                        className={styles.childrenSection}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.15, duration: 0.3 }}
                      >
                        <div className={`mono ${styles.childrenHeading}`}>
                          Вміст статті · {children.length}{" "}
                          {children.length === 1
                            ? "елемент"
                            : children.length < 5
                              ? "елементи"
                              : "елементів"}
                        </div>

                        <NestedNodeList
                          nodes={childTree}
                          activeSubjectId={activeSubjectId}
                          highlightTerms={highlightTerms}
                          highlightColor={highlightColor}
                          subjectsMap={subjectsMap}
                          lawTitle={lawTitle}
                          articleNum={articleNumber ?? ""}
                          lawId={lawId ?? ""}
                          amendmentsMap={amendmentsMap}
                        />
                      </motion.div>
                    ) : null}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <SelectionTooltip
              containerRef={containerRef}
              lawId={lawId ?? ""}
              lawTitle={law?.title ?? ""}
              articleNum={articleNumber ?? ""}
              articleTitle={article?.title ?? ""}
              onRequestNote={(draft: NoteDraft) => setNoteDraft(draft)}
            />
          </div>
        </div>
      </main>

      <NoteModal
        open={noteDraft !== null}
        draft={noteDraft}
        onClose={() => setNoteDraft(null)}
        onSaved={() => setNoteDraft(null)}
      />
    </Layout>
  );
}
