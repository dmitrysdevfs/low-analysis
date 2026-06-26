"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
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
  Shield,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  useMyGroups,
  useCreateGroup,
  useArchiveGroup,
  useSupervisorPendingCount,
} from "@/hooks/useGroups";
import { notify } from "@/lib/toast";
import { getLaws } from "@/lib/api/laws";
import type { Law } from "@/lib/api/laws";
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

function GroupsView() {
  const { data: groups, isLoading, error } = useMyGroups();
  const createGroup = useCreateGroup();
  const archiveGroup = useArchiveGroup();

  const [showModal, setShowModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [maxMembers, setMaxMembers] = useState(20);
  const [visibility, setVisibility] = useState<"public" | "invite_only">(
    "public",
  );

  // Law combobox state for create modal
  const [lawQuery, setLawQuery] = useState("");
  const [lawSuggestions, setLawSuggestions] = useState<Law[]>([]);
  const [selectedLaws, setSelectedLaws] = useState<Law[]>([]);
  const lawDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lawQuery.trim()) {
      setLawSuggestions([]);
      return;
    }
    if (lawDebounceRef.current) clearTimeout(lawDebounceRef.current);
    lawDebounceRef.current = setTimeout(async () => {
      const results = await getLaws(lawQuery).catch(() => []);
      setLawSuggestions(results.slice(0, 8));
    }, 300);
  }, [lawQuery]);

  const activeGroups = groups?.filter((g) => g.status === "active") ?? [];
  const totalMembers =
    groups?.reduce(
      (sum, g) => sum + g.members.filter((m) => m.status === "active").length,
      0,
    ) ?? 0;
  const activeGroupIds = activeGroups.map((g) => g._id);
  const pendingCount = useSupervisorPendingCount(activeGroupIds);

  const canCreate = activeGroups.length < 3;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createGroup.mutateAsync({
        name: name.trim(),
        course: course.trim() || undefined,
        maxMembers,
        visibility,
        trackedLaws: selectedLaws.map((l) => l._id),
      });
      notify.success("Групу створено");
      setName("");
      setCourse("");
      setMaxMembers(20);
      setVisibility("public");
      setSelectedLaws([]);
      setLawQuery("");
      setShowModal(false);
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося створити групу",
      );
    }
  };

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

  const groupFill = Math.min((activeGroups.length / 3) * 100, 100);
  const groupsFull = activeGroups.length >= 3;

  return (
    <div className={styles.page}>
      {/* HERO */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>SUPERVISOR · ГРУПИ</span>
            <h1
              className={styles.sectionTitle}
              style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)" }}
            >
              Мої групи
            </h1>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            disabled={!canCreate}
            title={!canCreate ? "Досягнуто ліміту 3 активних груп" : undefined}
          >
            <Plus size={14} />
            Створити групу
          </button>
        </div>

        {/* KPI STRIP */}
        <div className={styles.kpiStrip}>
          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Активних груп</p>
            <strong className={styles.kpiValue}>
              {activeGroups.length} / 3
            </strong>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressFill} ${groupsFull ? styles.progressFillRed : ""}`}
                style={{ width: `${groupFill}%` }}
              />
            </div>
          </div>

          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Pending заявок</p>
            <strong className={styles.kpiValue}>{pendingCount}</strong>
            {pendingCount > 0 && (
              <span className={`${styles.statBadge} ${styles.statBadgeOrange}`}>
                {pendingCount} нових
              </span>
            )}
          </div>

          <div className={styles.kpiCard}>
            <p className={styles.kpiLabel}>Всього учасників</p>
            <strong className={styles.kpiValue}>{totalMembers}</strong>
          </div>
        </div>
      </section>

      {/* GROUPS GRID */}
      <section className={`${styles.sectionPanel} panel`}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>МОЇ ГРУПИ</span>
            <h2 className={styles.sectionTitle}>Список груп</h2>
          </div>
        </div>

        {!groups || groups.length === 0 ? (
          <div className={styles.emptyState}>
            <Users size={36} className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>У вас ще немає груп</p>
            <span className={styles.emptyDesc}>
              Створіть першу групу, щоб почати роботу зі студентами!
            </span>
          </div>
        ) : (
          <div className={styles.groupsGrid}>
            {groups.map((group) => {
              const memberFill = Math.min(
                (group.members.length / group.maxMembers) * 100,
                100,
              );
              const lawsCount =
                typeof group.trackedLaws[0] === "string"
                  ? group.trackedLaws.length
                  : group.trackedLaws.length;

              return (
                <article key={group._id} className={styles.groupCard}>
                  <div>
                    <p className={styles.groupCardCourse}>
                      {group.course || "Без курсу"}
                    </p>
                    <h3 className={styles.groupCardName}>{group.name}</h3>
                  </div>

                  <div>
                    <div
                      className={styles.groupCardMeta}
                      style={{ marginBottom: 6 }}
                    >
                      <span>
                        {
                          group.members.filter((m) => m.status === "active")
                            .length
                        }{" "}
                        / {group.maxMembers} учасників
                      </span>
                      <span>·</span>
                      <span>{lawsCount} законів</span>
                    </div>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${memberFill}%` }}
                      />
                    </div>
                  </div>

                  <div className={styles.groupCardFooter}>
                    <span className={styles.groupCardDate}>
                      <Clock3 size={12} />
                      {new Date(group.updatedAt).toLocaleDateString("uk-UA")}
                    </span>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      {confirmDeleteId === group._id ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ fontSize: "0.75rem", padding: "3px 8px" }}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Скасувати
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary"
                            style={{
                              fontSize: "0.75rem",
                              padding: "3px 8px",
                              background: "#c0392b",
                              borderColor: "#c0392b",
                            }}
                            disabled={archiveGroup.isPending}
                            onClick={async () => {
                              try {
                                await archiveGroup.mutateAsync(group._id);
                                notify.success("Групу видалено");
                              } catch {
                                notify.error("Не вдалося видалити групу");
                              } finally {
                                setConfirmDeleteId(null);
                              }
                            }}
                          >
                            Так, видалити
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          title="Видалити групу"
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "var(--color-smoke)",
                            padding: "2px 4px",
                          }}
                          onClick={() => setConfirmDeleteId(group._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <Link
                        href={ROUTES.supervisorGroup(group._id)}
                        className={styles.inlineLink}
                      >
                        Відкрити групу <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* CREATE MODAL */}
      {showModal && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowModal(false)}
        >
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Нова група</h2>
            <form
              onSubmit={handleCreate}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <label className={styles.field}>
                <span>Назва групи *</span>
                <input
                  className="form-control"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Право 2026 · Група А"
                  required
                  autoFocus
                />
              </label>
              <label className={styles.field}>
                <span>Курс / програма</span>
                <input
                  className="form-control"
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Конституційне право"
                />
              </label>
              <label className={styles.field}>
                <span>Макс. учасників</span>
                <input
                  className="form-control"
                  type="number"
                  value={maxMembers}
                  min={1}
                  max={100}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                />
              </label>
              <label className={styles.field}>
                <span>Видимість</span>
                <select
                  className="form-control form-select"
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as "public" | "invite_only")
                  }
                >
                  <option value="public">Публічна</option>
                  <option value="invite_only">Тільки за запрошенням</option>
                </select>
              </label>
              <div className={styles.field}>
                <span>Закони під наглядом</span>
                <input
                  className="form-control"
                  type="text"
                  value={lawQuery}
                  onChange={(e) => setLawQuery(e.target.value)}
                  placeholder="Пошук закону..."
                  autoComplete="off"
                />
                {lawSuggestions.length > 0 && (
                  <div className={styles.lawDropdown}>
                    {lawSuggestions.map((law) => (
                      <button
                        key={law._id}
                        type="button"
                        className={styles.lawDropdownItem}
                        onClick={() => {
                          if (!selectedLaws.find((l) => l._id === law._id)) {
                            setSelectedLaws((prev) => [...prev, law]);
                          }
                          setLawQuery("");
                          setLawSuggestions([]);
                        }}
                      >
                        <span className={styles.lawCode}>{law.code}</span>{" "}
                        {law.title}
                      </button>
                    ))}
                  </div>
                )}
                {selectedLaws.length > 0 && (
                  <div className={styles.selectedLaws}>
                    {selectedLaws.map((law) => (
                      <span key={law._id} className={styles.lawTag}>
                        {law.code}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedLaws((prev) =>
                              prev.filter((l) => l._id !== law._id),
                            )
                          }
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowModal(false)}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createGroup.isPending}
                >
                  {createGroup.isPending ? "Збереження..." : "Створити групу"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupervisorGroupsPage() {
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
        <GroupsView />
      </main>
    </div>
  );
}
