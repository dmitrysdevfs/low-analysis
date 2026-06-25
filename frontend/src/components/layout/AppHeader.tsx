"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildNavItems, buildSessionMenuItems } from "@/constants/navigation";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/components/auth/AuthProvider";
import { TryzubMark } from "@/components/ui/TryzubMark";
import { AuthUserIcon } from "@/components/ui/AuthUserIcon";
import { BurgerIcon } from "./BurgerIcon";
import { SessionMenu } from "./SessionMenu";
import { AppSidebar } from "./AppSidebar";
import { PatreonButton } from "@/components/support/PatreonButton";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { useActiveProposalsCount } from "@/hooks/useLawChangeProposals";
import styles from "./AppHeader.module.scss";

export function AppHeader() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith(ROUTES.admin);

  if (isAdminPage) {
    return null;
  }

  return <PublicAppHeader pathname={pathname} />;
}

function PublicAppHeader({ pathname }: { pathname: string }) {
  const router = useRouter();
  const headerRef = useRef<HTMLElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerScrolledAway, setHeaderScrolledAway] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { isAuthenticated, isAdmin, isLegislator, isSupervisor, user, logout } =
    useAuth();
  const activeProposalsCount = useActiveProposalsCount();
  const isAuthPage = pathname.startsWith(ROUTES.auth);
  const isAdminPage = false;
  const isHome = pathname === "/";
  const visibleNavItems = useMemo(
    () => buildNavItems({ isAuthenticated, isLegislator, isSupervisor }),
    [isAuthenticated, isLegislator, isSupervisor],
  );

  const sessionMenuItems = useMemo(
    () => buildSessionMenuItems({ isAdmin, isLegislator, isSupervisor }),
    [isAdmin, isLegislator, isSupervisor],
  );

  const mobileNavItems = visibleNavItems;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const el = headerRef.current;
    if (!el || isHome) {
      setHeaderScrolledAway(false);
      setSidebarOpen(false);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        const away = !entry.isIntersecting;
        setHeaderScrolledAway(away);
        if (!away) setSidebarOpen(false);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isHome]);

  // Close sidebar on scroll — capture:true catches scrolls inside overflow containers too,
  // but we skip events that originate inside the sidebar itself
  useEffect(() => {
    if (!sidebarOpen) return;
    function onScroll(e: Event) {
      if (e.target instanceof Element && e.target.closest("[data-sidebar]")) {
        return;
      }
      setSidebarOpen(false);
    }
    document.addEventListener("scroll", onScroll, {
      passive: true,
      capture: true,
    });
    return () =>
      document.removeEventListener("scroll", onScroll, { capture: true });
  }, [sidebarOpen]);

  // Close sidebar on orientation change
  useEffect(() => {
    function onOrientationChange() {
      setSidebarOpen(false);
      setMobileOpen(false);
    }
    window.addEventListener("orientationchange", onOrientationChange);
    return () =>
      window.removeEventListener("orientationchange", onOrientationChange);
  }, []);

  // Track global drag for drag-strip visibility
  useEffect(() => {
    function onDragStart() {
      setIsDragging(true);
    }
    function onDragEnd() {
      setIsDragging(false);
    }
    window.addEventListener("dragstart", onDragStart);
    window.addEventListener("dragend", onDragEnd);
    window.addEventListener("drop", onDragEnd);
    return () => {
      window.removeEventListener("dragstart", onDragStart);
      window.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("drop", onDragEnd);
    };
  }, []);

  useEffect(() => {
  function handleClickOutside(e: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setOpenDropdown(null);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);

  function handleLogout() {
    if (!mounted) return;
    logout();
    setMobileOpen(false);
    router.push(ROUTES.home);
  }
 
  return (
    <>
      <motion.header
        ref={headerRef}
        className={`${styles.header} ${!isHome ? styles.headerStatic : ""}`}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className={styles.topBar}>
          <div className={styles.logoBlock}>
            <TryzubMark
              size={30}
              variant="header"
              className={styles.logoMark}
            />
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
            <PatreonButton />

            {mounted && isAdmin ? (
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

            {mounted && isAuthenticated ? (
              <SessionMenu
                displayName={user?.displayName ?? "Акаунт"}
                email={user?.email}
                isAdmin={isAdmin}
                items={sessionMenuItems}
                headerRef={headerRef}
                onLogout={handleLogout}
              />
            ) : mounted ? (
              <Link
                href={ROUTES.auth}
                className={`${styles.authLink} ${isAuthPage ? styles.authLinkActive : ""}`}
              >
                <span className={styles.authIconWrap}>
                  <AuthUserIcon size={18} />
                </span>
                <span className={styles.authLabel}>Вхід</span>
              </Link>
            ) : null}

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
    
    const isActive = item.href 
      ? pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
      : item.subItems?.some(sub => sub.href && pathname.startsWith(sub.href));
  
    if (item.subItems && item.subItems.length > 0) {
      const isOpen = openDropdown === item.label;
      return (
        <div key={item.label} ref={dropdownRef} className={styles.navDropdownWrap} onMouseEnter={() => setOpenDropdown(item.label)}
  onMouseLeave={() => setOpenDropdown(null)}>
          <button 
            type="button" 
            className={`nav-link ${styles.navDropdownTrigger} ${isActive ? "active" : ""}`}
            
                     >
            {item.label}
            <svg className={styles.navDropdownChevron} width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {isOpen && (
        <div className={styles.navDropdown}>
          {item.subItems.map((subItem) => (
            <Link
              key={subItem.label}
              href={subItem.href || "#"}
              className={styles.navDropdownItem}
              onClick={() => setOpenDropdown(null)} 
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

    return (
      <Link
        key={item.label}
        href={item.href || "#"}
        className={`nav-link${isActive ? " active" : ""}`}
      >
        {item.label}
        {item.href === ROUTES.proposals && activeProposalsCount > 0 && (
          <span
            style={{
              marginLeft: 4,
              background: "var(--color-danger, #e53e3e)",
              color: "#fff",
              borderRadius: "10px",
              padding: "0 5px",
              fontSize: "11px",
              fontWeight: 700,
              lineHeight: "16px",
              display: "inline-block",
            }}
          >
            {activeProposalsCount}
          </span>
        )}
      </Link>
    );
  })}
  <div className={styles.navThemeSwitcher}>
    <ThemeSwitcher />
  </div>
</nav>

        <AnimatePresence>
  {mounted && mobileOpen ? (
    <motion.nav
      key="mobile-nav"
      className={styles.mobileNav}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {mobileNavItems.map((item) => {
        
        if (item.subItems && item.subItems.length > 0) {
          return (
            <div key={item.label} className={styles.mobileNavGroup}>
              <div className={styles.mobileNavGroupLabel}>
                {item.label}
              </div>
              {item.subItems.map((subItem) => {
                const isSubActive = subItem.href && (pathname === subItem.href || (subItem.href !== "/" && pathname.startsWith(subItem.href)));
                return (
                  <Link
                    key={subItem.label}
                    href={subItem.href || "#"}
                    onClick={() => setMobileOpen(false)}
                    className={`${styles.mobileNavLink} ${styles.mobileNavSubLink} ${isSubActive ? styles.mobileNavLinkActive : ""}`}
                  >
                    {subItem.label}
                  </Link>
                );
              })}
            </div>
          );
        }

        const isActive = item.href && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));

        return (
          <Link
            key={item.label}
            href={item.href || "#"}
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
      {/* Sidebar tab — appears when header is off-screen */}
      {headerScrolledAway && (
        <button
          type="button"
          className={`${styles.sidebarTab} ${sidebarOpen ? styles.sidebarTabOpen : ""}`}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label={
            sidebarOpen ? "Закрити бічну панель" : "Відкрити бічну панель"
          }
        >
          {sidebarOpen ? "×" : "§"}
        </button>
      )}

      {/* Drag strip — thin left-edge zone that opens sidebar when dragging */}
      {headerScrolledAway && !sidebarOpen && (
        <div
          className={`${styles.sidebarDragStrip} ${isDragging ? styles.sidebarDragStripActive : ""}`}
          onDragEnter={() => setSidebarOpen(true)}
        />
      )}

      <AppSidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
}
