"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useBilling } from "@/components/billing/BillingProvider";
import { notify } from "@/lib/toast";
import type { BillingPaymentMethod, BillingPlanId } from "@/types";
import styles from "./ClientBilling.module.scss";

type CardState = {
  holder: string;
  number: string;
  expiry: string;
  cvv: string;
};

const PAYMENT_COPY: Record<
  BillingPaymentMethod,
  { label: string; hint: string }
> = {
  apple_pay: {
    label: "Apple Pay demo",
    hint: "Styled like Apple Pay, but completed locally without merchant validation.",
  },
  google_pay: {
    label: "Google Pay demo",
    hint: "Styled like Google Pay, but resolved only in local demo state.",
  },
  card: {
    label: "Card form",
    hint: "Card fields are used only in local component state and cleared after submit.",
  },
  admin_override: {
    label: "Admin override",
    hint: "Internal method reserved for admin panel plan changes.",
  },
};

export function CheckoutDemo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, planCatalog, purchasePlan } = useBilling();
  const [paymentMethod, setPaymentMethod] =
    useState<BillingPaymentMethod>("apple_pay");
  const [card, setCard] = useState<CardState>({
    holder: "",
    number: "",
    expiry: "",
    cvv: "",
  });
  const selectedPlanId =
    (searchParams.get("plan") as BillingPlanId | null) ??
    subscription?.planId ??
    "trial";
  const [planId, setPlanId] = useState<BillingPlanId>(selectedPlanId);

  const selectedPlan = useMemo(
    () => planCatalog.find((plan) => plan.id === planId) ?? planCatalog[0],
    [planCatalog, planId],
  );

  useEffect(() => {
    setPlanId(selectedPlanId);
  }, [selectedPlanId]);

  if (!subscription) {
    return null;
  }

  function handleCardChange<K extends keyof CardState>(key: K, value: CardState[K]) {
    setCard((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (paymentMethod === "card") {
      const number = card.number.replace(/\s+/g, "");

      if (
        card.holder.trim().length < 2 ||
        number.length < 12 ||
        card.expiry.trim().length < 4 ||
        card.cvv.trim().length < 3
      ) {
        notify.warning("Fill in the card demo fields before completing payment.");
        return;
      }
    }

    const result = purchasePlan(planId, paymentMethod);

    setCard({
      holder: "",
      number: "",
      expiry: "",
      cvv: "",
    });

    if (!result.ok) {
      notify.warning(result.error ?? "Payment demo failed.");
      return;
    }

    notify.success(
      `${selectedPlan.label} activated with ${PAYMENT_COPY[paymentMethod].label}.`,
    );
    router.push(ROUTES.accountBilling);
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Checkout demo</span>
          <h1 className={styles.title}>Local plan activation</h1>
          <p className={styles.description}>
            This checkout is a frontend-only demo. It writes only the selected plan,
            payment method, and timestamp to local storage. Card numbers, CVV, and
            expiry values are never persisted.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <div className={styles.heroStat}>
            <span className={styles.metaLabel}>Selected plan</span>
            <div className={styles.heroValue}>{selectedPlan.label}</div>
            <div className={styles.metaText}>{selectedPlan.badge}</div>
          </div>
          <div className={styles.actions}>
            <Link href={ROUTES.accountBilling} className={styles.secondaryAction}>
              Back to billing
            </Link>
          </div>
        </aside>
      </div>

      <div className={styles.checkoutLayout}>
        <form className={styles.panel} onSubmit={handleCheckout}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Step 1</span>
              <h2 className={styles.panelTitle}>Choose a plan</h2>
            </div>
          </div>

          <label className={styles.fieldLabel}>
            Plan
            <select
              className={styles.fieldSelect}
              value={planId}
              onChange={(event) => setPlanId(event.target.value as BillingPlanId)}
            >
              {planCatalog.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.label} · ${plan.priceUsd} · {plan.periodLabel}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionLabel}>Step 2</span>
              <h2 className={styles.panelTitle}>Select a payment method</h2>
            </div>
          </div>

          <div className={styles.checkoutMethods}>
            {(["apple_pay", "google_pay", "card"] as BillingPaymentMethod[]).map(
              (method) => (
                <button
                  key={method}
                  type="button"
                  className={`${styles.checkoutMethod} ${styles.checkoutMethodButton} ${
                    paymentMethod === method ? styles.checkoutMethodActive : ""
                  }`}
                  onClick={() => setPaymentMethod(method)}
                >
                  <div className={styles.checkoutTopRow}>
                    <div>
                      <div className={styles.historyValue}>
                        {PAYMENT_COPY[method].label}
                      </div>
                      <div className={styles.checkoutHint}>
                        {PAYMENT_COPY[method].hint}
                      </div>
                    </div>
                    <span className={styles.methodPill}>
                      {paymentMethod === method ? "Selected" : "Tap to choose"}
                    </span>
                  </div>
                </button>
              ),
            )}
          </div>

          {paymentMethod === "card" ? (
            <div className={styles.fieldGrid}>
              <label className={styles.fieldLabel}>
                Cardholder name
                <input
                  className={styles.fieldInput}
                  value={card.holder}
                  onChange={(event) => handleCardChange("holder", event.target.value)}
                />
              </label>

              <label className={styles.fieldLabel}>
                Card number
                <input
                  className={styles.fieldInput}
                  inputMode="numeric"
                  value={card.number}
                  onChange={(event) => handleCardChange("number", event.target.value)}
                />
              </label>

              <div className={styles.fieldRow}>
                <label className={styles.fieldLabel}>
                  Expiry
                  <input
                    className={styles.fieldInput}
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(event) => handleCardChange("expiry", event.target.value)}
                  />
                </label>

                <label className={styles.fieldLabel}>
                  CVV
                  <input
                    className={styles.fieldInput}
                    inputMode="numeric"
                    value={card.cvv}
                    onChange={(event) => handleCardChange("cvv", event.target.value)}
                  />
                </label>
              </div>
            </div>
          ) : null}

          <button type="submit" className={styles.checkoutButton}>
            Complete demo payment
          </button>

          <p className={styles.smallPrint}>
            Demo rule: payment method is stored, but card data is not. After submit,
            card inputs are cleared immediately in the UI.
          </p>
        </form>

        <aside className={styles.checkoutSummary}>
          <div>
            <span className={styles.sectionLabel}>Summary</span>
            <h2 className={styles.panelTitle}>{selectedPlan.label}</h2>
          </div>

          <div className={styles.summaryValue}>${selectedPlan.priceUsd}</div>
          <div className={styles.metaText}>{selectedPlan.periodLabel}</div>

          <ul className={styles.summaryList}>
            {selectedPlan.features.map((feature) => (
              <li key={feature} className={styles.summaryItem}>
                {feature}
              </li>
            ))}
          </ul>

          <div className={styles.heroStat}>
            <span className={styles.metaLabel}>Method</span>
            <div className={styles.heroValue}>{PAYMENT_COPY[paymentMethod].label}</div>
            <div className={styles.metaText}>{PAYMENT_COPY[paymentMethod].hint}</div>
          </div>
        </aside>
      </div>
    </section>
  );
}
