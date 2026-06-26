"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
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
  useSupervisorGroupAmendments,
  useReviewAmendment,
} from "@/hooks/useSupervisor";
import type { Amendment, AmendmentChangeType } from "@/types/legislator";
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

type FilterType = "all" | AmendmentChangeType;
type FilterStatus = "all" | "pending" | "approved" | "rejected";

function getChangeTypeLabel(type: AmendmentChangeType): string {
  if (type === "edit") return "Редагування";
  if (type === "add") return "Додавання";
  return "Видалення";
}

function ChangeBadge({ type }: { type: AmendmentChangeType }) {
  const cls =
    type === "edit"
      ? styles.badgeEdit
      : type === "add"
        ? styles.badgeAdd
        : styles.badgeDelete;
  return (
    <span className={`${styles.badge} ${cls}`}>{getChangeTypeLabel(type)}</span>
  );
}

function getAmendmentStatus(a: Amendment): FilterStatus {
  if (a.status === "approved") return "approved";
  if (a.status === "rejected") return "rejected";
  return "pending";
}

function getAuthorName(created_by: Amendment["created_by"]): string {
  if (typeof created_by === "object") return created_by.fullName;
  return created_by;
}

interface AmendmentRowProps {
  amendment: Amendment;
  isOpen: boolean;
  onToggle: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isReviewing: boolean;
}

function AmendmentRow({
  amendment: a,
  isOpen,
  onToggle,
  onApprove,
  onReject,
  isReviewing,
}: AmendmentRowProps) {
  const articleNum = a.context.article_num ?? "—";
  const articleTitle = a.context.article_title ?? "";
  const date = new Date(a.createdAt).toLocaleDateString("uk-UA");
  const author = getAuthorName(a.created_by);

  return (
    <div className={styles.amendmentCard}>
      <div
        className={`${styles.amendmentHeader} ${isOpen ? styles.amendmentHeaderOpen : ""}`}
        onClick={onToggle}
      >
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}
        />
        <span className={styles.amendmentMeta}>
          Стаття {articleNum}
          {articleTitle ? ` · ${articleTitle}` : ""}
        </span>
        <ChangeBadge type={a.change_type} />
        <span className={styles.amendmentAuthor}>{author}</span>
        <span className={styles.amendmentDate}>{date}</span>
        <span className={styles.toggleHint}>
          {isOpen ? "Згорнути" : "Розгорнути"}
        </span>
      </div>

      {isOpen && (
        <div className={styles.amendmentBody}>
          <div className={styles.diffGrid}>
            <div className={styles.diffOriginal}>
              <div className={styles.diffLabel}>Оригінальний текст</div>
              <div className={styles.diffText}>{a.original_text || "—"}</div>
            </div>
            <div className={styles.diffProposed}>
              <div className={styles.diffLabel}>Запропонований текст</div>
              <div className={styles.diffText}>{a.proposed_text || "—"}</div>
            </div>
          </div>
          {a.reason && (
            <p className={styles.reason}>
              <strong>Причина:</strong> {a.reason}
            </p>
          )}
          <div className={styles.amendActions}>
            <button
              type="button"
              className={styles.btnReject}
              disabled={isReviewing}
              onClick={() => onReject(a._id)}
            >
              Відхилити
            </button>
            <button
              type="button"
              className={styles.btnApprove}
              disabled={isReviewing}
              onClick={() => onApprove(a._id)}
            >
              Затвердити ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AmendmentsView() {
  const { data: amendments, isLoading, error } = useSupervisorGroupAmendments();
  const reviewMutation = useReviewAmendment();
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setReviewingId(id);
    try {
      await reviewMutation.mutateAsync({ id, action: "approve" });
    } finally {
      setReviewingId(null);
    }
  };
  const handleReject = async (id: string) => {
    setReviewingId(id);
    try {
      await reviewMutation.mutateAsync({ id, action: "reject" });
    } finally {
      setReviewingId(null);
    }
  };

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const list = amendments ?? [];

  const filtered = list.filter((a) => {
    if (filterType !== "all" && a.change_type !== filterType) return false;
    if (filterStatus !== "all" && getAmendmentStatus(a) !== filterStatus)
      return false;
    if (search) {
      const q = search.toLowerCase();
      const lawTitle =
        typeof a.law_id === "object" ? a.law_id.title.toLowerCase() : "";
      const article = (a.context.article_num ?? "").toLowerCase();
      const articleTitle = (a.context.article_title ?? "").toLowerCase();
      if (
        !lawTitle.includes(q) &&
        !article.includes(q) &&
        !articleTitle.includes(q)
      ) {
        return false;
      }
    }
    return true;
  });

  const pendingCount = list.filter(
    (a) => getAmendmentStatus(a) === "pending",
  ).length;
  const approvedCount = list.filter(
    (a) => getAmendmentStatus(a) === "approved",
  ).length;

  if (isLoading) {
    return (
      <div className={styles.page}>
        <p style={{ color: "var(--color-smoke)", padding: "40px 0" }}>
          Завантаження...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <p style={{ color: "#f39b9b", padding: "40px 0" }}>
          Помилка завантаження
        </p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>SUPERVISOR · ПОПРАВКИ</span>
            <h1
              className={styles.sectionTitle}
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}
            >
              Поправки учасників
            </h1>
          </div>
        </div>

        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>На розгляді</p>
            <strong className={styles.kpiValue}>{pendingCount}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Затверджено</p>
            <strong className={styles.kpiValue}>{approvedCount}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Всього поправок</p>
            <strong className={styles.kpiValue}>{list.length}</strong>
          </div>
        </div>
      </section>

      {/* FILTERS + LIST */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.filtersRow}>
          <select
            className={styles.filterSelect}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
          >
            <option value="all">Всі типи</option>
            <option value="edit">Редагування</option>
            <option value="add">Додавання</option>
            <option value="delete">Видалення</option>
          </select>

          <select
            className={styles.filterSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          >
            <option value="all">Всі статуси</option>
            <option value="pending">На розгляді</option>
            <option value="approved">Затверджено</option>
            <option value="rejected">Відхилено</option>
          </select>

          <input
            className={styles.filterInput}
            type="text"
            placeholder="Пошук по закону / статті..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Поправок поки немає</p>
          </div>
        ) : (
          <div className={styles.amendmentList}>
            {filtered.map((a) => (
              <AmendmentRow
                key={a._id}
                amendment={a}
                isOpen={openId === a._id}
                onToggle={() => setOpenId(openId === a._id ? null : a._id)}
                onApprove={handleApprove}
                onReject={handleReject}
                isReviewing={reviewingId === a._id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function SupervisorAmendmentsPage() {
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
        <AmendmentsView />
      </main>
    </div>
  );
}
