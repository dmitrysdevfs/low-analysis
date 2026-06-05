"use client";

import { useState } from "react";
import { formatDateShort } from "@/lib/utils";
import { formatCodeStatusLabel } from "./adminLabels";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminWorkspace.module.scss";

function RegenConfirmModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "rgba(9,18,38,0.98)", border: "1px solid rgba(233,119,75,0.3)",
        borderRadius: 20, padding: "28px 32px", maxWidth: 360, width: "100%",
        boxShadow: "0 24px 48px rgba(0,0,0,0.5)",
      }}>
        <div style={{ color: "#e9774b", fontFamily: "monospace", fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
          Попередження
        </div>
        <div style={{ color: "#ffffff", fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>
          Перегенерувати супер-код?
        </div>
        <div style={{ color: "#9eb5d9", fontSize: "0.84rem", marginBottom: 20 }}>
          Поточний код стане неактивним. Усі адміни, що не ввійшли, втратять можливість підключення через старий код.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1, minHeight: 38, borderRadius: 999, border: 0,
              background: "linear-gradient(135deg, #e9774b 0%, #c8612a 100%)",
              color: "#ffffff", fontWeight: 700, cursor: "pointer",
            }}
          >
            Перегенерувати
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1, minHeight: 38, borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.04)", color: "#eef3fb",
              fontWeight: 700, cursor: "pointer",
            }}
          >
            Скасувати
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCodesView() {
  const { snapshot, handleCopyCode, handleRegenerateCode } =
    useAdminWorkspace();

  const [codeRevealed, setCodeRevealed] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);

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
          <h2 className={styles.title}>
            Життєвий цикл супер-коду в одному місці.
          </h2>
          <p className={styles.description}>
            Модуль кодів зберігає поточну логіку підключення адміністраторів,
            але подає її як чіткіший безпековий екран з активним станом,
            історією ротацій і контекстом навколо захищених адмін-акаунтів.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Активний код</span>
          <div className={styles.heroValue} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ letterSpacing: codeRevealed ? "0.05em" : "0.15em", fontFamily: "monospace" }}>
              {codeRevealed ? snapshot.activeSuperCode : "•".repeat(Math.max(8, snapshot.activeSuperCode.length))}
            </span>
            <button
              type="button"
              onClick={() => setCodeRevealed(r => !r)}
              style={{
                background: "none", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6, color: "#9eb5d9", cursor: "pointer",
                fontSize: "0.72rem", padding: "2px 10px", fontWeight: 600,
              }}
            >
              {codeRevealed ? "Сховати" : "Показати"}
            </button>
          </div>
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
            Одночасно для підключення адміністраторів може бути чинним лише один
            супер-код.
          </p>
        </article>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Записи історії</span>
          <strong className={styles.metricValue}>
            {snapshot.superCodeHistory.length}
          </strong>
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
              <div className={styles.insightValue} style={{ letterSpacing: codeRevealed ? "0.05em" : "0.15em", fontFamily: "monospace" }}>
                {codeRevealed ? snapshot.activeSuperCode : "•".repeat(Math.max(8, snapshot.activeSuperCode.length))}
              </div>
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
                Після перегенерації попередні коди лишаються в історії, але вже
                не є активними.
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
              onClick={() => setConfirmRegen(true)}
            >
              Перегенерувати код
            </button>
          </div>

          {confirmRegen && (
            <RegenConfirmModal
              onConfirm={() => { handleRegenerateCode(); setConfirmRegen(false); setCodeRevealed(false); }}
              onCancel={() => setConfirmRegen(false)}
            />
          )}
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
                Для підключення адміністратора, як і раніше, потрібен саме
                поточний активний супер-код.
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>
                Історія лишається локальною для демо-адмінки й доступна для
                перегляду.
              </div>
            </div>
            <div className={styles.progressRow}>
              <div className={styles.progressLabel}>
                Кожна перегенерація лишає старий код видимим, але більше не
                активним.
              </div>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}
