"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ROUTES } from "@/constants/routes";
import { useBilling } from "@/components/billing/BillingProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatDateFull } from "@/lib/utils";
import styles from "./ClientBilling.module.scss";

function formatPlanStatus(status: string) {
  if (status === "trialing") {
    return "Пробний активний";
  }

  if (status === "expired") {
    return "Закінчився";
  }

  if (status === "active") {
    return "Активний";
  }

  return "Preview";
}

function formatUsageValue(
  limit: number | null,
  used: number,
  remaining: number | null,
) {
  if (limit === null || remaining === null) {
    return "Безліміт";
  }

  return `${remaining} з ${limit}`;
}

function formatUsagePercent(limit: number | null, used: number) {
  if (limit === null || limit === 0) {
    return 100;
  }

  return Math.min(100, Math.round((used / limit) * 100));
}

export function ClientBillingOverview() {
  const { user } = useAuth();
  const { subscription, payments, planCatalog } = useBilling();

  const currentPlan = subscription?.plan;
  const upsellPlans = useMemo(
    () => planCatalog.filter((plan) => plan.id !== subscription?.planId),
    [planCatalog, subscription?.planId],
  );

  if (!user || !subscription) {
    return null;
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Клієнтський білінг</span>
          <h1 className={styles.title}>Тариф, квоти та тестова оплата</h1>
          <p className={styles.description}>
            Цей локальний білінг живе лише в браузері. Він дає змогу клієнту
            активувати пробний тиждень, поновити щомісячний план і
            відстежувати квоти запитів — без збереження даних картки на бекенді.
          </p>
          <div className={styles.actions}>
            <Link
              href={ROUTES.accountCheckout}
              className={styles.primaryAction}
            >
              Перейти до оплати
            </Link>
            <Link href={ROUTES.account} className={styles.secondaryAction}>
              До кабінету
            </Link>
          </div>
        </div>

        <aside className={styles.heroAside}>
          <div className={styles.heroStat}>
            <span className={styles.metaLabel}>Поточний доступ</span>
            <div className={styles.heroValue}>{subscription.accessLabel}</div>
            <div className={styles.metaText}>{subscription.description}</div>
          </div>

          <div className={styles.heroMeta}>
            <span
              className={`${styles.statusPill} ${
                subscription.previewMode
                  ? styles.statusPillPreview
                  : styles.statusPillActive
              }`}
            >
              {formatPlanStatus(subscription.status)}
            </span>
            <span className={styles.pill}>
              {subscription.daysRemaining === null
                ? "Без терміну"
                : `Залишилось ${subscription.daysRemaining} дн.`}
            </span>
          </div>
        </aside>
      </div>

      <div className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Поточна підписка</span>
              <h2 className={styles.panelTitle}>Стан demo-доступу</h2>
            </div>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planTopRow}>
              <div>
                <h3 className={styles.planLabel}>
                  {currentPlan?.label ?? "Preview-доступ"}
                </h3>
                <div className={styles.planBadge}>
                  {currentPlan?.badge ?? "Стартова квота"}
                </div>
              </div>
              <div className={styles.price}>
                {currentPlan ? `$${currentPlan.priceUsd}` : "$0"}
              </div>
            </div>

            <div className={styles.note}>
              {subscription.endsAt
                ? `Поновлення вручну. Цикл закінчується ${formatDateFull(subscription.endsAt)}.`
                : "Платного плану ще немає. Preview-квоти активні до оновлення."}
            </div>

            <ul className={styles.summaryList}>
              <li className={styles.summaryItem}>
                Квота пошуку:{" "}
                {formatUsageValue(
                  subscription.searchLimit,
                  subscription.searchUsed,
                  subscription.searchRemaining,
                )}
              </li>
              <li className={styles.summaryItem}>
                Квота переглядів:{" "}
                {formatUsageValue(
                  subscription.viewLimit,
                  subscription.viewUsed,
                  subscription.viewRemaining,
                )}
              </li>
              <li className={styles.summaryItem}>
                Дані картки зберігаються лише в локальному стані форми.
              </li>
            </ul>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Використання</span>
              <h2 className={styles.panelTitle}>Поточні квоти запитів</h2>
            </div>
          </div>

          <div className={styles.usageGrid}>
            <div className={styles.usageCard}>
              <div className={styles.usageTopRow}>
                <span className={styles.metaLabel}>Запити пошуку</span>
                <span className={styles.methodPill}>
                  {formatUsageValue(
                    subscription.searchLimit,
                    subscription.searchUsed,
                    subscription.searchRemaining,
                  )}
                </span>
              </div>
              <div className={styles.usageValue}>
                {subscription.searchUsed} використано
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${formatUsagePercent(
                      subscription.searchLimit,
                      subscription.searchUsed,
                    )}%`,
                  }}
                />
              </div>
              <div className={styles.usageMeta}>
                Пошук проходить через ті самі ліміт-гейти, що й у живому застосунку.
              </div>
            </div>

            <div className={styles.usageCard}>
              <div className={styles.usageTopRow}>
                <span className={styles.metaLabel}>Глибокі перегляди</span>
                <span className={styles.methodPill}>
                  {formatUsageValue(
                    subscription.viewLimit,
                    subscription.viewUsed,
                    subscription.viewRemaining,
                  )}
                </span>
              </div>
              <div className={styles.usageValue}>
                {subscription.viewUsed} використано
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${formatUsagePercent(
                      subscription.viewLimit,
                      subscription.viewUsed,
                    )}%`,
                  }}
                />
              </div>
              <div className={styles.usageMeta}>
                Дерева законів, статті та сторінки суб&apos;єктів витрачають цю квоту.
              </div>
            </div>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Оновлення плану</span>
              <h2 className={styles.panelTitle}>Доступні плани</h2>
            </div>
          </div>

          <div className={styles.planGrid}>
            {upsellPlans.map((plan) => (
              <article key={plan.id} className={styles.planCard}>
                <div className={styles.planTopRow}>
                  <div>
                    <h3 className={styles.planLabel}>{plan.label}</h3>
                    <div className={styles.planBadge}>{plan.badge}</div>
                  </div>
                  <div className={styles.price}>${plan.priceUsd}</div>
                </div>

                <p className={styles.panelCopy}>{plan.description}</p>

                <ul className={styles.featureList}>
                  {plan.features.map((feature) => (
                    <li key={feature} className={styles.featureItem}>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className={styles.actions}>
                  <Link
                    href={`${ROUTES.accountCheckout}?plan=${plan.id}`}
                    className={styles.primaryAction}
                  >
                    Обрати {plan.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Історія платежів</span>
              <h2 className={styles.panelTitle}>Демо-транзакції</h2>
            </div>
          </div>

          {payments.length > 0 ? (
            <div className={styles.historyList}>
              {payments.map((payment) => (
                <div key={payment.id} className={styles.historyRow}>
                  <div className={styles.historyTopRow}>
                    <div>
                      <div className={styles.historyValue}>
                        {payment.summary}
                      </div>
                      <div className={styles.historyMeta}>
                        {formatDateFull(payment.paidAt)} · від {payment.actor}
                      </div>
                    </div>
                    <span className={styles.methodPill}>
                      {payment.method.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              Платіжних подій ще немає. Після активації пробного або щомісячного
              плану журнал demo-оплати з&apos;явиться тут.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
