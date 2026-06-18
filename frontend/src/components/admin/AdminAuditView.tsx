"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  Search,
  Download,
  Maximize2,
  MoreVertical,
  ChevronDown,
  Globe,
  UserX,
  ExternalLink,
  AlertOctagon,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { AuditBadge } from "@/admin/components/AuditBadge/AuditBadge";
import { useAuditFeed } from "./useAuditFeed";
import styles from "./AdminAudit.module.scss";

type Sev = "info" | "warning" | "security";

const AVATAR_COLORS = [
  { bg: "rgba(200,168,67,0.22)", text: "#c8a843" },
  { bg: "rgba(74,128,212,0.22)", text: "#4a80d4" },
  { bg: "rgba(82,183,136,0.22)", text: "#52b788" },
  { bg: "rgba(233,119,75,0.22)", text: "#e9774b" },
  { bg: "rgba(233,30,154,0.22)", text: "#e91e9a" },
  { bg: "rgba(139,195,74,0.22)", text: "#8bc34a" },
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Сьогодні";
  if (date.toDateString() === yesterday.toDateString()) return "Вчора";
  return date.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

function SeverityIcon({ sev }: { sev: Sev }) {
  if (sev === "security")
    return (
      <span className={`${styles.eventIconWrap} ${styles.security}`}>
        <ShieldAlert size={13} className={styles.eventIconSecurity} />
      </span>
    );
  if (sev === "warning")
    return (
      <span className={`${styles.eventIconWrap} ${styles.warning}`}>
        <AlertTriangle size={13} className={styles.eventIconWarning} />
      </span>
    );
  return (
    <span className={`${styles.eventIconWrap} ${styles.info}`}>
      <Info size={13} className={styles.eventIconInfo} />
    </span>
  );
}

function exportCSV(
  events: Array<{
    _id: string;
    severity: string;
    action: string;
    detail: string;
    actor: string;
    ipAddress?: string | null;
    createdAt: string;
  }>,
) {
  const header = "ID,Критичність,Дія,Деталі,Виконавець,IP,Дата";
  const rows = events.map((e) =>
    [
      e._id,
      e.severity,
      `"${e.action}"`,
      `"${e.detail}"`,
      e.actor,
      e.ipAddress ?? "",
      e.createdAt,
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminAuditView() {
  const {
    events,
    filteredCount,
    totalCount,
    overview,
    loading,
    lastSyncAt,
    query,
    setQuery,
    severity,
    setSeverity,
    actor,
    setActor,
    uniqueActors,
    showMore,
    hasMore,
    refresh,
  } = useAuditFeed();

  const groupedEvents = useMemo(() => {
    const groups: { label: string; events: typeof events }[] = [];
    let current: string | null = null;
    for (const e of events) {
      const label = getDateGroup(e.createdAt);
      if (label !== current) {
        groups.push({ label, events: [e] });
        current = label;
      } else {
        groups[groups.length - 1].events.push(e);
      }
    }
    return groups;
  }, [events]);

  const syncStr = lastSyncAt.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const { bySeverity, lastHourDelta, streamPercent, securitySignals } =
    overview;

  const router = useRouter();

  if (loading) return null;

  return (
    <section className={styles.page}>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Аудит</span>
          <h2 className={styles.title}>Журнал аудиту</h2>
          <p className={styles.description}>
            Моніторинг безпеки та операційних подій у реальному часі
          </p>
        </div>

        <div className={styles.heroStream}>
          <span className={styles.heroStreamLabel}>Поточний потік подій</span>
          <span className={styles.heroStreamTotal}>{overview.total} подій</span>
          <div className={styles.heroStreamRows}>
            {(
              [
                {
                  key: "security",
                  label: "Безпека",
                  Icon: ShieldAlert,
                  color: "#f08080",
                },
                {
                  key: "warning",
                  label: "Попередження",
                  Icon: AlertTriangle,
                  color: "#c8a843",
                },
                { key: "info", label: "Інфо", Icon: Info, color: "#4a80d4" },
                {
                  key: "critical",
                  label: "Критичні",
                  Icon: AlertOctagon,
                  color: "#9b5de5",
                },
              ] as const
            ).map(({ key, label, Icon, color }) => (
              <div key={key} className={styles.heroStreamRow}>
                <Icon size={11} style={{ color, flexShrink: 0 }} />
                <span>{label}</span>
                <span className={styles.heroStreamCount}>
                  {bySeverity[key]}&nbsp;({streamPercent[key]}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── KPI ROW ──────────────────────────────────────── */}
      <section className={styles.kpiRow}>
        {(
          [
            {
              dot: "total",
              label: "Загалом",
              val: overview.total,
              delta: lastHourDelta.total,
            },
            {
              dot: "security",
              label: "Безпека",
              val: bySeverity.security,
              delta: lastHourDelta.security,
            },
            {
              dot: "warning",
              label: "Попередження",
              val: bySeverity.warning,
              delta: lastHourDelta.warning,
            },
            {
              dot: "info",
              label: "Інфо",
              val: bySeverity.info,
              delta: lastHourDelta.info,
            },
            {
              dot: "critical",
              label: "Критичні",
              val: bySeverity.critical,
              delta: lastHourDelta.critical,
            },
          ] as const
        ).map(({ dot, label, val, delta }) => (
          <article key={label} className={styles.kpiCard}>
            <span className={styles.kpiLabel}>
              <span className={`${styles.kpiDot} ${styles[dot]}`} />
              {label}
            </span>
            <strong className={styles.kpiValue}>{val}</strong>
            <span
              className={`${styles.kpiDelta}${delta === 0 ? ` ${styles.zero}` : ""}`}
            >
              +{delta} за останню годину
            </span>
          </article>
        ))}
      </section>

      {/* ── WORKSPACE ────────────────────────────────────── */}
      <div className={styles.workspace}>
        {/* LEFT: event stream */}
        <section className={styles.streamPanel}>
          <div className={styles.streamHeader}>
            <span className={styles.streamTitle}>Стрічка подій</span>
            <span className={styles.streamMeta}>Оновлено: {syncStr}</span>
            <button
              type="button"
              className={styles.exportBtn}
              onClick={() => exportCSV(events)}
            >
              <Download size={12} />
              Експорт CSV
            </button>
          </div>

          <div className={styles.toolbar}>
            <div className={styles.toolbarSearchWrap}>
              <Search size={12} className={styles.toolbarSearchIcon} />
              <input
                className={styles.toolbarSearch}
                placeholder="Пошук подій, акторів..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <select
              className={styles.toolbarSelect}
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="all">Рівень: Усі</option>
              <option value="security">Безпека</option>
              <option value="warning">Попередження</option>
              <option value="info">Інфо</option>
            </select>

            <select
              className={styles.toolbarSelect}
              value={actor}
              onChange={(e) => setActor(e.target.value)}
            >
              <option value="all">Актор: Усі</option>
              {uniqueActors.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

            <button
              type="button"
              className={styles.toolbarExpandBtn}
              onClick={refresh}
              title="Оновити"
            >
              <Maximize2 size={12} />
            </button>
          </div>

          <div className={styles.foundCount}>
            Знайдено {filteredCount} з {totalCount} подій
          </div>

          <div className={styles.tableHead}>
            <span className={styles.tableHeadCell}>Подія</span>
            <span className={styles.tableHeadCell}>Актор</span>
            <span className={styles.tableHeadCell}>Категорія</span>
            <span className={styles.tableHeadCell}>Час</span>
            <span className={styles.tableHeadCell}>Джерело</span>
            <span className={styles.tableHeadCell} />
          </div>

          <div className={styles.tableScroll}>
            {groupedEvents.length > 0 ? (
              groupedEvents.map(({ label, events: grpEvents }) => (
                <div key={label}>
                  <div className={styles.dateGroup}>{label}</div>
                  {grpEvents.map((item) => {
                    const color = hashColor(item.actor);
                    const sev = item.severity as Sev;
                    return (
                      <div
                        key={item._id}
                        className={`${styles.tableRow}${sev === "security" ? ` ${styles.rowSecurity}` : ""}`}
                      >
                        <div className={styles.eventCell}>
                          <SeverityIcon sev={sev} />
                          <div className={styles.eventBody}>
                            <div className={styles.eventTitle}>
                              {item.action}
                            </div>
                            {item.detail && (
                              <div className={styles.eventDetail}>
                                {item.detail}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={styles.actorCell}>
                          <div
                            className={styles.actorAvatar}
                            style={{ background: color.bg, color: color.text }}
                          >
                            {item.actor.charAt(0).toUpperCase()}
                          </div>
                          <span className={styles.actorName}>{item.actor}</span>
                        </div>

                        <div className={styles.categoryCell}>
                          <AuditBadge
                            severity={sev}
                            label={
                              sev === "security"
                                ? "Безпека"
                                : sev === "warning"
                                  ? "Попередження"
                                  : "Інфо"
                            }
                          />
                        </div>

                        <span className={styles.timeCell}>
                          {formatDateShort(item.createdAt)}
                        </span>

                        <span className={styles.sourceCell}>
                          {item.ipAddress ?? "—"}
                        </span>

                        <button
                          type="button"
                          className={styles.menuBtn}
                          title={`Фільтрувати: ${item.actor}`}
                          onClick={() => setActor(item.actor)}
                        >
                          <MoreVertical size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                За поточними фільтрами не знайдено жодного запису аудиту.
              </div>
            )}
          </div>

          {hasMore && (
            <button
              type="button"
              className={styles.showMoreBtn}
              onClick={showMore}
            >
              Показати ще
              <ChevronDown size={13} />
            </button>
          )}
        </section>

        {/* RIGHT RAIL */}
        <aside className={styles.rail}>
          {/* Стан потоку */}
          <article className={styles.railCard}>
            <div className={styles.railCardHeader}>
              <span className={styles.railCardTitle}>Стан потоку</span>
              <span className={styles.liveIndicator}>
                <span className={styles.liveDot} />У реальному часі
              </span>
            </div>
            {[
              { key: "Збір логів", val: "Активний", green: true },
              {
                key: "Цілісність журналу",
                val: `${overview.integrityPercent}%`,
                green: false,
              },
              { key: "Остання синхронізація", val: syncStr, green: false },
              {
                key: "Зберігання логів",
                val: `${overview.retentionDays} дн`,
                green: false,
              },
              {
                key: "Ретенція подій",
                val: `${overview.retentionDays} дн`,
                green: false,
              },
            ].map(({ key, val, green }) => (
              <div key={key} className={styles.statusRow}>
                <span className={styles.statusKey}>{key}</span>
                <span
                  className={`${styles.statusVal}${green ? ` ${styles.green}` : ""}`}
                >
                  {val}
                </span>
              </div>
            ))}
            <button
              type="button"
              className={styles.statusLink}
              onClick={() => router.push(ROUTES.adminUsers)}
            >
              Переглянути деталі
              <ExternalLink size={10} />
            </button>
          </article>

          {/* Швидкі фільтри */}
          <article className={styles.railCard}>
            <div className={styles.railCardHeader}>
              <span className={styles.railCardTitle}>Швидкі фільтри</span>
            </div>
            {(
              [
                {
                  dot: "security",
                  label: "Безпека",
                  count: bySeverity.security,
                },
                {
                  dot: "warning",
                  label: "Попередження",
                  count: bySeverity.warning,
                },
                { dot: "info", label: "Інформаційні", count: bySeverity.info },
                {
                  dot: "critical",
                  label: "Критичні",
                  count: bySeverity.critical,
                },
              ] as const
            ).map(({ dot, label, count }) => (
              <div
                key={label}
                className={styles.filterRow}
                onClick={() =>
                  setSeverity(
                    dot === "critical" ? "all" : severity === dot ? "all" : dot,
                  )
                }
              >
                <span className={`${styles.filterDot} ${styles[dot]}`} />
                <span className={styles.filterLabel}>{label}</span>
                <span className={styles.filterCount}>{count}</span>
              </div>
            ))}
            <button
              type="button"
              className={styles.filterAllLink}
              onClick={() => setSeverity("all")}
            >
              Усі категорії →
            </button>
          </article>

          {/* Сигнали безпеки */}
          <article className={styles.railCard}>
            <div className={styles.railCardHeader}>
              <span className={styles.railCardTitle}>Сигнали безпеки</span>
            </div>

            <div className={styles.signalRow}>
              <span className={styles.signalIconWrap}>
                <ShieldAlert size={13} className={styles.eventIconSecurity} />
              </span>
              <div className={styles.signalInfo}>
                <div className={styles.signalTitle}>
                  Невдалі входи
                  <span className={styles.signalBadge}>
                    {securitySignals.failedLogins}
                  </span>
                </div>
                <div className={styles.signalMeta}>Останні 24 години</div>
              </div>
            </div>

            <div className={styles.signalRow}>
              <span className={styles.signalIconWrapGold}>
                <UserX size={13} className={styles.eventIconWarning} />
              </span>
              <div className={styles.signalInfo}>
                <div className={styles.signalTitle}>
                  Неочікувані зміни ролей
                  <span className={styles.signalBadge}>
                    {securitySignals.roleChanges}
                  </span>
                </div>
                <div className={styles.signalMeta}>Останні 24 години</div>
              </div>
            </div>

            <div className={styles.signalRow}>
              <span className={styles.signalIconWrapBlue}>
                <Globe size={13} className={styles.eventIconInfo} />
              </span>
              <div className={styles.signalInfo}>
                <div className={styles.signalTitle}>
                  Підключення з нових IP
                  <span className={styles.signalBadgeBlue}>
                    {securitySignals.newIps}
                  </span>
                </div>
                <div className={styles.signalMeta}>Останні 24 години</div>
              </div>
            </div>

            <button
              type="button"
              className={styles.consoleBtn}
              onClick={() => setSeverity("security")}
            >
              <ShieldAlert size={12} />
              Відкрити консоль безпеки
            </button>
          </article>
        </aside>
      </div>
    </section>
  );
}
