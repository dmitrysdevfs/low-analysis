"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  CreditCard,
  Search,
  Eye,
  FileText,
  Receipt,
  ShoppingCart,
  Package,
  Zap,
  Crown,
  Clock,
} from "lucide-react";
import { useBilling } from "@/components/billing/BillingProvider";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import { formatDateFull } from "@/lib/utils";
import styles from "./BillingDashboard.module.scss";

function usageLabel(limit: number | null, remaining: number | null): string {
  if (limit === null || remaining === null) return "Безліміт";
  return `${remaining} з ${limit}`;
}

function usagePercent(limit: number | null, used: number): number {
  if (!limit) return 100;
  return Math.min(100, Math.round((used / limit) * 100));
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "Активний",
    trialing: "Пробний",
    expired: "Закінчився",
    inactive: "Активний",
  };
  return map[status] ?? "Активний";
}

const RECOMMENDED_PLAN_ID = "user";

const PLAN_ICONS: Record<string, typeof Crown> = {
  trial: Zap,
  user: Crown,
  plus: Package,
  pro: ShoppingCart,
};

export function BillingDashboard() {
  const { user } = useAuth();
  const { subscription, payments, planCatalog } = useBilling();

  const upsellPlans = useMemo(
    () => planCatalog.filter((p) => p.id !== subscription?.planId),
    [planCatalog, subscription?.planId],
  );

  if (!user || !subscription) return null;

  const searchPercent = usagePercent(
    subscription.searchLimit,
    subscription.searchUsed,
  );
  const viewPercent = usagePercent(
    subscription.viewLimit,
    subscription.viewUsed,
  );

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>Налаштування доступу</span>
          <h1 className={styles.heroTitle}>
            Тариф, квоти та&nbsp;тестова оплата
          </h1>
          <p className={styles.heroDesc}>
            Оберіть тариф, що підходить вам. Активуйте пробний тиждень або
            перейдіть на повний план, щоб отримати доступ до аналітики,
            пошуку та збереження статей без обмежень.
          </p>
          <div className={styles.heroActions}>
            <Link href={ROUTES.accountCheckout} className={styles.btnPrimary}>
              <CreditCard size={15} />
              Перейти до оплати
            </Link>
            <Link href={ROUTES.account} className={styles.btnOutline}>
              До кабінету
            </Link>
          </div>
        </div>

        <aside className={styles.heroAside}>
          <div className={styles.heroAsideTop}>
            <span className={styles.asideEyebrow}>Поточний доступ</span>
            <span
              className={`${styles.statusPill} ${subscription.status === "inactive" ? styles.statusPillActive : styles.statusPillGold}`}
            >
              {statusLabel(subscription.status)}
            </span>
          </div>
          <div className={styles.heroAsideValue}>
            {subscription.accessLabel}
          </div>
          <p className={styles.heroAsideDesc}>{subscription.description}</p>
          <div className={styles.heroAsidePills}>
            <span className={styles.pill}>Ресурси</span>
            <span className={styles.pill}>
              {subscription.daysRemaining === null
                ? "Без терміну"
                : `${subscription.daysRemaining} дн.`}
            </span>
          </div>
        </aside>
      </div>

      {/* ── 3-card usage row ── */}
      <div className={styles.usageRow}>
        {/* Current plan / demo */}
        <div className={styles.card}>
          <div className={styles.cardEyebrow}>
            <Receipt size={14} />
            Пробний період
          </div>
          <h2 className={styles.cardTitle}>Стан demo-доступу</h2>

          <div className={styles.demoPlanRow}>
            <div className={styles.demoPlanName}>
              {subscription.plan?.label ?? "Preview-доступ"}
            </div>
            {subscription.endsAt ? (
              <span className={styles.demoActiveBadge}>
                {subscription.daysRemaining ?? 0} днів активно
              </span>
            ) : (
              <span className={styles.demoActiveBadge}>Preview</span>
            )}
            <div className={styles.demoPlanPrice}>
              ${subscription.plan?.priceUsd ?? 0}
            </div>
          </div>

          <p className={styles.demoNote}>
            {subscription.endsAt
              ? `Поновлення вручну. Цикл закінчується ${formatDateFull(subscription.endsAt)}.`
              : "Платного плану ще немає. Preview-квоти активні до оновлення."}
          </p>

          <ul className={styles.demoChecks}>
            <li>
              Квота пошуку:{" "}
              <strong>
                {usageLabel(
                  subscription.searchLimit,
                  subscription.searchRemaining,
                )}
              </strong>
            </li>
            <li>
              Квота переглядів:{" "}
              <strong>
                {usageLabel(subscription.viewLimit, subscription.viewRemaining)}
              </strong>
            </li>
            <li>Дані картки зберігаються лише в локальному стані форми.</li>
          </ul>
        </div>

        {/* Search quotas */}
        <div className={styles.card}>
          <div className={styles.cardEyebrow}>
            <Search size={14} />
            Поточні квоти запитів
          </div>
          <h2 className={styles.cardTitle}>Квоти пошуку</h2>

          <div className={styles.quotaBlock}>
            <div className={styles.quotaTopRow}>
              <span className={styles.quotaLabel}>Запити пошуку</span>
              <span className={styles.quotaBadge}>
                {usageLabel(
                  subscription.searchLimit,
                  subscription.searchRemaining,
                )}
              </span>
            </div>
            <div className={styles.quotaValue}>
              {subscription.searchUsed} використано
            </div>
            <div className={styles.progressTrack}>
              <span
                className={styles.progressFill}
                style={{ width: `${searchPercent}%` }}
              />
            </div>
            <p className={styles.quotaMeta}>
              Пошук проводиться через власний індекс сайту, що не у хмарах
              застосунку.
            </p>
          </div>
        </div>

        {/* View quotas */}
        <div className={styles.card}>
          <div className={styles.cardEyebrow}>
            <Eye size={14} />
            Поточні квоти переглядів
          </div>
          <h2 className={styles.cardTitle}>Квоти переглядів</h2>

          <div className={styles.quotaBlock}>
            <div className={styles.quotaTopRow}>
              <span className={styles.quotaLabel}>Глибокий перегляд</span>
              <span className={styles.quotaBadge}>
                {usageLabel(subscription.viewLimit, subscription.viewRemaining)}
              </span>
            </div>
            <div className={styles.quotaValue}>
              {subscription.viewUsed} використано
            </div>
            <div className={styles.progressTrack}>
              <span
                className={styles.progressFill}
                style={{ width: `${viewPercent}%` }}
              />
            </div>
            <p className={styles.quotaMeta}>
              Дерево законів, статті та сторінки суб&apos;єктів витрачають цю
              квоту.
            </p>
          </div>
        </div>
      </div>

      {/* ── Plans ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Crown size={16} className={styles.sectionIcon} />
          <span className={styles.sectionEyebrow}>Доступні плани</span>
        </div>

        <div className={styles.plansGrid}>
          {planCatalog.map((plan) => {
            const isCurrent = plan.id === subscription.planId;
            const isRecommended = plan.id === RECOMMENDED_PLAN_ID;
            const Icon = PLAN_ICONS[plan.id] ?? Package;
            return (
              <article
                key={plan.id}
                className={`${styles.planCard} ${isRecommended ? styles.planCardRecommended : ""} ${isCurrent ? styles.planCardCurrent : ""}`}
              >
                {isRecommended && (
                  <div className={styles.recommendedBadge}>
                    ⭐ Рекомендовано
                  </div>
                )}
                {isCurrent && !isRecommended && (
                  <div className={styles.currentBadge}>Поточний план</div>
                )}

                <div className={styles.planTop}>
                  <div className={styles.planLeft}>
                    <div className={styles.planIconWrap}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className={styles.planName}>{plan.label}</div>
                      <div className={styles.planBadge}>{plan.badge}</div>
                    </div>
                  </div>
                  <div className={styles.planPrice}>
                    <span className={styles.planPriceValue}>
                      ${plan.priceUsd}
                    </span>
                    <span className={styles.planPricePer}>&nbsp;/ міс</span>
                  </div>
                </div>

                <p className={styles.planDesc}>{plan.description}</p>

                <ul className={styles.planFeatures}>
                  {plan.features.map((f) => (
                    <li key={f} className={styles.planFeatureItem}>
                      <span className={styles.planFeatureDot}>◆</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button
                    type="button"
                    className={styles.planBtnCurrent}
                    disabled
                  >
                    Поточний план
                  </button>
                ) : (
                  <Link
                    href={`${ROUTES.accountCheckout}?plan=${plan.id}`}
                    className={`${styles.planBtn} ${isRecommended ? styles.planBtnGold : ""}`}
                  >
                    Обрати {plan.label}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {/* ── Payment history ── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <Clock size={16} className={styles.sectionIcon} />
          <span className={styles.sectionEyebrow}>Історія платежів</span>
        </div>
        <h2 className={styles.sectionTitle}>Демо-транзакції</h2>

        {payments.length > 0 ? (
          <div className={styles.historyList}>
            {payments.map((p) => (
              <div key={p.id} className={styles.historyRow}>
                <div className={styles.historyLeft}>
                  <div className={styles.historyValue}>{p.summary}</div>
                  <div className={styles.historyMeta}>
                    {formatDateFull(p.paidAt)} · від {p.actor}
                  </div>
                </div>
                <span className={styles.methodPill}>
                  {p.method.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.historyEmpty}>
            <FileText size={40} className={styles.historyEmptyIcon} />
            <p>
              Платіжних подій ще немає. Після активації пробного або щомісячного
              плану журнал demo-оплати з&apos;явиться тут.
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom stats ── */}
      <div className={styles.statsStrip}>
        <div className={styles.statItem}>
          <Receipt size={22} className={styles.statIcon} />
          <span className={styles.statValue}>{payments.length}</span>
          <span className={styles.statLabel}>Демо-транзакцій</span>
        </div>
        <div className={styles.statItem}>
          <Search size={22} className={styles.statIcon} />
          <span className={styles.statValue}>{subscription.searchUsed}</span>
          <span className={styles.statLabel}>Пошуків</span>
        </div>
        <div className={styles.statItem}>
          <Eye size={22} className={styles.statIcon} />
          <span className={styles.statValue}>{subscription.viewUsed}</span>
          <span className={styles.statLabel}>Переглядів</span>
        </div>
        <div className={styles.statItem}>
          <FileText size={22} className={styles.statIcon} />
          <span className={styles.statValue}>0</span>
          <span className={styles.statLabel}>Статей</span>
        </div>
      </div>
    </div>
  );
}
