"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import { useSubjects } from "@/hooks/useSubjects";
import { formatDateMedium, formatDateShort, groupCounts } from "@/lib/utils";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminWorkspace.module.scss";

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

export function AdminDashboardView() {
  const { snapshot, billingCounts, billingRegistry, handleCopyGuestStatus } =
    useAdminWorkspace();
  const { laws, loading: lawsLoading, error: lawsError } = useLaws();
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects();

  const siteMetrics = useMemo(() => {
    const totalSections = laws.reduce((sum, law) => sum + law.totalSections, 0);
    const totalArticles = laws.reduce((sum, law) => sum + law.totalArticles, 0);
    const totalParagraphs = laws.reduce(
      (sum, law) => sum + (law.totalParagraphs ?? 0),
      0,
    );
    const signatoryCoverage = laws.filter((law) => Boolean(law.signatory)).length;
    const preambleCoverage = laws.filter((law) => Boolean(law.preamble)).length;
    const subjectStatusDistribution = groupCounts(
      subjects.map((subject) => subject.legal_status),
    ).slice(0, 4);
    const recentLaws = [...laws]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 4);

    return {
      totalSections,
      totalArticles,
      totalParagraphs,
      signatoryCoverage,
      preambleCoverage,
      subjectStatusDistribution,
      recentLaws,
    };
  }, [laws, subjects]);

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

  const billingDonutStyle = useMemo(
    () =>
      ({
        "--donut-stops": buildDonutStops(billingSegments),
      }) as CSSProperties,
    [billingSegments],
  );

  if (!snapshot) {
    return null;
  }

  const paidAccounts =
    billingCounts.user + billingCounts.plus + billingCounts.pro;
  const guestSearchUsage = snapshot.guestPressure.searchLimit
    ? (snapshot.guestPressure.searchUsed / snapshot.guestPressure.searchLimit) *
      100
    : 0;
  const guestViewUsage = snapshot.guestPressure.viewLimit
    ? (snapshot.guestPressure.viewUsed / snapshot.guestPressure.viewLimit) * 100
    : 0;
  const siteCoverageBase = laws.length || 1;
  const accountSplit = [
    {
      label: "Clients",
      count: snapshot.clientAccounts,
      percent: snapshot.totalAccounts
        ? (snapshot.clientAccounts / snapshot.totalAccounts) * 100
        : 0,
    },
    {
      label: "Admins",
      count: snapshot.adminAccounts,
      percent: snapshot.totalAccounts
        ? (snapshot.adminAccounts / snapshot.totalAccounts) * 100
        : 0,
    },
  ];

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Dashboard</span>
          <h2 className={styles.title}>One screen for the whole platform.</h2>
          <p className={styles.description}>
            The dashboard is now a real control room: site-wide metrics, billing
            distribution, guest pressure, content coverage and direct jump points
            into each admin module.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Current footprint</span>
          <div className={styles.heroValue}>
            {laws.length + subjects.length + snapshot.totalAccounts} tracked
            entities
          </div>
          <div className={styles.heroMeta}>
            {laws.length} laws · {subjects.length} subjects ·{" "}
            {snapshot.totalAccounts} accounts · {billingRegistry.length} billing
            records
          </div>
          <Link href={ROUTES.adminBilling} className={styles.heroLink}>
            Open billing workspace
          </Link>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Laws</span>
          <strong className={styles.metricValue}>{laws.length}</strong>
          <p className={styles.metricNote}>Structured legal documents in the current frontend dataset.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Subjects</span>
          <strong className={styles.metricValue}>{subjects.length}</strong>
          <p className={styles.metricNote}>Resolved regulatory entities available for linking and filtering.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Accounts</span>
          <strong className={styles.metricValue}>{snapshot.totalAccounts}</strong>
          <p className={styles.metricNote}>Stored plus dev identities currently visible to the admin layer.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Paid plans</span>
          <strong className={styles.metricValue}>{paidAccounts}</strong>
          <p className={styles.metricNote}>User, Plus and Pro seats currently assigned from the demo billing registry.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Articles</span>
          <strong className={styles.metricValue}>{siteMetrics.totalArticles}</strong>
          <p className={styles.metricNote}>Total structured articles across the current legal corpus.</p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Audit events</span>
          <strong className={styles.metricValue}>{snapshot.auditLog.length}</strong>
          <p className={styles.metricNote}>Recent admin, auth and security events stored by the frontend audit layer.</p>
        </article>
      </section>

      <section className={styles.quickGrid}>
        {[
          {
            href: ROUTES.adminUsers,
            label: "Users",
            note: "Search registry, roles, source type and force logout actions.",
          },
          {
            href: ROUTES.adminBilling,
            label: "Billing",
            note: "Inspect distribution of plans, quota usage and reassign seats.",
          },
          {
            href: ROUTES.adminAudit,
            label: "Audit",
            note: "Review warning and security events without leaving the admin shell.",
          },
        ].map((item) => (
          <Link key={item.href} href={item.href} className={styles.quickCard}>
            <span className={styles.quickLabel}>{item.label}</span>
            <div className={styles.quickNote}>{item.note}</div>
          </Link>
        ))}
      </section>

      <section className={styles.splitGrid}>
        <article className={styles.donutCard}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Billing mix</span>
              <h3 className={styles.panelTitle}>Current plan distribution</h3>
            </div>
          </div>

          <div className={styles.donutChart} style={billingDonutStyle}>
            <div className={styles.donutHole}>
              <div>
                <strong>{billingRegistry.length}</strong>
                <span>registry rows</span>
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
              <span className={styles.panelEyebrow}>Operational pressure</span>
              <h3 className={styles.panelTitle}>Guests and account split</h3>
            </div>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleCopyGuestStatus}
            >
              Copy guest summary
            </button>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Guest search usage</span>
                <span className={styles.progressValue}>
                  {snapshot.guestPressure.searchUsed}/
                  {snapshot.guestPressure.searchLimit}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{ width: `${Math.min(guestSearchUsage, 100)}%` }}
                />
              </div>
              <div className={styles.progressMeta}>
                Remaining: {snapshot.guestPressure.searchRemaining} · Cooldown{" "}
                {snapshot.guestPressure.searchCooldownActive ? "active" : "off"}
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Guest view usage</span>
                <span className={styles.progressValue}>
                  {snapshot.guestPressure.viewUsed}/
                  {snapshot.guestPressure.viewLimit}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{ width: `${Math.min(guestViewUsage, 100)}%` }}
                />
              </div>
              <div className={styles.progressMeta}>
                Remaining: {snapshot.guestPressure.viewRemaining} · Cooldown{" "}
                {snapshot.guestPressure.viewCooldownActive ? "active" : "off"}
              </div>
            </div>

            {accountSplit.map((item) => (
              <div key={item.label} className={styles.progressRow}>
                <div className={styles.progressTopRow}>
                  <span className={styles.progressLabel}>{item.label}</span>
                  <span className={styles.progressValue}>{item.count}</span>
                </div>
                <div className={styles.progressTrack}>
                  <span
                    className={styles.progressFill}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <div className={styles.progressMeta}>
                  {Math.round(item.percent)}% of all accounts
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Coverage</span>
              <h3 className={styles.panelTitle}>Content completeness</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Signatory coverage</span>
                <span className={styles.progressValue}>
                  {siteMetrics.signatoryCoverage}/{laws.length}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${(siteMetrics.signatoryCoverage / siteCoverageBase) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Preamble coverage</span>
                <span className={styles.progressValue}>
                  {siteMetrics.preambleCoverage}/{laws.length}
                </span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${(siteMetrics.preambleCoverage / siteCoverageBase) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Structured depth</span>
                <span className={styles.progressValue}>
                  {siteMetrics.totalSections} sec · {siteMetrics.totalParagraphs} par
                </span>
              </div>
              <div className={styles.progressMeta}>
                Total article depth is calculated from the live frontend law payload.
              </div>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Subject landscape</span>
              <h3 className={styles.panelTitle}>Top subject categories</h3>
            </div>
          </div>

          {subjectsLoading ? (
            <div className={styles.emptyState}>Loading subject distribution…</div>
          ) : subjectsError ? (
            <div className={styles.emptyState}>{subjectsError}</div>
          ) : (
            <div className={styles.progressList}>
              {siteMetrics.subjectStatusDistribution.map(([label, count]) => (
                <div key={label} className={styles.progressRow}>
                  <div className={styles.progressTopRow}>
                    <span className={styles.progressLabel}>{label}</span>
                    <span className={styles.progressValue}>{count}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <span
                      className={styles.progressFill}
                      style={{
                        width: `${subjects.length ? (count / subjects.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className={styles.progressMeta}>
                    {subjects.length ? Math.round((count / subjects.length) * 100) : 0}
                    % of all subjects
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Newest laws</span>
              <h3 className={styles.panelTitle}>Recently added documents</h3>
            </div>
          </div>

          {lawsLoading ? (
            <div className={styles.emptyState}>Loading law feed…</div>
          ) : lawsError ? (
            <div className={styles.emptyState}>{lawsError}</div>
          ) : (
            <div className={styles.list}>
              {siteMetrics.recentLaws.map((law) => (
                <div key={law._id} className={styles.listRow}>
                  <div className={styles.listTopRow}>
                    <span className={styles.listCode}>{law.code}</span>
                    <Link href={ROUTES.law(law._id)} className={styles.heroLink}>
                      Open
                    </Link>
                  </div>
                  <div className={styles.listTitle}>{law.title}</div>
                  <div className={styles.listMeta}>
                    {formatDateMedium(law.createdAt)} · {law.totalArticles} articles ·{" "}
                    {law.totalSections} sections
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Audit radar</span>
              <h3 className={styles.panelTitle}>Latest control events</h3>
            </div>
          </div>

          {snapshot.auditLog.length > 0 ? (
            <div className={styles.auditList}>
              {snapshot.auditLog.slice(0, 4).map((item) => (
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
                      {item.severity}
                    </span>
                    <span>{formatDateShort(item.createdAt)}</span>
                    <span>{item.actor}</span>
                  </div>
                  <div className={styles.auditTitle}>{item.action}</div>
                  <div className={styles.auditDetail}>{item.detail}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>Audit entries will appear here as admin activity grows.</div>
          )}
        </article>
      </section>
    </section>
  );
}
