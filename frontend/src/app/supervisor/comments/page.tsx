"use client";

import Link from "next/link";
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
import styles from "./page.module.scss";

// ─── Sidebar nav ───────────────────────────────────────────────────────────────

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

// ─── Sidebar ──────────────────────────────────────────────────────────────────

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

// ─── Comments view ────────────────────────────────────────────────────────────

function CommentsView() {
  return (
    <div className={styles.page}>
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>
              SUPERVISOR · КОМЕНТАРІ
            </span>
            <h1 className={styles.sectionTitle}>Коментарі учасників</h1>
          </div>
        </div>
        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Непрочитані</p>
            <strong className={styles.kpiValue}>—</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Всього</p>
            <strong className={styles.kpiValue}>—</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Приховано</p>
            <strong className={styles.kpiValue}>—</strong>
          </div>
        </div>
      </section>

      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.emptyState}>
          <MessagesSquare
            size={36}
            style={{ color: "rgba(74,128,212,0.44)" }}
          />
          <p style={{ color: "var(--color-smoke-light)", fontWeight: 600 }}>
            Коментарі учасників
          </p>
          <p
            style={{
              color: "var(--color-smoke)",
              fontSize: "0.875rem",
              marginTop: 8,
            }}
          >
            Функціонал перегляду та модерації коментарів учасників груп
            знаходиться в розробці.
          </p>
        </div>
      </section>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupervisorCommentsPage() {
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
        <CommentsView />
      </main>
    </div>
  );
}
