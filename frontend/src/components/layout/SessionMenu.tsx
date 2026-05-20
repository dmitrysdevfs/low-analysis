"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ChevronIcon } from "./LayoutIcons";
import styles from "./AppHeader.module.scss";
import { NoteModal } from "@/components/notes/NoteModal";
import type { NoteDraft } from "@/lib/notes/types";

interface SessionMenuItem {
  href: string;
  label: string;
  caption: string;
}

interface Props {
  displayName: string;
  email?: string;
  isAdmin: boolean;
  items: SessionMenuItem[];
  headerRef: React.RefObject<HTMLElement | null>;
  onLogout: () => void;
  sidebarMode?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (
    parts
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function SessionMenu({
  displayName,
  email,
  isAdmin,
  items,
  headerRef,
  onLogout,
  sidebarMode = false,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{
    top?: number;
    bottom?: number;
    right?: number;
    left?: number;
    width?: number;
    maxHeight?: number;
  } | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const initials = getInitials(displayName);
  const planLabel = isAdmin ? "Адміністратор" : "Базовий план";

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      if (!buttonRef.current) return;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      if (sidebarMode) {
        const maxHeight = Math.min(480, buttonRect.top - 16);
        setPosition({
          bottom: window.innerHeight - buttonRect.top + 8,
          left: 8,
          width: 194,
          maxHeight,
        });
      } else {
        if (!headerRef.current) return;
        const headerRect = headerRef.current.getBoundingClientRect();
        setPosition({
          top: headerRect.bottom + 10,
          right: Math.max(16, window.innerWidth - buttonRect.right),
        });
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, headerRef, sidebarMode]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    function handleDragOver(e: DragEvent) {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    }

    function handleDragLeave() {
      setIsDragOver(false);
    }

    function handleDrop(e: DragEvent) {
      e.preventDefault();
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

    el.addEventListener("dragover", handleDragOver);
    el.addEventListener("dragleave", handleDragLeave);
    el.addEventListener("drop", handleDrop);
    return () => {
      el.removeEventListener("dragover", handleDragOver);
      el.removeEventListener("dragleave", handleDragLeave);
      el.removeEventListener("drop", handleDrop);
    };
  }, []);

  function handleLogout() {
    setOpen(false);
    onLogout();
  }

  return (
    <div className={styles.sessionMenuWrap} ref={menuRef}>
      <button
        type="button"
        ref={buttonRef}
        className={`${styles.sessionChip} ${open ? styles.sessionChipOpen : ""}`}
        aria-label="Відкрити меню акаунту"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        style={
          isDragOver
            ? { boxShadow: "0 0 0 3px #C8A843, 0 0 20px rgba(200,168,67,0.4)" }
            : undefined
        }
      >
        <span className={styles.sessionAvatar}>{initials}</span>
        <span className={styles.authLabelBlock}>
          <span className={styles.authLabel}>{displayName}</span>
          <span className={styles.authMeta}>
            {isAdmin ? "АДМІН" : "КЛІЄНТ"}
          </span>
        </span>
        <span className={styles.chevronWrap}>
          <ChevronIcon open={open} />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="session-menu"
            className={styles.sessionMenu}
            style={position ?? undefined}
            role="menu"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className={styles.sessionMenuHead}>
              <span className={styles.sessionMenuAvatar}>{initials}</span>
              <div className={styles.sessionMenuHeadInfo}>
                <span className={styles.sessionMenuHeadName}>
                  {displayName}
                </span>
                {email ? (
                  <span className={styles.sessionMenuHeadEmail}>{email}</span>
                ) : null}
              </div>
            </div>

            <div className={styles.sessionDivider} />

            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className={styles.sessionMenuItem}
                onClick={() => setOpen(false)}
              >
                <span className={styles.sessionMenuLabel}>{item.label}</span>
                <span className={styles.sessionMenuCaption}>
                  {item.caption}
                </span>
              </Link>
            ))}

            <div className={styles.sessionDivider} />

            <div className={styles.sessionPlanRow}>
              <span className={styles.sessionPlanLabel}>{planLabel}</span>
              <Link
                href="/account/billing"
                className={styles.sessionPlanLink}
                onClick={() => setOpen(false)}
              >
                Деталі
              </Link>
            </div>

            <div className={styles.sessionDivider} />

            <button
              type="button"
              role="menuitem"
              className={styles.sessionLogoutBtn}
              onClick={handleLogout}
            >
              Вийти з акаунту
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <NoteModal
        open={noteDraft !== null}
        draft={noteDraft}
        onClose={() => setNoteDraft(null)}
        onSaved={() => setNoteDraft(null)}
      />
    </div>
  );
}
