"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { AuthUserIcon } from "@/components/ui/AuthUserIcon";
import { ChevronIcon } from "./LayoutIcons";
import styles from "./AppHeader.module.scss";

interface SessionMenuItem {
  href: string;
  label: string;
  caption: string;
}

interface Props {
  displayName: string;
  isAdmin: boolean;
  items: SessionMenuItem[];
  headerRef: React.RefObject<HTMLElement | null>;
  onLogout: () => void;
}

export function SessionMenu({
  displayName,
  isAdmin,
  items,
  headerRef,
  onLogout,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      if (!buttonRef.current || !headerRef.current) return;
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const headerRect = headerRef.current.getBoundingClientRect();
      setPosition({
        top: headerRect.bottom + 10,
        right: Math.max(16, window.innerWidth - buttonRect.right),
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, headerRef]);

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

  return (
    <div className={styles.sessionCluster}>
      <div className={styles.sessionMenuWrap} ref={menuRef}>
        <button
          type="button"
          ref={buttonRef}
          className={`${styles.sessionChip} ${open ? styles.sessionChipOpen : ""}`}
          aria-label="Відкрити меню акаунту"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.authIconWrap}>
            <AuthUserIcon size={18} />
          </span>
          <span className={styles.authLabelBlock}>
            <span className={styles.authLabel}>{displayName}</span>
            <span className={styles.authMeta}>{isAdmin ? "АДМІН" : "КЛІЄНТ"}</span>
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
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  className={styles.sessionMenuItem}
                  onClick={() => setOpen(false)}
                >
                  <span className={styles.sessionMenuLabel}>{item.label}</span>
                  <span className={styles.sessionMenuCaption}>{item.caption}</span>
                </Link>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <button
        type="button"
        className={styles.logoutButton}
        onClick={onLogout}
        aria-label="Вийти з акаунту"
      >
        Вийти
      </button>
    </div>
  );
}
