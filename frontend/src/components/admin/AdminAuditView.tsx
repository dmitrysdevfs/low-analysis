"use client";

import { useMemo, useState } from "react";
import { formatDateShort } from "@/lib/utils";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminWorkspace.module.scss";

type SeverityFilter = "all" | "info" | "warning" | "security";

function formatSeverityLabel(value: SeverityFilter | "info" | "warning" | "security") {
  if (value === "security") {
    return "Security";
  }
  if (value === "warning") {
    return "Warning";
  }
  if (value === "info") {
    return "Info";
  }
  return "All";
}

export function AdminAuditView() {
  const { snapshot } = useAdminWorkspace();
  const [filter, setFilter] = useState<SeverityFilter>("all");
  const [query, setQuery] = useState("");

  const filteredEvents = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return snapshot.auditLog.filter((item) => {
      const matchesSeverity = filter === "all" ? true : item.severity === filter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : item.action.toLowerCase().includes(normalizedQuery) ||
            item.detail.toLowerCase().includes(normalizedQuery) ||
            item.actor.toLowerCase().includes(normalizedQuery);

      return matchesSeverity && matchesQuery;
    });
  }, [filter, query, snapshot]);

  const severityCounts = useMemo(() => {
    if (!snapshot) {
      return { info: 0, warning: 0, security: 0 };
    }

    return snapshot.auditLog.reduce(
      (acc, item) => {
        acc[item.severity] += 1;
        return acc;
      },
      { info: 0, warning: 0, security: 0 },
    );
  }, [snapshot]);

  if (!snapshot) {
    return null;
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Audit</span>
          <h2 className={styles.title}>Readable event feed instead of a hidden log.</h2>
          <p className={styles.description}>
            The audit module keeps the same frontend event source, but upgrades it
            into a dedicated review screen with severity filters, search and a
            clearer signal around security-relevant operations.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Current feed</span>
          <div className={styles.heroValue}>{snapshot.auditLog.length} events</div>
          <div className={styles.heroMeta}>
            {severityCounts.security} security · {severityCounts.warning} warning ·{" "}
            {severityCounts.info} info
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Info</span>
          <strong className={styles.metricValue}>{severityCounts.info}</strong>
          <p className={styles.metricNote}>General auth and navigation related events.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Warning</span>
          <strong className={styles.metricValue}>{severityCounts.warning}</strong>
          <p className={styles.metricNote}>Status changes, force logout actions and elevated operational signals.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Security</span>
          <strong className={styles.metricValue}>{severityCounts.security}</strong>
          <p className={styles.metricNote}>Admin logins, code rotations and billing/security-sensitive changes.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Visible</span>
          <strong className={styles.metricValue}>{filteredEvents.length}</strong>
          <p className={styles.metricNote}>Events currently matching the active filter and search query.</p>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Event feed</span>
            <h3 className={styles.panelTitle}>Filter and inspect events</h3>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={styles.toolbarInput}
            placeholder="Search by action, detail or actor"
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
        </div>

        <div className={styles.feedViewport}>
          <div className={styles.auditList}>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((item) => (
                <div key={item.id} className={styles.auditRow}>
                  <div className={styles.auditMeta}>
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
                    <span>{formatDateShort(item.createdAt)}</span>
                    <span>{item.actor}</span>
                  </div>
                  <div className={styles.auditTitle}>{item.action}</div>
                  <div className={styles.auditDetail}>{item.detail}</div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                No audit records match the current filters.
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
