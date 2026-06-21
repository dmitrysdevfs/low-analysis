"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import {
  ArrowLeft,
  Lock,
  CreditCard,
  Info,
  CheckCircle2,
  Star,
} from "lucide-react";
import { useBilling } from "@/components/billing/BillingProvider";
import { notify } from "@/lib/toast";
import type { BillingPaymentMethod, BillingPlanId } from "@/types";
import styles from "./CheckoutDashboard.module.scss";

type CardState = {
  holder: string;
  number: string;
  expiry: string;
  cvv: string;
};

const PAYMENT_METHODS: BillingPaymentMethod[] = ["apple_pay", "google_pay", "card"];

const PAYMENT_COPY: Record<BillingPaymentMethod, { label: string; hint: string; logo: string }> = {
  apple_pay: {
    label: "Apple Pay demo",
    hint: "Styled like Apple Pay, but completed locally without merchant validation.",
    logo: "",
  },
  google_pay: {
    label: "Google Pay demo",
    hint: "Styled like Google Pay, but resolved only in local demo state.",
    logo: "G",
  },
  card: {
    label: "Card form",
    hint: "Card fields are used only in local component state and cleared after submit.",
    logo: "",
  },
  admin_override: {
    label: "Admin override",
    hint: "Internal method reserved for admin panel plan changes.",
    logo: "",
  },
};

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export function CheckoutDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, planCatalog, purchasePlan } = useBilling();

  const [paymentMethod, setPaymentMethod] = useState<BillingPaymentMethod>("apple_pay");
  const [card, setCard] = useState<CardState>({ holder: "", number: "", expiry: "", cvv: "" });
  const [submitting, setSubmitting] = useState(false);

  const selectedPlanId =
    (searchParams.get("plan") as BillingPlanId | null) ?? subscription?.planId ?? "trial";
  const [planId, setPlanId] = useState<BillingPlanId>(selectedPlanId);

  const selectedPlan = useMemo(
    () => planCatalog.find((p) => p.id === planId) ?? planCatalog[0],
    [planCatalog, planId],
  );

  useEffect(() => {
    setPlanId(selectedPlanId);
  }, [selectedPlanId]);

  if (!subscription) return null;

  function handleCardChange<K extends keyof CardState>(key: K, val: CardState[K]) {
    setCard((prev) => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (paymentMethod === "card") {
      const num = card.number.replace(/\s+/g, "");
      if (card.holder.trim().length < 2 || num.length < 12 || card.expiry.trim().length < 4 || card.cvv.trim().length < 3) {
        notify.warning("Заповніть усі поля картки перед оплатою.");
        return;
      }
    }
    setSubmitting(true);
    const result = await purchasePlan(planId, paymentMethod);
    setCard({ holder: "", number: "", expiry: "", cvv: "" });
    setSubmitting(false);
    if (!result.ok) {
      notify.warning(result.error ?? "Помилка demo-оплати.");
      return;
    }
    notify.success(`${selectedPlan.label} активовано через ${PAYMENT_COPY[paymentMethod].label}.`);
    router.push(ROUTES.accountBilling);
  }

  return (
    <div className={styles.page}>

      {/* ── Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.eyebrow}>Checkout Demo</span>
          <h1 className={styles.heroTitle}>Local plan activation</h1>
          <p className={styles.heroDesc}>
            This checkout is a frontend-only demo. It writes only the selected plan,
            payment method, and timestamp to local storage. Card numbers, CVV,
            and expiry values are never persisted.
          </p>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.selectedPlanCard}>
            <span className={styles.selectedPlanEyebrow}>Selected plan</span>
            <div className={styles.selectedPlanBody}>
              <div className={styles.selectedPlanIcon}>
                <Star size={20} />
              </div>
              <div>
                <div className={styles.selectedPlanName}>{selectedPlan?.label}</div>
                <div className={styles.selectedPlanBadge}>{selectedPlan?.badge}</div>
              </div>
            </div>
          </div>
          <Link href={ROUTES.accountBilling} className={styles.backBtn}>
            <ArrowLeft size={14} />
            Back to billing
          </Link>
        </div>
      </div>

      {/* ── Checkout layout ── */}
      <div className={styles.checkoutGrid}>

        {/* Left: form */}
        <form className={styles.formPanel} onSubmit={handleSubmit}>

          {/* Step 1 */}
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <span className={styles.stepEyebrow}>Step 1</span>
              <h2 className={styles.stepTitle}>Choose a plan</h2>
            </div>

            <label className={styles.fieldLabel}>
              Plan
              <div className={styles.selectWrap}>
                <select
                  className={styles.select}
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value as BillingPlanId)}
                >
                  {planCatalog.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} · ${p.priceUsd} · {p.periodLabel}
                    </option>
                  ))}
                </select>
                <span className={styles.selectChevron}>▾</span>
              </div>
            </label>
          </div>

          {/* Step 2 */}
          <div className={styles.step}>
            <div className={styles.stepHeader}>
              <span className={styles.stepEyebrow}>Step 2</span>
              <h2 className={styles.stepTitle}>Select a payment method</h2>
            </div>

            <div className={styles.methods}>
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    className={`${styles.methodRow} ${active ? styles.methodRowActive : ""}`}
                    onClick={() => setPaymentMethod(method)}
                  >
                    <div className={`${styles.methodRadio} ${active ? styles.methodRadioActive : ""}`} />
                    <div className={styles.methodLogoWrap}>
                      {method === "apple_pay" && <AppleIcon />}
                      {method === "google_pay" && <GoogleIcon />}
                      {method === "card" && <CreditCard size={18} />}
                    </div>
                    <div className={styles.methodInfo}>
                      <div className={styles.methodLabel}>{PAYMENT_COPY[method].label}</div>
                      <div className={styles.methodHint}>{PAYMENT_COPY[method].hint}</div>
                    </div>
                    <span className={`${styles.methodBadge} ${active ? styles.methodBadgeActive : ""}`}>
                      {active ? "Selected" : "Tap to choose"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Card fields */}
            {paymentMethod === "card" && (
              <div className={styles.cardFields}>
                <label className={styles.fieldLabel}>
                  Cardholder name
                  <input
                    className={styles.input}
                    placeholder="John Doe"
                    value={card.holder}
                    onChange={(e) => handleCardChange("holder", e.target.value)}
                  />
                </label>

                <label className={styles.fieldLabel}>
                  Card number
                  <div className={styles.inputWrap}>
                    <input
                      className={styles.input}
                      inputMode="numeric"
                      placeholder="4242 4242 4242 4242"
                      value={card.number}
                      onChange={(e) => handleCardChange("number", e.target.value)}
                    />
                    <span className={styles.visaBadge}>VISA</span>
                  </div>
                </label>

                <div className={styles.cardRow}>
                  <label className={styles.fieldLabel}>
                    Expiry
                    <input
                      className={styles.input}
                      placeholder="MM / YY"
                      value={card.expiry}
                      onChange={(e) => handleCardChange("expiry", e.target.value)}
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    CVV
                    <div className={styles.inputWrap}>
                      <input
                        className={styles.input}
                        inputMode="numeric"
                        placeholder="123"
                        value={card.cvv}
                        onChange={(e) => handleCardChange("cvv", e.target.value)}
                      />
                      <Lock size={14} className={styles.inputSuffix} />
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            <Lock size={16} />
            {submitting ? "Обробка…" : "Complete demo payment"}
          </button>

          <p className={styles.smallPrint}>
            <Info size={13} />
            Demo rule: payment method is stored, but card data is not. After submit,
            card inputs are cleared immediately in the UI.
          </p>
        </form>

        {/* Right: summary */}
        <aside className={styles.summary}>
          <div className={styles.summaryTop}>
            <span className={styles.summaryEyebrow}>Summary</span>
            <h2 className={styles.summaryPlanName}>{selectedPlan?.label}</h2>
            <div className={styles.summaryPrice}>
              <span className={styles.summaryPriceSymbol}>$</span>
              {selectedPlan?.priceUsd}
            </div>
            <div className={styles.summaryPeriod}>{selectedPlan?.periodLabel}</div>
          </div>

          <ul className={styles.summaryFeatures}>
            {selectedPlan?.features.map((f) => (
              <li key={f} className={styles.summaryFeatureItem}>
                <CheckCircle2 size={17} className={styles.summaryCheck} />
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className={styles.summaryMethod}>
            <span className={styles.summaryEyebrow}>Method</span>
            <div className={styles.summaryMethodName}>{PAYMENT_COPY[paymentMethod].label}</div>
            <div className={styles.summaryMethodHint}>{PAYMENT_COPY[paymentMethod].hint}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
