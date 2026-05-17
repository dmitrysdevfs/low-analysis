"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ROUTES } from "@/constants/routes";
import { useSubjects } from "@/hooks/useSubjects";
import { getLegalStatusLabel, getLegalStatusColor } from "@/lib/lawTree";
import styles from "./page.module.scss";

export default function SubjectsPage() {
  const { subjects, loading, error } = useSubjects();

  return (
    <Layout>
      <div className={styles.wrapper}>
        <div className={styles.blobGold} />
        <div className={styles.blobBlue} />

        <div className={styles.inner}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className={styles.heroMotion}
          >
            <h1 className={`display ${styles.heading}`}>
              Суб&apos;єкти
              <br />
              <span className={styles.headingAccent}>регулювання</span>
            </h1>

            <p className={styles.subtitle}>
              Фізичні та юридичні особи, права та обов&apos;язки яких
              регулюються законодавством України.
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!loading && !error ? (
              <motion.div
                key={`count-${subjects.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className={`mono ${styles.countLine}`}
              >
                {subjects.length} суб&apos;єктів у базі
              </motion.div>
            ) : null}
          </AnimatePresence>

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
                />
              ))}
            </div>
          ) : null}

          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.errorBox}
            >
              {error}
            </motion.div>
          ) : null}

          {!loading && !error && subjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={styles.emptyState}
            >
              <div className={styles.emptyIcon}>§</div>
              Суб&apos;єктів ще немає в базі
            </motion.div>
          ) : null}

          {!loading && !error && subjects.length > 0 ? (
            <AnimatePresence>
              <div className={styles.cardList}>
                {subjects.map((subject, index) => {
                  const statusColor = getLegalStatusColor(subject.legal_status);
                  const statusLabel = getLegalStatusLabel(subject.legal_status);
                  return (
                    <motion.div
                      key={subject._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.07, duration: 0.4 }}
                      whileHover={{ y: -2 }}
                    >
                      <Link
                        href={ROUTES.subject(subject._id)}
                        className={styles.cardLink}
                        style={
                          { "--status-color": statusColor } as Record<string, string>
                        }
                      >
                        <div className={styles.cardTop}>
                          <span
                            className={`mono ${styles.statusBadge}`}
                            style={{
                              color: statusColor,
                              background: `${statusColor}18`,
                              borderColor: `${statusColor}40`,
                            }}
                          >
                            {statusLabel}
                          </span>
                          <span className={styles.cardArrow}>→</span>
                        </div>

                        <h2 className={`display ${styles.cardTitle}`}>
                          {subject.canonical_name}
                        </h2>

                        {subject.description ? (
                          <p className={styles.cardDescription}>
                            {subject.description}
                          </p>
                        ) : null}

                        {subject.aliases.length > 0 ? (
                          <div className={styles.aliasList}>
                            {subject.aliases.map((alias) => (
                              <span
                                key={alias}
                                className={`mono ${styles.aliasBadge}`}
                              >
                                {alias}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {(subject.laws_count != null ||
                          subject.elements_count != null) ? (
                          <div className={`mono ${styles.cardFooter}`}>
                            {subject.laws_count != null ? (
                              <span>{subject.laws_count} законів</span>
                            ) : null}
                            {subject.elements_count != null ? (
                              <span>{subject.elements_count} норм</span>
                            ) : null}
                          </div>
                        ) : null}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
