"use client";

import { ROUTES } from "@/constants/routes";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminWorkspace.module.scss";

const PROTECTED_SURFACES = [
  ROUTES.admin,
  ROUTES.adminUsers,
  ROUTES.adminBilling,
  ROUTES.adminAccess,
  ROUTES.adminCodes,
  ROUTES.adminAudit,
  ROUTES.adminAnalytics,
];

export function AdminAccessView() {
  const { snapshot } = useAdminWorkspace();

  if (!snapshot) {
    return null;
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Access</span>
          <h2 className={styles.title}>Keep permissions visible.</h2>
          <p className={styles.description}>
            The access module stays logic-compatible with the current route gate,
            but turns the role matrix into a dedicated control page with explicit
            coverage for the new admin workspace.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Protected zones</span>
          <div className={styles.heroValue}>{snapshot.protectedRoutes} routes</div>
          <div className={styles.heroMeta}>
            Admin-only surfaces now live under one persistent shell and a single
            route family.
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        {snapshot.accessMatrix.map((row) => {
          const allowed = [
            row.home,
            row.laws,
            row.subjects,
            row.search,
            row.adminPanel,
          ].filter(Boolean).length;

          return (
            <article key={row.role} className={styles.metricCard}>
              <span className={styles.metricLabel}>{row.role}</span>
              <strong className={styles.metricValue}>{allowed}</strong>
              <p className={styles.metricNote}>Enabled top-level surfaces for the current role model.</p>
            </article>
          );
        })}
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Admin shell</span>
          <strong className={styles.metricValue}>{PROTECTED_SURFACES.length}</strong>
          <p className={styles.metricNote}>Dedicated admin routes now isolated from the public site chrome.</p>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Role matrix</span>
              <h3 className={styles.panelTitle}>Who can open what</h3>
            </div>
          </div>

          <div className={styles.matrix}>
            <div className={styles.matrixHead}>
              <span>Role</span>
              <span>Home</span>
              <span>Laws</span>
              <span>Subjects</span>
              <span>Search</span>
              <span>Admin</span>
            </div>

            {snapshot.accessMatrix.map((row) => (
              <div key={row.role} className={styles.matrixRow}>
                <span className={styles.matrixRole}>{row.role}</span>
                <span>{row.home ? "Yes" : "No"}</span>
                <span>{row.laws ? "Yes" : "No"}</span>
                <span>{row.subjects ? "Yes" : "No"}</span>
                <span>{row.search ? "Yes" : "No"}</span>
                <span>{row.adminPanel ? "Yes" : "No"}</span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Protected surface</span>
              <h3 className={styles.panelTitle}>Admin route map</h3>
            </div>
          </div>

          <div className={styles.list}>
            {PROTECTED_SURFACES.map((route) => (
              <div key={route} className={styles.listRow}>
                <div className={styles.listTitle}>{route}</div>
                <div className={styles.listMeta}>Available only through the admin role gate.</div>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Guardrail notes</span>
              <h3 className={styles.panelTitle}>What remains true</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>RouteAccessGate still owns access control for /admin/*.</div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>Public pages keep the previous auth behavior and remain untouched.</div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>The redesign isolates admin chrome, but does not loosen permissions.</div>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
