"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShieldCheck,
  KeyRound,
  ScrollText,
  BarChart3,
  HelpCircle,
  Blocks,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import styles from "./AdminSidebarNav.module.scss";

const NAV_ITEMS = [
  {
    href: ROUTES.admin,
    label: "Дашборд",
    icon: LayoutDashboard,
    note: "Ключові метрики платформи",
  },
  {
    href: ROUTES.adminUsers,
    label: "Користувачі",
    icon: Users,
    note: "Реєстр, ролі, дії",
  },
  {
    href: ROUTES.adminBilling,
    label: "Білінг",
    icon: CreditCard,
    note: "Плани, квоти, призначення",
  },
  {
    href: ROUTES.adminAccess,
    label: "Доступ",
    icon: ShieldCheck,
    note: "Матриця ролей",
  },
  {
    href: ROUTES.adminCodes,
    label: "Коди",
    icon: KeyRound,
    note: "Супер-код, ротація",
  },
  {
    href: ROUTES.adminAudit,
    label: "Аудит",
    icon: ScrollText,
    note: "Операційні події",
  },
  {
    href: ROUTES.adminAnalytics,
    label: "Аналітика",
    icon: BarChart3,
    note: "Поглиблений зріз даних",
  },
  {
    href: ROUTES.adminProjectPage,
    label: "Сторінка проєкту",
    icon: Blocks,
    note: "Builder для публічної сторінки",
  },
  {
    href: ROUTES.adminHelp,
    label: "Довідка",
    icon: HelpCircle,
    note: "Керівництво адміна",
  },
] as const;

interface AdminSidebarNavProps {
  userDisplayName?: string;
}

export function AdminSidebarNav({ userDisplayName }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ""}`}
    >
      <div className={styles.brandBlock}>
        {!collapsed && (
          <>
            <span className={styles.brandEyebrow}>Law Analysis</span>
            <div className={styles.brandTitle}>Адмін</div>
          </>
        )}
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Розгорнути" : "Згорнути"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className={styles.navIcon} />
              {!collapsed && (
                <span className={styles.navText}>
                  <span className={styles.navLabel}>{item.label}</span>
                  <span className={styles.navNote}>{item.note}</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <Link
          href="/"
          className={styles.siteLink}
          title={collapsed ? "Публічний сайт" : undefined}
        >
          <ExternalLink size={14} />
          {!collapsed && <span>Публічний сайт</span>}
        </Link>
        {!collapsed && userDisplayName && (
          <span className={styles.userMeta}>{userDisplayName}</span>
        )}
      </div>
    </aside>
  );
}
