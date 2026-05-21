"use client";

import Link from "next/link";
import { useMemo, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import styles from "./AdminShell.module.scss";

type AdminNavItem = {
  href: string;
  label: string;
  note: string;
};

const ADMIN_NAV: AdminNavItem[] = [
  {
    href: ROUTES.admin,
    label: "Дашборд",
    note: "Ключові метрики, графіки та стан платформи",
  },
  {
    href: ROUTES.adminUsers,
    label: "Користувачі",
    note: "Реєстр, ролі та дії над акаунтами",
  },
  {
    href: ROUTES.adminBilling,
    label: "Білінг",
    note: "Плани, квоти та призначення",
  },
  {
    href: ROUTES.adminAccess,
    label: "Доступ",
    note: "Матриця ролей і захищені зони",
  },
  {
    href: ROUTES.adminCodes,
    label: "Коди",
    note: "Життєвий цикл супер-коду",
  },
  {
    href: ROUTES.adminAudit,
    label: "Аудит",
    note: "Стрічка операційних подій",
  },
  {
    href: ROUTES.adminAnalytics,
    label: "Аналітика",
    note: "Поглиблений зріз поточних даних сайту",
  },
];

const PAGE_COPY: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.admin]: {
    title: "Адмін-дашборд",
    subtitle: "Пульт керування акаунтами, білінгом, безпекою та активністю сайту.",
  },
  [ROUTES.adminUsers]: {
    title: "Реєстр користувачів",
    subtitle: "Пошук акаунтів, зміна ролей, керування статусами та примусовий вихід.",
  },
  [ROUTES.adminBilling]: {
    title: "Білінг-простір",
    subtitle: "Розподіл планів, стан квот і адміністраторські призначення.",
  },
  [ROUTES.adminAccess]: {
    title: "Матриця доступу",
    subtitle: "Поточні права для маршрутів і захищена адмін-поверхня.",
  },
  [ROUTES.adminCodes]: {
    title: "Життєвий цикл супер-коду",
    subtitle: "Код для входу адміністраторів, історія ротацій і запобіжники.",
  },
  [ROUTES.adminAudit]: {
    title: "Журнал аудиту",
    subtitle: "Останні події безпеки, попередження та операційні зміни.",
  },
  [ROUTES.adminAnalytics]: {
    title: "Аналітика",
    subtitle: "Глибші метрики сайту, зібрані з поточних фронтенд-даних.",
  },
};

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const pageCopy = useMemo(() => {
    const direct = PAGE_COPY[pathname];
    if (direct) {
      return direct;
    }

    const fallback =
      ADMIN_NAV.find(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      ) ?? ADMIN_NAV[0];

    return (
      PAGE_COPY[fallback.href] ?? {
        title: fallback.label,
        subtitle: fallback.note,
      }
    );
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <span className={styles.brandEyebrow}>Law Analysis</span>
          <h1 className={styles.brandTitle}>Адмін-простір</h1>
          <p className={styles.brandNote}>
            Окрема робоча поверхня для нагляду за платформою, контролю білінгу
            та безпекових сценаріїв.
          </p>
        </div>

        <div className={styles.navViewport}>
          <nav className={styles.nav}>
            {ADMIN_NAV.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                >
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navNote}>{item.note}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className={styles.sidebarFooter}>
          <Link href={ROUTES.home} className={styles.secondaryLink}>
            Публічний сайт
          </Link>
          <div className={styles.sidebarMeta}>
            Активний адмін: {user?.displayName ?? "Адміністратор"}
          </div>
        </div>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.topbarEyebrow}>Адмін-зона</span>
            <div className={styles.topbarTitle}>{pageCopy.title}</div>
            <p className={styles.topbarSubtitle}>{pageCopy.subtitle}</p>
          </div>

          <div className={styles.topbarActions}>
            <Link href={ROUTES.home} className={styles.siteSwitch}>
              Відкрити сайт
            </Link>

            <div className={styles.topbarCard}>
              <span className={styles.topbarCardLabel}>Сесія</span>
              <strong className={styles.topbarCardValue}>
                {user?.displayName ?? "Адмін"}
              </strong>
              <span className={styles.topbarCardMeta}>
                {user?.email ?? "admin@low-analysis.dev"}
              </span>
            </div>
          </div>
        </header>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
