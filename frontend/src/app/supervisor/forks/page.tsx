"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
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
  useSupervisorGroupForks,
  useReviewGroupFork,
} from "@/hooks/useSupervisor";
import { useMyGraphForks } from "@/hooks/useGraphForks";
import type { LawFork } from "@/lib/api/forks";
import type { GraphFork } from "@/lib/api/graphForks";
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

function getStatusBadgeClass(status: LawFork["status"]): string {
  switch (status) {
    case "draft":
      return styles.badgeDraft;
    case "review":
      return styles.badgeReview;
    case "approved":
      return styles.badgeApproved;
    case "rejected":
      return styles.badgeRejected;
    default:
      return styles.badge;
  }
}

function getStatusLabel(status: LawFork["status"]): string {
  switch (status) {
    case "draft":
      return "Чернетка";
    case "review":
      return "На розгляді";
    case "approved":
      return "Схвалено";
    case "rejected":
      return "Відхилено";
    default:
      return status;
  }
}

function getOperationBadgeClass(op: "edit" | "add" | "delete"): string {
  switch (op) {
    case "edit":
      return styles.badgeEdit;
    case "add":
      return styles.badgeAdd;
    case "delete":
      return styles.badgeDelete;
    default:
      return styles.badge;
  }
}

function getOperationLabel(op: "edit" | "add" | "delete"): string {
  switch (op) {
    case "edit":
      return "Редагування";
    case "add":
      return "Додавання";
    case "delete":
      return "Видалення";
    default:
      return op;
  }
}

function getLawTitle(lawId: LawFork["lawId"]): string {
  if (typeof lawId === "object" && lawId !== null) return lawId.title;
  return typeof lawId === "string" ? lawId : "";
}

function getAuthorName(authorId: LawFork["authorId"]): string {
  if (typeof authorId === "object" && authorId !== null)
    return authorId.fullName;
  return typeof authorId === "string" ? authorId : "Невідомий автор";
}

type StatusFilter = "all" | LawFork["status"];
type SectionTab = "law-forks" | "graph-forks";

function LawForksSection() {
  const { data: forks, isLoading, error } = useSupervisorGroupForks();
  const reviewFork = useReviewGroupFork();

  const [openForkId, setOpenForkId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <p style={{ color: "var(--color-smoke)", padding: "40px 0" }}>
        Завантаження...
      </p>
    );
  }
  if (error) {
    return (
      <p style={{ color: "#f39b9b", padding: "40px 0" }}>
        Помилка завантаження
      </p>
    );
  }

  const allForks = forks ?? [];
  const totalForks = allForks.length;
  const onReviewCount = allForks.filter((f) => f.status === "review").length;
  const approvedCount = allForks.filter((f) => f.status === "approved").length;

  const filtered = allForks.filter((f) => {
    const matchStatus = statusFilter === "all" || f.status === statusFilter;
    const matchSearch =
      !searchQuery || f.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleReview = async (forkId: string, action: "approve" | "reject") => {
    try {
      await reviewFork.mutateAsync({
        forkId,
        action,
        reviewNote: reviewNote.trim() || undefined,
      });
      notify.success(action === "approve" ? "Форк схвалено" : "Форк відхилено");
      setReviewingId(null);
      setReviewNote("");
    } catch {
      notify.error("Не вдалося оновити статус форку");
    }
  };

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>
              SUPERVISOR · ФОРКИ ЗАКОНІВ
            </span>
            <h1
              className={styles.sectionTitle}
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}
            >
              Форки учасників та мої
            </h1>
          </div>
        </div>

        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Всього форків</p>
            <strong className={styles.kpiValue}>{totalForks}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>На розгляді</p>
            <strong className={styles.kpiValue}>{onReviewCount}</strong>
          </div>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Схвалено</p>
            <strong className={styles.kpiValue}>{approvedCount}</strong>
          </div>
        </div>
      </section>

      {/* FILTERS + LIST */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.filtersRow}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          >
            <option value="all">Всі статуси</option>
            <option value="draft">Чернетка</option>
            <option value="review">На розгляді</option>
            <option value="approved">Схвалено</option>
            <option value="rejected">Відхилено</option>
          </select>
          <input
            className={styles.filterInput}
            type="text"
            placeholder="Пошук по назві форку..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Форків поки немає</p>
          </div>
        ) : (
          <div className={styles.forkList}>
            {filtered.map((fork) => {
              const isOpen = openForkId === fork._id;
              const lawTitle = getLawTitle(fork.lawId);
              const authorName = getAuthorName(fork.authorId);
              const changes = fork.changes ?? [];
              const isReviewing = reviewingId === fork._id;

              return (
                <article key={fork._id} className={styles.forkCard}>
                  <div
                    className={styles.forkCardHeader}
                    onClick={() => setOpenForkId(isOpen ? null : fork._id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className={styles.forkTitle}>{fork.title}</p>
                      {lawTitle && <p className={styles.forkLaw}>{lawTitle}</p>}
                      <div className={styles.forkMeta}>
                        <span
                          className={`${styles.badge} ${getStatusBadgeClass(fork.status)}`}
                        >
                          {getStatusLabel(fork.status)}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-smoke)",
                          }}
                        >
                          {authorName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-smoke)",
                          }}
                        >
                          {new Date(fork.createdAt).toLocaleDateString("uk-UA")}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <Link
                        href={`/legislator-cabinet/forks/${fork._id}`}
                        className={styles.btnSm}
                        onClick={(e) => e.stopPropagation()}
                      >
                        Переглянути diff →
                      </Link>
                      {isOpen ? (
                        <ChevronUp size={16} color="var(--color-smoke)" />
                      ) : (
                        <ChevronDown size={16} color="var(--color-smoke)" />
                      )}
                    </div>
                  </div>

                  {isOpen && (
                    <div className={styles.forkCardBody}>
                      {changes.length === 0 ? (
                        <p
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--color-smoke)",
                            marginTop: 14,
                          }}
                        >
                          Змін немає
                        </p>
                      ) : (
                        <div className={styles.changesList}>
                          {changes.map((change, idx) => (
                            <div
                              key={change._id ?? idx}
                              className={styles.changeItem}
                            >
                              <span className={styles.changeCode}>
                                {change.elementCode}
                              </span>
                              <span
                                className={`${styles.badge} ${getOperationBadgeClass(change.operation)}`}
                              >
                                {getOperationLabel(change.operation)}
                              </span>
                              <p className={styles.changePreview}>
                                {change.proposedText}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {fork.submittedAt && (
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-smoke)",
                            marginTop: 10,
                          }}
                        >
                          Подано:{" "}
                          {new Date(fork.submittedAt).toLocaleDateString(
                            "uk-UA",
                          )}
                        </p>
                      )}

                      {fork.reviewNote && (
                        <p className={styles.reviewNote}>{fork.reviewNote}</p>
                      )}

                      {/* Approve/Reject for review-status forks */}
                      {fork.status === "review" && (
                        <div
                          style={{
                            marginTop: 16,
                            borderTop: "1px solid var(--color-border)",
                            paddingTop: 12,
                          }}
                        >
                          {isReviewing ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              <textarea
                                className={styles.filterInput}
                                placeholder="Коментар до рішення (необов'язково)"
                                value={reviewNote}
                                onChange={(e) => setReviewNote(e.target.value)}
                                rows={2}
                                style={{
                                  resize: "vertical",
                                  fontFamily: "inherit",
                                  fontSize: "0.85rem",
                                }}
                              />
                              <div style={{ display: "flex", gap: 8 }}>
                                <button
                                  type="button"
                                  className={styles.btnSm}
                                  style={{
                                    background: "var(--color-success, #2ea043)",
                                    color: "#fff",
                                    border: "none",
                                  }}
                                  onClick={() =>
                                    handleReview(fork._id, "approve")
                                  }
                                  disabled={reviewFork.isPending}
                                >
                                  {reviewFork.isPending ? "..." : "Схвалити"}
                                </button>
                                <button
                                  type="button"
                                  className={styles.btnSm}
                                  style={{
                                    background: "#c0392b",
                                    color: "#fff",
                                    border: "none",
                                  }}
                                  onClick={() =>
                                    handleReview(fork._id, "reject")
                                  }
                                  disabled={reviewFork.isPending}
                                >
                                  {reviewFork.isPending ? "..." : "Відхилити"}
                                </button>
                                <button
                                  type="button"
                                  className={styles.btnSm}
                                  onClick={() => {
                                    setReviewingId(null);
                                    setReviewNote("");
                                  }}
                                >
                                  Скасувати
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className={styles.btnSm}
                              onClick={() => setReviewingId(fork._id)}
                            >
                              Розглянути →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function GraphForksSection() {
  const { data: graphForks, isLoading, error } = useMyGraphForks();

  if (isLoading) {
    return (
      <p style={{ color: "var(--color-smoke)", padding: "40px 0" }}>
        Завантаження...
      </p>
    );
  }
  if (error) {
    return (
      <p style={{ color: "#f39b9b", padding: "40px 0" }}>
        Помилка завантаження
      </p>
    );
  }

  const list = graphForks ?? [];

  return (
    <div className={styles.page}>
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>
              SUPERVISOR · ЗБЕРЕЖЕНІ ГРАФИ
            </span>
            <h1
              className={styles.sectionTitle}
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}
            >
              Мої збережені графи
            </h1>
          </div>
        </div>
      </section>

      <section className={`${styles.sectionPanel} panel`}>
        {list.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Збережених графів поки немає</p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-smoke)" }}>
              Збережіть стан графу на сторінці{" "}
              <Link
                href={ROUTES.graph}
                style={{ color: "var(--color-accent)" }}
              >
                Граф
              </Link>
            </p>
          </div>
        ) : (
          <div className={styles.forkList}>
            {list.map((gf: GraphFork) => {
              const notesCount = gf.viewState?.notes?.length ?? 0;
              const nodesCount = gf.viewState?.nodePositions?.length ?? 0;

              return (
                <article key={gf._id} className={styles.forkCard}>
                  <div
                    className={styles.forkCardHeader}
                    style={{ cursor: "default" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className={styles.forkTitle}>{gf.name}</p>
                      {gf.description && (
                        <p className={styles.forkLaw}>{gf.description}</p>
                      )}
                      <div className={styles.forkMeta}>
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-smoke)",
                          }}
                        >
                          {nodesCount} вузлів
                        </span>
                        {notesCount > 0 && (
                          <span
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--color-smoke)",
                            }}
                          >
                            {notesCount} нотаток
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-smoke)",
                          }}
                        >
                          {new Date(gf.updatedAt).toLocaleDateString("uk-UA")}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`${ROUTES.graph}?forkId=${gf._id}`}
                      className={styles.btnSm}
                    >
                      Відкрити в графі →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ForksView() {
  const [activeSection, setActiveSection] = useState<SectionTab>("law-forks");

  return (
    <div>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: 8, padding: "24px 32px 0" }}>
        <button
          type="button"
          className={`${styles.filterSelect} ${activeSection === "law-forks" ? (styles.tabActive ?? "") : ""}`}
          style={{
            background:
              activeSection === "law-forks" ? "var(--color-accent)" : undefined,
            color: activeSection === "law-forks" ? "#fff" : undefined,
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            padding: "6px 18px",
            cursor: "pointer",
            fontWeight: activeSection === "law-forks" ? 600 : 400,
          }}
          onClick={() => setActiveSection("law-forks")}
        >
          Форки законів
        </button>
        <button
          type="button"
          style={{
            background:
              activeSection === "graph-forks"
                ? "var(--color-accent)"
                : undefined,
            color: activeSection === "graph-forks" ? "#fff" : undefined,
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            padding: "6px 18px",
            cursor: "pointer",
            fontWeight: activeSection === "graph-forks" ? 600 : 400,
          }}
          onClick={() => setActiveSection("graph-forks")}
        >
          Збережені графи
        </button>
      </div>

      {activeSection === "law-forks" ? (
        <LawForksSection />
      ) : (
        <GraphForksSection />
      )}
    </div>
  );
}

export default function SupervisorForksPage() {
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
        <ForksView />
      </main>
    </div>
  );
}
