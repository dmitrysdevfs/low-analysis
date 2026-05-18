"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { NAV_ITEMS } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/auth/AuthProvider";
import { TryzubMark } from "@/components/TryzubMark";
import { AuthUserIcon } from "@/components/ui/AuthUserIcon";
import { BurgerIcon } from "./BurgerIcon";
import { SessionMenu } from "./SessionMenu";
import styles from "./AppHeader.module.scss";

export function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const isAuthPage = pathname.startsWith(ROUTES.auth);
  const isAdminPage = pathname.startsWith(ROUTES.admin);
  const visibleNavItems = NAV_ITEMS;

  const sessionMenuItems = useMemo(
    () => [
      {
        href: ROUTES.account,
        label: "Мій кабінет",
        caption: "Профіль, пароль та особисті налаштування",
      },
      {
        href: ROUTES.accountSaved,
        label: "Збережені статті",
        caption: "Швидкий доступ до важливих документів",
      },
      {
        href: ROUTES.accountNotes,
        label: "Нотатки",
        caption: "Особисті правові чернетки та спостереження",
      },
      {
        href: ROUTES.accountBilling,
        label: "План та оплата",
        caption: "Поточний рівень доступу, квоти та demo-checkout",
      },
      ...(isAdmin
        ? [
            {
              href: ROUTES.adminAnalytics,
              label: "Аналітика",
              caption: "Метрики, покриття та операційний огляд",
            },
          ]
        : []),
    ],
    [isAdmin],
  );

  const mobileNavItems = [
    ...visibleNavItems,
    ...(isAuthenticated ? [{ label: "Кабінет", href: ROUTES.account }] : []),
    ...(isAuthenticated
      ? [{ label: "План та оплата", href: ROUTES.accountBilling }]
      : []),
    ...(isAdmin
      ? [
          { label: "Адмін панель", href: ROUTES.admin },
          { label: "Аналітика", href: ROUTES.adminAnalytics },
        ]
      : []),
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    setMobileOpen(false);
    router.push(ROUTES.home);
  }

  return (
    <motion.header
      ref={headerRef}
      className={styles.header}
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className={styles.topBar}>
        <div className={styles.logoBlock}>
          <TryzubMark size={30} variant="header" className={styles.logoMark} />
          <div className={styles.logoCopy}>
            <Link href={ROUTES.home} className={styles.logoLink}>
              Law Analysis
            </Link>
            <div className={styles.logoSubtitle}>
              Система аналізу законодавства України
            </div>
          </div>
        </div>

        <div className={styles.topBarActions}>
          {isAdmin ? (
            <div className={styles.modeSwitch}>
              <Link
                href={ROUTES.home}
                className={`${styles.modeSwitchItem} ${!isAdminPage ? styles.modeSwitchItemActive : ""}`}
              >
                Сайт
              </Link>
              <Link
                href={ROUTES.admin}
                className={`${styles.modeSwitchItem} ${isAdminPage ? styles.modeSwitchItemActive : ""}`}
              >
                Панель адміна
              </Link>
            </div>
          ) : null}

          {isAuthenticated ? (
            <SessionMenu
              displayName={user?.displayName ?? "Акаунт"}
              isAdmin={isAdmin}
              items={sessionMenuItems}
              headerRef={headerRef}
              onLogout={handleLogout}
            />
          ) : (
            <Link
              href={ROUTES.auth}
              className={`${styles.authLink} ${isAuthPage ? styles.authLinkActive : ""}`}
            >
              <span className={styles.authIconWrap}>
                <AuthUserIcon size={18} />
              </span>
              <span className={styles.authLabel}>Вхід</span>
            </Link>
          )}

          <button
            type="button"
            className={`nav-mobile-btn ${styles.burgerBtn}`}
            onClick={() => setMobileOpen((value) => !value)}
            aria-label={mobileOpen ? "Закрити меню" : "Відкрити меню"}
            aria-expanded={mobileOpen}
          >
            <BurgerIcon open={mobileOpen} />
          </button>
        </div>
      </div>

      <nav className={`nav-desktop ${styles.desktopNav}`}>
        {visibleNavItems.map((item) => {
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

      <AnimatePresence>
        {mobileOpen ? (
          <motion.nav
            key="mobile-nav"
            className={styles.mobileNav}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {mobileNavItems.map((item) => {
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
        ) : null}
      </AnimatePresence>
    </motion.header>
  );
}
