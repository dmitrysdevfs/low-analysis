"use client";

import { useMemo, useState } from "react";
import { formatDateShort } from "@/lib/utils";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminWorkspace.module.scss";

type RegistryFilter = "all" | "client" | "admin";

export function AdminUsersView() {
  const { snapshot, handleAccountAction } = useAdminWorkspace();
  const [registryFilter, setRegistryFilter] = useState<RegistryFilter>("all");
  const [registryQuery, setRegistryQuery] = useState("");

  const filteredAccounts = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const normalizedQuery = registryQuery.trim().toLowerCase();

    return snapshot.registryAccounts.filter((account) => {
      const matchesRole =
        registryFilter === "all"
          ? true
          : account.accountType === registryFilter;
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : account.displayName.toLowerCase().includes(normalizedQuery) ||
            account.email.toLowerCase().includes(normalizedQuery);

      return matchesRole && matchesQuery;
    });
  }, [registryFilter, registryQuery, snapshot]);

  const statusCounts = useMemo(() => {
    if (!snapshot) {
      return { active: 0, inactive: 0, stored: 0, dev: 0 };
    }

    return snapshot.registryAccounts.reduce(
      (acc, account) => {
        acc[account.status] += 1;
        acc[account.source] += 1;
        return acc;
      },
      { active: 0, inactive: 0, stored: 0, dev: 0 },
    );
  }, [snapshot]);

  if (!snapshot) {
    return null;
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Users</span>
          <h2 className={styles.title}>Account registry with live admin actions.</h2>
          <p className={styles.description}>
            This screen keeps the existing mock account logic, but upgrades it
            into a focused registry with clearer status visibility, safer dev
            account handling and faster role-based filtering.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Current registry</span>
          <div className={styles.heroValue}>{snapshot.totalAccounts} accounts</div>
          <div className={styles.heroMeta}>
            {snapshot.clientAccounts} clients · {snapshot.adminAccounts} admins ·{" "}
            {statusCounts.inactive} inactive · {statusCounts.dev} dev identities
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Total</span>
          <strong className={styles.metricValue}>{snapshot.totalAccounts}</strong>
          <p className={styles.metricNote}>All stored and built-in dev identities visible to the admin layer.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Clients</span>
          <strong className={styles.metricValue}>{snapshot.clientAccounts}</strong>
          <p className={styles.metricNote}>Customer-facing sessions with standard access to laws, subjects and search.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Admins</span>
          <strong className={styles.metricValue}>{snapshot.adminAccounts}</strong>
          <p className={styles.metricNote}>Identities that can enter the admin shell and operate secure flows.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Inactive</span>
          <strong className={styles.metricValue}>{statusCounts.inactive}</strong>
          <p className={styles.metricNote}>Accounts currently toggled off from the preview authentication store.</p>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Status mix</span>
              <h3 className={styles.panelTitle}>Account health</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Active accounts</span>
                <span className={styles.progressValue}>{statusCounts.active}</span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${snapshot.totalAccounts ? (statusCounts.active / snapshot.totalAccounts) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Inactive accounts</span>
                <span className={styles.progressValue}>{statusCounts.inactive}</span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${snapshot.totalAccounts ? (statusCounts.inactive / snapshot.totalAccounts) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Source mix</span>
              <h3 className={styles.panelTitle}>Stored vs dev identities</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Stored accounts</span>
                <span className={styles.progressValue}>{statusCounts.stored}</span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${snapshot.totalAccounts ? (statusCounts.stored / snapshot.totalAccounts) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Dev accounts</span>
                <span className={styles.progressValue}>{statusCounts.dev}</span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${snapshot.totalAccounts ? (statusCounts.dev / snapshot.totalAccounts) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className={styles.progressMeta}>
                Dev identities stay visible for preview flows, but account role
                and status actions are intentionally disabled for them.
              </div>
            </div>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Registry</span>
              <h3 className={styles.panelTitle}>Search and manage accounts</h3>
            </div>
          </div>

          <div className={styles.toolbar}>
            <input
              value={registryQuery}
              onChange={(event) => setRegistryQuery(event.target.value)}
              className={styles.toolbarInput}
              placeholder="Search by name or email"
            />
            <div className={styles.filterTabs}>
              {(["all", "client", "admin"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.filterTab} ${registryFilter === value ? styles.filterTabActive : ""}`}
                  onClick={() => setRegistryFilter(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.registryViewport}>
            <div className={styles.accountList}>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => {
                  const isDev = account.source === "dev";
                  const isInactive = account.status === "inactive";

                  return (
                    <div key={account.id} className={styles.accountRow}>
                      <div>
                        <div className={styles.accountName}>{account.displayName}</div>
                        <div className={styles.accountMeta}>{account.email}</div>
                      </div>

                      <div className={styles.accountBadges}>
                        <span className={styles.accountBadge}>{account.accountType}</span>
                        <span className={styles.accountBadge}>{account.source}</span>
                        <span
                          className={
                            isInactive
                              ? styles.accountBadgeDanger
                              : styles.accountBadgeAccent
                          }
                        >
                          {account.status}
                        </span>
                        {account.superCodeProtected ? (
                          <span className={styles.accountBadgeAccent}>super code</span>
                        ) : null}
                      </div>

                      <div className={styles.accountMetaBlock}>
                        <span>Created: {formatDateShort(account.createdAt)}</span>
                        <span>
                          Last login:{" "}
                          {account.lastLoginAt
                            ? formatDateShort(account.lastLoginAt)
                            : "never"}
                        </span>
                      </div>

                      <div className={styles.accountActions}>
                        <button
                          type="button"
                          className={styles.accountActionBtn}
                          disabled={isDev}
                          onClick={() =>
                            handleAccountAction(
                              "deactivate",
                              account.id,
                              account.displayName,
                            )
                          }
                        >
                          {isInactive ? "Reactivate" : "Deactivate"}
                        </button>
                        <button
                          type="button"
                          className={styles.accountActionBtn}
                          disabled={isDev}
                          onClick={() =>
                            handleAccountAction(
                              "promote",
                              account.id,
                              account.displayName,
                            )
                          }
                        >
                          {account.accountType === "admin" ? "Demote" : "Promote"}
                        </button>
                        <button
                          type="button"
                          className={`${styles.accountActionBtn} ${styles.accountActionBtnDanger}`}
                          onClick={() =>
                            handleAccountAction(
                              "forceLogout",
                              account.id,
                              account.displayName,
                            )
                          }
                        >
                          Force logout
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyState}>
                  No accounts match the current registry filter.
                </div>
              )}
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
