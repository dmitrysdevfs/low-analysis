"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useMemo, useEffect, useRef } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { recordWorkspaceView } from "@/lib/auth/clientWorkspace";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Layout } from "@/components/Layout";
import { ArticleLawCard } from "@/components/ArticleLawCard";
import { ArticleSubjectsSidebar } from "@/components/article/ArticleSubjectsSidebar";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import { useArticle } from "@/hooks/useArticle";
import { useSubjectsMap } from "@/hooks/useSubjectsMap";
import { buildTreeBranches, getRoleColor } from "@/lib/lawTree";
import styles from "./page.module.scss";
import { NestedNodeList } from "@/components/ArticleTreeNode";
import type { Subject } from "@/types";

export default function ArticlePage() {
  const { user } = useAuth();
  const params = useParams<{ id: string; num: string }>();
  const lawId = params?.id;
  const articleNumber = params?.num;
  const { laws } = useLaws();
  const { article, children, loading, error } = useArticle(
    lawId,
    articleNumber,
  );
  const law = laws.find((item) => item._id === lawId);

  const lawTitle = law?.title ?? "Закон";
  const lawCode = law?.code ?? "";

  const childTree = useMemo(() => buildTreeBranches(children), [children]);

  const { subjectsMap, loading: subjectsLoading } = useSubjectsMap();

  const articleSubjects = useMemo(() => {
    const seen = new Set<string>();
    const result: { subject_id: string; role: string; subject: Subject }[] = [];
    const allNodes = article ? [article, ...children] : children;
    allNodes.forEach((node) => {
      node.subjects?.forEach((s) => {
        if (!seen.has(s.subject_id) && subjectsMap.get(s.subject_id)) {
          seen.add(s.subject_id);
          result.push({ ...s, subject: subjectsMap.get(s.subject_id)! });
        }
      });
    });
    return result;
  }, [article, children, subjectsMap]);

  const articleTreeRef = useRef<HTMLDivElement>(null);

  // State для активного суб'єкта (для highlight і dimming)
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [matchIndex, setMatchIndex] = useState(0);

  const handleSubjectSelect = (id: string | null) => {
    if (id === null) {
      setActiveSubjectId(null);
      setMatchIndex(0);
    } else if (id === activeSubjectId) {
      setMatchIndex((prev) => prev + 1);
    } else {
      setActiveSubjectId(id);
      setMatchIndex(0);
    }
  };

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
    }, 60);
    return () => clearTimeout(timer);
  }, [activeSubjectId, matchIndex]);

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
        <div className={styles.outerContainer}>
          {lawId && (
            <Link href={ROUTES.law(lawId)} className={styles.backLink}>
              ← Структура закону
            </Link>
          )}
          <div className={styles.articleLayout}>
            {/* Лівий сайдбар суб'єктів (показуємо тільки якщо є стаття) */}
            {!loading && !error && article && (
              <ArticleSubjectsSidebar
                subjects={articleSubjects}
                activeSubjectId={activeSubjectId}
                onSelect={handleSubjectSelect}
                loading={subjectsLoading}
              />
            )}

            {/* Правий контент */}
            <div className={styles.articleMain}>
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

                      {article.text ? (
                        <p className={styles.articleBody}>{article.text}</p>
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
                          />
                        </motion.div>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
