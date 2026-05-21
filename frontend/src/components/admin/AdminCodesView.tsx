"use client";

import { formatDateShort } from "@/lib/utils";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminWorkspace.module.scss";

export function AdminCodesView() {
  const { snapshot, handleCopyCode, handleRegenerateCode } =
    useAdminWorkspace();

  if (!snapshot) {
    return null;
  }

  const protectedAccounts = snapshot.registryAccounts.filter(
    (account) => account.superCodeProtected,
  ).length;
  const securityEvents = snapshot.auditLog.filter(
    (entry) => entry.severity === "security",
  ).length;

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Codes</span>
          <h2 className={styles.title}>Super code lifecycle in one place.</h2>
          <p className={styles.description}>
            The code module keeps the current onboarding logic, but turns it into
            a clearer security screen with active state, rotation history and
            context around protected admin accounts.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Active code</span>
          <div className={styles.heroValue}>{snapshot.activeSuperCode}</div>
          <div className={styles.heroMeta}>
            {snapshot.superCodeRotatedAt
              ? `Rotated ${formatDateShort(snapshot.superCodeRotatedAt)}`
              : "Default bootstrap code still active"}
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Active code</span>
          <strong className={styles.metricValue}>1</strong>
          <p className={styles.metricNote}>Only one super code is valid at a time for admin onboarding.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>History entries</span>
          <strong className={styles.metricValue}>{snapshot.superCodeHistory.length}</strong>
          <p className={styles.metricNote}>Rotation history preserved in the frontend admin storage.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Protected admins</span>
          <strong className={styles.metricValue}>{protectedAccounts}</strong>
          <p className={styles.metricNote}>Accounts created or guarded through the super-code flow.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Security events</span>
          <strong className={styles.metricValue}>{securityEvents}</strong>
          <p className={styles.metricNote}>Audit entries already marked with elevated severity.</p>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Code actions</span>
              <h3 className={styles.panelTitle}>Active invitation code</h3>
            </div>
          </div>

          <div className={styles.insightGrid}>
            <div className={styles.insightCard}>
              <div className={styles.insightTitle}>Current value</div>
              <div className={styles.insightValue}>{snapshot.activeSuperCode}</div>
              <div className={styles.insightMeta}>
                Share only through the admin onboarding flow.
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightTitle}>Last rotation</div>
              <div className={styles.insightValue}>
                {snapshot.superCodeRotatedAt
                  ? formatDateShort(snapshot.superCodeRotatedAt)
                  : "Bootstrap"}
              </div>
              <div className={styles.insightMeta}>
                Fresh rotations are automatically pushed into audit history.
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightTitle}>Action safety</div>
              <div className={styles.insightValue}>Single active code</div>
              <div className={styles.insightMeta}>
                Regenerating the code retires previous entries and keeps the
                history visible.
              </div>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleCopyCode}
            >
              Copy active code
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleRegenerateCode}
            >
              Regenerate code
            </button>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>History</span>
              <h3 className={styles.panelTitle}>Rotation log</h3>
            </div>
          </div>

          <div className={styles.historyList}>
            {snapshot.superCodeHistory.map((entry) => (
              <div key={entry.id} className={styles.historyRow}>
                <div>
                  <div className={styles.historyCode}>{entry.code}</div>
                  <div className={styles.historyMeta}>
                    {entry.rotatedBy} · {formatDateShort(entry.rotatedAt)}
                  </div>
                </div>
                <span className={styles.historyStatus}>{entry.status}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Guardrails</span>
              <h3 className={styles.panelTitle}>Operational notes</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>Admin onboarding still requires the currently active super code.</div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>History stays local to the frontend preview admin store and is visible for review.</div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>Every regeneration keeps the old code visible but no longer active.</div>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
