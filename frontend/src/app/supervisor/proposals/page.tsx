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
import {
  useSupervisorGroupProposals,
  useReviewProposal,
} from "@/hooks/useSupervisor";
import type { Proposal, ProposalStatus } from "@/types/legislator";
import { notify } from "@/lib/toast";
import styles from "./page.module.scss";

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
          <Link href={ROUTES.rolesSupervisorRequest} className="btn btn-primary">
            Подати заявку
          </Link>
          <Link href={ROUTES.rolesSupervisor} className="btn btn-outline">
            Про роль Supervisor
          </Link>
        </div>
      </div>
    </div>
  );
}

function getLawTitle(law_id: Proposal["law_id"]): string {
  if (typeof law_id === "object" && law_id !== null) return law_id.title;
  return law_id;
}

function getLawId(law_id: Proposal["law_id"]): string {
  if (typeof law_id === "object" && law_id !== null) return law_id._id;
  return law_id;
}

function getAuthorName(created_by: Proposal["created_by"]): string {
  if (typeof created_by === "object" && created_by !== null)
    return created_by.fullName;
  return created_by;
}

const STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: "Чернетка",
  review: "На розгляді",
  approved: "Схвалено",
  rejected: "Відхилено",
};

const STATUS_BADGE_CLASS: Record<ProposalStatus, string> = {
  draft: styles.badgeDraft,
  review: styles.badgeReview,
  approved: styles.badgeApproved,
  rejected: styles.badgeRejected,
};

function ProposalsView() {
  const { data: proposals, isLoading } = useSupervisorGroupProposals();
  const reviewMutation = useReviewProposal();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const handleReview = async (id: string, action: "approve" | "reject") => {
    setReviewingId(id);
    try {
      await reviewMutation.mutateAsync({ id, action });
      notify.success(action === "approve" ? "Пропозицію схвалено" : "Пропозицію відхилено");
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося виконати дію",
      );
    } finally {
      setReviewingId(null);
    }
  };

  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "all">(
    "all",
  );
  const [search, setSearch] = useState("");

  const list = proposals ?? [];

  const pendingCount = list.filter((p) => p.status === "review").length;
  const approvedCount = list.filter((p) => p.status === "approved").length;
  const rejectedCount = list.filter((p) => p.status === "rejected").length;

  const filtered = list.filter((p) => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchSearch =
      search.trim() === "" ||
      p.title.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>
              SUPERVISOR · ПРОПОЗИЦІЇ
            </span>
            <h1
              className={styles.sectionTitle}
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}
            >
              Пропозиції учасників
            </h1>
          </div>
        </div>

        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>На розгляді</p>
            <strong className={styles.kpiValue}>{pendingCount}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Схвалено</p>
            <strong className={styles.kpiValue}>{approvedCount}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Відхилено</p>
            <strong className={styles.kpiValue}>{rejectedCount}</strong>
          </div>
        </div>
      </section>

      {/* TABLE */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.filtersRow}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ProposalStatus | "all")
            }
          >
            <option value="all">Всі статуси</option>
            <option value="draft">Чернетка</option>
            <option value="review">На розгляді</option>
            <option value="approved">Схвалено</option>
            <option value="rejected">Відхилено</option>
          </select>
          <input
            type="text"
            className={styles.filterInput}
            placeholder="Пошук по назві..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <p className={styles.emptyState}>Завантаження...</p>
        ) : filtered.length === 0 ? (
          <p className={styles.emptyState}>Пропозицій поки немає</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Назва</th>
                <th className={styles.th}>Автор</th>
                <th className={styles.th}>Закон</th>
                <th className={styles.th}>Статус</th>
                <th className={styles.th}>Дата</th>
                <th className={styles.th}>Дії</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id}>
                  <td className={styles.td}>{p.title}</td>
                  <td className={styles.td}>{getAuthorName(p.created_by)}</td>
                  <td className={styles.td}>{getLawTitle(p.law_id)}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${STATUS_BADGE_CLASS[p.status]}`}
                    >
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className={styles.td}>
                    {new Date(p.createdAt).toLocaleDateString("uk-UA")}
                  </td>
                  <td
                    className={styles.td}
                    style={{ display: "flex", gap: 6, alignItems: "center" }}
                  >
                    <Link
                      href={`/laws/${getLawId(p.law_id)}`}
                      className={styles.btnSm}
                    >
                      Переглянути
                    </Link>
                    {p.status === "review" && (
                      <>
                        <button
                          type="button"
                          className={styles.btnSm}
                          style={{
                            background: "rgba(82,183,136,0.15)",
                            color: "#52b788",
                            border: "1px solid rgba(82,183,136,0.3)",
                          }}
                          disabled={reviewingId === p._id}
                          onClick={() => handleReview(p._id, "approve")}
                        >
                          ✓ Схвалити
                        </button>
                        <button
                          type="button"
                          className={styles.btnSm}
                          style={{
                            background: "rgba(233,119,75,0.15)",
                            color: "#e9774b",
                            border: "1px solid rgba(233,119,75,0.3)",
                          }}
                          disabled={reviewingId === p._id}
                          onClick={() => handleReview(p._id, "reject")}
                        >
                          ✕ Відхилити
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export default function SupervisorProposalsPage() {
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
        <ProposalsView />
      </main>
    </div>
  );
}
