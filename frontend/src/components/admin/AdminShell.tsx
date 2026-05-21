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
    label: "Dashboard",
    note: "KPI, graphs and site health",
  },
  {
    href: ROUTES.adminUsers,
    label: "Users",
    note: "Registry, roles and account actions",
  },
  {
    href: ROUTES.adminBilling,
    label: "Billing",
    note: "Plans, quotas and assignments",
  },
  {
    href: ROUTES.adminAccess,
    label: "Access",
    note: "Role matrix and protected areas",
  },
  {
    href: ROUTES.adminCodes,
    label: "Codes",
    note: "Super code lifecycle",
  },
  {
    href: ROUTES.adminAudit,
    label: "Audit",
    note: "Operational event feed",
  },
  {
    href: ROUTES.adminAnalytics,
    label: "Analytics",
    note: "Deep frontend data view",
  },
];

const PAGE_COPY: Record<string, { title: string; subtitle: string }> = {
  [ROUTES.admin]: {
    title: "Admin dashboard",
    subtitle: "Control room for accounts, billing, security and site activity.",
  },
  [ROUTES.adminUsers]: {
    title: "User registry",
    subtitle: "Account search, role changes, status control and force logout.",
  },
  [ROUTES.adminBilling]: {
    title: "Billing workspace",
    subtitle: "Plan distribution, quota health and admin-side assignments.",
  },
  [ROUTES.adminAccess]: {
    title: "Access matrix",
    subtitle: "Current route permissions and protected admin surface.",
  },
  [ROUTES.adminCodes]: {
    title: "Super code lifecycle",
    subtitle: "Administrator onboarding code, rotation history and safeguards.",
  },
  [ROUTES.adminAudit]: {
    title: "Audit log",
    subtitle: "Recent security, warning and operational events.",
  },
  [ROUTES.adminAnalytics]: {
    title: "Analytics",
    subtitle: "Deeper site metrics aggregated from current frontend datasets.",
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
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
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
          <h1 className={styles.brandTitle}>Admin workspace</h1>
          <p className={styles.brandNote}>
            Separate operating surface for platform supervision, billing control
            and security flows.
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
            Public site
          </Link>
          <div className={styles.sidebarMeta}>
            Active admin: {user?.displayName ?? "Administrator"}
          </div>
        </div>
      </aside>

      <div className={styles.contentArea}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.topbarEyebrow}>Admin zone</span>
            <div className={styles.topbarTitle}>{pageCopy.title}</div>
            <p className={styles.topbarSubtitle}>{pageCopy.subtitle}</p>
          </div>

          <div className={styles.topbarActions}>
            <Link href={ROUTES.home} className={styles.siteSwitch}>
              Open public site
            </Link>

            <div className={styles.topbarCard}>
              <span className={styles.topbarCardLabel}>Session</span>
              <strong className={styles.topbarCardValue}>
                {user?.displayName ?? "Admin"}
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
