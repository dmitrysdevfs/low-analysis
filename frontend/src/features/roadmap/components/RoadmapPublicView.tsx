"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoadmapContent } from "../hooks/useRoadmapContent";
import styles from "./RoadmapPublicView.module.scss";

const STATUS_LABEL: Record<string, string> = {
  done: "Завершено",
  in_progress: "В роботі",
  pending: "Заплановано",
};

const STATUS_CLASS: Record<string, string> = {
  done: styles.phaseDone,
  in_progress: styles.phaseInProgress,
  pending: styles.phasePending,
};

export function RoadmapPublicView() {
  const { content, updatedAt, loading } = useRoadmapContent();
  const [openDecision, setOpenDecision] = useState<string | null>(null);
  const [openDeferred, setOpenDeferred] = useState<string | null>(null);

  const doneCount = content.roadmapItems.filter((i) => i.done).length;
  const totalCount = content.roadmapItems.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const doneItems = content.roadmapItems.filter((i) => i.done);
  const pendingItems = content.roadmapItems.filter((i) => !i.done);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} style={{ height: 200 }} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Відкритий Roadmap</p>
          <h1 className={styles.heroTitle}>Як будується платформа</h1>
          <p className={styles.heroSub}>
            Що вже є, що зараз будується і куди рухається Low Analysis. Без
            маркетингу — тільки факти.
          </p>
          {updatedAt && (
            <p className={styles.updatedAt}>
              Оновлено:{" "}
              {new Date(updatedAt).toLocaleDateString("uk-UA", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </section>

      {/* Progress */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.progressBlock}>
            <div className={styles.progressMeta}>
              <span className={styles.progressLabel}>
                Загальна готовність MVP
              </span>
              <span className={styles.progressPct}>{pct}%</span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Загальний прогрес"
            >
              <motion.div
                className={styles.progressFill}
                initial={{ width: "0%" }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <p className={styles.progressNote}>
              {doneCount} з {totalCount} пунктів виконано
            </p>
          </div>
        </div>
      </section>

      {/* Done / Pending two-column */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>Що є зараз і що попереду</h2>
          <div className={styles.columns}>
            <div className={styles.column}>
              <div className={styles.colHeader}>
                <span className={styles.colDot} />
                <span className={styles.colLabel}>Вже доступно</span>
              </div>
              <ul className={styles.itemList}>
                {doneItems.map((item, i) => (
                  <motion.li
                    key={item.text}
                    className={styles.itemDone}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <span className={styles.checkDone} aria-hidden="true">✓</span>
                    <span>{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className={styles.column}>
              <div className={styles.colHeader}>
                <span className={styles.colDotPending} />
                <span className={styles.colLabel} style={{ opacity: 0.5 }}>
                  Незабаром
                </span>
              </div>
              <ul className={styles.itemList}>
                {pendingItems.map((item, i) => (
                  <motion.li
                    key={item.text}
                    className={styles.itemPending}
                    initial={{ opacity: 0, x: 16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <span className={styles.checkPending} aria-hidden="true">○</span>
                    <span>{item.text}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Phases */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>Фази розробки</h2>
          <div className={styles.phases}>
            {content.phases.map((phase, i) => (
              <motion.div
                key={phase.id}
                className={`${styles.phase} ${STATUS_CLASS[phase.status] ?? ""}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={styles.phaseHeader}>
                  <span className={styles.phaseLabel}>{phase.label}</span>
                  <span className={styles.phaseBadge}>
                    {STATUS_LABEL[phase.status]}
                  </span>
                </div>
                <ul className={styles.taskList}>
                  {phase.tasks.map((task) => (
                    <li
                      key={task.text}
                      className={
                        task.done ? styles.taskDone : styles.taskPending
                      }
                    >
                      <span aria-hidden="true">{task.done ? "✓" : "○"}</span>
                      <span>{task.text}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deferred */}
      {content.deferredItems.length > 0 && (
        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Свідомо відкладено</h2>
            <p className={styles.sectionSub}>
              Ці функції не входять у поточний scope — не тому що неможливо, а
              тому що пріоритет нижчий.
            </p>
            <div className={styles.accordion}>
              {content.deferredItems.map((item, i) => (
                <div key={item.title} className={styles.accordionItem}>
                  <button
                    type="button"
                    className={styles.accordionTrigger}
                    aria-expanded={openDeferred === String(i)}
                    onClick={() =>
                      setOpenDeferred(
                        openDeferred === String(i) ? null : String(i),
                      )
                    }
                  >
                    <span>{item.title}</span>
                    <span className={styles.accordionIcon} aria-hidden="true">
                      {openDeferred === String(i) ? "−" : "+"}
                    </span>
                  </button>
                  <AnimatePresence>
                    {openDeferred === String(i) && (
                      <motion.div
                        className={styles.accordionBody}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p>{item.reason}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Decisions */}
      {content.decisions.length > 0 && (
        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Архітектурні рішення</h2>
            <p className={styles.sectionSub}>
              Технологічні вибори, зроблені свідомо, з поясненням чому саме так.
            </p>
            <div className={styles.accordion}>
              {content.decisions.map((d) => (
                <div key={d.id} className={styles.accordionItem}>
                  <button
                    type="button"
                    className={styles.accordionTrigger}
                    aria-expanded={openDecision === d.id}
                    onClick={() =>
                      setOpenDecision(openDecision === d.id ? null : d.id)
                    }
                  >
                    <div className={styles.decisionMeta}>
                      <span className={styles.decisionTitle}>{d.title}</span>
                      <span className={styles.decisionSummary}>
                        {d.decision}
                      </span>
                    </div>
                    <span className={styles.accordionIcon} aria-hidden="true">
                      {openDecision === d.id ? "−" : "+"}
                    </span>
                  </button>
                  <AnimatePresence>
                    {openDecision === d.id && (
                      <motion.div
                        className={styles.accordionBody}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <p>{d.rationale}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
