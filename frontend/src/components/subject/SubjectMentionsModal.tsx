"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useSubjectDetail } from "@/hooks/useSubjectDetail";
import { useLawsMap } from "@/hooks/useLawsMap";
import { getNodeBadge, sanitizeAnchor } from "@/lib/tree";
import {
  buildMentions,
  buildArticlePartsMap,
  type ArticleMention,
} from "@/lib/subject/mentionHelpers";
import { ROUTES } from "@/constants/routes";
import styles from "./SubjectMentionsModal.module.scss";

interface PartMention {
  code: string;
  badge: string;
  snippet: string;
  globalIdx: number;
}

export function SubjectMentionsModal() {
  const searchParams = useSearchParams();
  const subjectId = searchParams.get("subjectModal");
  const mentionIdx = parseInt(searchParams.get("mentionIdx") ?? "0", 10);
  const partIdxParam = searchParams.get("partIdx");
  const partIdx = partIdxParam !== null ? parseInt(partIdxParam, 10) : null;
  const isPartsMode = partIdx !== null;

  const router = useRouter();
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);

  const articleMatch = pathname.match(/\/laws\/([^/]+)\/articles\/([^/]+)/);
  const currentLawId = articleMatch?.[1] ?? null;
  const currentArticleNum = articleMatch?.[2] ?? null;

  const { subject, elements, loading } = useSubjectDetail(
    subjectId ?? undefined,
  );
  const { lawsMap } = useLawsMap();

  const articleMentions = useMemo(
    () => buildMentions(elements, lawsMap),
    [elements, lawsMap],
  );
  const articlePartsMap = useMemo(
    () => buildArticlePartsMap(elements),
    [elements],
  );

  const partMentions = useMemo((): PartMention[] => {
    if (!currentLawId || !currentArticleNum) return [];
    const parts =
      articlePartsMap.get(`${currentLawId}/${currentArticleNum}`) ?? [];
    return parts.map((el, i) => ({
      code: el.code,
      badge: getNodeBadge(el),
      snippet: el.text?.slice(0, 80) ?? el.title ?? "",
      globalIdx: i,
    }));
  }, [articlePartsMap, currentLawId, currentArticleNum]);

  const safeIdx =
    articleMentions.length > 0
      ? Math.min(Math.max(mentionIdx, 0), articleMentions.length - 1)
      : 0;

  const safePartIdx =
    isPartsMode && partMentions.length > 0
      ? Math.min(Math.max(partIdx!, 0), partMentions.length - 1)
      : 0;

  // Auto-navigate to article at safeIdx (articles mode only)
  useEffect(() => {
    if (!subjectId || !articleMentions.length || isPartsMode) return;
    const mention = articleMentions[safeIdx];
    if (!mention) return;
    const targetPath = ROUTES.article(mention.lawId, mention.articleNum);
    if (pathname !== targetPath) {
      router.push(
        `${targetPath}?subjectModal=${subjectId}&mentionIdx=${safeIdx}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleMentions.length, safeIdx, subjectId, isPartsMode]);

  // Scroll list active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector(
      `[data-active="true"]`,
    ) as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [safeIdx, safePartIdx, isPartsMode]);

  // Scroll page to active part element in parts mode
  useEffect(() => {
    if (!isPartsMode || !partMentions.length) return;
    const mention = partMentions[safePartIdx];
    if (!mention) return;
    const timer = setTimeout(() => {
      document.getElementById(sanitizeAnchor(mention.code))?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
    return () => clearTimeout(timer);
  }, [isPartsMode, safePartIdx, partMentions]);

  const handleClose = () => router.replace(pathname);

  const handleReset = () => {
    router.replace(pathname);
    // Wait for router.replace to settle before scrolling — the target element
    // is conditionally rendered and may not exist until navigation completes.
    setTimeout(() => {
      document.getElementById("articleSubjectsBlock")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 200);
  };

  const handleNav = (idx: number) => {
    const mention = articleMentions[idx];
    if (!mention) return;
    router.push(
      `${ROUTES.article(mention.lawId, mention.articleNum)}?subjectModal=${subjectId}&mentionIdx=${idx}`,
    );
  };

  const handleNavPart = (idx: number) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("partIdx", String(idx));
    router.push(`${pathname}?${nextParams.toString()}`);
  };

  const handleBackToArticles = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("partIdx");
    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const handleEnterPartsMode = (mention: ArticleMention, idx: number) => {
    router.push(
      `${ROUTES.article(mention.lawId, mention.articleNum)}?subjectModal=${subjectId}&mentionIdx=${mention.globalIdx}&partIdx=${idx}`,
    );
  };

  // collapsed = explicitly closed; default = all expanded
  const [collapsedArticles, setCollapsedArticles] = useState<Set<string>>(
    new Set(),
  );
  const toggleArticle = useCallback((key: string) => {
    setCollapsedArticles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const groupedByLaw = useMemo(() => {
    const map = new Map<
      string,
      { lawTitle: string; mentions: ArticleMention[] }
    >();
    articleMentions.forEach((m) => {
      if (!map.has(m.lawId))
        map.set(m.lawId, { lawTitle: m.lawTitle, mentions: [] });
      map.get(m.lawId)!.mentions.push(m);
    });
    return Array.from(map.values());
  }, [articleMentions]);

  if (!subjectId) return null;

  const counterText = isPartsMode
    ? partMentions.length > 0
      ? `Стаття ${currentArticleNum} · ${partMentions.length} частин`
      : `Стаття ${currentArticleNum}`
    : articleMentions.length > 0
      ? `${articleMentions.length} ${articleMentions.length === 1 ? "стаття" : "статей"} · ${elements.length} згадок`
      : null;

  return (
    <AnimatePresence>
      <div className={styles.backdrop} />

      <motion.aside
        key="subject-modal"
        className={styles.modal}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        aria-label="Згадки суб'єкта"
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            {isPartsMode && (
              <button
                type="button"
                className={styles.backBtn}
                onClick={handleBackToArticles}
              >
                ← до статей
              </button>
            )}
            <div className={`display ${styles.subjectName}`}>
              {loading ? "…" : (subject?.canonical_name ?? "Суб'єкт")}
            </div>
            {!loading && counterText && (
              <div className={`mono ${styles.subjectMeta}`}>{counterText}</div>
            )}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={handleClose}
            aria-label="Закрити"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div ref={listRef} className={styles.list}>
          {loading ? (
            <div className={`mono ${styles.statusText}`}>Завантаження…</div>
          ) : isPartsMode ? (
            partMentions.length === 0 ? (
              <div className={`mono ${styles.statusText}`}>
                Частин не знайдено
              </div>
            ) : (
              partMentions.map((pm) => (
                <button
                  key={pm.code}
                  type="button"
                  data-active={
                    pm.globalIdx === safePartIdx ? "true" : undefined
                  }
                  className={`${styles.mentionItem} ${pm.globalIdx === safePartIdx ? styles.mentionItemActive : ""}`}
                  onClick={() => handleNavPart(pm.globalIdx)}
                >
                  <span className={`mono ${styles.mentionArticle}`}>
                    {pm.badge}
                  </span>
                  {pm.snippet && (
                    <span className={styles.mentionSnippet}>
                      {pm.snippet}
                      {pm.snippet.length >= 80 ? "…" : ""}
                    </span>
                  )}
                </button>
              ))
            )
          ) : groupedByLaw.length === 0 ? (
            <div className={`mono ${styles.statusText}`}>
              Згадок не знайдено
            </div>
          ) : (
            groupedByLaw.map((group) => (
              <div key={group.mentions[0]?.lawId} className={styles.lawGroup}>
                <div className={`mono ${styles.lawGroupTitle}`}>
                  {group.lawTitle}
                </div>
                {group.mentions.map((mention) => {
                  const parts =
                    articlePartsMap.get(
                      `${mention.lawId}/${mention.articleNum}`,
                    ) ?? [];
                  const articleKey = `${mention.lawId}/${mention.articleNum}`;
                  const isExpanded = !collapsedArticles.has(articleKey);
                  return (
                    <div key={articleKey}>
                      <div className={styles.articleRow}>
                        <button
                          type="button"
                          data-active={
                            mention.globalIdx === safeIdx ? "true" : undefined
                          }
                          className={`${styles.mentionItem} ${styles.mentionItemRow} ${mention.globalIdx === safeIdx ? styles.mentionItemActive : ""}`}
                          onClick={() => handleNav(mention.globalIdx)}
                        >
                          <span className={`mono ${styles.mentionArticle}`}>
                            Стаття {mention.articleNum}
                          </span>
                          {mention.snippet && (
                            <span className={styles.mentionSnippet}>
                              {mention.snippet}
                              {mention.snippet.length >= 90 ? "…" : ""}
                            </span>
                          )}
                        </button>
                        {parts.length > 0 && (
                          <button
                            type="button"
                            className={styles.chevronBtn}
                            onClick={() => toggleArticle(articleKey)}
                            aria-label={isExpanded ? "Згорнути" : "Розгорнути"}
                          >
                            <span
                              className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
                            />
                          </button>
                        )}
                      </div>
                      {isExpanded &&
                        parts.map((part, i) => (
                          <button
                            key={part.code}
                            type="button"
                            className={styles.partItem}
                            onClick={() => handleEnterPartsMode(mention, i)}
                          >
                            <span className={`mono ${styles.partBadge}`}>
                              {getNodeBadge(part)}
                            </span>
                            {(part.text || part.title) && (
                              <span className={styles.partSnippet}>
                                {(part.text ?? part.title ?? "").slice(0, 60)}
                                {(part.text ?? "").length > 60 ? "…" : ""}
                              </span>
                            )}
                          </button>
                        ))}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.navRow}>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() =>
                isPartsMode
                  ? handleNavPart(safePartIdx - 1)
                  : handleNav(safeIdx - 1)
              }
              disabled={isPartsMode ? safePartIdx <= 0 : safeIdx <= 0}
            >
              ← Попередня
            </button>
            <span className={`mono ${styles.navCounter}`}>
              {isPartsMode
                ? partMentions.length > 0
                  ? `${safePartIdx + 1} / ${partMentions.length}`
                  : "—"
                : articleMentions.length > 0
                  ? `${safeIdx + 1} / ${articleMentions.length}`
                  : "—"}
            </span>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() =>
                isPartsMode
                  ? handleNavPart(safePartIdx + 1)
                  : handleNav(safeIdx + 1)
              }
              disabled={
                isPartsMode
                  ? safePartIdx >= partMentions.length - 1
                  : safeIdx >= articleMentions.length - 1
              }
            >
              Наступна →
            </button>
          </div>
          <button
            type="button"
            className={styles.resetBtn}
            onClick={handleReset}
          >
            Скинути фільтр
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
