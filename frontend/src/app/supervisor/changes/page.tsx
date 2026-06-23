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
import { useSupervisorChanges } from "@/hooks/useChanges";
import type { ChangeEntry } from "@/lib/api/changes";
import styles from "./page.module.scss";

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

function typeName(type: ChangeEntry["type"]): string {
  switch (type) {
    case "fork":
      return "форк";
    case "proposal":
      return "пропозиція";
    case "amendment":
      return "поправка";
  }
}

// ─── Sidebar nav ──────────────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  {
    icon: <Eye size={20} />,
    label: "Нагляд",
    href: ROUTES.supervisorDashboard,
  },
  { icon: <Users size={20} />, label: "Групи", href: ROUTES.supervisorGroups },
  {
    icon: <FileText size={20} />,
    label: "Пропозиції",
    href: ROUTES.supervisorProposals,
  },
  {
    icon: <PenLine size={20} />,
    label: "Поправки",
    href: ROUTES.supervisorAmendments,
  },
  { icon: <Zap size={20} />, label: "Форки", href: ROUTES.supervisorForks },
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
    href: ROUTES.supervisorChanges,
  },
  {
    icon: <MessagesSquare size={20} />,
    label: "Коментарі",
    href: ROUTES.supervisorComments,
  },
  {
    icon: <Shield size={20} />,
    label: "Правила",
    href: ROUTES.supervisorRules,
  },
  {
    icon: <BarChart3 size={20} />,
    label: "Аналітика",
    href: ROUTES.supervisorAnalytics,
  },
  {
    icon: <History size={20} />,
    label: "Історія",
    href: ROUTES.supervisorHistory,
  },
  {
    icon: <MessageCircle size={20} />,
    label: "Чат",
    href: ROUTES.supervisorChat,
  },
];

// ─── Sidebar component ────────────────────────────────────────────────────────

function SupervisorSidebar({
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
            const isActive =
              pathname.startsWith(item.href) &&
              (item.href !== ROUTES.laws || pathname === ROUTES.laws);
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

// ─── Access gate ──────────────────────────────────────────────────────────────

function AccessGate() {
  return (
    <div className={styles.accessPage}>
      <div className={styles.gate}>
        <span className="eyebrow">Supervisor Access</span>
        <h1 className={styles.gateTitle}>Доступ лише для ролі Supervisor</h1>
        <p className={styles.gateText}>
          Цей workspace призначений для викладачів, менторів та керівників
          робочих груп.
        </p>
        <div className={styles.gateActions}>
          <Link href={ROUTES.rolesSupervisor} className="btn btn-primary">
            Про роль Supervisor
          </Link>
          <Link href={ROUTES.help} className="btn btn-outline">
            Як отримати доступ
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Feed icon ────────────────────────────────────────────────────────────────

function FeedIcon({ type }: { type: ChangeEntry["type"] }) {
  const iconClass =
    type === "fork"
      ? styles.feedIconFork
      : type === "proposal"
        ? styles.feedIconProposal
        : styles.feedIconAmendment;

  return (
    <div className={`${styles.feedIconCircle} ${iconClass}`}>
      {type === "fork" && <Zap size={16} />}
      {type === "proposal" && <FileText size={16} />}
      {type === "amendment" && <PenLine size={16} />}
    </div>
  );
}

// ─── Action badge ─────────────────────────────────────────────────────────────

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

// ─── Changes view ─────────────────────────────────────────────────────────────

function ChangesView() {
  const [filterType, setFilterType] = useState<"all" | ChangeEntry["type"]>(
    "all",
  );
  const [filterLaw, setFilterLaw] = useState("all");
  const [search, setSearch] = useState("");
  const { data: changes = [], isLoading } = useSupervisorChanges();

  const uniqueLaws = Array.from(new Set(changes.map((c) => c.lawTitle)));

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  const todayCount = changes.filter((c) => {
    const diff = now - new Date(c.createdAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  }).length;

  const weekCount = changes.filter((c) => {
    const diff = now - new Date(c.createdAt).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const filtered = changes.filter((c) => {
    if (filterType !== "all" && c.type !== filterType) return false;
    if (filterLaw !== "all" && c.lawTitle !== filterLaw) return false;
    if (
      search.trim() &&
      !c.title.toLowerCase().includes(search.toLowerCase()) &&
      !(c.authorName ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>SUPERVISOR · ЗМІНИ</span>
            <h1
              className={styles.sectionTitle}
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}
            >
              Стрічка змін
            </h1>
          </div>
          <button
            type="button"
            className={styles.exportBtn}
            onClick={() => console.log("Export CSV", filtered)}
          >
            ↓ CSV
          </button>
        </div>

        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Сьогодні</p>
            <strong className={styles.kpiValue}>{todayCount}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>За тиждень</p>
            <strong className={styles.kpiValue}>{weekCount}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Всього</p>
            <strong className={styles.kpiValue}>{changes.length}</strong>
          </div>
        </div>
      </section>

      {/* FEED */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.filtersRow}>
          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
          >
            <option value="all">Усі типи</option>
            <option value="fork">Форки</option>
            <option value="proposal">Пропозиції</option>
            <option value="amendment">Поправки</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterLaw}
            onChange={(e) => setFilterLaw(e.target.value)}
          >
            <option value="all">Усі закони</option>
            {uniqueLaws.map((law) => (
              <option key={law} value={law}>
                {law}
              </option>
            ))}
          </select>

          <input
            className={styles.filterInput}
            type="text"
            placeholder="Пошук за назвою або автором..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p style={{ color: "var(--color-smoke)", padding: "40px 0" }}>
            Завантаження...
          </p>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>Змін не знайдено</div>
        ) : (
          <div className={styles.feedList}>
            {filtered.map((entry) => (
              <article key={entry._id} className={styles.feedCard}>
                <FeedIcon type={entry.type} />

                <div className={styles.feedBody}>
                  <p style={{ margin: 0 }}>
                    {entry.authorName && (
                      <>
                        <span className={styles.feedAuthor}>
                          {entry.authorName}
                        </span>
                        {" · "}
                      </>
                    )}
                    <span
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {typeName(entry.type)}
                    </span>
                  </p>
                  <p className={styles.feedTitle}>
                    <Link
                      href={`/supervisor/changes/${entry._id}?type=${entry.type}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {entry.title}
                    </Link>
                  </p>
                  <p className={styles.feedMeta}>
                    {entry.lawCode} · {entry.lawTitle}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6,
                    flexShrink: 0,
                  }}
                >
                  <span className={styles.feedTime}>
                    {relativeTime(entry.createdAt)}
                  </span>
                  <ActionBadge status={entry.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupervisorChangesPage() {
  const { user, isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <div className={styles.workspace}>
        <div className={styles.sidebar} />
        <main className={styles.mainScroll} />
      </div>
    );
  }

  if (!isSupervisor && !isAdmin) return <AccessGate />;

  const initials = (user?.displayName ?? "СВ").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin ? "Адміністратор" : "Супервайзер";

  return (
    <div className={styles.workspace}>
      <SupervisorSidebar
        initials={initials}
        name={user?.displayName ?? "Supervisor"}
        role={roleLabel}
      />
      <main className={styles.mainScroll}>
        <ChangesView />
      </main>
    </div>
  );
}
