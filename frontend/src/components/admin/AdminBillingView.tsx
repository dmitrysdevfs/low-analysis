"use client";

import { useMemo, useState, type CSSProperties } from "react";
import {
  formatPlanFilterLabel,
} from "./adminLabels";
import { useAdminWorkspace } from "./useAdminWorkspace";
import { AdminBillingRow } from "./AdminBillingRow";
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

function exportBillingCSV(
  registry: ReturnType<typeof useAdminWorkspace>["billingRegistry"],
) {
  const header = "Ім'я,Email,Тип,План,Статус,Залишок пошуку,Залишок переглядів";
  const rows = registry.map((a) =>
    [
      a.displayName,
      a.email,
      a.accountType,
      a.subscription.planId ?? "preview",
      a.subscription.status,
      a.subscription.searchRemaining ?? "безліміт",
      a.subscription.viewRemaining ?? "безліміт",
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `billing-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ConfirmModal({
  plan,
  onConfirm,
  onCancel,
}: {
  plan: { accountId: string; accountName: string; planId: string };
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "rgba(9,18,38,0.98)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20,
          padding: "28px 32px",
          maxWidth: 360,
          width: "100%",
          boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            color: "#c8a843",
            fontFamily: "monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Підтвердження
        </div>
        <div
          style={{
            color: "#ffffff",
            fontSize: "1.1rem",
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          Призначити план «{plan.planId}»?
        </div>
        <div
          style={{ color: "#9eb5d9", fontSize: "0.84rem", marginBottom: 20 }}
        >
          Тарифний план буде змінено для{" "}
          <strong style={{ color: "#c7d5ea" }}>{plan.accountName}</strong>.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 999,
              border: 0,
              background: "linear-gradient(135deg, #f7f6f2 0%, #d9d5c9 100%)",
              color: "#081020",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Підтвердити
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              minHeight: 38,
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)",
              color: "#eef3fb",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
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
  const [confirmPlan, setConfirmPlan] = useState<{
    accountId: string;
    accountName: string;
    planId: string;
  } | null>(null);

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
      { label: "Прев'ю", value: billingCounts.preview, color: "#4a80d4" },
      { label: "Тріал", value: billingCounts.trial, color: "#6aa1ff" },
      { label: "Користувач", value: billingCounts.user, color: "#93b7ff" },
      { label: "Плюс", value: billingCounts.plus, color: "#c8a843" },
      { label: "Про", value: billingCounts.pro, color: "#f2d675" },
      { label: "Адмін", value: billingCounts.admin, color: "#e9774b" },
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
          <span className={styles.eyebrow}>Білінг</span>
          <h2 className={styles.title}>Окремий білінг-простір.</h2>
          <p className={styles.description}>
            Білінг більше не захований у дашборді. Тепер ця сторінка відповідає
            за розподіл планів, стан квот, перепризначення тарифів і перегляд
            підписок на рівні акаунтів.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Призначені місця</span>
          <div className={styles.heroValue}>
            {billingRegistry.length} рядків
          </div>
          <div className={styles.heroMeta}>
            {billingCounts.preview} прев'ю, {billingCounts.trial} тріал,{" "}
            {paidAccounts} платних, {billingCounts.admin} адмінських
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Прев'ю</span>
          <strong className={styles.metricValue}>
            {billingCounts.preview}
          </strong>
          <p className={styles.metricNote}>
            Акаунти без активного платного циклу, які все ще працюють на
            прев'ю-квотах.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Тріал</span>
          <strong className={styles.metricValue}>{billingCounts.trial}</strong>
          <p className={styles.metricNote}>
            Стартові місця з тимчасовим безлімітним доступом у демо-моделі
            білінгу.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Платні тарифи</span>
          <strong className={styles.metricValue}>{paidAccounts}</strong>
          <p className={styles.metricNote}>
            Користувач {billingCounts.user}, Плюс {billingCounts.plus}, Про{" "}
            {billingCounts.pro}
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Скоро завершаться</span>
          <strong className={styles.metricValue}>{expiringSoon}</strong>
          <p className={styles.metricNote}>
            Підписки, які завершуються протягом наступних семи днів.
          </p>
        </article>
      </section>

      <section className={styles.splitGrid}>
        <article className={styles.donutCard}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Розподіл планів</span>
              <h3 className={styles.panelTitle}>Структура за тарифами</h3>
            </div>
          </div>

          <div className={styles.donutChart} style={donutStyle}>
            <div className={styles.donutHole}>
              <div>
                <strong>{billingRegistry.length}</strong>
                <span>рядків білінгу</span>
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
              <span className={styles.panelEyebrow}>Стан квот</span>
              <h3 className={styles.panelTitle}>Середній тиск використання</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressTopRow}>
                <span className={styles.progressLabel}>
                  Середнє вигорання пошуку
                </span>
                <span className={styles.progressValue}>
                  {quotaHealth.search}%
                </span>
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
                <span className={styles.progressLabel}>
                  Середнє вигорання переглядів
                </span>
                <span className={styles.progressValue}>
                  {quotaHealth.view}%
                </span>
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
                <span className={styles.progressLabel}>Адмінські місця</span>
                <span className={styles.progressValue}>
                  {billingCounts.admin}
                </span>
              </div>
              <div className={styles.progressMeta}>
                Адміни не входять у клієнтські тарифні лінійки та мають
                безлімітний доступ.
              </div>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Реєстр</span>
            <h3 className={styles.panelTitle}>
              Призначення планів і перевірка квот
            </h3>
          </div>
          <button
            type="button"
            className={styles.secondaryAction}
            onClick={() => exportBillingCSV(filteredRegistry)}
          >
            Експорт CSV
          </button>
        </div>

        <div className={styles.toolbar}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={styles.toolbarInput}
            placeholder="Пошук за користувачем або email"
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
                {formatPlanFilterLabel(value)}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.registryViewport}>
          <div className={styles.accountList}>
            {filteredRegistry.length > 0 ? (
              filteredRegistry.map((account) => (
                <AdminBillingRow
                  key={account.id}
                  account={account}
                  clientPlanIds={clientPlanIds}
                  onRequestPlan={(accountId, accountName, planId) =>
                    setConfirmPlan({ accountId, accountName, planId })
                  }
                />
              ))
            ) : (
              <div className={styles.emptyState}>
                За поточним фільтром не знайдено жодного білінг-запису.
              </div>
            )}
          </div>
        </div>
        {confirmPlan && (
          <ConfirmModal
            plan={confirmPlan}
            onConfirm={() => {
              handleAssignPlan(
                confirmPlan.accountId,
                confirmPlan.accountName,
                confirmPlan.planId,
              );
              setConfirmPlan(null);
            }}
            onCancel={() => setConfirmPlan(null)}
          />
        )}
      </section>
    </section>
  );
}
