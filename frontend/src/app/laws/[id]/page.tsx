"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { motion } from "framer-motion";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LawMetaPanel } from "@/components/law/LawMetaPanel";
import { LawStructureList } from "@/components/law/LawStructureList";
import type { TreeNode } from "@/types";
import { Layout } from "@/components/layout/Layout";
import { ROUTES } from "@/constants/routes";
import { useLawTree } from "@/hooks/useLawTree";
import { useSubjectsMap } from "@/hooks/useSubjectsMap";
import {
  buildLawSections,
  countArticlesInSections,
  limitLawSections,
} from "@/lib/tree";
import styles from "./page.module.scss";
import {
  DEFAULT_ARTICLE_LIMIT,
  ARTICLE_LIMIT_OPTIONS,
  parseLimitValue,
  toLimitParam,
} from "@/lib/utils/pageLimits";
import { useSidebarData } from "@/components/layout/SidebarDataContext";

function filterTreeBySubject(
  tree: TreeNode[],
  subjectId: string | null,
): TreeNode[] {
  if (!subjectId) return tree;

  const matchingNodeIds = new Set<string>();
  const parentMap = new Map<string, string | null>();

  tree.forEach((node) => {
    if (node._id) parentMap.set(node._id, node.parentId || null);
    if (node.subjects?.some((s) => s.subject_id === subjectId)) {
      if (node._id) matchingNodeIds.add(node._id);
    }
  });

  const nodesToKeep = new Set<string>(matchingNodeIds);
  matchingNodeIds.forEach((id) => {
    let currentId: string | null = id;
    while (currentId) {
      const parentId = parentMap.get(currentId);
      if (parentId) {
        nodesToKeep.add(parentId);
      }
      currentId = parentId || null;
    }
  });

  return tree.filter((node) => node._id && nodesToKeep.has(node._id));
}

export default function LawTreePage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lawId = params?.id;
  const { law, tree, loading, error } = useLawTree(lawId);
  const { subjectsMap } = useSubjectsMap();
  const { setSubjects, setOnSubjectSelect } = useSidebarData();
  const [selectedLimit, setSelectedLimit] = useState(() =>
    parseLimitValue(searchParams.get("limit")),
  );
  // Sync state when URL changes (back/forward navigation)
  useEffect(() => {
    setSelectedLimit(parseLimitValue(searchParams.get("limit")));
  }, [searchParams]);
  const selectedSubjectId = searchParams.get("subject");

  // Save to recently viewed in localStorage
  useEffect(() => {
    if (!law || typeof window === "undefined") return;
    const RECENTLY_VIEWED_KEY = "law-analysis.recently-viewed";
    const MAX_RECENT = 5;
    try {
      const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const current: Array<{ _id: string; title: string; code: string }> = raw
        ? JSON.parse(raw)
        : [];
      const entry = { _id: law._id, title: law.title, code: law.code };
      const filtered = current.filter((item) => item._id !== law._id);
      const updated = [entry, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
    } catch {
      // localStorage unavailable — skip silently
    }
  }, [law]);

  const lawSubjects = useMemo(() => {
    const seen = new Set<string>();
    const countMap = new Map<string, number>();
    tree.forEach((el) => {
      el.subjects?.forEach((s) => {
        countMap.set(s.subject_id, (countMap.get(s.subject_id) ?? 0) + 1);
      });
    });
    const result: Array<{
      subject_id: string;
      name: string;
      role: string;
      count: number;
    }> = [];
    tree.forEach((el) => {
      el.subjects?.forEach((s) => {
        const subj = subjectsMap.get(s.subject_id);
        if (!seen.has(s.subject_id) && subj) {
          seen.add(s.subject_id);
          result.push({
            subject_id: s.subject_id,
            name: subj.canonical_name,
            role: s.role,
            count: countMap.get(s.subject_id) ?? 1,
          });
        }
      });
    });
    return result.sort((a, b) => b.count - a.count);
  }, [tree, subjectsMap]);

  useEffect(() => {
    if (lawSubjects.length === 0) return;
    setSubjects(
      lawSubjects.map((s) => ({
        id: s.subject_id,
        name: s.name,
        role: s.role,
        count: s.count,
      })),
    );
    return () => setSubjects([]);
  }, [lawSubjects, setSubjects]);

  const filteredTree = useMemo(
    () => filterTreeBySubject(tree, selectedSubjectId),
    [tree, selectedSubjectId],
  );

  const sections = useMemo(
    () => buildLawSections(filteredTree),
    [filteredTree],
  );
  const articleCount = useMemo(
    () => countArticlesInSections(sections),
    [sections],
  );
  const visibleSections = useMemo(
    () =>
      limitLawSections(
        sections,
        selectedLimit === "all" ? null : selectedLimit,
      ),
    [sections, selectedLimit],
  );
  const visibleArticleCount = useMemo(
    () => countArticlesInSections(visibleSections),
    [visibleSections],
  );
  const showLimitControls =
    !loading && !error && articleCount > ARTICLE_LIMIT_OPTIONS[0];
  const canLoadMore =
    showLimitControls &&
    selectedLimit !== "all" &&
    visibleArticleCount < articleCount;

  const updateLimit = (nextValue: number | "all") => {
    setSelectedLimit(nextValue);
    const nextSearchParams = new URLSearchParams(searchParams.toString());
    const nextParam = toLimitParam(nextValue);

    if (nextParam === String(DEFAULT_ARTICLE_LIMIT)) {
      nextSearchParams.delete("limit");
    } else {
      nextSearchParams.set("limit", nextParam);
    }

    const nextQuery = nextSearchParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  const updateSubject = useCallback(
    (nextValue: string | null) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      if (nextValue) {
        nextSearchParams.set("subject", nextValue);
      } else {
        nextSearchParams.delete("subject");
      }
      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [searchParams, pathname, router],
  );

  useEffect(() => {
    setOnSubjectSelect(updateSubject);
    return () => setOnSubjectSelect(null);
  }, [updateSubject, setOnSubjectSelect]);

  return (
    <Layout fullHeight>
      <div className={styles.contentFlex}>
        <div className="sm:flex sm:gap-8 max-w-[1400px] mx-auto w-full">
          <div className={`section-pad page-frame ${styles.pageInner} flex-1`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Breadcrumb
                items={[
                  { label: "Закони", href: ROUTES.laws },
                  { label: law?.title ?? lawId ?? "…" },
                ]}
              />
            </motion.div>

            <LawMetaPanel
              law={law}
              sectionsCount={sections.length}
              articleCount={articleCount}
              showLimitControls={showLimitControls}
              visibleArticleCount={visibleArticleCount}
              canLoadMore={canLoadMore}
              selectedLimit={selectedLimit}
              onLimitChange={updateLimit}
              lawSubjects={lawSubjects}
              selectedSubjectId={selectedSubjectId}
              onSubjectSelect={updateSubject}
            />

            {loading ? (
              <div
                className="law-structure-list"
                role="status"
                aria-live="polite"
                aria-label="Завантажуємо структуру закону"
              >
                {Array.from({ length: 3 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className={`panel law-structure-section ${styles.skeletonSection}`}
                    animate={{ opacity: [0.35, 0.65, 0.35] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.1,
                    }}
                  >
                    <div className={styles.skeletonLabel} />
                    <div className={styles.skeletonTitle} />
                    <div className={styles.skeletonRows}>
                      {Array.from({ length: 3 }).map((__, rowIndex) => (
                        <div key={rowIndex} className={styles.skeletonRow} />
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : null}

            {!loading && error ? (
              <motion.div
                role="alert"
                className={`panel ${styles.errorPanel}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={`mono ${styles.errorLabel}`}>
                  Помилка завантаження
                </div>
                <div className={styles.errorText}>{error}</div>
              </motion.div>
            ) : null}

            {!loading && !error && articleCount === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`panel ${styles.emptyPanel}`}
              >
                <div className={styles.emptyIcon}>§</div>
                <div className={`display ${styles.emptyTitle}`}>
                  У цьому законі поки немає статей для відображення
                </div>
                <div className={`mono ${styles.emptyNote}`}>
                  Коли дерево закону буде наповнене, тут з&apos;явиться повна
                  структура розділів і статей.
                </div>
              </motion.div>
            ) : null}

            {!loading && !error && articleCount > 0 && lawId ? (
              <LawStructureList
                sections={visibleSections}
                lawId={lawId}
                lawTitle={law?.title}
                highlightSubjectId={selectedSubjectId}
                subjectsMap={subjectsMap}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
