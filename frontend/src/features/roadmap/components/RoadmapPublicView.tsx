"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoadmapContent } from "../hooks/useRoadmapContent";
import styles from "./RoadmapPublicView.module.scss";

const STATUS_LABEL: Record<string, string> = {
  done: "Завершено",
  in_progress: "В роботі",
  pending: "Заплановано",
  current_focus: "Поточний фокус",
  planned: "Заплановано",
  research: "Дослідження",
  vision: "Візія",
};

const STATUS_CLASS: Record<string, string> = {
  done: styles.phaseDone,
  in_progress: styles.phaseInProgress,
  current_focus: styles.phaseInProgress,
  pending: styles.phasePending,
  planned: styles.phasePending,
  research: styles.phaseResearch,
  vision: styles.phasePending,
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

  const donePhases = content.phases.filter((p) => p.status === "done").length;
  const totalPhases = content.phases.length;
  const currentPhase = content.phases.find((p) => p.status === "current_focus");

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
      <section className={`section ${styles.hero}`}>
        <div className={`container ${styles.heroInner}`}>
          <p className={styles.eyebrow}>Відкритий Roadmap</p>
          <h1 className={`title ${styles.heroTitle}`}>
            Як будується платформа
          </h1>
          <p className={styles.heroSub}>
            Реальний стан розробки: що вже працює, що в процесі і що заплановано
            далі. Без маркетингових обіцянок — тільки факти.
          </p>
          <p className={styles.heroDisclaimer}>
            Roadmap є орієнтовним і може змінюватись залежно від пріоритетів та
            зворотного зв&apos;язку.
          </p>
          {updatedAt && (
            <p className={styles.updatedAt}>
              Оновлено:{" "}
              {new Date(updatedAt)
                .toLocaleDateString("uk-UA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
                .replace(" р.", "")}
            </p>
          )}
        </div>
      </section>

      {/* Progress */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <div className={styles.progressBlock}>
            <div className={styles.progressMeta}>
              <span className={styles.progressLabel}>Загальний прогрес</span>
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
          <div className={styles.phaseMeta}>
            <span className={styles.phaseMetaItem}>
              <span className={styles.phaseMetaValue}>{donePhases}</span>
              <span className={styles.phaseMetaLabel}>
                з {totalPhases} фаз завершено
              </span>
            </span>
            {currentPhase && (
              <span className={styles.phaseMetaItem}>
                <span className={styles.phaseMetaLabel}>Поточний етап:</span>
                <span className={styles.phaseMetaCurrent}>
                  {currentPhase.label}
                </span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* What we build */}
      {content.whatWeBuilding && content.whatWeBuilding.length > 0 && (
        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Що ми будуємо</h2>
            <p className={styles.sectionSub}>
              Law Analysis — це не просто система аналізу законів. Ми створюємо
              платформу для:
            </p>
            <ul className={styles.itemList}>
              {content.whatWeBuilding.map((item) => (
                <motion.li
                  key={item}
                  className={styles.itemDone}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <span className={styles.checkDone} aria-hidden="true">
                    •
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </section>
      )}

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
                    <span className={styles.checkDone} aria-hidden="true">
                      ✓
                    </span>
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
                    <span className={styles.checkPending} aria-hidden="true">
                      ○
                    </span>
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
                    {STATUS_LABEL[phase.status] ?? phase.status}
                  </span>
                </div>
                {phase.description && (
                  <p className={styles.phaseDescription}>{phase.description}</p>
                )}
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
                {phase.businessValue && (
                  <p className={styles.phaseBusinessValue}>
                    <strong>Цінність:</strong> {phase.businessValue}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Vision 2030 */}
      {content.visionStatement && (
        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Product Vision 2030</h2>
            <motion.p
              className={styles.visionStatement}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {content.visionStatement}
            </motion.p>
          </div>
        </section>
      )}

      {/* Deferred */}
      {content.deferredItems.length > 0 && (
        <section className={styles.section}>
          <div className={styles.inner}>
            <h2 className={styles.sectionTitle}>Відкладено на потім</h2>
            <p className={styles.sectionSub}>
              Ці функції свідомо виключені з поточного scope — не тому що
              неможливо реалізувати, а тому що вони не дають достатньої цінності
              на цьому етапі розробки.
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

      {/* CTA */}
      <section className={styles.section}>
        <div className={styles.inner}>
          <h2 className={styles.sectionTitle}>
            Хочете долучитися до розвитку Law Analysis?
          </h2>
          <p className={styles.sectionSub}>
            Платформа будується відкрито. Якщо вам близька ідея прозорого
            законодавства — ми раді кожному, хто хоче долучитись.
          </p>
          <div className={styles.ctaGrid}>
            <a
              href="https://github.com/dmitrysdevfs/low-analysis/issues"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.ctaBtn}
            >
              Стати контриб'ютором
            </a>
            <a
              href="/contacts"
              className={`${styles.ctaBtn} ${styles.ctaBtnSecondary}`}
            >
              Стати ментором
            </a>
            <a
              href="/contacts"
              className={`${styles.ctaBtn} ${styles.ctaBtnSecondary}`}
            >
              Підтримати проєкт
            </a>
            <a
              href="https://github.com/dmitrysdevfs/low-analysis"
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.ctaBtn} ${styles.ctaBtnGhost}`}
            >
              Переглянути GitHub
            </a>
          </div>
        </div>
      </section>

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
