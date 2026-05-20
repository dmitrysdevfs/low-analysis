"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useMemo, useState, useEffect } from "react";
import { NAV_ITEMS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotes } from "@/hooks/useNotes";
import { TryzubMark } from "@/components/ui/TryzubMark";
import { NoteModal } from "@/components/notes/NoteModal";
import type { NoteDraft } from "@/lib/notes/types";
import { getRoleColor } from "@/lib/tree";
import { SessionMenu } from "./SessionMenu";
import { useSidebarData } from "./SidebarDataContext";
import styles from "./AppSidebar.module.scss";

function hexToRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return "122,152,192";
  return [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)].join(",");
}

export function AppSidebar({ visible }: { visible: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const sidebarAsHeaderRef = useRef<HTMLElement | null>(null);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { subjects, onSubjectSelect, activeSubjectId } = useSidebarData();
  const { notes } = useNotes();
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [subjectsQuery, setSubjectsQuery] = useState("");
  const dragCounter = useRef(0);

  const recentNotes = useMemo(() => notes.slice(0, 5), [notes]);

  const sessionMenuItems = useMemo(
    () => [
      {
        href: ROUTES.account,
        label: "Мій кабінет",
        caption: "Профіль та налаштування",
      },
      {
        href: ROUTES.accountSaved,
        label: "Збережені статті",
        caption: "Важливі документи",
      },
      {
        href: ROUTES.accountNotes,
        label: "Нотатки",
        caption: "Правові чернетки",
      },
      {
        href: ROUTES.accountBilling,
        label: "План та оплата",
        caption: "Рівень доступу",
      },
      ...(isAdmin
        ? [
            {
              href: ROUTES.adminAnalytics,
              label: "Аналітика",
              caption: "Метрики та огляд",
            },
          ]
        : []),
    ],
    [isAdmin],
  );

  function handleLogout() {
    logout();
    router.push(ROUTES.home);
  }

  // Reset notesOpen when sidebar closes
  useEffect(() => {
    if (!visible) setNotesOpen(false);
  }, [visible]);

  // Sidebar drag detection + drop handling (all at sidebar level so drop zone doesn't need to be mounted)
  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;

    function onDragEnter() {
      dragCounter.current += 1;
      setIsDragOver(true);
      setNotesOpen(true);
    }
    function onDragLeave() {
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragOver(false);
      }
    }
    function onDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragOver(false);
      const raw = e.dataTransfer?.getData("application/law-article");
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as {
          lawId: string;
          lawTitle: string;
          articleNum: string;
          articleTitle: string;
        };
        setNoteDraft({
          type: "article",
          color: "gold",
          noteText: "",
          lawId: data.lawId,
          lawTitle: data.lawTitle,
          articleNum: data.articleNum,
          articleTitle: data.articleTitle,
        });
      } catch {
        /* ignore */
      }
    }
    function onDragEnd() {
      dragCounter.current = 0;
      setIsDragOver(false);
    }

    el.addEventListener("dragenter", onDragEnter);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    el.addEventListener("dragend", onDragEnd);
    window.addEventListener("dragend", onDragEnd);
    return () => {
      el.removeEventListener("dragenter", onDragEnter);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
      el.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("dragend", onDragEnd);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            ref={sidebarRef}
            className={`${styles.sidebar} ${isDragOver ? styles.sidebarDragOver : ""}`}
            initial={{ x: -220, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -220, opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* Logo */}
            <div className={styles.logoRow}>
              <TryzubMark size={24} variant="header" />
              <Link href={ROUTES.home} className={styles.logoLink}>
                Law Analysis
              </Link>
            </div>

            <div className={styles.divider} />

            {/* Nav links */}
            <nav className={styles.nav}>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Subjects section */}
            {subjects.length > 0 && (
              <>
                <div className={styles.divider} />
                <div className={styles.subjectsSection}>
                  <div className={styles.subjectsSectionHeader}>
                    <span className={styles.subjectsSectionLabel}>
                      СУБ&apos;ЄКТИ · {subjects.length}
                    </span>
                    {activeSubjectId && (
                      <div className={styles.subjectsActions}>
                        <button
                          type="button"
                          className={styles.subjectsActionBtn}
                          title="Перейти до виділення"
                          onClick={() => {
                            const mark = document.querySelector("mark");
                            if (mark) mark.scrollIntoView({ behavior: "smooth", block: "center" });
                          }}
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          className={styles.subjectsActionBtn}
                          title="Скинути вибір"
                          onClick={() => onSubjectSelect?.(null)}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  <div className={styles.subjectsSearch}>
                    <span className={styles.subjectsSearchIcon}>⌕</span>
                    <input
                      type="text"
                      className={styles.subjectsSearchInput}
                      placeholder="Пошук суб'єкта..."
                      value={subjectsQuery}
                      onChange={(e) => setSubjectsQuery(e.target.value)}
                    />
                    {subjectsQuery && (
                      <button
                        type="button"
                        className={styles.subjectsSearchClear}
                        onClick={() => setSubjectsQuery("")}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className={styles.subjectsList}>
                    {(subjectsQuery
                      ? subjects.filter((s) =>
                          s.name.toLowerCase().includes(subjectsQuery.toLowerCase())
                        )
                      : subjects.slice(0, 3)
                    ).map((s) => {
                      const color = s.role ? getRoleColor(s.role) : "#7a98c0";
                      const rgb = hexToRgb(color);
                      return (
                        <div
                          key={s.id}
                          className={styles.subjectItem}
                          style={{
                            cursor: onSubjectSelect ? "pointer" : "default",
                            borderColor: activeSubjectId === s.id ? `rgba(${rgb},0.6)` : `rgba(${rgb},0.25)`,
                            background: activeSubjectId === s.id ? `rgba(${rgb},0.08)` : undefined,
                          }}
                          onClick={() => {
                            if (onSubjectSelect) {
                              onSubjectSelect(s.id);
                              setSubjectsQuery("");
                            }
                          }}
                          role={onSubjectSelect ? "button" : undefined}
                          tabIndex={onSubjectSelect ? 0 : undefined}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && onSubjectSelect) {
                              onSubjectSelect(s.id);
                              setSubjectsQuery("");
                            }
                          }}
                        >
                          <span
                            className={styles.subjectName}
                            style={{ color }}
                          >
                            {s.name}
                          </span>
                          {s.role && (
                            <span
                              className={styles.subjectBadge}
                              style={{
                                color,
                                background: `rgba(${rgb},0.12)`,
                                border: `1px solid rgba(${rgb},0.25)`,
                              }}
                            >
                              {s.role}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            <div className={styles.spacer} />
            <div className={styles.divider} />

            {/* Notes section */}
            <div className={styles.notesSection}>
              <button
                type="button"
                className={styles.notesSectionHeader}
                onClick={() => setNotesOpen((v) => !v)}
              >
                <span>НОТАТКИ</span>
                <span className={styles.notesMeta}>
                  {recentNotes.length > 0 ? recentNotes.length : ""}
                  <span className={styles.notesChevron}>
                    {notesOpen ? "▾" : "▸"}
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {notesOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={styles.notesBody}
                  >
                    {/* Drop zone — visual indicator only, drop is handled at sidebar level */}
                    <div
                      className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ""}`}
                    >
                      {isDragOver ? "↓ Відпусти сюди" : "+ Перетягни статтю"}
                    </div>

                    {/* Notes list */}
                    {recentNotes.length === 0 ? (
                      <p className={styles.notesEmpty}>Нотаток ще немає</p>
                    ) : (
                      <ul className={styles.notesList}>
                        {recentNotes.map((note) => (
                          <li key={note.id} className={styles.notesItem}>
                            <span className={styles.notesItemTitle}>
                              {note.type === "article"
                                ? `Ст. ${note.articleNum}${note.articleTitle ? ` — ${note.articleTitle}` : ""}`
                                : (note.selectedText?.slice(0, 40) ??
                                  "Виділення")}
                            </span>
                            {(note.lawId && note.articleNum) || note.pageUrl ? (
                              <a
                                href={
                                  note.lawId && note.articleNum
                                    ? ROUTES.article(
                                        note.lawId,
                                        note.articleNum,
                                      )
                                    : (note.pageUrl ?? "#")
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.notesItemLink}
                              >
                                ↗
                              </a>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}

                    <Link
                      href={ROUTES.accountNotes}
                      className={styles.notesAll}
                    >
                      Всі нотатки →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={styles.divider} />

            {/* Session menu */}
            <div className={styles.sessionRow}>
              {isAuthenticated ? (
                <SessionMenu
                  displayName={user?.displayName ?? "Акаунт"}
                  email={user?.email}
                  isAdmin={isAdmin}
                  items={sessionMenuItems}
                  headerRef={sidebarAsHeaderRef}
                  onLogout={handleLogout}
                  sidebarMode
                />
              ) : (
                <Link href={ROUTES.auth} className={styles.loginLink}>
                  Увійти
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NoteModal
        open={noteDraft !== null}
        draft={noteDraft}
        onClose={() => setNoteDraft(null)}
        onSaved={() => setNoteDraft(null)}
      />
    </>
  );
}
