"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Layout } from "@/components/Layout";
import { ROUTES } from "@/constants/routes";
import { useSubjectDetail } from "@/hooks/useSubjectDetail";
import styles from "./page.module.scss";

export default function SubjectDetailPage() {
  const params = useParams<{ id: string }>();
  const subjectId = params?.id;
  const { subject, elements, loading, error } = useSubjectDetail(subjectId);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={styles.breadcrumbBar}
      >
        <Breadcrumb
          items={[
            { label: "Суб'єкти", href: ROUTES.subjects },
            { label: subject?.name ?? subjectId ?? "…" },
          ]}
        />
      </motion.div>

      <div className={styles.scrollArea}>
        <div className={styles.inner}>
          {loading ? (
            <div className={styles.skeletonList}>
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.15,
                  }}
                  className={styles.skeletonItem}
                  style={{
                    height: index === 0 ? 48 : 22,
                    width: index === 0 ? "60%" : `${45 + index * 15}%`,
                  }}
                />
              ))}
            </div>
          ) : null}

          {!loading && error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.errorBox}
            >
              {error}
            </motion.div>
          ) : null}

          {!loading && !error && subject ? (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <h1 className={`display ${styles.heading}`}>{subject.name}</h1>

              {subject.aliases.length > 0 ? (
                <div className={styles.aliasesSection}>
                  <div className={`mono ${styles.aliasesLabel}`}>
                    Псевдоніми / синоніми
                  </div>
                  <div className={styles.aliasesFlex}>
                    {subject.aliases.map((alias) => (
                      <span
                        key={alias}
                        className={`mono ${styles.aliasBadge}`}
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <h2 className={`display ${styles.elementsHeading}`}>
                  Пов&apos;язані елементи законів
                </h2>

                {elements.length === 0 ? (
                  <div className={styles.emptyInfo}>
                    <span className={styles.emptyInfoIcon}>ℹ</span>
                    <p className={styles.emptyInfoText}>
                      Елементи ще не прив&apos;язані. Pipeline AI-аналізу в
                      розробці.
                    </p>
                  </div>
                ) : (
                  <div className={styles.elementsList}>
                    {elements.map((element, index) => (
                      <motion.div
                        key={element._id ?? element.code}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        className={styles.elementCard}
                      >
                        <div
                          className={styles.elementCodeRow}
                          style={{
                            marginBottom: element.title || element.text ? 8 : 0,
                          }}
                        >
                          <span className={`mono ${styles.elementCode}`}>
                            {element.code}
                          </span>
                        </div>
                        {element.title ? (
                          <p className={styles.elementTitle}>{element.title}</p>
                        ) : null}
                        {element.text ? (
                          <p className={styles.elementText}>{element.text}</p>
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
