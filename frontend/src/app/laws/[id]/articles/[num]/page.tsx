"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Layout } from "@/components/Layout";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import { useArticle } from "@/hooks/useArticle";
import styles from "./page.module.scss";

function getNodeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    article: "Стаття",
    part: "Частина",
    point: "Пункт",
    sub_point: "Підпункт",
    paragraph: "Абзац",
  };
  return map[type] ?? type;
}

export default function ArticlePage() {
  const params = useParams<{ id: string; num: string }>();
  const lawId = params?.id;
  const articleNumber = params?.num;
  const { laws } = useLaws();
  const { article, children, loading, error } = useArticle(lawId, articleNumber);
  const law = laws.find((item) => item._id === lawId);

  const lawTitle = law?.title ?? "Закон";
  const lawCode = law?.code ?? "";

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
                    style={{ height: index === 0 ? 32 : index === 1 ? 20 : 14, width: `${width}%` }}
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
                <span className={`mono ${styles.emptyText}`}>Статтю не знайдено</span>
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
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={styles.lawCard}
                >
                  <span className={`mono ${styles.lawCardLabel}`}>Закон</span>
                  <span className={styles.lawCardTitle}>{lawTitle}</span>
                  {lawCode && (
                    <span className={`mono ${styles.lawCardCode}`}>{lawCode}</span>
                  )}
                </motion.div>

                {/* Article block */}
                <div className={styles.articleBlock}>
                  <div className={styles.articleMeta}>
                    <span className={`mono ${styles.articleCode}`}>{article.code}</span>
                    <span className={`mono ${styles.articleType}`}>
                      {getNodeTypeLabel(article.type)}
                    </span>
                  </div>

                  {article.number && (
                    <p className={`display ${styles.articleNumber}`}>
                      Стаття {article.number}
                    </p>
                  )}

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
                      className={styles.childrenSection}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.3 }}
                    >
                      <div className={`mono ${styles.childrenHeading}`}>
                        Вміст статті · {children.length}{" "}
                        {children.length === 1 ? "елемент" : children.length < 5 ? "елементи" : "елементів"}
                      </div>
                      <div className={styles.childrenList}>
                        {children.map((child, index) => (
                          <motion.div
                            key={child.code}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.05, duration: 0.28 }}
                            className={styles.childItem}
                          >
                            <span className={`mono ${styles.childBadge}`}>
                              {child.number ?? (index + 1)}
                            </span>
                            <div className={styles.childContent}>
                              {child.title && child.text ? (
                                <>
                                  <div className={styles.childTitle}>{child.title}</div>
                                  <div className={styles.childText}>{child.text}</div>
                                </>
                              ) : child.title ? (
                                <div className={styles.childTitle}>{child.title}</div>
                              ) : (
                                <div className={styles.childTextOnly}>{child.text}</div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </div>

                {/* Open full law link */}
                {lawId && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                  >
                    <Link
                      href={ROUTES.law(lawId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.lawLink}
                    >
                      <div className={styles.lawLinkLeft}>
                        <span className={`mono ${styles.lawLinkLabel}`}>Повний закон</span>
                        <span className={styles.lawLinkTitle}>{lawTitle}</span>
                      </div>
                      <span className={styles.lawLinkArrow}>↗</span>
                    </Link>
                  </motion.div>
                )}
              </motion.div>
            ) : null}

          </AnimatePresence>
        </div>
      </main>
    </Layout>
  );
}
