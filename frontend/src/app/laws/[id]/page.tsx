"use client";

import { useMemo, useState } from "react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { motion } from "framer-motion";
import { Breadcrumb } from "@/components/Breadcrumb";
import { LawStructureList } from "@/components/LawStructureList";
import { Layout } from "@/components/Layout";
import { ROUTES } from "@/constants/routes";
import { useLawTree } from "@/hooks/useLawTree";
import {
  buildLawSections,
  countArticlesInSections,
  limitLawSections,
} from "@/lib/lawTree";
import styles from "./page.module.scss";

const DEFAULT_ARTICLE_LIMIT = 20;
const ARTICLE_LIMIT_OPTIONS = [10, 20, 50, 100] as const;

function parseLimitValue(rawValue: string | null) {
  if (rawValue === "all") {
    return "all" as const;
  }

  const parsed = Number(rawValue);
  return ARTICLE_LIMIT_OPTIONS.includes(
    parsed as (typeof ARTICLE_LIMIT_OPTIONS)[number],
  )
    ? parsed
    : DEFAULT_ARTICLE_LIMIT;
}

function toLimitParam(value: number | "all") {
  return value === "all" ? "all" : String(value);
}

function getNextLimitValue(current: number | "all") {
  if (current === "all") {
    return "all" as const;
  }

  return ARTICLE_LIMIT_OPTIONS.find((option) => option > current) ?? "all";
}

export default function LawTreePage() {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lawId = params?.id;
  const { law, tree, loading, error } = useLawTree(lawId);
  const [selectedLimit, setSelectedLimit] = useState<number | "all">(() =>
    parseLimitValue(searchParams.get("limit")),
  );

  const sections = useMemo(() => buildLawSections(tree), [tree]);
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

  return (
    <Layout fullHeight>
      <div className={`section-pad ${styles.contentFlex}`}>
        <div className={`page-frame ${styles.pageInner}`}>
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

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.05 }}
            className={`panel ${styles.lawMeta}`}
          >
            <span className="eyebrow">Структура закону</span>
            <h1 className={`display ${styles.lawTitle}`}>
              {law?.title ?? "Завантажуємо структуру закону"}
            </h1>
            {law?.signatory && (
              <div className={styles.lawSignatory}>{law.signatory}</div>
            )}
            <div className="law-structure-summary">
              {law ? (
                <span className="directory-chip mono">{law.code}</span>
              ) : null}
              <span className="mono law-structure-inline-note">
                {sections.length} розділів · {articleCount} статей
              </span>
            </div>
            {law?.status && (
              <div className={styles.lawStatus}>
                {law.status.charAt(0).toUpperCase() +
                  law.status.slice(1).toLowerCase()}
              </div>
            )}
            <p className={styles.lawDesc}>
              Список статей формується напряму з дерева закону. Клік по назві
              статті відкриває повну сторінку, а кнопка праворуч показує
              вкладену структуру частин, пунктів і абзаців.
            </p>

            {showLimitControls ? (
              <div className={styles.controls}>
                <div className={styles.controlsCopy}>
                  <div className={`mono ${styles.controlsLabel}`}>
                    Показано {visibleArticleCount} із {articleCount} статей
                  </div>
                  <p className={styles.controlsHint}>
                    Довгі закони можна переглядати частинами, щоб сторінка не
                    перетворювалася на довгий суцільний список.
                  </p>
                </div>

                <div className={styles.controlsActions}>
                  <label className={styles.limitField}>
                    <span className={`mono ${styles.limitLabel}`}>
                      Показувати
                    </span>
                    <select
                      aria-label="Показувати статей"
                      className={`form-control form-select ${styles.limitSelect}`}
                      value={toLimitParam(selectedLimit)}
                      onChange={(event) =>
                        updateLimit(parseLimitValue(event.target.value))
                      }
                    >
                      {ARTICLE_LIMIT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                      <option value="all">Всі</option>
                    </select>
                  </label>

                  {canLoadMore ? (
                    <button
                      type="button"
                      className={`btn btn-ghost ${styles.loadMoreButton}`}
                      onClick={() =>
                        updateLimit(getNextLimitValue(selectedLimit))
                      }
                    >
                      {getNextLimitValue(selectedLimit) === "all"
                        ? "Показати всі"
                        : "Показати ще"}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </motion.section>

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
            <LawStructureList sections={visibleSections} lawId={lawId} />
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
