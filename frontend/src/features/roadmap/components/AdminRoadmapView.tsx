"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pencil,
  X,
  Save,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAdminRoadmap } from "../hooks/useAdminRoadmap";
import type {
  RoadmapContent,
  RoadmapPhase,
  RoadmapItem,
  RoadmapDeferredItem,
  RoadmapDecision,
} from "../types";
import styles from "./AdminRoadmapView.module.scss";

const STATUS_LABEL: Record<string, string> = {
  done: "Завершено",
  in_progress: "В роботі",
  pending: "Заплановано",
};

export function AdminRoadmapView() {
  const { content, updatedAt, loading, saving, saveError, save, refetch } =
    useAdminRoadmap();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<RoadmapContent | null>(null);
  const [openDecision, setOpenDecision] = useState<string | null>(null);
  const [openDeferred, setOpenDeferred] = useState<string | null>(null);

  const active = editing && draft ? draft : content;

  const doneCount = active.roadmapItems.filter((i) => i.done).length;
  const totalCount = active.roadmapItems.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  function startEdit() {
    setDraft(JSON.parse(JSON.stringify(content)));
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(null);
    setEditing(false);
  }

  async function handleSave() {
    if (!draft) return;
    await save(draft);
    setEditing(false);
    setDraft(null);
  }

  function patchDraft(updater: (d: RoadmapContent) => void) {
    if (!draft) return;
    const next = JSON.parse(JSON.stringify(draft)) as RoadmapContent;
    updater(next);
    setDraft(next);
  }

  function setPhaseText(phaseIdx: number, text: string) {
    patchDraft((d) => {
      d.phases[phaseIdx].label = text;
    });
  }

  function setPhaseStatus(phaseIdx: number, status: RoadmapPhase["status"]) {
    patchDraft((d) => {
      d.phases[phaseIdx].status = status;
    });
  }

  function setTaskText(phaseIdx: number, taskIdx: number, text: string) {
    patchDraft((d) => {
      d.phases[phaseIdx].tasks[taskIdx].text = text;
    });
  }

  function toggleTaskDone(phaseIdx: number, taskIdx: number) {
    patchDraft((d) => {
      d.phases[phaseIdx].tasks[taskIdx].done =
        !d.phases[phaseIdx].tasks[taskIdx].done;
    });
  }

  function setRoadmapItemText(idx: number, text: string) {
    patchDraft((d) => {
      d.roadmapItems[idx].text = text;
    });
  }

  function toggleRoadmapItem(idx: number) {
    patchDraft((d) => {
      d.roadmapItems[idx].done = !d.roadmapItems[idx].done;
    });
  }

  function setDeferredTitle(idx: number, title: string) {
    patchDraft((d) => {
      d.deferredItems[idx].title = title;
    });
  }

  function setDeferredReason(idx: number, reason: string) {
    patchDraft((d) => {
      d.deferredItems[idx].reason = reason;
    });
  }

  function setDecisionField(
    idx: number,
    field: keyof RoadmapDecision,
    value: string,
  ) {
    patchDraft((d) => {
      (d.decisions[idx] as Record<string, string>)[field] = value;
    });
  }

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
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarMeta}>
          {updatedAt && (
            <span className={styles.updatedAt}>
              Збережено:{" "}
              {new Date(updatedAt).toLocaleDateString("uk-UA", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {saveError && <span className={styles.saveError}>{saveError}</span>}
        </div>
        <div className={styles.toolbarActions}>
          {!editing ? (
            <>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => refetch()}
              >
                <RefreshCw size={14} />
                Оновити
              </button>
              <button
                type="button"
                className={styles.btnEdit}
                onClick={startEdit}
              >
                <Pencil size={14} />
                Редагувати
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={cancelEdit}
              >
                <X size={14} />
                Скасувати
              </button>
              <button
                type="button"
                className={styles.btnSave}
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={14} />
                {saving ? "Збереження..." : "Зберегти"}
              </button>
            </>
          )}
        </div>
      </div>

      {editing && (
        <div className={styles.editBanner}>
          Режим редагування активний — зміни не збережені до натискання
          «Зберегти»
        </div>
      )}

      {/* Progress */}
      <div className={styles.card}>
        <p className={styles.cardEyebrow}>Загальна готовність</p>
        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <motion.div
              className={styles.progressFill}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <span className={styles.progressPct}>{pct}%</span>
        </div>
        <p className={styles.progressNote}>
          {doneCount} з {totalCount} пунктів виконано
        </p>
      </div>

      {/* Roadmap items */}
      <div className={styles.card}>
        <p className={styles.cardEyebrow}>Публічний Roadmap</p>
        <div className={styles.itemGrid}>
          {active.roadmapItems.map((item, i) => (
            <div
              key={i}
              className={`${styles.roadmapItem} ${item.done ? styles.roadmapItemDone : styles.roadmapItemPending}`}
            >
              {editing ? (
                <>
                  <button
                    type="button"
                    className={
                      item.done ? styles.checkActive : styles.checkInactive
                    }
                    onClick={() => toggleRoadmapItem(i)}
                  >
                    {item.done ? "✓" : "○"}
                  </button>
                  <input
                    className={styles.inlineInput}
                    value={(draft?.roadmapItems[i] ?? item).text}
                    onChange={(e) => setRoadmapItemText(i, e.target.value)}
                  />
                </>
              ) : (
                <>
                  <span
                    className={
                      item.done ? styles.checkActive : styles.checkInactive
                    }
                  >
                    {item.done ? "✓" : "○"}
                  </span>
                  <span>{item.text}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Phases */}
      <div className={styles.card}>
        <p className={styles.cardEyebrow}>Фази розробки</p>
        <div className={styles.phases}>
          {active.phases.map((phase, pi) => (
            <div key={phase.id} className={styles.phase}>
              <div className={styles.phaseHeader}>
                {editing ? (
                  <>
                    <input
                      className={styles.inlineInput}
                      value={(draft?.phases[pi] ?? phase).label}
                      onChange={(e) => setPhaseText(pi, e.target.value)}
                    />
                    <select
                      className={styles.statusSelect}
                      value={(draft?.phases[pi] ?? phase).status}
                      onChange={(e) =>
                        setPhaseStatus(
                          pi,
                          e.target.value as RoadmapPhase["status"],
                        )
                      }
                    >
                      <option value="done">Завершено</option>
                      <option value="in_progress">В роботі</option>
                      <option value="pending">Заплановано</option>
                    </select>
                  </>
                ) : (
                  <>
                    <span className={styles.phaseLabel}>{phase.label}</span>
                    <span
                      className={`${styles.phaseBadge} ${styles[`badge_${phase.status}`]}`}
                    >
                      {STATUS_LABEL[phase.status]}
                    </span>
                  </>
                )}
              </div>
              <div className={styles.taskList}>
                {phase.tasks.map((task, ti) => (
                  <div key={ti} className={styles.taskRow}>
                    {editing ? (
                      <>
                        <button
                          type="button"
                          className={
                            task.done
                              ? styles.checkActive
                              : styles.checkInactive
                          }
                          onClick={() => toggleTaskDone(pi, ti)}
                          style={{ fontSize: "0.75rem" }}
                        >
                          {task.done ? "✓" : "○"}
                        </button>
                        <input
                          className={styles.inlineInput}
                          value={(draft?.phases[pi].tasks[ti] ?? task).text}
                          onChange={(e) => setTaskText(pi, ti, e.target.value)}
                        />
                      </>
                    ) : (
                      <>
                        <span
                          className={
                            task.done
                              ? styles.checkActive
                              : styles.checkInactive
                          }
                          style={{ fontSize: "0.75rem" }}
                        >
                          {task.done ? "✓" : "○"}
                        </span>
                        <span className={styles.taskText}>{task.text}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deferred */}
      <div className={styles.card}>
        <p className={styles.cardEyebrow}>Свідомо відкладено</p>
        <div className={styles.accordion}>
          {active.deferredItems.map((item, i) => (
            <div key={i} className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionTrigger}
                onClick={() =>
                  setOpenDeferred(openDeferred === String(i) ? null : String(i))
                }
              >
                {editing ? (
                  <input
                    className={styles.inlineInput}
                    value={(draft?.deferredItems[i] ?? item).title}
                    onChange={(e) => setDeferredTitle(i, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span>{item.title}</span>
                )}
                {openDeferred === String(i) ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
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
                    {editing ? (
                      <textarea
                        className={styles.inlineTextarea}
                        value={(draft?.deferredItems[i] ?? item).reason}
                        onChange={(e) => setDeferredReason(i, e.target.value)}
                        rows={3}
                      />
                    ) : (
                      <p>{item.reason}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Decisions */}
      <div className={styles.card}>
        <p className={styles.cardEyebrow}>Архітектурні рішення</p>
        <div className={styles.accordion}>
          {active.decisions.map((d, i) => (
            <div key={d.id} className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionTrigger}
                onClick={() =>
                  setOpenDecision(openDecision === d.id ? null : d.id)
                }
              >
                <div className={styles.decisionMeta}>
                  {editing ? (
                    <input
                      className={styles.inlineInput}
                      value={(draft?.decisions[i] ?? d).title}
                      onChange={(e) =>
                        setDecisionField(i, "title", e.target.value)
                      }
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <span className={styles.decisionTitle}>{d.title}</span>
                      <span className={styles.decisionSub}>{d.decision}</span>
                    </>
                  )}
                </div>
                {openDecision === d.id ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
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
                    {editing ? (
                      <div className={styles.decisionEditBlock}>
                        <label className={styles.editLabel}>Рішення</label>
                        <input
                          className={styles.inlineInput}
                          value={(draft?.decisions[i] ?? d).decision}
                          onChange={(e) =>
                            setDecisionField(i, "decision", e.target.value)
                          }
                        />
                        <label className={styles.editLabel}>
                          Обґрунтування
                        </label>
                        <textarea
                          className={styles.inlineTextarea}
                          value={(draft?.decisions[i] ?? d).rationale}
                          onChange={(e) =>
                            setDecisionField(i, "rationale", e.target.value)
                          }
                          rows={3}
                        />
                      </div>
                    ) : (
                      <>
                        <p className={styles.decisionDecision}>{d.decision}</p>
                        <p>{d.rationale}</p>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
