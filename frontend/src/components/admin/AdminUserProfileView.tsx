"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronDown,
  UserCircle,
  Key,
  Zap,
  PowerOff,
  ArrowUpCircle,
  ShieldOff,
  Crown,
  LogOut,
  Eye,
  Search,
  FileText,
  Shield,
  AlertTriangle,
  Info,
  Activity,
  Globe,
  Lock,
  Download,
} from "lucide-react";
import {
  adminApi,
  AdminUserOverview,
  AdminAuditEntry,
  UserActivityEntry,
} from "@/lib/api/admin";
import { notify } from "@/lib/toast";
import { formatDateShort, formatDateFull } from "@/lib/utils";
import { formatPlanLabel } from "./adminLabels";
import styles from "./AdminUserProfile.module.scss";

/* ── helpers ─────────────────────────────────────── */
const AVATAR_COLORS = [
  { bg: "rgba(200,168,67,0.2)", text: "#c8a843" },
  { bg: "rgba(74,128,212,0.2)", text: "#4a80d4" },
  { bg: "rgba(82,183,136,0.2)", text: "#52b788" },
  { bg: "rgba(233,119,75,0.2)", text: "#e9774b" },
  { bg: "rgba(233,30,154,0.2)", text: "#e91e9a" },
  { bg: "rgba(139,195,74,0.2)", text: "#8bc34a" },
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const BILLING_PLANS = ["preview", "trial", "user", "plus", "pro"] as const;

const ROLE_LABELS: Record<string, string> = {
  user: "Клієнт",
  paid_user: "Платний клієнт",
  legislator: "Законотворець",
  supervisor: "Супервізер",
  admin: "Адмін",
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "Пряме відвідування",
  google: "Google Search",
  bing: "Bing Search",
  social: "Соціальні мережі",
  link: "Зовнішнє посилання",
  unknown: "Невідомо",
};

/* ── unified journal entry ───────────────────────── */
type JournalKind = "page_view" | "search" | "law_view" | "audit";

type JournalEntry = {
  id: string;
  kind: JournalKind;
  action: string;
  sub?: string;
  actor: string;
  role?: string;
  ip?: string | null;
  time: string;
};

function buildJournal(
  activity: UserActivityEntry[],
  audit: AdminAuditEntry[],
): JournalEntry[] {
  const actEntries: JournalEntry[] = activity.map((e) => ({
    id: e._id,
    kind: e.type as JournalKind,
    action:
      e.type === "page_view"
        ? (e.path ?? "Перегляд сторінки")
        : e.type === "search"
          ? `Пошук: "${e.query ?? ""}"`
          : `Закон: ${e.lawId ?? ""}`,
    sub:
      e.type === "page_view"
        ? "page_view"
        : e.type === "search"
          ? "search"
          : "law_view",
    actor: "Користувач",
    ip: e.ipAddress,
    time: e.createdAt,
  }));

  const auditEntries: JournalEntry[] = audit.map((e) => ({
    id: e._id,
    kind: "audit",
    action: e.action,
    sub: e.detail,
    actor: e.actor,
    role: "АДМІН",
    ip: e.ipAddress,
    time: e.createdAt,
  }));

  return [...actEntries, ...auditEntries].sort(
    (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
  );
}

function kindIcon(kind: JournalKind, severity?: string) {
  if (kind === "page_view")
    return { icon: Eye, bg: "rgba(74,128,212,0.12)", color: "#6aa1ff" };
  if (kind === "search")
    return { icon: Search, bg: "rgba(82,183,136,0.12)", color: "#52b788" };
  if (kind === "law_view")
    return { icon: FileText, bg: "rgba(200,168,67,0.12)", color: "#c8a843" };
  if (severity === "security")
    return { icon: Shield, bg: "rgba(233,119,75,0.12)", color: "#ffb39b" };
  if (severity === "warning")
    return {
      icon: AlertTriangle,
      bg: "rgba(200,168,67,0.12)",
      color: "#c8a843",
    };
  return { icon: Info, bg: "rgba(74,128,212,0.12)", color: "#6aa1ff" };
}

function exportJournalCSV(entries: JournalEntry[]) {
  const header = "Тип,Подія,Актор,Роль,Час,IP";
  const rows = entries.map((e) =>
    [e.kind, `"${e.action}"`, e.actor, e.role ?? "—", e.time, e.ip ?? "—"].join(
      ",",
    ),
  );
  const blob = new Blob([[header, ...rows].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `journal-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Skeleton ────────────────────────────────────── */
function SkeletonView() {
  return (
    <div className={styles.page}>
      <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
      <div className={styles.skeletonMetrics}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`${styles.skeleton} ${styles.skeletonMetricCard}`}
          />
        ))}
      </div>
      <div className={styles.skeletonWorkspace}>
        <div className={`${styles.skeleton} ${styles.skeletonPanel}`} />
        <div className={styles.skeletonSidebar}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`${styles.skeleton} ${styles.skeletonSideCard}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Collapsible side panel ──────────────────────── */
function SidePanel({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  defaultOpen = true,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.sidePanel}>
      <button
        type="button"
        className={styles.sidePanelHeader}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.sidePanelTitle}>
          <span
            className={styles.sidePanelIcon}
            style={{ background: iconBg, color: iconColor }}
          >
            <Icon size={13} />
          </span>
          {title}
        </span>
        <ChevronDown
          size={14}
          className={`${styles.sidePanelChevron} ${open ? styles.sidePanelChevronOpen : ""}`}
        />
      </button>
      {open && <div className={styles.sidePanelBody}>{children}</div>}
    </div>
  );
}

type Tab = "profile" | "activity";

/* ── Main component ──────────────────────────────── */
export function AdminUserProfileView({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>("profile");
  const [overview, setOverview] = useState<AdminUserOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actLoading, setActLoading] = useState(false);

  /* ── journal filters ── */
  const [kindFilter, setKindFilter] = useState<"all" | JournalKind>("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [journalLimit, setJournalLimit] = useState(25);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUserOverview(userId);
      setOverview(data);
    } catch {
      setError("Не вдалося завантажити дані користувача.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const act = useCallback(
    async (fn: () => Promise<unknown>, successMsg: string) => {
      setActLoading(true);
      try {
        await fn();
        notify.success(successMsg);
        await fetchOverview();
      } catch {
        notify.warning("Дію не виконано. Спробуйте ще раз.");
      } finally {
        setActLoading(false);
      }
    },
    [fetchOverview],
  );

  const journal = useMemo(
    () =>
      overview ? buildJournal(overview.activity, overview.auditEntries) : [],
    [overview],
  );

  const actors = useMemo(() => {
    const set = new Set<string>();
    journal.forEach((e) => set.add(e.actor));
    return Array.from(set);
  }, [journal]);

  const filteredJournal = useMemo(() => {
    let list = journal;
    if (kindFilter !== "all") list = list.filter((e) => e.kind === kindFilter);
    if (actorFilter !== "all")
      list = list.filter((e) => e.actor === actorFilter);
    return list;
  }, [journal, kindFilter, actorFilter]);

  if (loading) return <SkeletonView />;

  if (error || !overview) {
    return (
      <div className={styles.stateScreen}>
        <div className={styles.stateText}>
          {error ?? "Користувача не знайдено."}
        </div>
        <Link href="/admin/users" className={styles.backLink}>
          ← Повернутися
        </Link>
      </div>
    );
  }

  const { user, stats, tracking, verifiedResources } = overview;
  const isAdmin = user.role === "admin";
  const isLegislator = user.role === "legislator";
  const isSupervisor = user.role === "supervisor";
  const isActive = user.status === "active";
  const avatarColor = hashColor(user.fullName);

  const visibleJournal = filteredJournal.slice(0, journalLimit);

  return (
    <div className={styles.page}>
      <Link href="/admin/users" className={styles.backLink}>
        <ChevronLeft size={13} />
        Користувачі
      </Link>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div
          className={styles.avatar}
          style={{ background: avatarColor.bg, color: avatarColor.text }}
        >
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className={styles.heroInfo}>
          <div className={styles.heroNameRow}>
            <h1 className={styles.heroName}>{user.fullName}</h1>
            <span
              className={isActive ? styles.badgeAccent : styles.badgeDanger}
            >
              {isActive ? "Активний" : "Неактивний"}
            </span>
          </div>
          <div className={styles.heroEmail}>{user.email}</div>
          <div className={styles.heroId}>ID: …{user._id.slice(-8)}</div>
        </div>
        <div className={styles.heroMeta}>
          <div className={styles.heroMetaCell}>
            <span className={styles.heroMetaLabel}>Роль</span>
            <span className={styles.heroMetaValue}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <div className={styles.heroMetaCell}>
            <span className={styles.heroMetaLabel}>План</span>
            <span className={styles.heroMetaValue}>
              {formatPlanLabel(user.billingPlan)}
            </span>
          </div>
          <div className={styles.heroMetaCell}>
            <span className={styles.heroMetaLabel}>Остання активність</span>
            <span className={styles.heroMetaValue}>
              {user.lastLoginAt ? (
                <>
                  <span className={styles.heroMetaDot} />
                  {formatDateShort(user.lastLoginAt)}
                </>
              ) : (
                "—"
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === "profile" ? styles.tabActive : ""}`}
          onClick={() => setTab("profile")}
        >
          Профіль
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === "activity" ? styles.tabActive : ""}`}
          onClick={() => setTab("activity")}
        >
          Активність
          {stats.totalEvents + stats.pageViews + stats.searches > 0 && (
            <span className={styles.tabCount}>
              {stats.totalEvents + stats.pageViews + stats.searches}
            </span>
          )}
        </button>
      </div>

      {/* ── PROFILE TAB ── */}
      {tab === "profile" && (
        <div className={styles.content}>
          <div className={styles.infoGrid}>
            {/* Account card */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span
                  className={styles.cardTitleIcon}
                  style={{
                    background: "rgba(74,128,212,0.12)",
                    color: "#6aa1ff",
                  }}
                >
                  <UserCircle size={13} />
                </span>
                Деталі акаунта
              </div>
              <dl className={styles.dl}>
                <dt>Роль</dt>
                <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
                <dt>Статус</dt>
                <dd className={isActive ? styles.accent : styles.danger}>
                  {isActive ? "Активний" : "Неактивний"}
                </dd>
                <dt>Зареєстровано</dt>
                <dd>{formatDateFull(user.createdAt)}</dd>
                <dt>Оновлено</dt>
                <dd>{formatDateShort(user.updatedAt)}</dd>
              </dl>
            </div>

            {/* Billing card */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span
                  className={styles.cardTitleIcon}
                  style={{
                    background: "rgba(200,168,67,0.12)",
                    color: "#c8a843",
                  }}
                >
                  <Key size={13} />
                </span>
                Доступ і план
              </div>
              <dl className={styles.dl}>
                <dt>Поточний план</dt>
                <dd className={styles.accent}>
                  {formatPlanLabel(user.billingPlan)}
                </dd>
              </dl>
              <div className={styles.modulesLabel}>Права та модулі</div>
              <div className={styles.planRow}>
                {BILLING_PLANS.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    disabled={actLoading || user.billingPlan === plan}
                    className={`${styles.planBtn} ${user.billingPlan === plan ? styles.planBtnActive : ""}`}
                    onClick={() =>
                      act(
                        () => adminApi.setUserBilling(user._id, plan),
                        `План змінено на «${formatPlanLabel(plan)}».`,
                      )
                    }
                  >
                    {formatPlanLabel(plan)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions card */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span
                  className={styles.cardTitleIcon}
                  style={{
                    background: "rgba(233,119,75,0.12)",
                    color: "#ffb39b",
                  }}
                >
                  <Zap size={13} />
                </span>
                Дії
              </div>
              <div className={styles.actionsList}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  disabled={actLoading}
                  onClick={() =>
                    act(
                      () =>
                        adminApi.setUserStatus(
                          user._id,
                          isActive ? "inactive" : "active",
                        ),
                      isActive ? "Акаунт деактивовано." : "Акаунт активовано.",
                    )
                  }
                >
                  <PowerOff size={14} />
                  {isActive ? "Деактивувати" : "Активувати"}
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  disabled={actLoading}
                  onClick={() =>
                    act(
                      () =>
                        adminApi.setUserRole(
                          user._id,
                          isAdmin ? "user" : "admin",
                        ),
                      isAdmin
                        ? "Права адміна знято."
                        : "Акаунт підвищено до адміна.",
                    )
                  }
                >
                  {isAdmin ? (
                    <ShieldOff size={14} />
                  ) : (
                    <ArrowUpCircle size={14} />
                  )}
                  {isAdmin ? "Знизити до клієнта" : "Підвищити до адміна"}
                </button>
                {!isAdmin && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={actLoading}
                    onClick={() =>
                      act(
                        () =>
                          adminApi.setUserRole(
                            user._id,
                            isLegislator ? "user" : "legislator",
                          ),
                        isLegislator
                          ? "Роль законотворця знято."
                          : "Призначено законотворцем.",
                      )
                    }
                  >
                    <ShieldOff size={14} />
                    {isLegislator
                      ? "Зняти роль законотворця"
                      : "Призначити законотворцем"}
                  </button>
                )}
                {!isAdmin && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={actLoading}
                    onClick={() =>
                      act(
                        () =>
                          adminApi.setUserRole(
                            user._id,
                            isSupervisor ? "user" : "supervisor",
                          ),
                        isSupervisor
                          ? "Роль супервізера знято."
                          : "Призначено супервізером.",
                      )
                    }
                  >
                    <Crown size={14} />
                    {isSupervisor
                      ? "Зняти роль супервізера"
                      : "Призначити супервізером"}
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  disabled={actLoading}
                  onClick={() =>
                    act(
                      () => adminApi.forceLogout(user._id),
                      "Примусовий вихід виконано.",
                    )
                  }
                >
                  <LogOut size={14} />
                  Примусовий вихід
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACTIVITY TAB ── */}
      {tab === "activity" && (
        <>
          {/* 4 metric cards */}
          <div className={styles.metricsRow}>
            <div className={styles.metricCard}>
              <span
                className={styles.metricIconBadge}
                style={{
                  background: "rgba(74,128,212,0.12)",
                  color: "#6aa1ff",
                }}
              >
                <Activity size={14} />
              </span>
              <span className={styles.metricLabel}>Події</span>
              <strong className={styles.metricValue}>
                {stats.totalEvents}
              </strong>
            </div>
            <div className={styles.metricCard}>
              <span
                className={styles.metricIconBadge}
                style={{
                  background: "rgba(82,183,136,0.12)",
                  color: "#52b788",
                }}
              >
                <Eye size={14} />
              </span>
              <span className={styles.metricLabel}>Перегляди</span>
              <strong className={styles.metricValue}>{stats.pageViews}</strong>
            </div>
            <div className={styles.metricCard}>
              <span
                className={styles.metricIconBadge}
                style={{
                  background: "rgba(200,168,67,0.12)",
                  color: "#c8a843",
                }}
              >
                <Search size={14} />
              </span>
              <span className={styles.metricLabel}>Пошуки</span>
              <strong className={styles.metricValue}>{stats.searches}</strong>
            </div>
            <div className={styles.metricCard}>
              <span
                className={styles.metricIconBadge}
                style={{
                  background: "rgba(233,119,75,0.12)",
                  color: "#ffb39b",
                }}
              >
                <Globe size={14} />
              </span>
              <span className={styles.metricLabel}>Ресурси</span>
              <strong className={styles.metricValue}>
                {verifiedResources.length || stats.lawViews}
              </strong>
            </div>
          </div>

          {/* 2-column workspace */}
          <div className={styles.workspace}>
            {/* Left: unified journal */}
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Журнал</span>
                  <h3 className={styles.panelTitle}>Журнал активності</h3>
                </div>
              </div>

              {/* Toolbar */}
              <div className={styles.toolbar}>
                <select
                  className={styles.toolbarSelect}
                  value={kindFilter}
                  onChange={(e) => {
                    setKindFilter(e.target.value as typeof kindFilter);
                    setJournalLimit(25);
                  }}
                >
                  <option value="all">Тип подій: Усі</option>
                  <option value="page_view">Перегляди</option>
                  <option value="search">Пошуки</option>
                  <option value="law_view">Закони</option>
                  <option value="audit">Адмін-події</option>
                </select>
                <select
                  className={styles.toolbarSelect}
                  value={actorFilter}
                  onChange={(e) => {
                    setActorFilter(e.target.value);
                    setJournalLimit(25);
                  }}
                >
                  <option value="all">Актор: Усі</option>
                  {actors.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={styles.toolbarBtn}
                  onClick={() => exportJournalCSV(filteredJournal)}
                >
                  <Download size={13} />
                  Експорт
                </button>
              </div>

              {/* Table head */}
              <div className={styles.journalHead}>
                <span />
                <span>Подія</span>
                <span>Актор</span>
                <span>Роль</span>
                <span>Час</span>
                <span>Джерело</span>
              </div>

              {/* Rows */}
              {visibleJournal.length === 0 ? (
                <div className={styles.journalEmpty}>Подій не знайдено</div>
              ) : (
                visibleJournal.map((entry) => {
                  const auditEntry = overview.auditEntries.find(
                    (a) => a._id === entry.id,
                  );
                  const {
                    icon: IconComp,
                    bg,
                    color,
                  } = kindIcon(entry.kind, auditEntry?.severity);
                  return (
                    <div key={entry.id} className={styles.journalRow}>
                      <span
                        className={styles.journalIcon}
                        style={{ background: bg, color }}
                      >
                        <IconComp size={13} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.journalAction}>
                          {entry.action}
                        </div>
                        {entry.sub && entry.sub !== entry.action && (
                          <div className={styles.journalSub}>{entry.sub}</div>
                        )}
                      </div>
                      <span className={styles.journalActor}>{entry.actor}</span>
                      <span className={styles.journalRole}>
                        {entry.role ?? "—"}
                      </span>
                      <span className={styles.journalTime}>
                        {formatDateShort(entry.time)}
                      </span>
                      <span className={styles.journalIp}>
                        {entry.ip ?? "—"}
                      </span>
                    </div>
                  );
                })
              )}

              {filteredJournal.length > journalLimit && (
                <button
                  type="button"
                  className={styles.showMore}
                  onClick={() => setJournalLimit((l) => l + 25)}
                >
                  Показати ще ({filteredJournal.length - journalLimit}{" "}
                  залишилось)
                </button>
              )}
            </div>

            {/* Right: sidebar panels */}
            <div className={styles.sidebar}>
              {/* Tracking status */}
              <SidePanel
                icon={Activity}
                iconBg="rgba(74,128,212,0.12)"
                iconColor="#6aa1ff"
                title="Стан трекінгу"
              >
                <div className={styles.sidePanelRow}>
                  <span className={styles.sidePanelKey}>Трекінг подій</span>
                  <span
                    className={`${styles.sidePanelVal} ${styles.statusDot}`}
                  >
                    Увімкнено
                  </span>
                </div>
                <div className={styles.sidePanelRow}>
                  <span className={styles.sidePanelKey}>Збір логів</span>
                  <span
                    className={`${styles.sidePanelVal} ${styles.statusDot}`}
                  >
                    Активний
                  </span>
                </div>
                <div className={styles.sidePanelRow}>
                  <span className={styles.sidePanelKey}>Зберігання логів</span>
                  <span className={styles.sidePanelVal}>
                    {tracking.retentionDays} днів
                  </span>
                </div>
                <div className={styles.sidePanelRow}>
                  <span className={styles.sidePanelKey}>Останнє оновлення</span>
                  <span className={styles.sidePanelVal}>
                    {tracking.lastUpdatedAt
                      ? formatDateShort(tracking.lastUpdatedAt)
                      : "—"}
                  </span>
                </div>
              </SidePanel>

              {/* Verified resources */}
              <SidePanel
                icon={Globe}
                iconBg="rgba(82,183,136,0.12)"
                iconColor="#52b788"
                title="Перевірені ресурси"
              >
                {verifiedResources.length === 0 ? (
                  <div className={styles.sidePanelRow}>
                    <span className={styles.sidePanelKey}>
                      {user.registrationSource?.source === "direct"
                        ? "Прямий вхід"
                        : user.registrationSource?.source
                          ? SOURCE_LABELS[user.registrationSource.source]
                          : "Джерело невідоме"}
                    </span>
                  </div>
                ) : (
                  verifiedResources.map((r, i) => (
                    <div key={i} style={{ paddingBottom: 6 }}>
                      <div className={styles.resourceUrl}>{r.url}</div>
                      <div className={styles.sidePanelRow}>
                        <span className={styles.sidePanelKey}>Статус</span>
                        <span
                          className={`${styles.sidePanelVal} ${styles.statusDot}`}
                        >
                          Активне
                        </span>
                      </div>
                      <div className={styles.sidePanelRow}>
                        <span className={styles.sidePanelKey}>Перевірено</span>
                        <span className={styles.sidePanelVal}>
                          {formatDateShort(r.verifiedAt)}
                        </span>
                      </div>
                      <div className={styles.sidePanelRow}>
                        <span className={styles.sidePanelKey}>Тип</span>
                        <span className={styles.sidePanelVal}>
                          {SOURCE_LABELS[r.source] ?? r.source}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </SidePanel>

              {/* Sessions & Security */}
              <SidePanel
                icon={Lock}
                iconBg="rgba(200,168,67,0.12)"
                iconColor="#c8a843"
                title="Сесії та безпека"
              >
                <div className={styles.sidePanelRow}>
                  <span className={styles.sidePanelKey}>Останній вхід</span>
                  <span className={styles.sidePanelVal}>
                    {user.lastLoginAt ? formatDateShort(user.lastLoginAt) : "—"}
                  </span>
                </div>
                <div className={styles.sidePanelRow}>
                  <span className={styles.sidePanelKey}>IP-адреса</span>
                  <span className={styles.sidePanelVal}>
                    {user.lastLoginIp ?? "—"}
                  </span>
                </div>
                <div className={styles.sidePanelRow}>
                  <span className={styles.sidePanelKey}>Пристрій</span>
                  <span className={styles.sidePanelVal}>
                    {user.lastLoginDevice ?? "—"}
                  </span>
                </div>
                <div className={styles.sidePanelSessions}>
                  <span className={styles.sidePanelKey}>Активні сесії</span>
                  <button
                    type="button"
                    className={styles.sidePanelSessionsLink}
                    onClick={() =>
                      act(
                        () => adminApi.forceLogout(user._id),
                        "Примусовий вихід виконано.",
                      )
                    }
                  >
                    Завершити сесії
                  </button>
                </div>
              </SidePanel>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
