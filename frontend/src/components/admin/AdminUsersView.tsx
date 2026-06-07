"use client";

import { useMemo, useState } from "react";
import { formatDateShort } from "@/lib/utils";

const AVATAR_COLORS = [
  { bg: "rgba(200,168,67,0.2)", text: "#c8a843" },
  { bg: "rgba(74,128,212,0.2)", text: "#4a80d4" },
  { bg: "rgba(82,183,136,0.2)", text: "#52b788" },
  { bg: "rgba(233,119,75,0.2)", text: "#e9774b" },
  { bg: "rgba(233,30,154,0.2)", text: "#e91e9a" },
  { bg: "rgba(139,195,74,0.2)", text: "#8bc34a" },
];

function hashAvatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function exportUsersCSV(accounts: ReturnType<typeof useAdminUsers>["users"]) {
  const header = "Ім'я,Email,Тип,Джерело,Статус,Створено,Останній вхід";
  const rows = accounts.map((a) =>
    [
      a.displayName,
      a.email,
      a.accountType,
      a.source,
      a.status,
      a.createdAt,
      a.lastLoginAt ?? "—",
    ].join(","),
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
import {
  formatAccountSourceLabel,
  formatAccountStatusLabel,
  formatAccountTypeLabel,
  formatPlanFilterLabel,
} from "./adminLabels";
import { useAdminWorkspace } from "./useAdminWorkspace";
import { useAdminUsers } from "@/admin/data/_adapters/usersAdapter";
import { VirtualList } from "@/admin/components/VirtualList/VirtualList";
import { SemanticProgressBar } from "@/admin/components/SemanticProgressBar/SemanticProgressBar";
import styles from "./AdminWorkspace.module.scss";

type RegistryFilter = "all" | "client" | "admin";

export function AdminUsersView() {
  const { snapshot, handleAccountAction } = useAdminWorkspace();
  const [registryFilter, setRegistryFilter] = useState<RegistryFilter>("all");
  const [registryQuery, setRegistryQuery] = useState("");

  const { users: adapterUsers } = useAdminUsers({ query: registryQuery });
  const filteredAccounts = useMemo(() => {
    if (registryFilter === "all") return adapterUsers;
    return adapterUsers.filter((u) => u.accountType === registryFilter);
  }, [adapterUsers, registryFilter]);

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
          <span className={styles.eyebrow}>Користувачі</span>
          <h2 className={styles.title}>
            Реєстр акаунтів із живими адмін-діями.
          </h2>
          <p className={styles.description}>
            Цей екран зберігає поточну демонстраційну логіку акаунтів, але подає
            її як сфокусований реєстр із чіткішим відображенням статусів,
            безпечнішою роботою з розробницькими акаунтами та швидкими рольовими
            фільтрами.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Поточний реєстр</span>
          <div className={styles.heroValue}>
            {snapshot.totalAccounts} акаунтів
          </div>
          <div className={styles.heroMeta}>
            {snapshot.clientAccounts} клієнтів, {snapshot.adminAccounts}{" "}
            адмінів, {statusCounts.inactive} неактивних, {statusCounts.dev}{" "}
            розробницьких ідентичностей
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Усього</span>
          <strong className={styles.metricValue}>
            {snapshot.totalAccounts}
          </strong>
          <p className={styles.metricNote}>
            Усі збережені та вбудовані розробницькі ідентичності, які бачить
            адмін-простір.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Клієнти</span>
          <strong className={styles.metricValue}>
            {snapshot.clientAccounts}
          </strong>
          <p className={styles.metricNote}>
            Клієнтські сесії зі стандартним доступом до законів, суб'єктів і
            пошуку.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Адміни</span>
          <strong className={styles.metricValue}>
            {snapshot.adminAccounts}
          </strong>
          <p className={styles.metricNote}>
            Ідентичності, які можуть входити в адмін-простір і керувати
            захищеними сценаріями.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Неактивні</span>
          <strong className={styles.metricValue}>
            {statusCounts.inactive}
          </strong>
          <p className={styles.metricNote}>
            Акаунти, які зараз вимкнені у локальному сховищі автентифікації.
          </p>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Мікс статусів</span>
              <h3 className={styles.panelTitle}>Стан акаунтів</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <SemanticProgressBar
              value={statusCounts.active}
              max={snapshot.totalAccounts}
              label="Активні акаунти"
            />
            <SemanticProgressBar
              value={statusCounts.inactive}
              max={snapshot.totalAccounts}
              label="Неактивні акаунти"
            />
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Мікс джерел</span>
              <h3 className={styles.panelTitle}>
                Збережені та розробницькі ідентичності
              </h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <SemanticProgressBar
              value={statusCounts.stored}
              max={snapshot.totalAccounts}
              label="Збережені акаунти"
            />
            <SemanticProgressBar
              value={statusCounts.dev}
              max={snapshot.totalAccounts}
              label="Розробницькі акаунти"
              meta="Розробницькі ідентичності лишаються видимими для демо-сценаріїв."
            />
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Реєстр</span>
              <h3 className={styles.panelTitle}>Пошук і керування акаунтами</h3>
            </div>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={() => exportUsersCSV(filteredAccounts)}
            >
              Експорт CSV
            </button>
          </div>

          <div className={styles.toolbar}>
            <input
              value={registryQuery}
              onChange={(event) => setRegistryQuery(event.target.value)}
              className={styles.toolbarInput}
              placeholder="Пошук за ім'ям або email"
            />
            <div className={styles.filterTabs}>
              {(["all", "client", "admin"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.filterTab} ${registryFilter === value ? styles.filterTabActive : ""}`}
                  onClick={() => setRegistryFilter(value)}
                >
                  {formatPlanFilterLabel(value)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.registryViewport}>
            <VirtualList
              items={filteredAccounts}
              estimateSize={120}
              maxHeight={520}
              emptyState={
                <div className={styles.emptyState}>
                  За поточним фільтром не знайдено жодного акаунта.
                </div>
              }
              renderItem={(account) => {
                const isDev = account.source === "dev";
                const isInactive = account.status === "inactive";
                const avatarColor = hashAvatarColor(account.displayName);
                return (
                  <div key={account.id} className={styles.accountRow}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: avatarColor.bg,
                          color: avatarColor.text,
                          fontWeight: 700,
                          fontSize: "0.9rem",
                        }}
                      >
                        {account.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.accountName}>
                          {account.displayName}
                        </div>
                        <div className={styles.accountMeta}>
                          {account.email}
                        </div>
                      </div>
                    </div>
                    <div className={styles.accountBadges}>
                      <span className={styles.accountBadge}>
                        {formatAccountTypeLabel(account.accountType)}
                      </span>
                      {account.roles?.includes("legislator") && (
                        <span className={styles.accountBadgeAccent}>
                          Законотворець
                        </span>
                      )}
                      <span className={styles.accountBadge}>
                        {formatAccountSourceLabel(account.source)}
                      </span>
                      <span
                        className={
                          isInactive
                            ? styles.accountBadgeDanger
                            : styles.accountBadgeAccent
                        }
                      >
                        {account.status === "active"
                          ? "✓ Активний"
                          : "✕ Неактивний"}
                      </span>
                      {account.superCodeProtected ? (
                        <span className={styles.accountBadgeAccent}>
                          супер-код
                        </span>
                      ) : null}
                    </div>
                    <div className={styles.accountMetaBlock}>
                      <span>
                        Створено: {formatDateShort(account.createdAt)}
                      </span>
                      <span>
                        Останній вхід:{" "}
                        {account.lastLoginAt
                          ? formatDateShort(account.lastLoginAt)
                          : "ніколи"}
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
                        {isInactive ? "Активувати" : "Деактивувати"}
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
                        {account.accountType === "admin"
                          ? "Знизити роль"
                          : "Підвищити до адміна"}
                      </button>
                      {account.accountType !== "admin" && (
                        <button
                          type="button"
                          className={styles.accountActionBtn}
                          disabled={isDev}
                          onClick={() =>
                            handleAccountAction(
                              "setLegislator",
                              account.id,
                              account.displayName,
                            )
                          }
                        >
                          {account.roles?.includes("legislator")
                            ? "Зняти законотворця"
                            : "Законотворець"}
                        </button>
                      )}
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
                        Вийти примусово
                      </button>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        </article>
      </section>
    </section>
  );
}
