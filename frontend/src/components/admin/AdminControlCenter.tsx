"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { notify } from "@/lib/toast";
import {
  appendAdminAuditLog,
  deactivateMockAccount,
  forceLogoutMockAccount,
  getAdminDashboardSnapshot,
  promoteMockAccount,
  regenerateAdminSuperCode,
  type AdminDashboardSnapshot,
} from "@/lib/auth/mockAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBilling } from "@/components/billing/BillingProvider";
import { formatDateShort } from "@/lib/utils";
import styles from "./AdminControlCenter.module.scss";

type RegistryFilter = "all" | "client" | "admin";
type ActiveZone =
  | "overview"
  | "users"
  | "access"
  | "codes"
  | "plans"
  | "analytics"
  | "audit";

const ZONE_TABS: { key: ActiveZone; label: string }[] = [
  { key: "overview", label: "Огляд" },
  { key: "users", label: "Користувачі" },
  { key: "access", label: "Доступ" },
  { key: "codes", label: "Коди" },
  { key: "plans", label: "Billing" },
  { key: "analytics", label: "Аналітика" },
  { key: "audit", label: "Аудит" },
];

function formatAuditSeverity(severity: "info" | "warning" | "security") {
  if (severity === "security") {
    return "Безпека";
  }

  if (severity === "warning") {
    return "Попередження";
  }

  return "Інфо";
}

export function AdminControlCenter() {
  const { user } = useAuth();
  const { getBillingRegistry, assignPlan } = useBilling();
  const [snapshot, setSnapshot] = useState<AdminDashboardSnapshot | null>(null);
  const [registryFilter, setRegistryFilter] = useState<RegistryFilter>("all");
  const [registryQuery, setRegistryQuery] = useState("");
  const [activeZone, setActiveZone] = useState<ActiveZone>("overview");

  useEffect(() => {
    setSnapshot(getAdminDashboardSnapshot());
  }, [user]);

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
  const billingRegistry = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return getBillingRegistry(
      filteredAccounts.map((account) => ({
        id: account.id,
        displayName: account.displayName,
        email: account.email,
        accountType: account.accountType,
      })),
    );
  }, [filteredAccounts, getBillingRegistry, snapshot]);
  const billingCounts = useMemo(
    () =>
      billingRegistry.reduce(
        (acc, account) => {
          if (account.accountType === "admin") {
            acc.admin += 1;
            return acc;
          }

          if (!account.subscription.planId) {
            acc.preview += 1;
            return acc;
          }

          acc[account.subscription.planId] += 1;
          return acc;
        },
        { preview: 0, trial: 0, user: 0, plus: 0, pro: 0, admin: 0 },
      ),
    [billingRegistry],
  );

  if (!snapshot) {
    return null;
  }

  function refreshSnapshot() {
    setSnapshot(getAdminDashboardSnapshot());
  }

  async function handleCopyCode() {
    if (!snapshot) {
      return;
    }

    try {
      await navigator.clipboard.writeText(snapshot.activeSuperCode);
      notify.success("Активний супер-код скопійовано.");
      appendAdminAuditLog({
        action: "Super code copied",
        detail: `Активний супер-код скопійовано адміном ${user?.email ?? "admin"}.`,
        actor: user?.email ?? "admin",
        severity: "info",
      });
    } catch {
      notify.info(`Поточний супер-код: ${snapshot.activeSuperCode}`);
      appendAdminAuditLog({
        action: "Super code copied",
        detail: `Активний супер-код скопійовано адміном ${user?.email ?? "admin"}.`,
        actor: user?.email ?? "admin",
        severity: "info",
      });
    }
  }

  function handleRegenerateCode() {
    const next = regenerateAdminSuperCode();
    setSnapshot(getAdminDashboardSnapshot());
    notify.success(`Новий супер-код видано: ${next.code}`);
  }

  function handleCopyGuestStatus() {
    if (!snapshot) {
      return;
    }

    const summary = [
      `Пошук гостей: ${snapshot.guestPressure.searchUsed}/${snapshot.guestPressure.searchLimit}`,
      `Перегляди гостей: ${snapshot.guestPressure.viewUsed}/${snapshot.guestPressure.viewLimit}`,
      `Кулдаун пошуку: ${snapshot.guestPressure.searchCooldownActive ? "активний" : "вимкнено"}`,
      `Кулдаун перегляду: ${snapshot.guestPressure.viewCooldownActive ? "активний" : "вимкнено"}`,
    ].join(" | ");

    navigator.clipboard
      .writeText(summary)
      .then(() => notify.success("Зведення навантаження гостей скопійовано."))
      .catch(() => notify.info(summary));
  }

  function handleAccountAction(
    action: "deactivate" | "promote" | "forceLogout",
    accountId: string,
    accountName: string,
  ) {
    if (action === "deactivate") {
      const result = deactivateMockAccount(accountId);
      if (!result.ok) {
        notify.warning(result.error ?? "Не вдалося змінити статус.");
        return;
      }
      notify.success("Статус акаунту змінено.");
    } else if (action === "promote") {
      const result = promoteMockAccount(accountId);
      if (!result.ok) {
        notify.warning(result.error ?? "Не вдалося змінити роль.");
        return;
      }
      notify.success("Роль акаунту оновлено.");
    } else {
      forceLogoutMockAccount(accountId);
      appendAdminAuditLog({
        action: "Force logout",
        detail: `Примусовий вихід виконано для ${accountName} (${accountId}).`,
        actor: user?.email ?? "admin",
        severity: "warning",
      });
      notify.success("Примусовий вихід виконано.");
    }
    refreshSnapshot();
  }

  function handleAssignPlan(
    accountId: string,
    accountName: string,
    planId: "trial" | "user" | "plus" | "pro",
  ) {
    const result = assignPlan(accountId, planId, user?.email ?? "admin");

    if (!result.ok) {
      notify.warning(result.error ?? "Не вдалося оновити план.");
      return;
    }

    appendAdminAuditLog({
      action: "Billing plan reassigned",
      detail: `План ${planId} встановлено для ${accountName} (${accountId}).`,
      actor: user?.email ?? "admin",
      severity: "security",
    });
    notify.success("План клієнта оновлено.");
    refreshSnapshot();
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Центр керування</span>
          <h1 className={styles.title}>
            Операційний огляд для управління платформою
          </h1>
          <p className={styles.description}>
            Адмін-панель зберігає свою структуру, але отримує більшу операційну
            глибину: інструменти реєстру користувачів, історія lifecycle-кодів,
            моніторинг навантаження гостей і видимий журнал аудиту.
          </p>
        </div>

        <div className={styles.heroPanel}>
          <div className={styles.heroPanelLabel}>Активний адміністратор</div>
          <div className={styles.heroPanelValue}>
            {user?.displayName ?? "Admin"}
          </div>
          <div className={styles.heroPanelMeta}>{user?.email}</div>
          <div className={styles.heroPill}>
            Роль: {snapshot.activeSessionRole}
          </div>
        </div>
      </div>

      <div className={styles.zoneTabs}>
        {ZONE_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`mono ${styles.zoneTab} ${activeZone === tab.key ? styles.zoneTabActive : ""}`}
            onClick={() => {
              setActiveZone(tab.key);
              appendAdminAuditLog({
                action: "Zone switched",
                detail: `Адмін перейшов до зони: ${tab.label}.`,
                actor: user?.email ?? "admin",
                severity: "info",
              });
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.contentGrid}>
        {activeZone === "overview" && (
          <>
            <article className={`${styles.panel} ${styles.panelWide}`}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Метрики</span>
                  <h2 className={styles.panelTitle}>
                    Загальний огляд платформи
                  </h2>
                </div>
              </div>
              <div className={styles.metricsInline}>
                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Всього акаунтів</span>
                  <strong className={styles.metricValue}>
                    {snapshot.totalAccounts}
                  </strong>
                  <p className={styles.metricNote}>
                    Збережені та вбудовані frontend-ідентичності, доступні
                    платформі.
                  </p>
                </article>

                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Клієнтські акаунти</span>
                  <strong className={styles.metricValue}>
                    {snapshot.clientAccounts}
                  </strong>
                  <p className={styles.metricNote}>
                    Звичайні користувачі з доступом до клієнтського простору.
                  </p>
                </article>

                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Адмін акаунти</span>
                  <strong className={styles.metricValue}>
                    {snapshot.adminAccounts}
                  </strong>
                  <p className={styles.metricNote}>
                    Адміністративні ідентичності, що можуть розблоковувати
                    захищені операції.
                  </p>
                </article>

                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Події аудиту</span>
                  <strong className={styles.metricValue}>
                    {snapshot.auditLog.length}
                  </strong>
                  <p className={styles.metricNote}>
                    Нещодавні операційні події, зафіксовані фронтенд
                    адмін-шаром.
                  </p>
                </article>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    Навантаження гостей
                  </span>
                  <h2 className={styles.panelTitle}>
                    Поточне навантаження від гостей
                  </h2>
                </div>
              </div>

              <div className={styles.pressureGrid}>
                <div className={styles.pressureCard}>
                  <div className={styles.pressureTitle}>Пошукові запити</div>
                  <div className={styles.pressureValue}>
                    {snapshot.guestPressure.searchUsed}/
                    {snapshot.guestPressure.searchLimit}
                  </div>
                  <div className={styles.pressureMeta}>
                    Залишилось: {snapshot.guestPressure.searchRemaining}
                  </div>
                </div>

                <div className={styles.pressureCard}>
                  <div className={styles.pressureTitle}>Глибокі перегляди</div>
                  <div className={styles.pressureValue}>
                    {snapshot.guestPressure.viewUsed}/
                    {snapshot.guestPressure.viewLimit}
                  </div>
                  <div className={styles.pressureMeta}>
                    Залишилось: {snapshot.guestPressure.viewRemaining}
                  </div>
                </div>

                <div className={styles.pressureCard}>
                  <div className={styles.pressureTitle}>Стан кулдауну</div>
                  <div className={styles.pressureValue}>
                    {snapshot.guestPressure.searchCooldownActive ||
                    snapshot.guestPressure.viewCooldownActive
                      ? "Активний"
                      : "Норма"}
                  </div>
                  <div className={styles.pressureMeta}>
                    Кулдаун пошуку:{" "}
                    {snapshot.guestPressure.searchCooldownActive
                      ? "увімк."
                      : "вимк."}{" "}
                    · Кулдаун перегляду:{" "}
                    {snapshot.guestPressure.viewCooldownActive
                      ? "увімк."
                      : "вимк."}
                  </div>
                </div>
              </div>

              <div className={styles.actionStack}>
                <button
                  type="button"
                  className={styles.secondaryAction}
                  onClick={handleCopyGuestStatus}
                >
                  Копіювати зведення навантаження гостей
                </button>
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Готовність</span>
                  <h2 className={styles.panelTitle}>
                    Покриття фронтенд адміну
                  </h2>
                </div>
              </div>

              <ul className={styles.checklist}>
                <li>
                  Рольовий процес реєстрації з онбордингом для клієнтів і
                  адмінів.
                </li>
                <li>
                  Автоматичне визначення ролі входу на основі облікових даних.
                </li>
                <li>
                  Видимість навантаження гостей через лічильники пошуку та
                  перегляду.
                </li>
                <li>
                  Видача супер-коду адміністратора, історія ротації та журнал
                  аудиту.
                </li>
                <li>Фільтри реєстру поверх існуючого знімку акаунтів.</li>
              </ul>
            </article>
          </>
        )}

        {activeZone === "users" && (
          <article className={`${styles.panel} ${styles.panelWide}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Реєстр</span>
                <h2 className={styles.panelTitle}>
                  Інструменти реєстру акаунтів
                </h2>
              </div>

              <button
                type="button"
                className={styles.ghostAction}
                onClick={refreshSnapshot}
              >
                Оновити знімок
              </button>
            </div>

            <div className={styles.toolbar}>
              <input
                className={styles.toolbarInput}
                value={registryQuery}
                onChange={(event) => setRegistryQuery(event.target.value)}
                placeholder="Пошук за іменем або email..."
              />

              <div className={styles.filterTabs}>
                {(["all", "client", "admin"] as const).map((value) => {
                  const filterLabel: Record<RegistryFilter, string> = {
                    all: "Всі",
                    client: "Клієнти",
                    admin: "Адміни",
                  };
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`${styles.filterTab} ${registryFilter === value ? styles.filterTabActive : ""}`}
                      onClick={() => setRegistryFilter(value)}
                    >
                      {filterLabel[value]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.accountList}>
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((account) => (
                  <div key={account.id} className={styles.accountRow}>
                    <div>
                      <div className={styles.accountName}>
                        {account.displayName}
                      </div>
                      <div className={styles.accountMeta}>{account.email}</div>
                    </div>

                    <div className={styles.accountBadges}>
                      <span className={styles.accountBadge}>
                        {account.accountType}
                      </span>
                      <span className={styles.accountBadge}>
                        {account.source}
                      </span>
                      {account.superCodeProtected ? (
                        <span className={styles.accountBadgeAccent}>
                          super code
                        </span>
                      ) : null}
                    </div>

                    <div className={styles.accountMetaBlock}>
                      <span>
                        Створено: {formatDateShort(account.createdAt)}
                      </span>
                      <span>
                        Останній вхід: {formatDateShort(account.lastLoginAt)}
                      </span>
                    </div>

                    <div className={styles.accountActions}>
                      <button
                        type="button"
                        className={styles.accountActionBtn}
                        onClick={() =>
                          handleAccountAction(
                            "deactivate",
                            account.id,
                            account.displayName,
                          )
                        }
                      >
                        Деактивувати
                      </button>
                      <button
                        type="button"
                        className={styles.accountActionBtn}
                        onClick={() =>
                          handleAccountAction(
                            "promote",
                            account.id,
                            account.displayName,
                          )
                        }
                      >
                        {account.accountType === "admin"
                          ? "Зняти права адміна"
                          : "Підвищити до адміна"}
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
                        Примусовий вихід
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  Жодного акаунту не знайдено за поточним фільтром реєстру.
                </div>
              )}
            </div>
          </article>
        )}

        {activeZone === "access" && (
          <article className={`${styles.panel} ${styles.panelWide}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Матриця доступу</span>
                <h2 className={styles.panelTitle}>Хто що може відкрити</h2>
              </div>
            </div>

            <div className={styles.matrix}>
              <div className={styles.matrixHead}>
                <span>Роль</span>
                <span>Головна</span>
                <span>Закони</span>
                <span>Предмети</span>
                <span>Пошук</span>
                <span>Адмін</span>
              </div>

              {snapshot.accessMatrix.map((row) => (
                <div key={row.role} className={styles.matrixRow}>
                  <span className={styles.matrixRole}>{row.role}</span>
                  <span>{row.home ? "Так" : "Ні"}</span>
                  <span>{row.laws ? "Так" : "Ні"}</span>
                  <span>{row.subjects ? "Так" : "Ні"}</span>
                  <span>{row.search ? "Так" : "Ні"}</span>
                  <span>{row.adminPanel ? "Так" : "Ні"}</span>
                </div>
              ))}
            </div>
          </article>
        )}

        {activeZone === "codes" && (
          <article className={`${styles.panel} ${styles.panelWide}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Запрошення адміна</span>
                <h2 className={styles.panelTitle}>Lifecycle супер-коду</h2>
              </div>
            </div>

            <div className={styles.superCodeCard}>
              <div className={styles.superCodeValue}>
                {snapshot.activeSuperCode}
              </div>
              <div className={styles.superCodeMeta}>
                {snapshot.superCodeRotatedAt
                  ? `Замінено ${formatDateShort(snapshot.superCodeRotatedAt)}`
                  : "Активний код запрошення адміна за замовчуванням"}
              </div>
            </div>

            <div className={styles.actionStack}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={handleCopyCode}
              >
                Копіювати активний код
              </button>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={handleRegenerateCode}
              >
                Оновити супер-код
              </button>
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
        )}

        {activeZone === "plans" && (
          <>
            <article className={`${styles.panel} ${styles.panelWide}`}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Billing</span>
                  <h2 className={styles.panelTitle}>
                    Розподіл планів клієнтів
                  </h2>
                </div>
              </div>

              <div className={styles.metricsInline}>
                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Preview</span>
                  <strong className={styles.metricValue}>
                    {billingCounts.preview}
                  </strong>
                  <p className={styles.metricNote}>
                    Акаунти без активного плану з локальними preview-квотами.
                  </p>
                </article>

                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Trial</span>
                  <strong className={styles.metricValue}>
                    {billingCounts.trial}
                  </strong>
                  <p className={styles.metricNote}>
                    Однотижневі starter-week доступи із безлімітною квотою.
                  </p>
                </article>

                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Paid tiers</span>
                  <strong className={styles.metricValue}>
                    {billingCounts.user +
                      billingCounts.plus +
                      billingCounts.pro}
                  </strong>
                  <p className={styles.metricNote}>
                    User {billingCounts.user} · Plus {billingCounts.plus} · Pro{" "}
                    {billingCounts.pro}
                  </p>
                </article>

                <article className={styles.metricCard}>
                  <span className={styles.metricLabel}>Admin access</span>
                  <strong className={styles.metricValue}>
                    {billingCounts.admin}
                  </strong>
                  <p className={styles.metricNote}>
                    Адміністратори не підпадають під клієнтські billing-плани.
                  </p>
                </article>
              </div>
            </article>

            <article className={`${styles.panel} ${styles.panelWide}`}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Plan registry</span>
                  <h2 className={styles.panelTitle}>
                    Поточний план кожного користувача
                  </h2>
                </div>
              </div>

              <div className={styles.accountList}>
                {billingRegistry.length > 0 ? (
                  billingRegistry.map((account) => (
                    <div key={account.id} className={styles.accountRow}>
                      <div>
                        <div className={styles.accountName}>
                          {account.displayName}
                        </div>
                        <div className={styles.accountMeta}>
                          {account.email}
                        </div>
                      </div>

                      <div className={styles.accountBadges}>
                        <span className={styles.accountBadge}>
                          {account.accountType}
                        </span>
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
                            ? `Діє до ${formatDateShort(account.subscription.endsAt)}`
                            : "Без оплаченого циклу"}
                        </span>
                      </div>

                      {account.accountType === "client" ? (
                        <div className={styles.accountActions}>
                          {(["trial", "user", "plus", "pro"] as const).map(
                            (planId) => (
                              <button
                                key={planId}
                                type="button"
                                className={styles.accountActionBtn}
                                onClick={() =>
                                  handleAssignPlan(
                                    account.id,
                                    account.displayName,
                                    planId,
                                  )
                                }
                              >
                                {planId}
                              </button>
                            ),
                          )}
                        </div>
                      ) : (
                        <div className={styles.accountActions}>
                          <span className={styles.accountBadgeAccent}>
                            admin-managed
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyState}>
                    Реєстр планів порожній за поточним фільтром.
                  </div>
                )}
              </div>
            </article>
          </>
        )}

        {activeZone === "analytics" && (
          <article className={`${styles.panel} ${styles.panelWide}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Аналітика</span>
                <h2 className={styles.panelTitle}>Аналіз даних</h2>
              </div>
            </div>

            <p className={styles.panelDescription}>
              Відкрийте окремий екран аналітики для перегляду законів,
              предметів, розділів, статей і покриття метаданими з поточних
              frontend API-запитів.
            </p>

            <div className={styles.actionStack}>
              <Link
                href={ROUTES.adminAnalytics}
                className={styles.primaryAction}
              >
                Відкрити аналітику
              </Link>
              <button
                type="button"
                className={styles.secondaryAction}
                onClick={() =>
                  notify.info(
                    "Метрики бекенду відображаються через фронтенд-аналітику.",
                  )
                }
              >
                Пояснити поточні метрики
              </button>
            </div>
          </article>
        )}

        {activeZone === "audit" && (
          <article className={`${styles.panel} ${styles.panelWide}`}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Аудит</span>
                <h2 className={styles.panelTitle}>Операційний журнал аудиту</h2>
              </div>
            </div>

            <div className={styles.auditList}>
              {snapshot.auditLog.length > 0 ? (
                snapshot.auditLog.map((item) => (
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
                        {formatAuditSeverity(item.severity)}
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
                  Події аудиту з'являться тут зі зростанням адмін-активності.
                </div>
              )}
            </div>
          </article>
        )}
      </div>
    </section>
  );
}
