"use client";

import Link from "next/link";
import { useMemo, type CSSProperties } from "react";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import { useSubjects } from "@/hooks/useSubjects";
import { formatDateMedium, formatDateShort, groupCounts } from "@/lib/utils";
import {
  formatAccessRoleLabel,
  formatSeverityLabel,
} from "./adminLabels";
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
    const signatoryCoverage = laws.filter((law) =>
      Boolean(law.signatory),
    ).length;
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
      { label: "Прев'ю", value: billingCounts.preview, color: "#4a80d4" },
      { label: "Тріал", value: billingCounts.trial, color: "#6aa1ff" },
      { label: "Користувач", value: billingCounts.user, color: "#93b7ff" },
      { label: "Плюс", value: billingCounts.plus, color: "#c8a843" },
      { label: "Про", value: billingCounts.pro, color: "#f2d675" },
      { label: "Адмін", value: billingCounts.admin, color: "#e9774b" },
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
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Закони</span>
          <strong className={styles.metricValue}>{laws.length}</strong>
          <p className={styles.metricNote}>
            Структуровані правові документи в поточному наборі даних.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Суб'єкти</span>
          <strong className={styles.metricValue}>{subjects.length}</strong>
          <p className={styles.metricNote}>
            Розпізнані регуляторні суб'єкти, доступні для зв'язування та фільтрів.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Акаунти</span>
          <strong className={styles.metricValue}>{snapshot.totalAccounts}</strong>
          <p className={styles.metricNote}>
            Збережені та розробницькі ідентичності, які бачить адмін-простір.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Платні плани</span>
          <strong className={styles.metricValue}>{paidAccounts}</strong>
          <p className={styles.metricNote}>
            Місця тарифів «Користувач», «Плюс» і «Про», призначені через демо-білінг.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Статті</span>
          <strong className={styles.metricValue}>{siteMetrics.totalArticles}</strong>
          <p className={styles.metricNote}>
            Загальна кількість структурованих статей у корпусі законів.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Події аудиту</span>
          <strong className={styles.metricValue}>{snapshot.auditLog.length}</strong>
          <p className={styles.metricNote}>
            Останні адмінські, автентифікаційні та безпекові події в локальному журналі.
          </p>
        </article>
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

          <div className={styles.donutChart} style={billingDonutStyle}>
            <div className={styles.donutHole}>
              <div>
                <strong>{billingRegistry.length}</strong>
                <span>рядків реєстру</span>
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
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Використання пошуку гостями</span>
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
                Залишок: {snapshot.guestPressure.searchRemaining}, кулдаун{" "}
                {snapshot.guestPressure.searchCooldownActive ? "активний" : "вимкнено"}
              </div>
            </div>

            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Використання переглядів гостями</span>
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
                Залишок: {snapshot.guestPressure.viewRemaining}, кулдаун{" "}
                {snapshot.guestPressure.viewCooldownActive ? "активний" : "вимкнено"}
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
                  {Math.round(item.percent)}% від усіх акаунтів
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
              <span className={styles.panelEyebrow}>Покриття</span>
              <h3 className={styles.panelTitle}>Повнота контенту</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>Покриття підписантів</span>
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
                <span className={styles.progressLabel}>Покриття преамбул</span>
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
                <span className={styles.progressLabel}>Глибина структури</span>
                <span className={styles.progressValue}>
                  {siteMetrics.totalSections} розд., {siteMetrics.totalParagraphs} абз.
                </span>
              </div>
              <div className={styles.progressMeta}>
                Глибина статей обчислюється з актуальних даних, отриманих для законів.
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
            <div className={styles.emptyState}>Завантаження розподілу суб'єктів…</div>
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
            <div className={styles.emptyState}>Завантаження стрічки законів…</div>
          ) : lawsError ? (
            <div className={styles.emptyState}>{lawsError}</div>
          ) : (
            <div className={styles.list}>
              {siteMetrics.recentLaws.map((law) => (
                <div key={law._id} className={styles.listRow}>
                  <div className={styles.listTopRow}>
                    <span className={styles.listCode}>{law.code}</span>
                    <Link href={ROUTES.law(law._id)} className={styles.heroLink}>
                      Відкрити
                    </Link>
                  </div>
                  <div className={styles.listTitle}>{law.title}</div>
                  <div className={styles.listMeta}>
                    {formatDateMedium(law.createdAt)}, {law.totalArticles} статей,{" "}
                    {law.totalSections} розділів
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
