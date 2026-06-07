"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateShort } from "@/lib/utils";
import { formatSeverityLabel } from "./adminLabels";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminWorkspace.module.scss";

type SeverityFilter = "all" | "info" | "warning" | "security";

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

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Сьогодні";
  if (date.toDateString() === yesterday.toDateString()) return "Вчора";
  return date.toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
}

function exportAuditCSV(
  events: Array<{
    id: string;
    severity: string;
    action: string;
    detail: string;
    actor: string;
    createdAt: string;
  }>,
) {
  const header = "ID,Критичність,Дія,Деталі,Виконавець,Дата";
  const rows = events.map((e) =>
    [
      e.id,
      e.severity,
      `"${e.action}"`,
      `"${e.detail}"`,
      e.actor,
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
  const { snapshot, refreshSnapshot } = useAdminWorkspace();
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [query, setQuery] = useState("");
  const [lastPolledAt, setLastPolledAt] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      refreshSnapshot();
      setLastPolledAt(new Date());
    }, 30_000);
    return () => clearInterval(id);
  }, [refreshSnapshot]);

  const filteredEvents = useMemo(() => {
    if (!snapshot) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return snapshot.auditLog.filter((item) => {
      const matchesSeverity =
        filter === "all" ? true : item.severity === filter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : item.action.toLowerCase().includes(normalizedQuery) ||
            item.detail.toLowerCase().includes(normalizedQuery) ||
            item.actor.toLowerCase().includes(normalizedQuery);
      return matchesSeverity && matchesQuery;
    });
  }, [filter, query, snapshot]);

  const groupedEvents = useMemo(() => {
    const groups: { label: string; events: typeof filteredEvents }[] = [];
    let currentLabel: string | null = null;
    for (const event of filteredEvents) {
      const label = getDateGroup(event.createdAt);
      if (label !== currentLabel) {
        groups.push({ label, events: [event] });
        currentLabel = label;
      } else {
        groups[groups.length - 1].events.push(event);
      }
    }
    return groups;
  }, [filteredEvents]);

  const severityCounts = useMemo(() => {
    if (!snapshot) return { info: 0, warning: 0, security: 0 };
    return snapshot.auditLog.reduce(
      (acc, item) => {
        acc[item.severity as keyof typeof acc] += 1;
        return acc;
      },
      { info: 0, warning: 0, security: 0 },
    );
  }, [snapshot]);

  const hasActiveFilters = query !== "" || filter !== "all";

  if (!snapshot) return null;

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Аудит</span>
          <h2 className={styles.title}>
            Читабельна стрічка подій замість прихованого логу.
          </h2>
          <p className={styles.description}>
            Модуль аудиту зберігає те саме фронтенд-джерело подій, але подає
            його як окремий екран перевірки з фільтрами за критичністю, пошуком
            і чіткішим сигналом навколо безпекових операцій.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Поточна стрічка</span>
          <div className={styles.heroValue}>
            {snapshot.auditLog.length} подій
          </div>
          <div className={styles.heroMeta}>
            {severityCounts.security} безпекових, {severityCounts.warning}{" "}
            попереджень, {severityCounts.info} інформаційних
          </div>
        </aside>
      </section>

      <section className={`${styles.metricsGrid} ${styles.metricsGrid3}`}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Інфо</span>
          <strong className={styles.metricValue}>{severityCounts.info}</strong>
          <p className={styles.metricNote}>
            Загальні події, пов&apos;язані з автентифікацією та навігацією.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Попередження</span>
          <strong className={styles.metricValue}>
            {severityCounts.warning}
          </strong>
          <p className={styles.metricNote}>
            Зміни статусів, примусові виходи та підвищені операційні сигнали.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Безпека</span>
          <strong className={styles.metricValue}>
            {severityCounts.security}
          </strong>
          <p className={styles.metricNote}>
            Входи адмінів, ротації коду та білінг/безпеково-чутливі зміни.
          </p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Стрічка подій</span>
            <h3 className={styles.panelTitle}>
              Фільтрування та перегляд подій
            </h3>
          </div>
          <div className={styles.panelHeaderActions}>
            <span className={styles.updatedText}>
              Оновлено:{" "}
              {lastPolledAt.toLocaleTimeString("uk-UA", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => exportAuditCSV(filteredEvents)}
            >
              Експорт CSV
            </button>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={styles.toolbarInput}
            placeholder="Пошук за дією, деталями або виконавцем"
          />
          <div className={styles.filterTabs}>
            {(["all", "info", "warning", "security"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.filterTab} ${filter === value ? styles.filterTabActive : ""}`}
                onClick={() => setFilter(value)}
              >
                {formatSeverityLabel(value)}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearFiltersBtn}
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              ✕ Очистити
            </button>
          )}
        </div>

        <div className={styles.auditCount}>
          Знайдено {filteredEvents.length} з {snapshot.auditLog.length} подій
        </div>

        <div className={styles.feedViewport}>
          <div className={styles.auditList}>
            {groupedEvents.length > 0 ? (
              groupedEvents.map(({ label, events }) => (
                <div key={label}>
                  <div className={styles.auditDateGroup}>{label}</div>
                  {events.map((item) => {
                    const color = hashColor(item.actor);
                    return (
                      <div
                        key={item.id}
                        className={`${styles.auditRow} ${
                          item.severity === "security"
                            ? styles.auditRowSecurity
                            : ""
                        }`}
                      >
                        <div className={styles.auditRowHead}>
                          <div
                            className={styles.auditAvatar}
                            style={{
                              background: color.bg,
                              color: color.text,
                            }}
                          >
                            {item.actor.charAt(0).toUpperCase()}
                          </div>
                          <div className={styles.auditRowContent}>
                            <div className={styles.auditTitle}>
                              {item.action}
                            </div>
                            <div className={styles.auditActor}>
                              {item.actor}
                            </div>
                          </div>
                          <div className={styles.auditRowRight}>
                            <span
                              className={`${styles.auditBadge} ${
                                item.severity === "security"
                                  ? styles.auditBadgeSecurity
                                  : item.severity === "warning"
                                    ? styles.auditBadgeWarning
                                    : ""
                              }`}
                            >
                              {formatSeverityLabel(item.severity)}
                            </span>
                            <span className={styles.auditDate}>
                              {formatDateShort(item.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className={styles.auditDetail}>{item.detail}</div>
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
        </div>
      </section>
    </section>
  );
}
