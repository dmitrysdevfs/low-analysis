"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { NAV_ITEMS } from "@/constants/navigation";
import styles from "./AppHeader.module.scss";

function TryzubIcon() {
  return (
    <svg
      width="28"
      height="36"
      viewBox="0 0 28 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M14 2 L14 34 M14 2 L6 10 M14 2 L22 10 M6 10 L6 18 Q6 22 10 22 L14 22 M22 10 L22 18 Q22 22 18 22 L14 22 M8 34 L20 34"
        stroke="#C8A843"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 2 L14 10 M10 6 Q14 2 18 6"
        stroke="#C8A843"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BurgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {open ? (
        <>
          <line x1="4" y1="4" x2="16" y2="16" stroke="#C8A843" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="16" y1="4" x2="4" y2="16" stroke="#C8A843" strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="3" y1="5" x2="17" y2="5" stroke="#C8A843" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="3" y1="10" x2="17" y2="10" stroke="#C8A843" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="3" y1="15" x2="17" y2="15" stroke="#C8A843" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        {/* Logo block */}
        <div className={styles.logoBlock}>
          <TryzubIcon />
          <div>
            <Link href="/" className={styles.logoLink}>
              Low Analysis
            </Link>
            <div className={styles.logoSubtitle}>
              Система аналізу законодавства України
            </div>
          </div>
        </div>

        {/* Burger button — visible only on mobile via CSS class */}
        <button
          className={`nav-mobile-btn ${styles.burgerBtn}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Закрити меню" : "Відкрити меню"}
          aria-expanded={mobileOpen}
        >
          <BurgerIcon open={mobileOpen} />
        </button>
      </div>

      {/* ── Desktop nav — hidden on mobile via CSS class ── */}
      <nav className={`nav-desktop ${styles.desktopNav}`}>
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* ── Mobile dropdown nav ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            key="mobile-nav"
            className={styles.mobileNav}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
