"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  FolderKanban,
  GraduationCap,
  Save,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Layout } from "@/components/layout/Layout";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ROUTES } from "@/constants/routes";
import {
  useSupervisorGroupDetail,
  useUpdateSupervisorGroup,
} from "@/hooks/useSupervisor";
import { useGroupRequests, useReviewRequest } from "@/hooks/useGroups";
import { getLaws } from "@/lib/api/laws";
import type { SupervisorLawRef } from "@/lib/api/supervisor";
import { notify } from "@/lib/toast";
import styles from "./page.module.scss";

function formatRelativeDate(value: string | null) {
  if (!value) return "Без активності";

  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (diffDays === 0) {
    return `Сьогодні · ${date.toLocaleTimeString("uk-UA", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
  if (diffDays === 1) {
    return "Вчора";
  }
  if (diffDays < 7) {
    return `${diffDays} дн. тому`;
  }

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

function mapStatusLabel(status: string) {
  switch (status) {
    case "draft":
      return "Чернетка";
    case "review":
    case "active":
      return "На розгляді";
    case "approved":
      return "Погоджено";
    case "rejected":
      return "Відхилено";
    case "withdrawn":
      return "Знято";
    case "archived":
      return "Архів";
    case "superseded":
      return "Замінено";
    default:
      return status;
  }
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

  if (total === 0) {
    return { label: "Під наглядом", tone: "neutral" as const };
  }
  if (input.reviewCount > 0) {
    return { label: "Чекає розгляду", tone: "warning" as const };
  }
  if (input.draftCount > 0 && input.approvedCount === 0) {
    return { label: "Є чернетки", tone: "draft" as const };
  }
  if (input.approvedCount > 0 && input.rejectedCount === 0) {
    return { label: "Позитивна динаміка", tone: "good" as const };
  }
  if (input.rejectedCount > 0 && input.approvedCount === 0) {
    return { label: "Потребує уваги", tone: "danger" as const };
  }
  return { label: "Змішаний стан", tone: "mixed" as const };
}

function AccessGate() {
  return (
    <Layout fullHeight>
      <section className={styles.page}>
        <div className={`${styles.gate} panel`}>
          <span className="eyebrow">Supervisor Access</span>
          <h1 className={styles.gateTitle}>
            Ця сторінка доступна лише supervisor-ролі
          </h1>
          <p className={styles.gateText}>
            Тут зібрано контроль груп, відстеження законів, активність учасників
            та стрічку змін. Для входу потрібна роль supervisor або admin.
          </p>
          <div className={styles.gateActions}>
            <Link href={ROUTES.supervisorDashboard} className="btn btn-primary">
              До supervisor dashboard
            </Link>
            <Link href={ROUTES.rolesSupervisor} className="btn btn-outline">
              Про роль Supervisor
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function DetailSkeleton() {
  return (
    <Layout fullHeight>
      <section className={styles.page}>
        <div className={styles.crumbBar}>
          <div className={styles.crumbSkeleton} />
        </div>
        <div className={`${styles.hero} ${styles.skeletonBlock}`} />
        <div className={styles.statsGrid}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`${styles.metricCard} ${styles.skeletonBlock}`}
            />
          ))}
        </div>
        <div className={styles.detailGrid}>
          <div className={styles.mainCol}>
            <div className={`${styles.sectionPanel} ${styles.skeletonBlock}`} />
            <div className={`${styles.sectionPanel} ${styles.skeletonBlock}`} />
          </div>
          <div className={styles.sideCol}>
            <div className={`${styles.sectionPanel} ${styles.skeletonBlock}`} />
            <div className={`${styles.sectionPanel} ${styles.skeletonBlock}`} />
          </div>
        </div>
      </section>
    </Layout>
  );
}

export default function SupervisorGroupPage() {
  const { isSupervisor, isAdmin, isHydrated } = useAuth();

  if (!isHydrated) {
    return <DetailSkeleton />;
  }

  if (!isSupervisor && !isAdmin) {
    return <AccessGate />;
  }

  return (
    <Layout fullHeight>
      <SupervisorGroupView />
    </Layout>
  );
}

function SupervisorGroupView() {
  const params = useParams<{ id: string }>();
  const groupId = Array.isArray(params?.id) ? params.id[0] : params?.id || null;
  const { data, isLoading, error } = useSupervisorGroupDetail(groupId);
  const updateGroup = useUpdateSupervisorGroup();
  const { data: groupRequests = [] } = useGroupRequests(groupId ?? "");
  const reviewRequest = useReviewRequest(groupId ?? "");

  const pendingRequests = groupRequests.filter((r) => r.status === "pending");

  const handleReview = async (reqId: string, action: "approve" | "reject") => {
    try {
      await reviewRequest.mutateAsync({ reqId, action });
      notify.success(
        action === "approve" ? "Заявку прийнято" : "Заявку відхилено",
      );
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : "Не вдалося обробити заявку",
      );
    }
  };

  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [trackedLaws, setTrackedLaws] = useState<SupervisorLawRef[]>([]);
  const [lawSearch, setLawSearch] = useState("");

  // Law combobox state for tracked laws editing
  const [lawAddQuery, setLawAddQuery] = useState("");
  const [lawSuggestions, setLawSuggestions] = useState<SupervisorLawRef[]>([]);
  const lawDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!data?.group) return;
    setName(data.group.name || "");
    setCourse(data.group.course || "");
    setTrackedLaws(data.group.trackedLawIds ?? []);
  }, [data?.group]);

  useEffect(() => {
    if (!lawAddQuery.trim()) {
      setLawSuggestions([]);
      return;
    }
    if (lawDebounceRef.current) clearTimeout(lawDebounceRef.current);
    lawDebounceRef.current = setTimeout(async () => {
      const results = await getLaws(lawAddQuery).catch(() => []);
      setLawSuggestions(
        results
          .slice(0, 8)
          .map((l) => ({ _id: l._id, title: l.title, code: l.code ?? "" })),
      );
    }, 300);
  }, [lawAddQuery]);

  const highlight = data?.highlight;
  const latestActivity =
    data?.recentActivity?.[0]?.updatedAt ??
    highlight?.lastActivityAt ??
    data?.group.updatedAt ??
    null;

  const activeMemberIds = useMemo(
    () => new Set((data?.students ?? []).map((student) => student.userId)),
    [data?.students],
  );

  const silentMembers = useMemo(() => {
    return (data?.group.memberIds ?? []).filter(
      (member) => !activeMemberIds.has(member._id),
    );
  }, [activeMemberIds, data?.group.memberIds]);

  const filteredMonitoring = useMemo(() => {
    const query = lawSearch.trim().toLowerCase();
    const rows = data?.monitoring ?? [];

    if (!query) {
      return rows;
    }

    return rows.filter((row) =>
      [row.law?.title, row.law?.code, row.groupName, row.course]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [data?.monitoring, lawSearch]);

  const rosterRows = useMemo(() => {
    const studentMap = new Map(
      (data?.students ?? []).map((student) => [student.userId, student]),
    );

    return (data?.group.memberIds ?? []).map((member) => ({
      member,
      activity: studentMap.get(member._id) ?? null,
    }));
  }, [data?.group.memberIds, data?.students]);

  const isDirty =
    Boolean(data?.group) &&
    (name.trim() !== (data?.group.name || "").trim() ||
      course.trim() !== (data?.group.course || "").trim() ||
      JSON.stringify(trackedLaws.map((l) => l._id).sort()) !==
        JSON.stringify(
          (data?.group.trackedLawIds ?? []).map((l) => l._id).sort(),
        ));

  const memberCount = data?.group?.memberIds.length ?? 0;
  const engagementRate = memberCount
    ? Math.round((activeMemberIds.size / memberCount) * 100)
    : 0;

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!data?.group || !isDirty) return;

    try {
      await updateGroup.mutateAsync({
        id: data.group._id,
        data: {
          name: name.trim(),
          course: course.trim(),
          trackedLawIds: trackedLaws.map((l) => l._id),
        },
      });
      notify.success("Параметри групи оновлено");
    } catch (updateError) {
      notify.error(
        updateError instanceof Error
          ? updateError.message
          : "Не вдалося оновити групу",
      );
    }
  };

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (error || !data?.group) {
    return (
      <section className={styles.page}>
        <div className={styles.crumbBar}>
          <Breadcrumb
            items={[
              { label: "Supervisor", href: ROUTES.supervisorDashboard },
              { label: "Групи", href: ROUTES.supervisorDashboard },
              { label: "Помилка" },
            ]}
          />
        </div>

        <div className={`${styles.errorState} panel`}>
          <span className="eyebrow">Supervisor Group</span>
          <h1 className={styles.errorTitle}>
            Не вдалося відкрити сторінку групи
          </h1>
          <p className={styles.errorText}>
            Група або не існує, або зараз недоступна для вашої ролі. Якщо її
            було архівовано, вона вже не потрапляє до активного
            supervisor-space.
          </p>
          <div className={styles.gateActions}>
            <Link href={ROUTES.supervisorDashboard} className="btn btn-primary">
              Повернутися до дашборду
            </Link>
            <Link href={ROUTES.rolesSupervisor} className="btn btn-outline">
              Опис ролі
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const tone = statusTone(
    highlight ?? {
      draftCount: 0,
      reviewCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      changeCount: 0,
    },
  );

  return (
    <section className={styles.page}>
      <div className={styles.crumbBar}>
        <Breadcrumb
          items={[
            { label: "Supervisor", href: ROUTES.supervisorDashboard },
            { label: "Dashboard", href: ROUTES.supervisorDashboard },
            { label: data.group.name },
          ]}
        />
      </div>

      <section className={`${styles.hero} panel`}>
        <div className={styles.heroCopy}>
          <span className="eyebrow">Supervisor Group</span>
          <h1 className={styles.title}>{data.group.name}</h1>
          <p className={styles.description}>
            {data.group.course
              ? `Курс або програма: ${data.group.course}.`
              : "Група ще без заповненого курсу або програми."}{" "}
            Тут видно, як команда рухає законопроєкти, де накопичуються
            чернетки, хто тримає темп і кому потрібен методичний фідбек.
          </p>

          <div className={styles.heroMeta}>
            <span
              className={`${styles.statusBadge} ${styles[`statusBadge_${tone.tone}`]}`}
            >
              {tone.label}
            </span>
            <span className={styles.metaPill}>
              <Users size={13} />
              {data.group.memberIds.length} учасників
            </span>
            <span className={styles.metaPill}>
              <BookOpen size={13} />
              {data.group.trackedLawIds.length} законів під наглядом
            </span>
            <span className={styles.metaPill}>
              <Clock3 size={13} />
              {formatRelativeDate(latestActivity)}
            </span>
          </div>

          <div className={styles.heroActions}>
            <Link href={ROUTES.supervisorDashboard} className="btn btn-outline">
              <ArrowLeft size={14} />
              Назад до дашборду
            </Link>
            <Link href={ROUTES.rolesSupervisor} className="btn btn-primary">
              Принципи ролі
            </Link>
          </div>
        </div>

        <aside className={styles.heroAside}>
          <div className={styles.heroAsideCard}>
            <span className={styles.heroAsideLabel}>Поточна картина</span>
            <strong className={styles.heroAsideValue}>
              {highlight?.changeCount ?? 0} змін у потоці
            </strong>
            <span className={styles.heroAsideMeta}>
              {highlight?.reviewCount ?? 0} на розгляді,{" "}
              {highlight?.approvedCount ?? 0} погоджено,{" "}
              {highlight?.rejectedCount ?? 0} відхилено.
            </span>
          </div>

          <div className={styles.heroAsideGrid}>
            <div className={styles.heroMiniCard}>
              <span>Залучення</span>
              <strong>{engagementRate}%</strong>
            </div>
            <div className={styles.heroMiniCard}>
              <span>Активних законів</span>
              <strong>{highlight?.activeLawsCount ?? 0}</strong>
            </div>
            <div className={styles.heroMiniCard}>
              <span>Тихі учасники</span>
              <strong>{silentMembers.length}</strong>
            </div>
            <div className={styles.heroMiniCard}>
              <span>Останній апдейт</span>
              <strong>{formatRelativeDate(latestActivity)}</strong>
            </div>
          </div>
        </aside>
      </section>

      <nav
        style={{
          display: "flex",
          gap: 8,
          padding: "16px 32px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--bg-panel, #0d0d1a)",
          flexWrap: "wrap",
        }}
      >
        {[
          { label: "👥 Учасники", href: "#members" },
          { label: "📄 Пропозиції", href: ROUTES.supervisorProposals },
          { label: "✏️ Правки", href: ROUTES.supervisorAmendments },
          { label: "🔀 Форки", href: ROUTES.supervisorForks },
          { label: "⚖️ Закони", href: ROUTES.laws },
          { label: "📊 Аналітика", href: ROUTES.supervisorAnalytics },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "1px solid var(--color-border)",
              fontSize: "0.85rem",
              color: "var(--color-text)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <section className={styles.statsGrid}>
        {[
          {
            label: "У роботі",
            value: highlight?.draftCount ?? 0,
            note: "Чернетки та перші редакції команди",
            icon: <FolderKanban size={18} />,
            tone: "draft",
          },
          {
            label: "Очікують рев'ю",
            value: highlight?.reviewCount ?? 0,
            note: "Матеріали, де supervisor потрібен зараз",
            icon: <Activity size={18} />,
            tone: "warning",
          },
          {
            label: "Погоджено",
            value: highlight?.approvedCount ?? 0,
            note: "Зміни, що дійшли до якісного результату",
            icon: <CheckCircle2 size={18} />,
            tone: "good",
          },
          {
            label: "Потребують підтримки",
            value: silentMembers.length,
            note: "Учасники без зафіксованої активності",
            icon: <ShieldCheck size={18} />,
            tone: "neutral",
          },
        ].map((card) => (
          <article key={card.label} className={`${styles.metricCard} panel`}>
            <span
              className={`${styles.metricIcon} ${styles[`metricIcon_${card.tone}`]}`}
            >
              {card.icon}
            </span>
            <span className={styles.metricLabel}>{card.label}</span>
            <strong className={styles.metricValue}>{card.value}</strong>
            <p className={styles.metricNote}>{card.note}</p>
          </article>
        ))}
      </section>

      <div className={styles.detailGrid}>
        <div className={styles.mainCol}>
          <section className={`${styles.sectionPanel} panel`}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>
                  Моніторинг законів
                </span>
                <h2 className={styles.sectionTitle}>
                  Законопроєкти цієї групи
                </h2>
              </div>
              <label className={styles.searchField}>
                <Search size={14} />
                <input
                  type="text"
                  value={lawSearch}
                  onChange={(event) => setLawSearch(event.target.value)}
                  placeholder="Пошук за законом або кодом"
                />
              </label>
            </div>

            {!filteredMonitoring.length ? (
              <div className={styles.emptyState}>
                <BookOpen size={18} />
                <p>
                  Для цієї групи ще немає активних змін по відстежуваних законах
                  або ж фільтр не знайшов збігів.
                </p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Закон</th>
                      <th>Зміни</th>
                      <th>Авторів</th>
                      <th>Стан</th>
                      <th>Остання активність</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMonitoring.map((row) => {
                      const rowTone = statusTone(row);
                      return (
                        <tr key={`${row.groupId}-${row.law?._id || "law"}`}>
                          <td>
                            <div className={styles.lawCell}>
                              <Link
                                href={
                                  row.law
                                    ? ROUTES.law(row.law._id)
                                    : ROUTES.laws
                                }
                                className={styles.tableLawLink}
                              >
                                {row.law?.code || "Без коду"}
                                <ArrowUpRight size={13} />
                              </Link>
                              <span className={styles.tableLawTitle}>
                                {row.law?.title || "Закон не знайдено"}
                              </span>
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
                          <td className={styles.tableDate}>
                            {row.activeAuthors}
                          </td>
                          <td>
                            <span
                              className={`${styles.statusBadge} ${styles[`statusBadge_${rowTone.tone}`]}`}
                            >
                              {rowTone.label}
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

          <section className={`${styles.sectionPanel} panel`}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>
                  Активність учасників
                </span>
                <h2 className={styles.sectionTitle}>
                  Хто рухає групу, а хто ще не включився
                </h2>
              </div>
              <span className={styles.sectionMeta}>
                {rosterRows.length} людей у групі
              </span>
            </div>

            {!rosterRows.length ? (
              <div className={styles.emptyState}>
                <GraduationCap size={18} />
                <p>
                  У групі ще немає учасників. Додайте людей через backend flow
                  або admin-side зв'язування.
                </p>
              </div>
            ) : (
              <div className={styles.memberList}>
                {rosterRows.map(({ member, activity }) => (
                  <article key={member._id} className={styles.memberItem}>
                    <div className={styles.memberMain}>
                      <div className={styles.memberHeader}>
                        <div>
                          <h3 className={styles.memberName}>
                            {member.fullName}
                          </h3>
                          <p className={styles.memberEmail}>{member.email}</p>
                        </div>
                        <span
                          className={`${styles.memberStatus} ${
                            activity
                              ? styles.memberStatusActive
                              : styles.memberStatusSilent
                          }`}
                        >
                          {activity ? "Є активність" : "Очікує перший внесок"}
                        </span>
                      </div>

                      {activity ? (
                        <div className={styles.memberStats}>
                          <span>{activity.changeCount} змін</span>
                          <span>{activity.forkCount} форків</span>
                          <span>{activity.proposalCount} пропозицій</span>
                          <span>
                            {formatRelativeDate(activity.lastActivityAt)}
                          </span>
                        </div>
                      ) : (
                        <p className={styles.memberHint}>
                          Ще немає форків або proposals у межах законів цієї
                          групи.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className={`${styles.sectionPanel} panel`}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Стрічка подій</span>
                <h2 className={styles.sectionTitle}>Останні зміни по групі</h2>
              </div>
              <span className={styles.sectionMeta}>
                {data.recentActivity.length} записів
              </span>
            </div>

            {!data.recentActivity.length ? (
              <div className={styles.emptyState}>
                <FileText size={18} />
                <p>
                  Коли учасники цієї групи створять форк або proposal, подія
                  відразу з'явиться в цій стрічці.
                </p>
              </div>
            ) : (
              <div className={styles.activityFeed}>
                {data.recentActivity.slice(0, 12).map((item) => (
                  <article
                    key={`${item.type}-${item.lawId}-${item.updatedAt}-${item.authorEmail}`}
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
                        {item.author} · {item.lawCode} · {item.authorEmail}
                      </p>
                      <div className={styles.feedBottom}>
                        <span className={styles.feedStatus}>
                          {mapStatusLabel(item.status)}
                        </span>
                        <Link
                          href={ROUTES.law(item.lawId)}
                          className={styles.inlineLink}
                        >
                          Відкрити закон
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ── Pending Requests ─────────────────────────────────────────── */}
          <section className={`${styles.sectionPanel} panel`}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Заявки</span>
                <h2 className={styles.sectionTitle}>Очікують розгляду</h2>
              </div>
              <span className={styles.sectionMeta}>
                {pendingRequests.length} pending
              </span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className={styles.emptyState}>
                <Users size={18} />
                <p>Немає нових заявок на вступ до групи.</p>
              </div>
            ) : (
              <div className={styles.memberList}>
                {pendingRequests.map((req) => {
                  const user =
                    typeof req.userId === "object" ? req.userId : null;
                  return (
                    <article key={req._id} className={styles.memberItem}>
                      <div className={styles.memberMain}>
                        <div className={styles.memberHeader}>
                          <div>
                            <h3 className={styles.memberName}>
                              {user?.fullName ?? "—"}
                            </h3>
                            <p className={styles.memberEmail}>
                              {user?.email ?? ""}
                            </p>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              className="btn btn-primary"
                              style={{
                                fontSize: "0.75rem",
                                padding: "4px 12px",
                              }}
                              onClick={() => handleReview(req._id, "approve")}
                              disabled={reviewRequest.isPending}
                            >
                              Прийняти
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              style={{
                                fontSize: "0.75rem",
                                padding: "4px 12px",
                              }}
                              onClick={() => handleReview(req._id, "reject")}
                              disabled={reviewRequest.isPending}
                            >
                              Відхилити
                            </button>
                          </div>
                        </div>
                        {req.message && (
                          <p className={styles.memberHint}>
                            &ldquo;{req.message}&rdquo;
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <aside className={styles.sideCol}>
          <section className={`${styles.sectionPanel} panel`}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Параметри групи</span>
                <h2 className={styles.sectionTitle}>Опис та контекст</h2>
              </div>
            </div>

            <form className={styles.formGrid} onSubmit={handleSave}>
              <label className={styles.field}>
                <span>Назва групи</span>
                <input
                  className="form-control"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Право 2026 · Група А"
                />
              </label>

              <label className={styles.field}>
                <span>Курс / програма</span>
                <input
                  className="form-control"
                  type="text"
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  placeholder="Law Analysis Bootcamp"
                />
              </label>

              <div className={styles.detailMetaList}>
                <div className={styles.detailMetaItem}>
                  <span>Статус групи</span>
                  <strong>
                    {data.group.status === "active" ? "Активна" : "Архів"}
                  </strong>
                </div>
                <div className={styles.detailMetaItem}>
                  <span>Створено</span>
                  <strong>{formatFullDate(data.group.createdAt)}</strong>
                </div>
                <div className={styles.detailMetaItem}>
                  <span>Оновлено</span>
                  <strong>{formatFullDate(data.group.updatedAt)}</strong>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isDirty || updateGroup.isPending}
              >
                <Save size={14} />
                {updateGroup.isPending ? "Збереження..." : "Зберегти параметри"}
              </button>
            </form>
          </section>

          <section className={`${styles.sectionPanel} panel`}>
            <div className={styles.sectionHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Tracked laws</span>
                <h2 className={styles.sectionTitle}>Закони під наглядом</h2>
              </div>
            </div>

            {/* Law add combobox */}
            <div className={styles.field} style={{ marginBottom: 16 }}>
              <input
                className="form-control"
                type="text"
                value={lawAddQuery}
                onChange={(e) => setLawAddQuery(e.target.value)}
                placeholder="Додати закон — почніть вводити назву або номер..."
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
                        if (!trackedLaws.find((l) => l._id === law._id)) {
                          setTrackedLaws((prev) => [...prev, law]);
                        }
                        setLawAddQuery("");
                        setLawSuggestions([]);
                      }}
                    >
                      <span className={styles.lawCode}>{law.code}</span>{" "}
                      {law.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!trackedLaws.length ? (
              <div className={styles.emptyState}>
                <BookOpen size={18} />
                <p>
                  У цієї групи ще не прив'язано законів. Саме вони визначають
                  зону моніторингу supervisor-а.
                </p>
              </div>
            ) : (
              <div className={styles.lawList}>
                {trackedLaws.map((law) => {
                  const lawRow =
                    data.monitoring.find((row) => row.law?._id === law._id) ??
                    null;
                  return (
                    <article key={law._id} className={styles.lawCard}>
                      <div>
                        <span className={styles.lawCode}>{law.code}</span>
                        <h3 className={styles.lawTitle}>{law.title}</h3>
                      </div>
                      <div className={styles.lawFooter}>
                        <span className={styles.lawNote}>
                          {lawRow
                            ? `${lawRow.changeCount} змін у потоці`
                            : "Ще без змін"}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                          }}
                        >
                          <Link
                            href={ROUTES.law(law._id)}
                            className={styles.inlineLink}
                          >
                            До закону
                            <ArrowUpRight size={14} />
                          </Link>
                          <button
                            type="button"
                            onClick={() =>
                              setTrackedLaws((prev) =>
                                prev.filter((l) => l._id !== law._id),
                              )
                            }
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--color-danger, #f39b9b)",
                              fontSize: "0.75rem",
                              padding: "2px 4px",
                            }}
                            title="Видалити закон"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>
    </section>
  );
}
