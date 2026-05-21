"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { formatDateShort } from "@/lib/utils";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminWorkspace.module.scss";

type PlanFilter =
  | "all"
  | "preview"
  | "trial"
  | "user"
  | "plus"
  | "pro"
  | "admin";

type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

function buildDonutStops(segments: DonutSegment[]) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  if (!total) {
    return "rgba(255,255,255,0.08) 0 100%";
  }

  let cursor = 0;
  return segments
    .filter((segment) => segment.value > 0)
    .map((segment) => {
      const start = cursor;
      cursor += (segment.value / total) * 100;
      return `${segment.color} ${start}% ${cursor}%`;
    })
    .join(", ");
}

export function AdminBillingView() {
  const {
    snapshot,
    billingRegistry,
    billingCounts,
    clientPlanIds,
    handleAssignPlan,
  } = useAdminWorkspace();
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [query, setQuery] = useState("");

  const filteredRegistry = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return billingRegistry.filter((account) => {
      const currentPlan = account.subscription.planId ?? "preview";
      const matchesFilter =
        planFilter === "all"
          ? true
          : planFilter === "admin"
            ? account.accountType === "admin"
            : currentPlan === planFilter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : account.displayName.toLowerCase().includes(normalizedQuery) ||
            account.email.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [billingRegistry, planFilter, query]);

  const billingSegments = useMemo<DonutSegment[]>(
    () => [
      { label: "Preview", value: billingCounts.preview, color: "#4a80d4" },
      { label: "Trial", value: billingCounts.trial, color: "#6aa1ff" },
      { label: "User", value: billingCounts.user, color: "#93b7ff" },
      { label: "Plus", value: billingCounts.plus, color: "#c8a843" },
      { label: "Pro", value: billingCounts.pro, color: "#f2d675" },
      { label: "Admin", value: billingCounts.admin, color: "#e9774b" },
    ],
    [billingCounts],
  );

  const donutStyle = useMemo(
    () =>
      ({
        "--donut-stops": buildDonutStops(billingSegments),
      }) as CSSProperties,
    [billingSegments],
  );

  const quotaHealth = useMemo(() => {
    const billableAccounts = billingRegistry.filter(
      (account) =>
        account.accountType === "client" &&
        account.subscription.searchLimit !== null &&
        account.subscription.viewLimit !== null,
    );

    if (billableAccounts.length === 0) {
      return { search: 0, view: 0 };
    }

    const search =
      billableAccounts.reduce((sum, account) => {
        const limit = account.subscription.searchLimit ?? 0;
        return sum + (limit ? account.subscription.searchUsed / limit : 0);
      }, 0) / billableAccounts.length;

    const view =
      billableAccounts.reduce((sum, account) => {
        const limit = account.subscription.viewLimit ?? 0;
        return sum + (limit ? account.subscription.viewUsed / limit : 0);
      }, 0) / billableAccounts.length;

    return {
      search: Math.round(search * 100),
      view: Math.round(view * 100),
    };
  }, [billingRegistry]);

  const paidAccounts =
    billingCounts.user + billingCounts.plus + billingCounts.pro;
  const expiringSoon = billingRegistry.filter((account) => {
    if (account.accountType !== "client") {
      return false;
    }

    const daysRemaining = account.subscription.daysRemaining;
    return daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 7;
  }).length;

  if (!snapshot) {
    return null;
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Billing</span>
          <h2 className={styles.title}>Dedicated billing workspace.</h2>
          <p className={styles.description}>
            Billing is no longer buried inside the dashboard. This page now owns
            plan distribution, quota health, plan reassignment and account-level
            subscription inspection.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Assigned seats</span>
          <div className={styles.heroValue}>{billingRegistry.length} rows</div>
          <div className={styles.heroMeta}>
            {billingCounts.preview} preview · {billingCounts.trial} trial ·{" "}
            {paidAccounts} paid · {billingCounts.admin} admin managed
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Preview</span>
          <strong className={styles.metricValue}>{billingCounts.preview}</strong>
          <p className={styles.metricNote}>Accounts without a paid cycle, still using preview quotas.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Trial</span>
          <strong className={styles.metricValue}>{billingCounts.trial}</strong>
          <p className={styles.metricNote}>Starter seats with temporary unlimited access in the demo billing model.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Paid tiers</span>
          <strong className={styles.metricValue}>{paidAccounts}</strong>
          <p className={styles.metricNote}>User {billingCounts.user} · Plus {billingCounts.plus} · Pro {billingCounts.pro}</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Expiring soon</span>
          <strong className={styles.metricValue}>{expiringSoon}</strong>
          <p className={styles.metricNote}>Subscriptions ending within the next seven days.</p>
        </article>
      </section>

      <section className={styles.splitGrid}>
        <article className={styles.donutCard}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Plan split</span>
              <h3 className={styles.panelTitle}>Distribution by plan</h3>
            </div>
          </div>

          <div className={styles.donutChart} style={donutStyle}>
            <div className={styles.donutHole}>
              <div>
                <strong>{billingRegistry.length}</strong>
                <span>billing rows</span>
              </div>
            </div>
          </div>

          <div className={styles.legend}>
            {billingSegments.map((segment) => (
              <div key={segment.label} className={styles.legendRow}>
                <span className={styles.legendLabel}>
                  <span
                    className={styles.legendSwatch}
                    style={{ backgroundColor: segment.color }}
                  />
                  {segment.label}
                </span>
                <span className={styles.legendValue}>{segment.value}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Quota health</span>
              <h3 className={styles.panelTitle}>Average usage pressure</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Average search burn</span>
                <span className={styles.progressValue}>{quotaHealth.search}%</span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{ width: `${quotaHealth.search}%` }}
                />
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Average view burn</span>
                <span className={styles.progressValue}>{quotaHealth.view}%</span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{ width: `${quotaHealth.view}%` }}
                />
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Admin seats</span>
                <span className={styles.progressValue}>{billingCounts.admin}</span>
              </div>
              <div className={styles.progressMeta}>
                Admins remain outside customer billing tiers and keep unlimited access.
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Registry</span>
            <h3 className={styles.panelTitle}>Assign plans and inspect quotas</h3>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={styles.toolbarInput}
            placeholder="Search by user or email"
          />
          <div className={styles.filterTabs}>
            {(
              [
                "all",
                "preview",
                "trial",
                "user",
                "plus",
                "pro",
                "admin",
              ] as const
            ).map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.filterTab} ${planFilter === value ? styles.filterTabActive : ""}`}
                onClick={() => setPlanFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.accountList}>
          {filteredRegistry.length > 0 ? (
            filteredRegistry.map((account) => (
              <div key={account.id} className={styles.accountRow}>
                <div>
                  <div className={styles.accountName}>{account.displayName}</div>
                  <div className={styles.accountMeta}>{account.email}</div>
                </div>

                <div className={styles.accountBadges}>
                  <span className={styles.accountBadge}>{account.accountType}</span>
                  <span className={styles.accountBadge}>
                    {account.subscription.plan?.label ?? "Preview"}
                  </span>
                  <span className={styles.accountBadgeAccent}>
                    {account.subscription.status}
                  </span>
                </div>

                <div className={styles.accountMetaBlock}>
                  <span>
                    Search:{" "}
                    {account.subscription.searchRemaining === null
                      ? "unlimited"
                      : `${account.subscription.searchRemaining} / ${account.subscription.searchLimit}`}
                  </span>
                  <span>
                    Views:{" "}
                    {account.subscription.viewRemaining === null
                      ? "unlimited"
                      : `${account.subscription.viewRemaining} / ${account.subscription.viewLimit}`}
                  </span>
                  <span>
                    {account.subscription.endsAt
                      ? `Ends ${formatDateShort(account.subscription.endsAt)}`
                      : "No active billing cycle"}
                  </span>
                </div>

                {account.accountType === "client" ? (
                  <div className={styles.accountActions}>
                    {clientPlanIds.map((planId) => (
                      <button
                        key={planId}
                        type="button"
                        className={styles.accountActionBtn}
                        onClick={() =>
                          handleAssignPlan(account.id, account.displayName, planId)
                        }
                      >
                        {planId}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.accountActions}>
                    <span className={styles.accountBadgeAccent}>admin-managed</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              No billing entries match the current filter.
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
