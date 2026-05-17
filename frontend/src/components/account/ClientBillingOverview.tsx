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
    return "Trial active";
  }

  if (status === "expired") {
    return "Expired";
  }

  if (status === "active") {
    return "Active";
  }

  return "Preview";
}

function formatUsageValue(limit: number | null, used: number, remaining: number | null) {
  if (limit === null || remaining === null) {
    return "Unlimited";
  }

  return `${remaining} left of ${limit}`;
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
    () =>
      planCatalog.filter((plan) => plan.id !== subscription?.planId),
    [planCatalog, subscription?.planId],
  );

  if (!user || !subscription) {
    return null;
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Client billing</span>
          <h1 className={styles.title}>Plan, quota, and demo checkout</h1>
          <p className={styles.description}>
            This local billing layer lives only in the browser. It lets the client
            activate a weekly trial, renew a monthly plan, and track current request
            quotas without storing card data on the backend.
          </p>
          <div className={styles.actions}>
            <Link href={ROUTES.accountCheckout} className={styles.primaryAction}>
              Open checkout
            </Link>
            <Link href={ROUTES.account} className={styles.secondaryAction}>
              Back to workspace
            </Link>
          </div>
        </div>

        <aside className={styles.heroAside}>
          <div className={styles.heroStat}>
            <span className={styles.metaLabel}>Current access</span>
            <div className={styles.heroValue}>{subscription.accessLabel}</div>
            <div className={styles.metaText}>{subscription.description}</div>
          </div>

          <div className={styles.heroMeta}>
            <span
              className={`${styles.statusPill} ${
                subscription.previewMode ? styles.statusPillPreview : styles.statusPillActive
              }`}
            >
              {formatPlanStatus(subscription.status)}
            </span>
            <span className={styles.pill}>
              {subscription.daysRemaining === null
                ? "No expiry"
                : `${subscription.daysRemaining} days left`}
            </span>
          </div>
        </aside>
      </div>

      <div className={styles.grid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Current subscription</span>
              <h2 className={styles.panelTitle}>Live demo access state</h2>
            </div>
          </div>

          <div className={styles.planCard}>
            <div className={styles.planTopRow}>
              <div>
                <h3 className={styles.planLabel}>
                  {currentPlan?.label ?? "Preview access"}
                </h3>
                <div className={styles.planBadge}>
                  {currentPlan?.badge ?? "Local starter quota"}
                </div>
              </div>
              <div className={styles.price}>
                {currentPlan ? `$${currentPlan.priceUsd}` : "$0"}
              </div>
            </div>

            <div className={styles.note}>
              {subscription.endsAt
                ? `Renews manually. Current cycle ends ${formatDateFull(subscription.endsAt)}.`
                : "No paid plan is active yet. Preview quotas remain available until you upgrade."}
            </div>

            <ul className={styles.summaryList}>
              <li className={styles.summaryItem}>
                Search quota:{" "}
                {formatUsageValue(
                  subscription.searchLimit,
                  subscription.searchUsed,
                  subscription.searchRemaining,
                )}
              </li>
              <li className={styles.summaryItem}>
                Deep-view quota:{" "}
                {formatUsageValue(
                  subscription.viewLimit,
                  subscription.viewUsed,
                  subscription.viewRemaining,
                )}
              </li>
              <li className={styles.summaryItem}>
                Card data stays in local form state only and is never persisted.
              </li>
            </ul>
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Usage</span>
              <h2 className={styles.panelTitle}>Current request quotas</h2>
            </div>
          </div>

          <div className={styles.usageGrid}>
            <div className={styles.usageCard}>
              <div className={styles.usageTopRow}>
                <span className={styles.metaLabel}>Search requests</span>
                <span className={styles.methodPill}>
                  {formatUsageValue(
                    subscription.searchLimit,
                    subscription.searchUsed,
                    subscription.searchRemaining,
                  )}
                </span>
              </div>
              <div className={styles.usageValue}>{subscription.searchUsed} used</div>
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
                Search runs through the same frontend limit gates as the live app.
              </div>
            </div>

            <div className={styles.usageCard}>
              <div className={styles.usageTopRow}>
                <span className={styles.metaLabel}>Deep views</span>
                <span className={styles.methodPill}>
                  {formatUsageValue(
                    subscription.viewLimit,
                    subscription.viewUsed,
                    subscription.viewRemaining,
                  )}
                </span>
              </div>
              <div className={styles.usageValue}>{subscription.viewUsed} used</div>
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
                Detailed law trees, articles, and subject pages spend this quota.
              </div>
            </div>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Upgrade path</span>
              <h2 className={styles.panelTitle}>Available client plans</h2>
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
                    Choose {plan.label}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Payment history</span>
              <h2 className={styles.panelTitle}>Local demo transactions</h2>
            </div>
          </div>

          {payments.length > 0 ? (
            <div className={styles.historyList}>
              {payments.map((payment) => (
                <div key={payment.id} className={styles.historyRow}>
                  <div className={styles.historyTopRow}>
                    <div>
                      <div className={styles.historyValue}>{payment.summary}</div>
                      <div className={styles.historyMeta}>
                        {formatDateFull(payment.paidAt)} · actor {payment.actor}
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
              No local payment events yet. Once a client activates a trial or monthly
              plan, the demo checkout log appears here.
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
