"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Eye,
  FileText,
  FolderKanban,
  GraduationCap,
  History,
  MessageCircle,
  MessagesSquare,
  GitGraph,
  Network,
  PenLine,
  Plus,
  Radar,
  RefreshCcw,
  Scale,
  Search,
  Settings,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { ForkDiffModal } from "@/components/fork/ForkDiffModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  useCreateSupervisorGroup,
  useSupervisorDashboard,
} from "@/hooks/useSupervisor";
import { getJson, requestJson } from "@/lib/api/_client";
import type { LawChangeProposal } from "@/types/law-change.types";
import { notify } from "@/lib/toast";
import styles from "./page.module.scss";

// ── Expired proposals helpers ─────────────────────────────────────────────────

type ExpiredResponse =
  | LawChangeProposal[]
  | { proposals: LawChangeProposal[]; total: number };

function extractExpired(data: ExpiredResponse): LawChangeProposal[] {
  if (Array.isArray(data)) return data;
  return data.proposals;
}

function fetchExpiredProposals() {
  return getJson<ExpiredResponse>("/law-change/proposals?status=expired");
}

function doReviewProposal(id: string, action: "approve" | "reject") {
  return requestJson<LawChangeProposal>(
    `/law-change/proposals/${id}/review`,
    "POST",
    { action },
  );
}

function useExpiredProposals() {
  return useQuery({
    queryKey: ["law-change-proposals-expired"],
    queryFn: fetchExpiredProposals,
    staleTime: 30_000,
    select: extractExpired,
  });
}

function useReviewProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "approve" | "reject";
    }) => doReviewProposal(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["law-change-proposals-expired"],
      });
    },
  });
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  edit: "Редагування",
  add: "Додавання",
  delete: "Видалення",
  move: "Переміщення",
};

function formatRelativeDate(value: string | null) {
  if (!value) return "Без активності";
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays === 0)
    return `Сьогодні · ${date.toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return "Вчора";
  if (diffDays < 7) return `${diffDays} дн. тому`;
  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatFullDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusTone(input: {
  draftCount: number;
  reviewCount: number;
  approvedCount: number;
  rejectedCount: number;
  changeCount?: number;
}) {
  const total =
    input.changeCount ??
    input.draftCount +
      input.reviewCount +
      input.approvedCount +
      input.rejectedCount;
  if (total === 0) return { label: "Під наглядом", tone: "neutral" as const };
  if (input.reviewCount > 0)
    return { label: "Чекає розгляду", tone: "warning" as const };
  if (input.draftCount > 0 && input.approvedCount === 0)
    return { label: "Є чернетки", tone: "draft" as const };
  if (input.approvedCount > 0 && input.rejectedCount === 0)
    return { label: "Позитивний рух", tone: "good" as const };
  if (input.rejectedCount > 0 && input.approvedCount === 0)
    return { label: "Потребує уваги", tone: "danger" as const };
  return { label: "Змішаний статус", tone: "mixed" as const };
}

const SIDEBAR_NAV = [
  {
    icon: <Eye size={20} />,
    label: "Нагляд",
    href: ROUTES.supervisorDashboard,
    active: true,
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
          {SIDEBAR_NAV.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className={`${styles.navItem} ${item.active ? styles.navItemActive : ""}`}
                title={item.label}
              >
                {item.icon}
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
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
          робочих груп. Тут зібрано моніторинг студентських груп, активність по
          законах та контроль змін.
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

function DashboardSkeleton() {
  return (
    <div className={styles.workspace}>
      <div className={styles.sidebar} />
      <main className={styles.mainScroll}>
        <div className={styles.page}>
          <div className={`${styles.hero} ${styles.skeletonBlock}`} />
          <div className={styles.kpiGrid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`${styles.kpiCard} ${styles.skeletonBlock}`}
              />
            ))}
          </div>
          <div className={styles.twoCol}>
            <div className={`${styles.sectionPanel} ${styles.skeletonBlock}`} />
            <div className={`${styles.sectionPanel} ${styles.skeletonBlock}`} />
          </div>
          <div className={`${styles.sectionPanel} ${styles.skeletonBlock}`} />
        </div>
      </main>
    </div>
  );
}

export default function SupervisorDashboardPage() {
  const { user, isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) return <DashboardSkeleton />;
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
        <SupervisorDashboardView />
      </main>
    </div>
  );
}

// ── Expired Proposals Section ─────────────────────────────────────────────────

function ExpiredProposalsSection() {
  const { data: proposals, isLoading, error } = useExpiredProposals();
  const review = useReviewProposal();

  async function handleReview(id: string, action: "approve" | "reject") {
    try {
      await review.mutateAsync({ id, action });
      notify.success(action === "approve" ? "Затверджено" : "Відхилено");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Помилка перегляду");
    }
  }

  return (
    <section className={`${styles.sectionPanel} panel`}>
      <div className={styles.sectionHeader}>
        <div>
          <span className={styles.sectionEyebrow}>ПРОСТРОЧЕНІ ГОЛОСУВАННЯ</span>
          <h2 className={styles.sectionTitle}>Прострочені голосування</h2>
        </div>
        {proposals && proposals.length > 0 && (
          <span className={styles.expiredCount}>
            <AlertTriangle size={14} />
            {proposals.length}
          </span>
        )}
      </div>

      {isLoading && (
        <div className={styles.emptyState}>
          <RefreshCcw size={22} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Завантаження...</p>
        </div>
      )}

      {error && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>Не вдалося завантажити дані</p>
        </div>
      )}

      {!isLoading && !error && (!proposals || proposals.length === 0) && (
        <div className={styles.emptyState}>
          <CheckCircle2 size={28} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Прострочених голосувань немає</p>
          <span className={styles.emptyDesc}>
            Усі пропозиції розглянуті або знаходяться в активному голосуванні.
          </span>
        </div>
      )}

      {!isLoading && proposals && proposals.length > 0 && (
        <div className={styles.expiredList}>
          {proposals.map((proposal) => (
            <article key={proposal._id} className={styles.expiredItem}>
              <div className={styles.expiredItemHead}>
                <div className={styles.expiredItemMeta}>
                  <span className={styles.expiredTypeBadge}>
                    {CHANGE_TYPE_LABELS[proposal.change_type] ??
                      proposal.change_type}
                  </span>
                  <span className={styles.expiredAuthor}>
                    {proposal.author_display_name}
                  </span>
                  {proposal.voting_deadline && (
                    <span className={styles.expiredDeadline}>
                      <Clock3 size={12} />
                      {new Date(proposal.voting_deadline).toLocaleDateString(
                        "uk-UA",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </span>
                  )}
                </div>
                <div className={styles.expiredActions}>
                  <button
                    type="button"
                    className={styles.expiredBtnApprove}
                    disabled={review.isPending}
                    onClick={() => handleReview(proposal._id, "approve")}
                  >
                    Затвердити ✓
                  </button>
                  <button
                    type="button"
                    className={styles.expiredBtnReject}
                    disabled={review.isPending}
                    onClick={() => handleReview(proposal._id, "reject")}
                  >
                    Відхилити ✗
                  </button>
                </div>
              </div>
              {proposal.proposed_text && (
                <p className={styles.expiredText}>
                  {proposal.proposed_text.slice(0, 200)}
                  {proposal.proposed_text.length > 200 ? "…" : ""}
                </p>
              )}
              {proposal.reason && (
                <p className={styles.expiredReason}>
                  <span>Причина:</span> {proposal.reason}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SupervisorDashboardView() {
  const { data, isLoading, error } = useSupervisorDashboard();
  const createGroup = useCreateSupervisorGroup();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCourse, setGroupCourse] = useState("");
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [diffForkId, setDiffForkId] = useState<string | null>(null);

  const filteredMonitoring = useMemo(() => {
    const rows = data?.groupMonitoring ?? [];
    return rows.filter((row) => {
      if (groupFilter !== "all" && row.groupId !== groupFilter) return false;
      const query = search.trim().toLowerCase();
      if (!query) return true;
      return [row.groupName, row.course, row.law?.title, row.law?.code]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query));
    });
  }, [data?.groupMonitoring, groupFilter, search]);

  const filteredStudents = useMemo(() => {
    const rows = data?.studentActivity ?? [];
    return rows.filter((student) => {
      if (groupFilter === "all") return true;
      return student.groups.some((g) => g.id === groupFilter);
    });
  }, [data?.studentActivity, groupFilter]);

  const filteredRecent = useMemo(() => {
    const rows = data?.recentActivity ?? [];
    return rows.filter((item) => {
      if (groupFilter === "all") return true;
      return item.groupIds.includes(groupFilter);
    });
  }, [data?.recentActivity, groupFilter]);

  const highlightedGroups = useMemo(() => {
    return [...(data?.groupHighlights ?? [])].sort((a, b) => {
      if (b.changeCount !== a.changeCount) return b.changeCount - a.changeCount;
      return b.memberCount - a.memberCount;
    });
  }, [data?.groupHighlights]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      await createGroup.mutateAsync({
        name: groupName.trim(),
        course: groupCourse.trim(),
      });
      notify.success("Групу створено");
      setGroupName("");
      setGroupCourse("");
      setShowCreateForm(false);
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося створити групу",
      );
    }
  };

  if (isLoading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={`${styles.errorState} panel`}>
          <span className="eyebrow">Supervisor API</span>
          <h1 className={styles.gateTitle}>Дашборд тимчасово недоступний</h1>
          <p className={styles.gateText}>
            Не вдалося завантажити дані. Перевірте роль та доступність API.
          </p>
          <Link href={ROUTES.rolesSupervisor} className="btn btn-outline">
            Повернутися до опису ролі
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className={`${styles.hero} panel`}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">Supervisor Dashboard</span>
          <h1 className={styles.title}>
            Контролюйте групи, законопроєкти та якість змін в одному workspace.
          </h1>
          <p className={styles.description}>
            Ця панель допомагає вам керувати групами та стежити за змінами, де
            важливу роль відіграє якість. Настройте правила та отримуйте
            сигнали, що потребують вашої уваги.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateForm((v) => !v)}
            >
              <Plus size={14} />
              {showCreateForm ? "Сховати форму" : "Створити групу"}
            </button>
            <Link href={ROUTES.rolesSupervisor} className="btn btn-outline">
              <FileText size={14} />
              Режим та правила
            </Link>
          </div>
        </div>

        <aside className={styles.heroAside}>
          <div className={styles.asideHeader}>
            <div className={styles.asideHeaderLeft}>
              <Shield size={15} />
              <span>ЗМІНИ ПІД НАГЛЯДОМ</span>
            </div>
            <div className={styles.asideUpdated}>
              Оновлено щойно
              <span className={styles.updatedDot} />
            </div>
          </div>
          <p className={styles.asideSubtitle}>Огляд у реальному часі</p>
          <div className={styles.asideStats}>
            {[
              {
                icon: <FileText size={22} />,
                value: data.statusBreakdown.draftCount,
                label: "Чернетки",
              },
              {
                icon: <CheckCircle2 size={22} />,
                value: data.statusBreakdown.reviewCount,
                label: "На розгляді",
              },
              {
                icon: <CircleHelp size={22} />,
                value: data.statusBreakdown.rejectedCount,
                label: "Під сумнівом",
              },
              {
                icon: <Users size={22} />,
                value: data.statusBreakdown.approvedCount,
                label: "Вирішено",
              },
            ].map((stat) => (
              <div key={stat.label} className={styles.asideStat}>
                <span className={styles.asideStatIcon}>{stat.icon}</span>
                <strong className={styles.asideStatValue}>{stat.value}</strong>
                <span className={styles.asideStatLabel}>{stat.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* ── CREATE GROUP FORM ─────────────────────────────────────────────── */}
      {showCreateForm && (
        <section className={`${styles.formPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Нова група</span>
              <h2 className={styles.sectionTitle}>
                Створення supervisor-групи
              </h2>
            </div>
          </div>
          <form className={styles.formGrid} onSubmit={handleCreateGroup}>
            <label className={styles.field}>
              <span>Назва групи</span>
              <input
                className="form-control"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Право 2026 · Група А"
                required
              />
            </label>
            <label className={styles.field}>
              <span>Курс / програма</span>
              <input
                className="form-control"
                type="text"
                value={groupCourse}
                onChange={(e) => setGroupCourse(e.target.value)}
                placeholder="Конституційне право / Law Analysis Bootcamp"
              />
            </label>
            <div className={styles.formActions}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowCreateForm(false)}
              >
                Скасувати
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createGroup.isPending}
              >
                {createGroup.isPending ? "Збереження..." : "Зберегти групу"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── KPI GRID ─────────────────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        {[
          {
            label: "Активні групи",
            value: data.groups.length,
            note: "Груп, що перебувають під вашим наглядом",
            icon: <Users size={20} />,
            tone: "gold",
          },
          {
            label: "Учасники",
            value: data.totalMembers,
            note: "Людей, за активністю яких ви спостерігаєте",
            icon: <Users size={20} />,
            tone: "blue",
          },
          {
            label: "Зміни в законопроектах",
            value: data.statusBreakdown.totalChanges,
            note: "Зміни в проектах під моніторингом",
            icon: <FileText size={20} />,
            tone: "teal",
          },
          {
            label: "У роботі",
            value: data.statusBreakdown.reviewCount,
            note: "Оцінюють редакцію проекту зараз",
            icon: <Activity size={20} />,
            tone: "violet",
          },
        ].map((card) => (
          <article key={card.label} className={`${styles.kpiCard} panel`}>
            <div className={styles.kpiCardTop}>
              <strong className={styles.kpiValue}>{card.value}</strong>
              <span
                className={`${styles.kpiIcon} ${styles[`kpiIcon_${card.tone}`]}`}
              >
                {card.icon}
              </span>
            </div>
            <h3 className={styles.kpiLabel}>{card.label}</h3>
            <p className={styles.kpiNote}>{card.note}</p>
          </article>
        ))}
      </div>

      {/* ── TWO COL: GROUPS + PRIORITIES ─────────────────────────────────── */}
      <div className={styles.twoCol}>
        <section className={`${styles.sectionPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>ВАШ НАГЛЯД</span>
              <h2 className={styles.sectionTitle}>Кого ви ведете зараз</h2>
            </div>
            <Link href="#" className={styles.sectionLink}>
              Переглянути всіх <ArrowUpRight size={14} />
            </Link>
          </div>

          {!highlightedGroups.length ? (
            <div className={styles.emptyState}>
              <GraduationCap size={36} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Поки що немає активних груп</p>
              <span className={styles.emptyDesc}>
                Створіть першу групу, щоб почати моніторинг студентів та
                законопроектів.
              </span>
              <button
                type="button"
                className={styles.emptyBtn}
                onClick={() => setShowCreateForm(true)}
              >
                <Plus size={14} /> Створити групу
              </button>
            </div>
          ) : (
            <div className={styles.groupGrid}>
              {highlightedGroups.map((group) => {
                const tone = statusTone(group);
                return (
                  <article key={group.groupId} className={styles.groupCard}>
                    <div className={styles.groupHead}>
                      <div>
                        <span className={styles.groupCourse}>
                          {group.course || "Без курсу"}
                        </span>
                        <h3 className={styles.groupTitle}>{group.groupName}</h3>
                      </div>
                      <span
                        className={`${styles.statusBadge} ${styles[`statusBadge_${tone.tone}`]}`}
                      >
                        {tone.label}
                      </span>
                    </div>
                    <div className={styles.groupStats}>
                      <div>
                        <span>Студентів</span>
                        <strong>{group.memberCount}</strong>
                      </div>
                      <div>
                        <span>Активні закони</span>
                        <strong>{group.activeLawsCount}</strong>
                      </div>
                      <div>
                        <span>Усі закони</span>
                        <strong>{group.trackedLawsCount}</strong>
                      </div>
                      <div>
                        <span>Зміни</span>
                        <strong>{group.changeCount}</strong>
                      </div>
                    </div>
                    <div className={styles.groupFooter}>
                      <span className={styles.groupLastActivity}>
                        <Clock3 size={13} />
                        {formatRelativeDate(group.lastActivityAt)}
                      </span>
                      <Link
                        href={ROUTES.supervisorGroup(group.groupId)}
                        className={styles.inlineLink}
                      >
                        Відкрити групу <ChevronRight size={14} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={`${styles.sectionPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>ПРІОРИТЕТИ</span>
              <h2 className={styles.sectionTitle}>Що потребує вашої уваги</h2>
            </div>
          </div>
          <div className={styles.priorityList}>
            {[
              {
                color: "orange",
                title: "Ознайомитися й розглянути",
                desc: "Це збірка та редакція змін, які вибрані з чернетки і потребують вашої дії",
              },
              {
                color: "purple",
                title: "Оцінюються у роботі",
                desc: "Користувачі працюють над змінами чи готують зміни і модератори оцінюють поточну редакцію",
              },
              {
                color: "teal",
                title: "Узгоджуються зміни",
                desc: "Показники того, що групи чи проект погоджують активність, а редакція вже наближається до консенсусу",
              },
              {
                color: "blue",
                title: "Обговорення рішень",
                desc: "Документ пройшов, але учасники все ще обговорюють над деталями або шукають підтримки до рішення",
              },
            ].map((item) => (
              <div key={item.title} className={styles.priorityItem}>
                <span
                  className={`${styles.priorityDot} ${styles[`priorityDot_${item.color}`]}`}
                />
                <div className={styles.priorityBody}>
                  <strong>{item.title}</strong>
                  <p>{item.desc}</p>
                </div>
                <ChevronRight size={16} className={styles.priorityChevron} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── MONITORING TABLE ─────────────────────────────────────────────── */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>
              МОНІТОРИНГ ЗАКОНОПРОЕКТІВ
            </span>
            <h2 className={styles.sectionTitle}>
              Закони × групи × кількість змін
            </h2>
          </div>
          <div className={styles.filters}>
            <label className={styles.searchField}>
              <Search size={14} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Пошук за законом або групою"
              />
            </label>
            <select
              className="form-control form-select"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="all">Усі групи</option>
              {highlightedGroups.map((g) => (
                <option key={g.groupId} value={g.groupId}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredMonitoring.length === 0 ? (
          <div className={styles.emptyState}>
            <BookOpen size={32} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>
              Для поточного фільтра ще немає рядків моніторингу.
            </p>
            <span className={styles.emptyDesc}>
              Додайте закони до групи або дочекайтеся першої активності.
            </span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Закон</th>
                  <th>Група</th>
                  <th>Кількість змін</th>
                  <th>Статус</th>
                  <th>Остання активність</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonitoring.slice(0, 12).map((row) => {
                  const tone = statusTone(row);
                  return (
                    <tr key={`${row.groupId}-${row.law?._id || "law"}`}>
                      <td>
                        <div className={styles.lawCell}>
                          <Link
                            href={
                              row.law ? ROUTES.law(row.law._id) : ROUTES.laws
                            }
                            className={styles.tableLawLink}
                          >
                            {row.law?.code || "Без коду"}{" "}
                            <ArrowUpRight size={13} />
                          </Link>
                          <span className={styles.tableLawTitle}>
                            {row.law?.title || "Закон не знайдено"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.groupCell}>
                          <strong>{row.groupName}</strong>
                          <span>{row.course || "Без курсу"}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.changeCell}>
                          <strong>{row.changeCount}</strong>
                          <span>
                            {row.forkCount} форків · {row.proposalCount}{" "}
                            пропозицій
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`${styles.statusBadge} ${styles[`statusBadge_${tone.tone}`]}`}
                        >
                          {tone.label}
                        </span>
                      </td>
                      <td className={styles.tableDate}>
                        {formatRelativeDate(row.lastActivityAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── BOTTOM 3 COLUMNS ─────────────────────────────────────────────── */}
      <div className={styles.threeCol}>
        <section className={`${styles.sectionPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>
                АКТИВНІСТЬ СТУДЕНТІВ
              </span>
              <h2 className={styles.sectionTitle}>Хто реально рухає роботу</h2>
            </div>
          </div>

          {!filteredStudents.length ? (
            <div className={styles.emptyState}>
              <Users size={28} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Поки що немає активності</p>
              <span className={styles.emptyDesc}>
                Поки що немає активності учасників для цього фільтра. Як тільки
                з'являться серія дій: пропозиції, коментарі чи затвердження,
                вони будуть показані тут.
              </span>
            </div>
          ) : (
            <div className={styles.studentList}>
              {filteredStudents.slice(0, 8).map((student, index) => (
                <article key={student.userId} className={styles.studentCard}>
                  <div className={styles.studentRank}>{index + 1}</div>
                  <div className={styles.studentMain}>
                    <div className={styles.studentTop}>
                      <div>
                        <h3 className={styles.studentName}>{student.name}</h3>
                        <p className={styles.studentEmail}>{student.email}</p>
                      </div>
                      <span className={styles.studentDate}>
                        {formatRelativeDate(student.lastActivityAt)}
                      </span>
                    </div>
                    <div className={styles.studentGroups}>
                      {student.groups.map((g) => (
                        <span key={g.id} className={styles.studentGroupTag}>
                          {g.name}
                        </span>
                      ))}
                    </div>
                    <div className={styles.studentStats}>
                      <span>{student.changeCount} змін</span>
                      <span>{student.forkCount} форків</span>
                      <span>{student.proposalCount} пропозицій</span>
                      <span>{student.reviewCount} на розгляді</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={`${styles.sectionPanel} panel`}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>ЖИВА СТРІЧКА ЗМІН</span>
              <h2 className={styles.sectionTitle}>Жива стрічка змін</h2>
            </div>
          </div>

          {!filteredRecent.length ? (
            <div className={styles.emptyState}>
              <RefreshCcw size={28} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>Стрічка подій порожня</p>
              <span className={styles.emptyDesc}>
                Коли учасники створять, оновлять або затвердять зміни, ви
                побачите це тут.
              </span>
            </div>
          ) : (
            <div className={styles.activityFeed}>
              {filteredRecent.slice(0, 10).map((item) => (
                <article
                  key={`${item.type}-${item.lawId}-${item.updatedAt}`}
                  className={styles.feedItem}
                >
                  <span
                    className={`${styles.feedIcon} ${
                      item.type === "fork"
                        ? styles.feedIconFork
                        : styles.feedIconProposal
                    }`}
                  >
                    {item.type === "fork" ? (
                      <FolderKanban size={14} />
                    ) : (
                      <FileText size={14} />
                    )}
                  </span>
                  <div className={styles.feedBody}>
                    <div className={styles.feedTop}>
                      <strong>{item.title}</strong>
                      <span className={styles.feedDate}>
                        {formatRelativeDate(item.updatedAt)}
                      </span>
                    </div>
                    <p className={styles.feedMeta}>
                      {item.author} · {item.lawCode} · {item.groupLabel}
                    </p>
                    <div className={styles.feedBottom}>
                      <span className={styles.feedStatus}>{item.status}</span>
                      {item.type === "fork" && item.id && (
                        <button
                          type="button"
                          className={styles.inlineLink}
                          onClick={() => setDiffForkId(item.id)}
                        >
                          Переглянути diff
                        </button>
                      )}
                      <Link
                        href={ROUTES.law(item.lawId)}
                        className={styles.inlineLink}
                      >
                        Відкрити закон <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section
          className={`${styles.sectionPanel} ${styles.supervisorPanel} panel`}
        >
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.sectionEyebrow}>SUPERVISOR РЕЖИМ</span>
              <h2 className={styles.supervisorPanelTitle}>
                Панель уже готова для початкового контролю і росте разом із
                роллю.
              </h2>
            </div>
          </div>
          <p className={styles.supervisorDesc}>
            Згодом вона допоможе групам отримувати сигнали в групах, зміни,
            активність студентів і статуси якості. Настройте правила та групи
            поетапно та адаптуйте цей workspace під реальність по змінах.
          </p>
          <div className={styles.supervisorLinks}>
            <Link href={ROUTES.account} className={styles.supervisorLink}>
              <Settings size={14} />
              <span>Основні налаштування активності</span>
              <ChevronRight size={14} />
            </Link>
            <Link
              href={ROUTES.supervisorRules}
              className={styles.supervisorLink}
            >
              <Shield size={14} />
              <span>Правила змін та сигнали для змін</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className={styles.supervisorFooter}>
            <span>
              {formatFullDate(data.recentActivity[0]?.updatedAt ?? null)}
            </span>
            <span>Остання активність</span>
          </div>
        </section>
      </div>
      {/* ── EXPIRED PROPOSALS ────────────────────────────────────────────── */}
      <ExpiredProposalsSection />

      {diffForkId && (
        <ForkDiffModal
          forkId={diffForkId}
          onClose={() => setDiffForkId(null)}
        />
      )}
    </div>
  );
}
