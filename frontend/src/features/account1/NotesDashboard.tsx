"use client";

import Link from "next/link";
import { useState, useMemo, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Search,
  Bookmark,
  Bell,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  FileText,
  Pin,
  Trash2,
  ExternalLink,
  Plus,
  X,
  PenSquare,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotes } from "@/hooks/useNotes";
import { notify } from "@/lib/toast";
import type { Note } from "@/lib/notes/types";
import { ROUTES } from "@/constants/routes";
import styles from "./NotesDashboard.module.scss";

const COLOR_MAP: Record<string, string> = {
  gold: "#C8A843",
  blue: "#4A80D4",
  green: "#2D8A4E",
};

const COLORS = [
  { value: "gold", label: "Золота" },
  { value: "blue", label: "Синя" },
  { value: "green", label: "Зелена" },
] as const;

type FilterValue = "all" | "gold" | "blue" | "green";

const dateFormatter = new Intl.DateTimeFormat("uk-UA", { dateStyle: "short" });

const TEXT_LIMIT = 180;
const QUOTE_LIMIT = 120;

const NAV_ITEMS = [
  { href: ROUTES.account, label: "Особистий кабінет", Icon: User },
  { href: ROUTES.search, label: "Пошук документів", Icon: Search },
  { href: ROUTES.accountSaved, label: "Збережені статті", Icon: Bookmark },
  { href: ROUTES.accountNotes, label: "Нотатки", Icon: Bell },
  {
    href: ROUTES.accountBilling,
    label: "План та оплата",
    Icon: CreditCard,
  },
  { href: ROUTES.account, label: "Налаштування", Icon: Settings },
  { href: ROUTES.support, label: "Підтримка", Icon: HelpCircle },
];

export function NotesDashboard() {
  const { user, logout } = useAuth();
  const { notes, loading, addNote, removeNote, togglePin } = useNotes();

  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [expandedNote, setExpandedNote] = useState<Note | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");

  const filtered = useMemo(
    () =>
      notes
        .filter((n) => activeFilter === "all" || n.color === activeFilter)
        .sort((a, b) => {
          if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }),
    [notes, activeFilter],
  );

  const pinnedCount = notes.filter((n) => n.pinned).length;

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newText.trim().length < 10) {
      notify.warning("Нотатка має містити щонайменше 10 символів.");
      return;
    }
    addNote({ type: "manual", color: "gold", noteText: newText.trim() });
    setNewText("");
    notify.success("Нотатку додано.");
  }

  function confirmDelete() {
    if (!deleteId) return;
    removeNote(deleteId);
    if (expandedNote?.id === deleteId) setExpandedNote(null);
    setDeleteId(null);
  }

  if (!user) return null;

  return (
    <div className={styles.wrapper}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoMark}>⚖</div>
          <div className={styles.logoGroup}>
            <span className={styles.logoText}>LAW ANALYSIS</span>
            <span className={styles.logoSub}>Кабінет</span>
          </div>
        </div>
        <nav className={styles.sidebarNav}>
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={label}
              href={href}
              className={`${styles.navItem} ${label === "Нотатки" ? styles.navItemActive : ""}`}
            >
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <button type="button" className={styles.navLogout} onClick={logout}>
          <LogOut size={18} />
          <span>Вийти</span>
        </button>
      </aside>

      {/* Main */}
      <main className={styles.content}>
        <div className={styles.contentInner}>
          {/* Header */}
          <div className={styles.pageHeader}>
            <div>
              <span className={styles.eyebrow}>Персональні нотатки</span>
              <h1 className={styles.pageTitle}>Нотатки та виділення</h1>
              <p className={styles.pageSub}>
                Ваші особисті правові коментарі, виділення та нотатки до статей
                законів.
              </p>
            </div>
            <div className={styles.headerStats}>
              <div className={styles.statChip}>
                <FileText size={14} />
                <span>{notes.length} нотаток</span>
              </div>
              {pinnedCount > 0 && (
                <div className={`${styles.statChip} ${styles.statChipGold}`}>
                  <Pin size={14} />
                  <span>{pinnedCount} закріплено</span>
                </div>
              )}
            </div>
          </div>

          {/* Create form */}
          <form className={styles.createForm} onSubmit={handleCreate}>
            <div className={styles.createIcon}>
              <PenSquare size={18} />
            </div>
            <textarea
              className={styles.createTextarea}
              placeholder="Нова нотатка… (мін. 10 символів)"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              rows={2}
            />
            <button type="submit" className={styles.createBtn}>
              <Plus size={15} />
              Додати
            </button>
          </form>

          {/* Filter chips */}
          <div className={styles.filterBar}>
            <button
              type="button"
              className={`${styles.chip} ${activeFilter === "all" ? styles.chipActive : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              Всі ({notes.length})
            </button>
            {COLORS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`${styles.chip} ${activeFilter === value ? styles.chipActive : ""}`}
                style={
                  activeFilter === value
                    ? { borderColor: COLOR_MAP[value], color: COLOR_MAP[value] }
                    : {}
                }
                onClick={() => setActiveFilter(value)}
              >
                <span
                  className={styles.chipDot}
                  style={{ background: COLOR_MAP[value] }}
                />
                {label} ({notes.filter((n) => n.color === value).length})
              </button>
            ))}
          </div>

          {/* Notes grid */}
          {loading ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>⏳</div>
              <p>Завантаження нотаток…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>
                <FileText size={40} />
              </div>
              <p>Нотаток ще немає. Додайте першу за допомогою форми вище.</p>
            </div>
          ) : (
            <ul className={styles.noteGrid}>
              <AnimatePresence initial={false}>
                {filtered.map((note, index) => {
                  const color = COLOR_MAP[note.color] ?? "#C8A843";
                  const textTruncated =
                    note.noteText && note.noteText.length > TEXT_LIMIT;
                  const quoteTruncated =
                    note.selectedText && note.selectedText.length > QUOTE_LIMIT;
                  const hasMore = textTruncated || quoteTruncated;

                  return (
                    <motion.li
                      key={note.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ delay: index * 0.04, duration: 0.2 }}
                      className={styles.noteCard}
                      style={{ "--note-color": color } as React.CSSProperties}
                    >
                      {/* Color bar */}
                      <div className={styles.noteColorBar} />

                      {/* Actions row */}
                      <div className={styles.noteActions}>
                        {note.pinned && (
                          <span className={styles.pinBadge}>
                            <Pin size={11} />
                          </span>
                        )}
                        <div className={styles.noteActionBtns}>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${note.pinned ? styles.iconBtnActive : ""}`}
                            title={note.pinned ? "Відкріпити" : "Закріпити"}
                            onClick={() => togglePin(note.id)}
                          >
                            <Pin size={13} />
                          </button>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            title="Видалити"
                            onClick={() => setDeleteId(note.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Body */}
                      <div className={styles.noteBody}>
                        {note.type === "article" ? (
                          <>
                            <span className={styles.noteType}>Стаття</span>
                            <p className={styles.noteArticleTitle}>
                              {note.articleTitle
                                ? `Ст. ${note.articleNum} — ${note.articleTitle}`
                                : `Ст. ${note.articleNum}`}
                            </p>
                          </>
                        ) : (
                          <>
                            <span className={styles.noteType}>Виділення</span>
                            {note.selectedText && (
                              <blockquote className={styles.noteQuote}>
                                {note.selectedText.length > QUOTE_LIMIT &&
                                !expandedNote
                                  ? `${note.selectedText.slice(0, QUOTE_LIMIT)}…`
                                  : note.selectedText}
                              </blockquote>
                            )}
                          </>
                        )}

                        {(note.lawId || note.lawTitle) && (
                          <div className={styles.noteSource}>
                            <span className={styles.noteSourceLabel}>
                              Джерело:
                            </span>
                            {note.lawTitle || note.lawId}
                            {note.articleNum ? ` · ст. ${note.articleNum}` : ""}
                          </div>
                        )}

                        {note.noteText && (
                          <p className={styles.noteText}>
                            {note.noteText.length > TEXT_LIMIT
                              ? `${note.noteText.slice(0, TEXT_LIMIT)}…`
                              : note.noteText}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className={styles.noteFooter}>
                        <span className={styles.noteDate}>
                          {dateFormatter.format(new Date(note.createdAt))}
                        </span>
                        <div className={styles.noteFooterRight}>
                          {hasMore && (
                            <button
                              type="button"
                              className={styles.expandBtn}
                              onClick={() => setExpandedNote(note)}
                            >
                              Читати →
                            </button>
                          )}
                          {((note.lawId && note.articleNum) ||
                            note.pageUrl) && (
                            <a
                              href={
                                note.lawId && note.articleNum
                                  ? ROUTES.article(note.lawId, note.articleNum)
                                  : (note.pageUrl ?? "#")
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.openLink}
                              title="Відкрити статтю"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </main>

      {/* ── Delete confirm modal ── */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className={styles.overlay}
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
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setDeleteId(null)}
              >
                <X size={16} />
              </button>
              <div className={styles.confirmIcon}>
                <Trash2 size={28} />
              </div>
              <p className={styles.confirmText}>Видалити нотатку?</p>
              <p className={styles.confirmSub}>Цю дію не можна скасувати.</p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setDeleteId(null)}
                >
                  Скасувати
                </button>
                <button
                  type="button"
                  className={styles.deleteBtn}
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
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setExpandedNote(null)}
          >
            <motion.div
              className={styles.expandModal}
              style={
                {
                  "--note-color": COLOR_MAP[expandedNote.color] ?? "#C8A843",
                } as React.CSSProperties
              }
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setExpandedNote(null)}
              >
                <X size={16} />
              </button>

              <div className={styles.expandColorBar} />

              <span className={styles.noteType}>
                {expandedNote.type === "article" ? "Стаття" : "Виділення"}
              </span>

              {expandedNote.type === "article" ? (
                <p className={styles.noteArticleTitle}>
                  {expandedNote.articleTitle
                    ? `Ст. ${expandedNote.articleNum} — ${expandedNote.articleTitle}`
                    : `Ст. ${expandedNote.articleNum}`}
                </p>
              ) : expandedNote.selectedText ? (
                <blockquote className={styles.expandQuote}>
                  {expandedNote.selectedText}
                </blockquote>
              ) : null}

              {(expandedNote.lawId || expandedNote.lawTitle) && (
                <div className={styles.noteSource} style={{ marginTop: 12 }}>
                  <span className={styles.noteSourceLabel}>Джерело:</span>
                  {expandedNote.lawTitle || expandedNote.lawId}
                  {expandedNote.articleNum
                    ? ` · ст. ${expandedNote.articleNum}`
                    : ""}
                </div>
              )}

              {expandedNote.noteText && (
                <p className={styles.expandText}>{expandedNote.noteText}</p>
              )}

              <div className={styles.expandFooter}>
                <span className={styles.noteDate}>
                  {dateFormatter.format(new Date(expandedNote.createdAt))}
                </span>
                {((expandedNote.lawId && expandedNote.articleNum) ||
                  expandedNote.pageUrl) && (
                  <a
                    href={
                      expandedNote.lawId && expandedNote.articleNum
                        ? ROUTES.article(
                            expandedNote.lawId,
                            expandedNote.articleNum,
                          )
                        : (expandedNote.pageUrl ?? "#")
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.openLinkFull}
                  >
                    <ExternalLink size={14} />
                    Відкрити статтю
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
