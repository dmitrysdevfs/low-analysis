"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { LawCardSkeletonLine } from "./LawCardSkeletonLine";
import { ROUTES } from "@/constants/routes";
import { getNodeLabel, getArticleTitle } from "@/lib/lawTree";
import type { TreeNode } from "@/types";
import styles from "./LawCard.module.scss";

type ArticleItem = TreeNode;

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

export function LawCardArticlesList({
  loading,
  visible,
  isEmpty,
  lawId,
  query,
}: {
  loading: boolean;
  visible: ArticleItem[];
  isEmpty: boolean;
  lawId: string;
  query: string;
}) {
  return (
    <div className={styles.articlesList}>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={styles.skeletonContainer}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={styles.skeletonItem}>
                <LawCardSkeletonLine width={`${50 + (i % 3) * 15}%`} />
                <LawCardSkeletonLine width={`${30 + (i % 4) * 10}%`} />
              </div>
            ))}
          </motion.div>
        ) : isEmpty ? (
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
                      ? ROUTES.article(lawId, article.number)
                      : ROUTES.law(lawId)
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
  );
}
