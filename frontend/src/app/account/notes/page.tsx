"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotes } from "@/hooks/useNotes";
import type { Note } from "@/lib/notes/types";
import { ROUTES } from "@/constants/routes";
import styles from "./page.module.scss";

const COLOR_MAP: Record<string, string> = {
  gold: "#C8A843",
  blue: "#4A80D4",
  green: "#2D8A4E",
};

const FILTER_OPTIONS = [
  { label: "Всі", value: "all" },
  { label: "Золота", value: "gold" },
  { label: "Синя", value: "blue" },
  { label: "Зелена", value: "green" },
] as const;

type FilterValue = (typeof FILTER_OPTIONS)[number]["value"];

const dateFormatter = new Intl.DateTimeFormat("uk-UA", { dateStyle: "short" });

const TEXT_LIMIT = 180;
const QUOTE_LIMIT = 120;

export default function AccountNotesPage() {
  const { user } = useAuth();
  const { notes, removeNote } = useNotes();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = notes
    .filter((n) => activeFilter === "all" || n.color === activeFilter)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  function confirmDelete() {
    if (!deleteId) return;
    removeNote(deleteId);
    if (expandedNote?.id === deleteId) setExpandedNote(null);
    setDeleteId(null);
  }

  const noteColor = expandedNote ? (COLOR_MAP[expandedNote.color] ?? "#C8A843") : "#C8A843";

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.heading}>Нотатки</h1>
      <p className={styles.subtitle}>
        Ваші особисті правові коментарі та виділення
      </p>

      {!user ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>§</span>
          <p className={styles.emptyText}>
            Увійдіть, щоб переглядати нотатки.{" "}
            <Link href={ROUTES.authLogin}>Увійти</Link>
          </p>
        </div>
      ) : (
        <>
          <div className={styles.filterBar}>
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={
                  activeFilter === opt.value
                    ? `${styles.chip} ${styles.chipActive}`
                    : styles.chip
                }
                onClick={() => setActiveFilter(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}>§</span>
              <p className={styles.emptyText}>
                Нотаток ще немає. Виділіть текст у статті або перетягніть
                статтю на свій аватар, щоб додати першу нотатку.
              </p>
            </div>
          ) : (
            <ul className={styles.noteList}>
              <AnimatePresence initial={false}>
                {filtered.map((note, index) => {
                  const color = COLOR_MAP[note.color] ?? "#C8A843";
                  const textTruncated = note.noteText && note.noteText.length > TEXT_LIMIT;
                  const quoteTruncated = note.selectedText && note.selectedText.length > QUOTE_LIMIT;
                  const hasMore = textTruncated || quoteTruncated;

                  return (
                    <motion.li
                      key={note.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className={styles.noteCard}
                      style={{ "--note-color": color } as React.CSSProperties}
                    >
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        aria-label="Видалити нотатку"
                        onClick={() => setDeleteId(note.id)}
                      >
                        ✕
                      </button>

                      <div className={styles.noteBody}>
                        {note.type === "article" ? (
                          <>
                            <p className={styles.noteType}>Стаття</p>
                            <p className={styles.noteArticleTitle}>
                              {note.articleTitle
                                ? `Ст. ${note.articleNum} — ${note.articleTitle}`
                                : `Ст. ${note.articleNum}`}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className={styles.noteType}>Виділення</p>
                            {note.selectedText && (
                              <blockquote
                                className={styles.noteBlockquote}
                                style={{ color }}
                              >
                                {note.selectedText}
                              </blockquote>
                            )}
                          </>
                        )}

                        {(note.lawId || note.lawTitle) && (
                          <p className={styles.noteSource}>
                            <span className={styles.noteSourceLabel}>Джерело</span>
                            {note.lawTitle || note.lawId}
                            {note.articleNum ? ` · ст. ${note.articleNum}` : ""}
                          </p>
                        )}

                        {note.noteText ? (
                          <p className={styles.noteText}>{note.noteText}</p>
                        ) : null}

                        {hasMore && (
                          <button
                            type="button"
                            className={styles.expandBtn}
                            onClick={() => setExpandedNote(note)}
                          >
                            Читати повністю →
                          </button>
                        )}
                      </div>

                      <div className={styles.noteFooter}>
                        <span className={styles.noteDate}>
                          {dateFormatter.format(new Date(note.createdAt))}
                        </span>
                        {(note.lawId && note.articleNum) || note.pageUrl ? (
                          <a
                            href={
                              note.lawId && note.articleNum
                                ? ROUTES.article(note.lawId, note.articleNum)
                                : (note.pageUrl ?? "#")
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.openBtn}
                          >
                            ↗ Відкрити
                          </a>
                        ) : null}
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </>
      )}

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className={styles.expandOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              className={styles.confirmModal}
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className={styles.confirmText}>Видалити нотатку?</p>
              <p className={styles.confirmSub}>Цю дію не можна скасувати.</p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmCancel}
                  onClick={() => setDeleteId(null)}
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  className={styles.confirmDelete}
                  onClick={confirmDelete}
                >
                  Видалити
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Expand modal ── */}
      <AnimatePresence>
        {expandedNote && (
          <motion.div
            className={styles.expandOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setExpandedNote(null)}
          >
            <motion.div
              className={styles.expandModal}
              style={{ "--note-color": noteColor } as React.CSSProperties}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.expandModalClose}
                onClick={() => setExpandedNote(null)}
                aria-label="Закрити"
              >
                ✕
              </button>

              <p className={styles.noteType}>
                {expandedNote.type === "article" ? "Стаття" : "Виділення"}
              </p>

              {expandedNote.type === "article" ? (
                <p className={styles.noteArticleTitle}>
                  {expandedNote.articleTitle
                    ? `Ст. ${expandedNote.articleNum} — ${expandedNote.articleTitle}`
                    : `Ст. ${expandedNote.articleNum}`}
                </p>
              ) : expandedNote.selectedText ? (
                <blockquote
                  className={styles.expandModalBlockquote}
                >
                  {expandedNote.selectedText}
                </blockquote>
              ) : null}

              {(expandedNote.lawId || expandedNote.lawTitle) && (
                <p className={styles.noteSource} style={{ marginTop: 8 }}>
                  <span className={styles.noteSourceLabel}>Джерело</span>
                  {expandedNote.lawTitle || expandedNote.lawId}
                  {expandedNote.articleNum ? ` · ст. ${expandedNote.articleNum}` : ""}
                </p>
              )}

              {expandedNote.noteText && (
                <p className={styles.expandModalText}>{expandedNote.noteText}</p>
              )}

              <div className={styles.noteFooter} style={{ marginTop: 20, paddingTop: 0 }}>
                <span className={styles.noteDate}>
                  {dateFormatter.format(new Date(expandedNote.createdAt))}
                </span>
                {(expandedNote.lawId && expandedNote.articleNum) || expandedNote.pageUrl ? (
                  <a
                    href={
                      expandedNote.lawId && expandedNote.articleNum
                        ? ROUTES.article(expandedNote.lawId, expandedNote.articleNum)
                        : (expandedNote.pageUrl ?? "#")
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.openBtn}
                  >
                    ↗ Відкрити статтю
                  </a>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
