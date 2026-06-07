"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { formatDateMedium, formatDateShort, groupCounts } from "@/lib/utils";
import { formatAccessRoleLabel, formatSeverityLabel } from "./adminLabels";
import { useAdminWorkspace } from "./useAdminWorkspace";
import { MetricCard } from "@/admin/components/MetricCard/MetricCard";
import { AdminDonutChart } from "@/admin/components/AdminDonutChart/AdminDonutChart";
import { SemanticProgressBar } from "@/admin/components/SemanticProgressBar/SemanticProgressBar";
import { AuditBadge } from "@/admin/components/AuditBadge/AuditBadge";
import { useAdminLaws } from "@/admin/data/_adapters/lawsAdapter";
import { useAdminSubjects } from "@/admin/data/_adapters/subjectsAdapter";
import type { DonutSegment } from "@/admin/components/AdminDonutChart/AdminDonutChart";
import styles from "./AdminWorkspace.module.scss";

export function AdminDashboardView() {
  const { snapshot, billingCounts, billingRegistry, handleCopyGuestStatus } =
    useAdminWorkspace();
  const { laws, loading: lawsLoading, error: lawsError } = useAdminLaws();
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
  } = useAdminSubjects();

  const siteMetrics = useMemo(() => {
    const totalSections = laws.reduce((sum, law) => sum + law.totalSections, 0);
    const totalArticles = laws.reduce((sum, law) => sum + law.totalArticles, 0);
    const totalParagraphs = laws.reduce(
      (sum, law) => sum + (law.totalParagraphs ?? 0),
      0,
    );
    const signatoryCoverage = laws.filter((law) =>
      Boolean(law.signatory),
    ).length;
    const preambleCoverage = laws.filter((law) => Boolean(law.preamble)).length;
    const subjectStatusDistribution = groupCounts(
      subjects.map((subject) => subject.legal_status),
    ).slice(0, 4);
    const recentLaws = [...laws]
      .sort((left, right) =>
        (right.adoptedDate ?? right.createdAt).localeCompare(
          left.adoptedDate ?? left.createdAt,
        ),
      )
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
      { label: "Прев'ю", value: billingCounts.preview, color: "#4a80d4" },
      { label: "Тріал", value: billingCounts.trial, color: "#6aa1ff" },
      { label: "Користувач", value: billingCounts.user, color: "#93b7ff" },
      { label: "Плюс", value: billingCounts.plus, color: "#c8a843" },
      { label: "Про", value: billingCounts.pro, color: "#f2d675" },
      { label: "Адмін", value: billingCounts.admin, color: "#e9774b" },
    ],
    [billingCounts],
  );

  if (!snapshot) {
    return (
      <section className={styles.page}>
        <div className={styles.skeletonHero} />
        <div className={styles.metricsGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
        <div className={styles.skeletonPanel} />
      </section>
    );
  }

  const paidAccounts =
    billingCounts.user + billingCounts.plus + billingCounts.pro;
  const accountSplit = [
    {
      label: formatAccessRoleLabel("client"),
      count: snapshot.clientAccounts,
      percent: snapshot.totalAccounts
        ? (snapshot.clientAccounts / snapshot.totalAccounts) * 100
        : 0,
    },
    {
      label: formatAccessRoleLabel("admin"),
      count: snapshot.adminAccounts,
      percent: snapshot.totalAccounts
        ? (snapshot.adminAccounts / snapshot.totalAccounts) * 100
        : 0,
    },
  ];

  return (
    <section className={styles.page}>
      {snapshot.auditLog.some((e) => e.severity === "security") && (
        <SecurityBanner
          events={snapshot.auditLog.filter((e) => e.severity === "security")}
        />
      )}
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Дашборд</span>
          <h2 className={styles.title}>Один екран для всієї платформи.</h2>
          <p className={styles.description}>
            Це головний пульт керування: загальні метрики сайту, розподіл
            білінгу, навантаження гостей, повнота контенту та швидкі переходи до
            окремих адмін-модулів.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Поточний масштаб</span>
          <div className={styles.heroValue}>
            {laws.length + subjects.length + snapshot.totalAccounts} об'єктів
            під наглядом
          </div>
          <div className={styles.heroMeta}>
            {laws.length} законів, {subjects.length} суб'єктів,{" "}
            {snapshot.totalAccounts} акаунтів, {billingRegistry.length} записів
            білінгу
          </div>
          <Link href={ROUTES.adminBilling} className={styles.heroLink}>
            Відкрити білінг
          </Link>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <MetricCard
          label="Закони"
          value={laws.length}
          note="Структуровані правові документи."
          loading={lawsLoading}
          color="#4a80d4"
        />
        <MetricCard
          label="Суб'єкти"
          value={subjects.length}
          note="Визначені регуляторні суб'єкти."
          loading={subjectsLoading}
          color="#93b7ff"
        />
        <MetricCard
          label="Акаунти"
          value={snapshot.totalAccounts}
          note="Ідентичності в адмін-просторі."
          color="#c8a843"
        />
        <MetricCard
          label="Платні плани"
          value={paidAccounts}
          note="Тарифи «Користувач», «Плюс» і «Про»."
          color="#f2d06c"
        />
        <MetricCard
          label="Статті"
          value={siteMetrics.totalArticles}
          note="Загальна кількість статей у корпусі."
          loading={lawsLoading}
          color="#4a9e6b"
        />
        <MetricCard
          label="Події аудиту"
          value={snapshot.auditLog.length}
          note="Останні адмінські події."
          color="#e9774b"
        />
      </section>

      <section className={styles.quickGrid}>
        {[
          {
            href: ROUTES.adminUsers,
            label: "Користувачі",
            note: "Пошук реєстру, ролі, тип джерела та примусовий вихід.",
          },
          {
            href: ROUTES.adminBilling,
            label: "Білінг",
            note: "Перевірити розподіл планів, використання квот і перепризначення місць.",
          },
          {
            href: ROUTES.adminAudit,
            label: "Аудит",
            note: "Переглянути попередження і безпекові події без виходу з адмінки.",
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
              <span className={styles.panelEyebrow}>Білінг-мікс</span>
              <h3 className={styles.panelTitle}>Поточний розподіл планів</h3>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "8px 0",
            }}
          >
            <AdminDonutChart
              segments={billingSegments}
              centerValue={billingRegistry.length}
              centerLabel="записів"
              size={200}
            />
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
              <span className={styles.panelEyebrow}>Операційний тиск</span>
              <h3 className={styles.panelTitle}>Гості та розподіл акаунтів</h3>
            </div>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleCopyGuestStatus}
            >
              Копіювати зведення гостей
            </button>
          </div>

          <div className={styles.progressList}>
            <SemanticProgressBar
              value={snapshot.guestPressure.searchUsed}
              max={snapshot.guestPressure.searchLimit ?? 1}
              label="Пошук гостей"
              meta={`Залишок: ${snapshot.guestPressure.searchRemaining}, кулдаун ${snapshot.guestPressure.searchCooldownActive ? "активний" : "вимкнено"}`}
            />
            <SemanticProgressBar
              value={snapshot.guestPressure.viewUsed}
              max={snapshot.guestPressure.viewLimit ?? 1}
              label="Перегляди гостей"
              meta={`Залишок: ${snapshot.guestPressure.viewRemaining}, кулдаун ${snapshot.guestPressure.viewCooldownActive ? "активний" : "вимкнено"}`}
            />
            {accountSplit.map((item) => (
              <SemanticProgressBar
                key={item.label}
                value={item.count}
                max={snapshot.totalAccounts}
                label={item.label}
                meta={`${Math.round(item.percent)}% від усіх акаунтів`}
              />
            ))}
          </div>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Покриття</span>
              <h3 className={styles.panelTitle}>Повнота контенту</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <SemanticProgressBar
              value={siteMetrics.signatoryCoverage}
              max={laws.length}
              label="Покриття підписантів"
            />
            <SemanticProgressBar
              value={siteMetrics.preambleCoverage}
              max={laws.length}
              label="Покриття преамбул"
            />
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Глибина структури</span>
                <span className={styles.progressValue}>
                  {siteMetrics.totalSections} розд.,{" "}
                  {siteMetrics.totalParagraphs} абз.
                </span>
              </div>
              <div className={styles.progressMeta}>
                Глибина статей обчислюється з актуальних даних.
              </div>
            </div>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Ландшафт суб'єктів</span>
              <h3 className={styles.panelTitle}>Топові категорії суб'єктів</h3>
            </div>
          </div>

          {subjectsLoading ? (
            <div className={styles.emptyState}>
              Завантаження розподілу суб'єктів…
            </div>
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
                    {subjects.length
                      ? Math.round((count / subjects.length) * 100)
                      : 0}
                    % від усіх суб'єктів
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Нові закони</span>
              <h3 className={styles.panelTitle}>Останні додані документи</h3>
            </div>
          </div>

          {lawsLoading ? (
            <div className={styles.emptyState}>
              Завантаження стрічки законів…
            </div>
          ) : lawsError ? (
            <div className={styles.emptyState}>{lawsError}</div>
          ) : (
            <div className={styles.list}>
              {siteMetrics.recentLaws.map((law) => (
                <div key={law._id} className={styles.listRow}>
                  <div className={styles.listTopRow}>
                    <span className={styles.listCode}>{law.code}</span>
                    <Link
                      href={ROUTES.law(law._id)}
                      className={styles.heroLink}
                    >
                      Відкрити
                    </Link>
                  </div>
                  <div className={styles.listTitle}>{law.title}</div>
                  <div className={styles.listMeta}>
                    {formatDateMedium(law.createdAt)}, {law.totalArticles}{" "}
                    статей, {law.totalSections} розділів
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Радар аудиту</span>
              <h3 className={styles.panelTitle}>Останні контрольні події</h3>
            </div>
          </div>

          {snapshot.auditLog.length > 0 ? (
            <div className={styles.auditList}>
              {snapshot.auditLog.slice(0, 4).map((item) => (
                <div key={item.id} className={styles.auditRow}>
                  <div className={styles.auditMeta}>
                    <AuditBadge
                      severity={
                        item.severity as "info" | "warning" | "security"
                      }
                      label={formatSeverityLabel(item.severity)}
                    />
                    <span>{formatDateShort(item.createdAt)}</span>
                    <span>{item.actor}</span>
                  </div>
                  <div className={styles.auditTitle}>{item.action}</div>
                  <div className={styles.auditDetail}>{item.detail}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              Записи аудиту з'являться тут, коли адмін-активність зростатиме.
            </div>
          )}
        </article>
      </section>
    </section>
  );
}

const SECURITY_ACTION_ROUTES: Array<{ keywords: string[]; route: string }> = [
  { keywords: ["роль", "призначено", "legislator", "законотворц"], route: ROUTES.adminUsers },
  { keywords: ["код", "super code", "supercode"], route: ROUTES.adminCodes },
  { keywords: ["доступ", "access", "заявк"], route: ROUTES.adminAccess },
];

function resolveSecurityRoute(action: string, detail: string): string {
  const text = (action + " " + detail).toLowerCase();
  for (const { keywords, route } of SECURITY_ACTION_ROUTES) {
    if (keywords.some((kw) => text.includes(kw))) return route;
  }
  return ROUTES.adminAudit;
}

function SecurityBanner({ events }: { events: import("@/lib/auth/mockAuth").AdminAuditLogEntry[] }) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  if (dismissed) return null;
  return (
    <div className={styles.securityBanner}>
      <button
        type="button"
        className={styles.securityBannerHeader}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.securityBannerIcon}>⚠</span>
        <span>{events.length} подій безпеки потребують уваги</span>
        <span className={styles.securityBannerChevron}>{open ? "▲" : "▼"}</span>
      </button>
      <button
        type="button"
        className={styles.securityBannerDismiss}
        onClick={() => setDismissed(true)}
      >
        ✕
      </button>
      {open && (
        <ul className={styles.securityBannerBody}>
          {events.map((e) => (
            <li key={e.id}>
              <a
                href={resolveSecurityRoute(e.action, e.detail)}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.securityItem}
              >
                <span className={styles.securityItemAction}>{e.action}</span>
                {e.detail && (
                  <span className={styles.securityItemDetail}>{e.detail}</span>
                )}
                <span className={styles.securityItemMeta}>
                  {e.actor} · {formatDateShort(e.createdAt)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
