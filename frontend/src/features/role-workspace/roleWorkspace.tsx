"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Eye,
  FileText,
  GitGraph,
  History,
  MessageCircle,
  MessagesSquare,
  Network,
  PenLine,
  Radar,
  RefreshCcw,
  Scale,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import styles from "./roleWorkspace.module.scss";

export type RoleWorkspaceKind = "supervisor" | "legislator";

type NavBlueprint = {
  icon: LucideIcon;
  label: string;
  key:
    | "oversight"
    | "groups"
    | "proposals"
    | "amendments"
    | "forks"
    | "laws"
    | "graph"
    | "graphProposals"
    | "radiantProposals"
    | "changes"
    | "comments"
    | "rules"
    | "analytics"
    | "history"
    | "chat";
};

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const SIDEBAR_BLUEPRINT: NavBlueprint[] = [
  { key: "oversight", label: "Нагляд", icon: Eye },
  { key: "groups", label: "Групи", icon: Users },
  { key: "proposals", label: "Пропозиції", icon: FileText },
  { key: "amendments", label: "Поправки", icon: PenLine },
  { key: "forks", label: "Форки", icon: Zap },
  { key: "laws", label: "Закони", icon: Scale },
  { key: "graph", label: "Граф", icon: Network },
  { key: "graphProposals", label: "Пропоз. Граф", icon: GitGraph },
  { key: "radiantProposals", label: "Пропоз. Радіант", icon: Radar },
  { key: "changes", label: "Зміни", icon: RefreshCcw },
  { key: "comments", label: "Коментарі", icon: MessagesSquare },
  { key: "rules", label: "Правила", icon: Shield },
  { key: "analytics", label: "Аналітика", icon: BarChart3 },
  { key: "history", label: "Історія", icon: History },
  { key: "chat", label: "Чат", icon: MessageCircle },
];

const NAV_ROUTES: Record<
  RoleWorkspaceKind,
  Record<NavBlueprint["key"], string>
> = {
  supervisor: {
    oversight: ROUTES.supervisorDashboard,
    groups: ROUTES.supervisorGroups,
    proposals: ROUTES.supervisorProposals,
    amendments: ROUTES.supervisorAmendments,
    forks: ROUTES.supervisorForks,
    laws: ROUTES.laws,
    graph: ROUTES.graph,
    graphProposals: ROUTES.graphProposals,
    radiantProposals: ROUTES.radiantProposals,
    changes: ROUTES.supervisorChanges,
    comments: ROUTES.supervisorComments,
    rules: ROUTES.supervisorRules,
    analytics: ROUTES.supervisorAnalytics,
    history: ROUTES.supervisorHistory,
    chat: ROUTES.supervisorChat,
  },
  legislator: {
    oversight: ROUTES.legislatorCabinet,
    groups: ROUTES.legislatorCabinetGroups,
    proposals: ROUTES.legislatorCabinetProposals,
    amendments: ROUTES.legislatorCabinetAmendments,
    forks: ROUTES.legislatorCabinetForks,
    laws: ROUTES.laws,
    graph: ROUTES.graph,
    graphProposals: ROUTES.graphProposals,
    radiantProposals: ROUTES.radiantProposals,
    changes: ROUTES.legislatorCabinetChanges,
    comments: ROUTES.legislatorCabinetComments,
    rules: ROUTES.legislatorCabinetRules,
    analytics: ROUTES.legislatorCabinetAnalytics,
    history: ROUTES.legislatorCabinetHistory,
    chat: ROUTES.legislatorCabinetChat,
  },
};

function getSidebarNav(role: RoleWorkspaceKind): NavItem[] {
  return SIDEBAR_BLUEPRINT.map((item) => ({
    ...item,
    href: NAV_ROUTES[role][item.key],
  }));
}

function isActivePath(pathname: string, href: string) {
  const pureHref = href.split("#")[0];
  return pathname === pureHref || pathname.startsWith(`${pureHref}/`);
}

export function RoleWorkspace({
  role,
  initials,
  name,
  roleLabel,
  children,
}: {
  role: RoleWorkspaceKind;
  initials: string;
  name: string;
  roleLabel: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.workspace}>
      <RoleSidebar
        role={role}
        initials={initials}
        name={name}
        roleLabel={roleLabel}
      />
      <main className={styles.mainScroll}>{children}</main>
    </div>
  );
}

export function RoleHydrationShell() {
  return (
    <div className={styles.workspace}>
      <div className={styles.sidebar} />
      <main className={styles.mainScroll} />
    </div>
  );
}

export function RoleAccessGate({
  eyebrow,
  title,
  text,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  text: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <div className={styles.accessPage}>
      <div className={`${styles.gate} ${styles.panel}`}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.gateTitle}>{title}</h1>
        <p className={styles.gateText}>{text}</p>
        <div className={styles.gateActions}>
          <Link href={primaryHref} className="btn btn-primary">
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className="btn btn-outline">
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

function RoleSidebar({
  role,
  initials,
  name,
  roleLabel,
}: {
  role: RoleWorkspaceKind;
  initials: string;
  name: string;
  roleLabel: string;
}) {
  const pathname = usePathname();
  const items = getSidebarNav(role);

  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <Link href={ROUTES.home} className={styles.logoBlock}>
          <span className={styles.logoIcon}>L</span>
          <div className={styles.logoMeta}>
            <span>LAW</span>
            <span>ANALYSIS</span>
          </div>
        </Link>

        <ul className={styles.navList}>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = isActivePath(pathname, item.href);

            return (
              <li key={`${role}-${item.label}`}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  title={item.label}
                >
                  <Icon size={20} />
                  <span className={styles.navLabel}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.sidebarBottom}>
        <div className={styles.userAvatar}>{initials}</div>
        <div className={styles.userMeta}>
          <span className={styles.userName}>{name}</span>
          <span className={styles.userRole}>{roleLabel}</span>
        </div>
      </div>
    </nav>
  );
}

export function formatUkDate(value: string) {
  return new Date(value).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatUkTime(value: string) {
  return new Date(value).toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
