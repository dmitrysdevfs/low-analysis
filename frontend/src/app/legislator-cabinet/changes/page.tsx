"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Eye,
  FileText,
  History,
  MessageCircle,
  MessagesSquare,
  GitGraph,
  Network,
  PenLine,
  Radar,
  RefreshCcw,
  Scale,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { useMyChanges } from "@/hooks/useChanges";
import type { ChangeEntry } from "@/lib/api/changes";
import styles from "./page.module.scss";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabFilter = "all" | ChangeEntry["type"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} хв тому`;
  if (hours < 24) return `${hours} год тому`;
  if (days === 1) return "вчора";
  return `${days} дн тому`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  { icon: <Eye size={20} />, label: "Нагляд", href: ROUTES.legislatorCabinet },
  {
    icon: <Users size={20} />,
    label: "Групи",
    href: ROUTES.legislatorCabinetGroups,
  },
  {
    icon: <FileText size={20} />,
    label: "Пропозиції",
    href: ROUTES.legislatorCabinetProposals,
  },
  {
    icon: <PenLine size={20} />,
    label: "Поправки",
    href: ROUTES.legislatorCabinetAmendments,
  },
  {
    icon: <Zap size={20} />,
    label: "Форки",
    href: ROUTES.legislatorCabinetForks,
  },
  { icon: <Scale size={20} />, label: "Закони", href: ROUTES.laws },
  { icon: <Network size={20} />, label: "Граф", href: ROUTES.graph },
  {
    icon: <GitGraph size={20} />,
    label: "Пропоз. Граф",
    href: ROUTES.graphProposals,
  },
  {
    icon: <Radar size={20} />,
    label: "Пропоз. Радіант",
    href: ROUTES.radiantProposals,
  },
  {
    icon: <RefreshCcw size={20} />,
    label: "Зміни",
    href: ROUTES.legislatorCabinetChanges,
  },
  {
    icon: <MessagesSquare size={20} />,
    label: "Коментарі",
    href: ROUTES.legislatorCabinetComments,
  },
  {
    icon: <Shield size={20} />,
    label: "Правила",
    href: ROUTES.legislatorCabinetRules,
  },
  {
    icon: <BarChart3 size={20} />,
    label: "Аналітика",
    href: ROUTES.legislatorCabinetAnalytics,
  },
  {
    icon: <History size={20} />,
    label: "Історія",
    href: ROUTES.legislatorCabinetHistory,
  },
  {
    icon: <MessageCircle size={20} />,
    label: "Чат",
    href: ROUTES.legislatorCabinetChat,
  },
];

// ─── Sidebar component ────────────────────────────────────────────────────────

function LegislatorSidebar({
  initials,
  name,
  role,
}: {
  initials: string;
  name: string;
  role: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={styles.sidebar}>
      <div className={styles.sidebarTop}>
        <Link href={ROUTES.home} className={styles.logoBlock}>
          <span className={styles.logoIcon}>L</span>
          <div className={styles.logoMeta}>
            <span>LEGAL</span>
            <span>HUB</span>
          </div>
        </Link>
        <ul className={styles.navList}>
          {SIDEBAR_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  title={item.label}
                >
                  {item.icon}
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
          <span className={styles.userRole}>{role}</span>
        </div>
      </div>
    </nav>
  );
}

// ─── Badge components ─────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: ChangeEntry["type"] }) {
  const labels: Record<ChangeEntry["type"], string> = {
    fork: "Форк",
    proposal: "Пропозиція",
    amendment: "Поправка",
  };
  const cls =
    type === "fork"
      ? styles.badgeFork
      : type === "proposal"
        ? styles.badgeProposal
        : styles.badgeAmendment;

  return <span className={`${styles.badge} ${cls}`}>{labels[type]}</span>;
}

function ActionBadge({ status }: { status: ChangeEntry["status"] }) {
  if (!status) return null;
  const map: Record<string, { cls: string; label: string }> = {
    approved: { cls: styles.badgeApproved, label: "схвалено" },
    rejected: { cls: styles.badgeRejected, label: "відхилено" },
    review: { cls: styles.badgeSubmitted, label: "на розгляді" },
    draft: { cls: styles.badgeCreated, label: "чернетка" },
  };
  const item = map[status];
  if (!item) return null;
  return <span className={`${styles.badge} ${item.cls}`}>{item.label}</span>;
}

// ─── Timeline dot ─────────────────────────────────────────────────────────────

function TimelineDot({ type }: { type: ChangeEntry["type"] }) {
  const cls =
    type === "fork"
      ? styles.dotFork
      : type === "proposal"
        ? styles.dotProposal
        : styles.dotAmendment;

  return <span className={`${styles.timelineDot} ${cls}`} />;
}

// ─── Changes content ──────────────────────────────────────────────────────────

function MyChangesContent() {
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const { data: changes = [], isLoading } = useMyChanges();

  const totalCount = changes.length;
  const approvedCount = changes.filter((c) => c.status === "approved").length;
  const reviewCount = changes.filter((c) => c.status === "review").length;

  const filtered =
    activeTab === "all" ? changes : changes.filter((c) => c.type === activeTab);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: "all", label: "Всі" },
    { key: "fork", label: "Форки" },
    { key: "proposal", label: "Пропозиції" },
    { key: "amendment", label: "Поправки" },
  ];

  return (
    <div className={styles.mainContent}>
      {/* HERO */}
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ЗМІНИ</span>
      <div className={styles.heroRow}>
        <h1 className={styles.pageTitle}>Мої зміни</h1>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatValue}>{totalCount}</span>
            <span className={styles.heroStatLabel}>всього</span>
          </div>
          <div className={styles.heroStat}>
            <span className={`${styles.heroStatValue} ${styles.heroStatGreen}`}>
              {approvedCount}
            </span>
            <span className={styles.heroStatLabel}>схвалено</span>
          </div>
          <div className={styles.heroStat}>
            <span
              className={`${styles.heroStatValue} ${styles.heroStatOrange}`}
            >
              {reviewCount}
            </span>
            <span className={styles.heroStatLabel}>на розгляді</span>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className={styles.tabRow}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TIMELINE */}
      {isLoading ? (
        <p style={{ color: "var(--color-smoke)", padding: "40px 0" }}>
          Завантаження...
        </p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>Змін не знайдено</div>
      ) : (
        <div className={styles.timeline}>
          {filtered.map((entry, idx) => (
            <div key={entry._id} className={styles.timelineItem}>
              <TimelineDot type={entry.type} />
              {idx < filtered.length - 1 && (
                <span className={styles.timelineLine} />
              )}

              <div className={styles.timelineCard}>
                <div className={styles.timelineMeta}>
                  <TypeBadge type={entry.type} />
                  <ActionBadge status={entry.status} />
                </div>

                <h3 className={styles.timelineTitle}>
                  <Link
                    href={`/legislator-cabinet/changes/${entry._id}?type=${entry.type}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {entry.title}
                  </Link>
                </h3>
                <p className={styles.timelineLaw}>
                  {entry.lawCode} · {entry.lawTitle}
                </p>

                <div className={styles.timelineMeta}>
                  <span className={styles.timelineTime}>
                    {formatDate(entry.createdAt)} ·{" "}
                    {relativeTime(entry.createdAt)}
                  </span>
                </div>

                <Link
                  href={`/legislator-cabinet/changes/${entry._id}?type=${entry.type}`}
                  className={styles.compareLink}
                >
                  Переглянути деталі →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LegislatorChangesPage() {
  const { user, isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <div className={styles.workspace}>
        <div className={styles.sidebar} />
        <main className={styles.mainScroll}>
          <div className={styles.mainContent}>
            <p style={{ color: "var(--color-smoke)", padding: "40px 0" }}>
              Завантаження...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!isLegislator && !isSupervisor && !isAdmin) {
    return (
      <div className={styles.workspace}>
        <main className={styles.mainScroll}>
          <div className={styles.mainContent}>
            <p style={{ color: "#f39b9b", padding: "40px 0" }}>
              Доступ заборонено
            </p>
          </div>
        </main>
      </div>
    );
  }

  const initials = (user?.displayName ?? "ЗТ").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin
    ? "Адміністратор"
    : isSupervisor
      ? "Супервайзер"
      : "Законотворець";

  return (
    <div className={styles.workspace}>
      <LegislatorSidebar
        initials={initials}
        name={user?.displayName ?? "Законотворець"}
        role={roleLabel}
      />
      <main className={styles.mainScroll}>
        <MyChangesContent />
      </main>
    </div>
  );
}
