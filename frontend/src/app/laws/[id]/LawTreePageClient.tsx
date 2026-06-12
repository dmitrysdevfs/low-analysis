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
import { Layout } from "@/components/layout/Layout";
import { ROUTES } from "@/constants/routes";
import { useLawTree } from "@/hooks/useLawTree";
import { useSubjectsMap } from "@/hooks/useSubjectsMap";
import {
  buildLawSections,
  countArticlesInSections,
  limitLawSections,
  computeArticleRiskMap,
  computeStatsFromTree,
  filterTreeBySubject,
  type RiskLevel,
  type TreeBranch,
} from "@/lib/tree";
import styles from "./page.module.scss";
import {
  DEFAULT_ARTICLE_LIMIT,
  ARTICLE_LIMIT_OPTIONS,
  parseLimitValue,
  toLimitParam,
} from "@/lib/utils/pageLimits";
import { useSidebarData } from "@/components/layout/SidebarDataContext";
import { useLawStats } from "@/hooks/useLawStats";
import { saveRecentlyViewed } from "@/lib/storage/recentlyViewed";
import { VolumeChipBar } from "@/components/law/VolumeChipBar";

export function LawTreePageClient() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lawId = params?.id;
  const { law, tree, loading, error } = useLawTree(lawId);
  const { stats } = useLawStats(lawId);
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
  const riskFilter = searchParams.get("risk") as RiskLevel | null;

  // Save to recently viewed in localStorage
  useEffect(() => {
    if (!law) return;
    saveRecentlyViewed({ _id: law._id, title: law.title, code: law.code });
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
  const computedStats = useMemo(
    () => (stats ? null : computeStatsFromTree(tree)),
    [stats, tree],
  );

  const articleRiskMap = useMemo(
    () => computeArticleRiskMap(sections),
    [sections],
  );

  const riskFilteredArticles = useMemo(() => {
    if (!riskFilter) return null;
    const articles: TreeBranch[] = [];
    for (const section of sections) {
      for (const child of section.children) {
        if (child.type === "article" && child._id) {
          const computedRisk = articleRiskMap.get(child._id);
          if (computedRisk === riskFilter) {
            // Override risk_level so ArticleEntry dot shows the computed level
            articles.push({
              ...child,
              risk_level: computedRisk as RiskLevel,
            });
          }
        }
      }
    }
    return articles;
  }, [sections, riskFilter, articleRiskMap]);

  const showLimitControls =
    !loading &&
    !error &&
    !riskFilter &&
    articleCount > ARTICLE_LIMIT_OPTIONS[0];
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

  const updateRisk = useCallback(
    (level: RiskLevel | "orange") => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      if (searchParams.get("risk") === level) {
        nextSearchParams.delete("risk");
      } else {
        nextSearchParams.set("risk", level);
      }
      const nextQuery = nextSearchParams.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    },
    [searchParams, pathname, router],
  );

  const updateSubject = useCallback(
    (nextValue: string | null) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());
      if (nextValue) {
        nextSearchParams.set("subject", nextValue);
        nextSearchParams.set("subjectModal", nextValue);
        nextSearchParams.set("mentionIdx", "0");
      } else {
        nextSearchParams.delete("subject");
        nextSearchParams.delete("subjectModal");
        nextSearchParams.delete("mentionIdx");
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
              stats={stats ?? computedStats}
              activeRiskLevel={riskFilter}
              onRiskLevelClick={updateRisk}
              riskFilterCount={riskFilteredArticles?.length}
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

            {!loading && !error && (stats ?? computedStats) ? (
              <VolumeChipBar
                stats={(stats ?? computedStats)!}
                activeLevel={riskFilter as RiskLevel}
                onLevelClick={updateRisk}
              />
            ) : null}

            {!loading && !error && articleCount > 0 && lawId ? (
              <LawStructureList
                sections={visibleSections}
                lawId={lawId}
                lawTitle={law?.title}
                highlightSubjectId={selectedSubjectId}
                subjectsMap={subjectsMap}
                flatArticles={riskFilteredArticles}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Layout>
  );
}
