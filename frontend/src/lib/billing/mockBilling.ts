"use client";

import type {
  AuthAccountType,
  BillingActionResult,
  BillingPaymentMethod,
  BillingPaymentRecord,
  BillingPlanDefinition,
  BillingPlanId,
  BillingQuotaAttemptResult,
  BillingQuotaType,
  BillingSubscriptionSnapshot,
  StoredBillingSubscription,
} from "@/types";

export const BILLING_SUBSCRIPTIONS_STORAGE_KEY =
  "low-analysis.billing.subscriptions";
export const BILLING_PAYMENTS_STORAGE_KEY = "low-analysis.billing.payments";

const PREVIEW_LIMITS = {
  search: 18,
  view: 10,
} as const;

export const BILLING_PLAN_CATALOG: BillingPlanDefinition[] = [
  {
    id: "trial",
    label: "Starter Week",
    badge: "$1 / 7 days",
    description:
      "One-week premium access for client research flows with no search or view caps.",
    priceUsd: 1,
    durationDays: 7,
    periodLabel: "7-day trial",
    isUnlimited: true,
    searchLimit: null,
    viewLimit: null,
    features: [
      "Full client access for one week",
      "Unlimited searches and detail views",
      "Saved laws, notes, and personal workspace",
    ],
  },
  {
    id: "user",
    label: "User",
    badge: "$9 / month",
    description:
      "Monthly client plan with controlled usage for personal legal research.",
    priceUsd: 9,
    durationDays: 30,
    periodLabel: "Monthly plan",
    isUnlimited: false,
    searchLimit: 350,
    viewLimit: 120,
    features: [
      "Moderate monthly request volume",
      "Great for focused solo research",
      "Keeps all client workspace tools enabled",
    ],
  },
  {
    id: "plus",
    label: "Plus",
    badge: "$19 / month",
    description:
      "Expanded monthly client plan for active researchers handling broader legal reviews.",
    priceUsd: 19,
    durationDays: 30,
    periodLabel: "Monthly plan",
    isUnlimited: false,
    searchLimit: 1600,
    viewLimit: 620,
    features: [
      "Higher monthly quota for search and deep reads",
      "Better fit for recurring legal monitoring",
      "Extended room for saved material workflows",
    ],
  },
  {
    id: "pro",
    label: "Pro",
    badge: "$39 / month",
    description:
      "Unlimited monthly client plan with no usage caps across search and deep document review.",
    priceUsd: 39,
    durationDays: 30,
    periodLabel: "Monthly plan",
    isUnlimited: true,
    searchLimit: null,
    viewLimit: null,
    features: [
      "Unlimited research requests",
      "Unlimited detailed document access",
      "Designed for power users and legal teams",
    ],
  },
];

function isBrowser() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readStorageItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorageItem(key: string, value: unknown) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readSubscriptionsStore() {
  return readStorageItem<Record<string, StoredBillingSubscription>>(
    BILLING_SUBSCRIPTIONS_STORAGE_KEY,
    {},
  );
}

function writeSubscriptionsStore(
  store: Record<string, StoredBillingSubscription>,
) {
  writeStorageItem(BILLING_SUBSCRIPTIONS_STORAGE_KEY, store);
}

function readPaymentsStore() {
  return readStorageItem<BillingPaymentRecord[]>(
    BILLING_PAYMENTS_STORAGE_KEY,
    [],
  );
}

function writePaymentsStore(records: BillingPaymentRecord[]) {
  writeStorageItem(BILLING_PAYMENTS_STORAGE_KEY, records);
}

function getNowIso() {
  return new Date().toISOString();
}

function addDays(iso: string, days: number) {
  const next = new Date(iso);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function getPlanDefinition(planId: BillingPlanId | null) {
  if (!planId) {
    return null;
  }

  return BILLING_PLAN_CATALOG.find((plan) => plan.id === planId) ?? null;
}

function normalizeSubscriptionRecord(userId: string) {
  const store = readSubscriptionsStore();
  const existing = store[userId];

  if (!existing) {
    const nextRecord: StoredBillingSubscription = {
      userId,
      planId: null,
      status: "inactive",
      usage: {
        search: 0,
        view: 0,
      },
      updatedAt: getNowIso(),
    };
    writeSubscriptionsStore({
      ...store,
      [userId]: nextRecord,
    });
    return nextRecord;
  }

  if (
    existing.endsAt &&
    new Date(existing.endsAt).getTime() < Date.now() &&
    existing.status !== "expired"
  ) {
    const nextRecord: StoredBillingSubscription = {
      ...existing,
      status: "expired",
      updatedAt: getNowIso(),
    };
    writeSubscriptionsStore({
      ...store,
      [userId]: nextRecord,
    });
    return nextRecord;
  }

  return existing;
}

function buildAccessLabel(
  accountType: AuthAccountType,
  record: StoredBillingSubscription,
  plan: BillingPlanDefinition | null,
) {
  if (accountType === "admin") {
    return "Admin access";
  }

  if (plan) {
    return `${plan.label} plan`;
  }

  if (record.status === "expired") {
    return "Expired plan";
  }

  return "Preview access";
}

function buildDescription(
  accountType: AuthAccountType,
  record: StoredBillingSubscription,
  plan: BillingPlanDefinition | null,
) {
  if (accountType === "admin") {
    return "Administrative access is managed separately from client subscriptions.";
  }

  if (plan) {
    return plan.description;
  }

  if (record.status === "expired") {
    return "Your last client plan expired. Preview limits remain available until you renew.";
  }

  return "You are using the local preview tier. Activate a paid plan to unlock fuller client access.";
}

function resolveLimits(
  accountType: AuthAccountType,
  record: StoredBillingSubscription,
  plan: BillingPlanDefinition | null,
) {
  if (accountType === "admin") {
    return {
      searchLimit: null,
      viewLimit: null,
      isUnlimited: true,
      previewMode: false,
    };
  }

  if (plan) {
    return {
      searchLimit: plan.searchLimit,
      viewLimit: plan.viewLimit,
      isUnlimited: plan.isUnlimited,
      previewMode: false,
    };
  }

  return {
    searchLimit: PREVIEW_LIMITS.search,
    viewLimit: PREVIEW_LIMITS.view,
    isUnlimited: false,
    previewMode: true,
  };
}

function getDaysRemaining(endsAt?: string) {
  if (!endsAt) {
    return null;
  }

  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function getBillingSubscriptionSnapshot(
  userId: string,
  accountType: AuthAccountType,
): BillingSubscriptionSnapshot {
  const record = normalizeSubscriptionRecord(userId);
  const plan = getPlanDefinition(record.planId);
  const { searchLimit, viewLimit, isUnlimited, previewMode } = resolveLimits(
    accountType,
    record,
    plan,
  );

  return {
    userId,
    accountType,
    planId: record.planId,
    plan,
    status: accountType === "admin" ? "active" : record.status,
    accessLabel: buildAccessLabel(accountType, record, plan),
    description: buildDescription(accountType, record, plan),
    startedAt: record.startedAt,
    endsAt: record.endsAt,
    daysRemaining: getDaysRemaining(record.endsAt),
    isUnlimited,
    searchLimit,
    viewLimit,
    searchUsed: record.usage.search,
    viewUsed: record.usage.view,
    searchRemaining:
      searchLimit === null
        ? null
        : Math.max(0, searchLimit - record.usage.search),
    viewRemaining:
      viewLimit === null ? null : Math.max(0, viewLimit - record.usage.view),
    previewMode,
  };
}

function writeSubscriptionRecord(record: StoredBillingSubscription) {
  const store = readSubscriptionsStore();
  writeSubscriptionsStore({
    ...store,
    [record.userId]: record,
  });
}

function createPaymentRecord(
  userId: string,
  plan: BillingPlanDefinition,
  method: BillingPaymentMethod,
  actor: string,
  amountUsd = plan.priceUsd,
) {
  const payment: BillingPaymentRecord = {
    id: `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    planId: plan.id,
    method,
    amountUsd,
    paidAt: getNowIso(),
    summary:
      method === "admin_override"
        ? `${plan.label} plan assigned by admin`
        : `${plan.label} plan activated via ${method.replace("_", " ")}`,
    actor,
  };

  writePaymentsStore([payment, ...readPaymentsStore()].slice(0, 36));
  return payment;
}

export function purchaseDemoPlan(
  userId: string,
  planId: BillingPlanId,
  method: BillingPaymentMethod,
  actor = "Client checkout",
): BillingActionResult {
  const plan = getPlanDefinition(planId);

  if (!plan) {
    return {
      ok: false,
      error: "Selected plan is not available.",
    };
  }

  if (
    planId === "trial" &&
    readPaymentsStore().some(
      (payment) => payment.userId === userId && payment.planId === "trial",
    )
  ) {
    return {
      ok: false,
      error: "The starter week was already used for this local client account.",
    };
  }

  const startedAt = getNowIso();
  const nextRecord: StoredBillingSubscription = {
    userId,
    planId: plan.id,
    status: plan.id === "trial" ? "trialing" : "active",
    startedAt,
    endsAt: addDays(startedAt, plan.durationDays),
    usage: {
      search: 0,
      view: 0,
    },
    lastPaymentMethod: method,
    lastPaymentAt: startedAt,
    updatedAt: startedAt,
  };

  writeSubscriptionRecord(nextRecord);
  const payment = createPaymentRecord(userId, plan, method, actor);

  return {
    ok: true,
    snapshot: getBillingSubscriptionSnapshot(userId, "client"),
    payment,
  };
}

export function adminAssignDemoPlan(
  userId: string,
  planId: BillingPlanId,
  actor = "Administrator",
): BillingActionResult {
  const plan = getPlanDefinition(planId);

  if (!plan) {
    return {
      ok: false,
      error: "Selected plan is not available.",
    };
  }

  const startedAt = getNowIso();
  const nextRecord: StoredBillingSubscription = {
    userId,
    planId: plan.id,
    status: plan.id === "trial" ? "trialing" : "active",
    startedAt,
    endsAt: addDays(startedAt, plan.durationDays),
    usage: {
      search: 0,
      view: 0,
    },
    lastPaymentMethod: "admin_override",
    lastPaymentAt: startedAt,
    updatedAt: startedAt,
  };

  writeSubscriptionRecord(nextRecord);
  const payment = createPaymentRecord(userId, plan, "admin_override", actor, 0);

  return {
    ok: true,
    snapshot: getBillingSubscriptionSnapshot(userId, "client"),
    payment,
  };
}

export function getBillingPaymentsForUser(userId: string) {
  return readPaymentsStore().filter((payment) => payment.userId === userId);
}

export function getBillingRegistrySnapshot(
  accounts: Array<{
    id: string;
    displayName: string;
    email: string;
    accountType: AuthAccountType;
  }>,
) {
  return accounts.map((account) => ({
    ...account,
    subscription: getBillingSubscriptionSnapshot(
      account.id,
      account.accountType,
    ),
    payments: getBillingPaymentsForUser(account.id),
  }));
}

export function consumeBillingQuota(
  userId: string,
  accountType: AuthAccountType,
  type: BillingQuotaType,
): BillingQuotaAttemptResult {
  const snapshot = getBillingSubscriptionSnapshot(userId, accountType);

  if (snapshot.isUnlimited) {
    return {
      allowed: true,
      snapshot,
    };
  }

  const limit = type === "search" ? snapshot.searchLimit : snapshot.viewLimit;
  const used = type === "search" ? snapshot.searchUsed : snapshot.viewUsed;

  if (limit !== null && used >= limit) {
    const message =
      snapshot.previewMode || snapshot.status === "expired"
        ? "Your preview access quota is exhausted. Activate or renew a plan to continue without interruptions."
        : `Your ${snapshot.plan?.label ?? "client"} plan hit its ${type} quota. Upgrade or renew to continue.`;

    return {
      allowed: false,
      reason:
        snapshot.previewMode || snapshot.status === "expired"
          ? "preview_limit"
          : "plan_limit",
      message,
      snapshot,
    };
  }

  const record = normalizeSubscriptionRecord(userId);
  const nextRecord: StoredBillingSubscription = {
    ...record,
    usage: {
      ...record.usage,
      [type]: record.usage[type] + 1,
    },
    updatedAt: getNowIso(),
  };

  writeSubscriptionRecord(nextRecord);
  return {
    allowed: true,
    snapshot: getBillingSubscriptionSnapshot(userId, accountType),
  };
}

export function resetBillingDemoState() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(BILLING_SUBSCRIPTIONS_STORAGE_KEY);
  window.localStorage.removeItem(BILLING_PAYMENTS_STORAGE_KEY);
}
