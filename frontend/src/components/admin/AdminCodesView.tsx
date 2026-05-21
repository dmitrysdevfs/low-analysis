"use client";

import { formatDateShort } from "@/lib/utils";
import { formatCodeStatusLabel } from "./adminLabels";
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
          <span className={styles.eyebrow}>Коди</span>
          <h2 className={styles.title}>Життєвий цикл супер-коду в одному місці.</h2>
          <p className={styles.description}>
            Модуль кодів зберігає поточну логіку підключення адміністраторів, але подає її як
            чіткіший безпековий екран з активним станом, історією ротацій і
            контекстом навколо захищених адмін-акаунтів.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Активний код</span>
          <div className={styles.heroValue}>{snapshot.activeSuperCode}</div>
          <div className={styles.heroMeta}>
            {snapshot.superCodeRotatedAt
              ? `Оновлено ${formatDateShort(snapshot.superCodeRotatedAt)}`
              : "Початковий код ще активний"}
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Активний код</span>
          <strong className={styles.metricValue}>1</strong>
          <p className={styles.metricNote}>
            Одночасно для підключення адміністраторів може бути чинним лише один супер-код.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Записи історії</span>
          <strong className={styles.metricValue}>{snapshot.superCodeHistory.length}</strong>
          <p className={styles.metricNote}>
            Історія ротацій збережена у фронтенд-сховищі адмінки.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Захищені адміни</span>
          <strong className={styles.metricValue}>{protectedAccounts}</strong>
          <p className={styles.metricNote}>
            Акаунти, створені або захищені через потік супер-коду.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Події безпеки</span>
          <strong className={styles.metricValue}>{securityEvents}</strong>
          <p className={styles.metricNote}>
            Записи аудиту, вже позначені підвищеним рівнем критичності.
          </p>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Дії з кодом</span>
              <h3 className={styles.panelTitle}>Активний код запрошення</h3>
            </div>
          </div>

          <div className={styles.insightGrid}>
            <div className={styles.insightCard}>
              <div className={styles.insightTitle}>Поточне значення</div>
              <div className={styles.insightValue}>{snapshot.activeSuperCode}</div>
              <div className={styles.insightMeta}>
                Передавайте лише в межах сценарію підключення адміністратора.
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightTitle}>Остання ротація</div>
              <div className={styles.insightValue}>
                {snapshot.superCodeRotatedAt
                  ? formatDateShort(snapshot.superCodeRotatedAt)
                  : "Початковий"}
              </div>
              <div className={styles.insightMeta}>
                Свіжі ротації автоматично потрапляють в історію аудиту.
              </div>
            </div>
            <div className={styles.insightCard}>
              <div className={styles.insightTitle}>Безпечна модель</div>
              <div className={styles.insightValue}>Один активний код</div>
              <div className={styles.insightMeta}>
                Після перегенерації попередні коди лишаються в історії, але вже не
                є активними.
              </div>
            </div>
          </div>

          <div className={styles.actionRow}>
            <button
              type="button"
              className={styles.primaryAction}
              onClick={handleCopyCode}
            >
              Скопіювати активний код
            </button>
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={handleRegenerateCode}
            >
              Перегенерувати код
            </button>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Історія</span>
              <h3 className={styles.panelTitle}>Журнал ротацій</h3>
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
                <span className={styles.historyStatus}>
                  {formatCodeStatusLabel(entry.status)}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Запобіжники</span>
              <h3 className={styles.panelTitle}>Операційні примітки</h3>
            </div>
          </div>

          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>
                Для підключення адміністратора, як і раніше, потрібен саме поточний активний супер-код.
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>
                Історія лишається локальною для демо-адмінки й доступна для перегляду.
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>
                Кожна перегенерація лишає старий код видимим, але більше не активним.
              </div>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
