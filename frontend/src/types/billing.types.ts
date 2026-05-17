export type BillingPlanId = "trial" | "user" | "plus" | "pro";

export type BillingPaymentMethod =
  | "apple_pay"
  | "google_pay"
  | "card"
  | "admin_override";

export type BillingStatus = "inactive" | "trialing" | "active" | "expired";

export type BillingQuotaType = "search" | "view";

export interface BillingPlanDefinition {
  id: BillingPlanId;
  label: string;
  badge: string;
  description: string;
  priceUsd: number;
  durationDays: number;
  periodLabel: string;
  isUnlimited: boolean;
  searchLimit: number | null;
  viewLimit: number | null;
  features: string[];
}

export interface StoredBillingSubscription {
  userId: string;
  planId: BillingPlanId | null;
  status: BillingStatus;
  startedAt?: string;
  endsAt?: string;
  usage: {
    search: number;
    view: number;
  };
  lastPaymentMethod?: BillingPaymentMethod;
  lastPaymentAt?: string;
  updatedAt: string;
}

export interface BillingPaymentRecord {
  id: string;
  userId: string;
  planId: BillingPlanId;
  method: BillingPaymentMethod;
  amountUsd: number;
  paidAt: string;
  summary: string;
  actor: string;
}

export interface BillingSubscriptionSnapshot {
  userId: string;
  accountType: "client" | "admin";
  planId: BillingPlanId | null;
  plan: BillingPlanDefinition | null;
  status: BillingStatus;
  accessLabel: string;
  description: string;
  startedAt?: string;
  endsAt?: string;
  daysRemaining: number | null;
  isUnlimited: boolean;
  searchLimit: number | null;
  viewLimit: number | null;
  searchUsed: number;
  viewUsed: number;
  searchRemaining: number | null;
  viewRemaining: number | null;
  previewMode: boolean;
}

export interface BillingActionResult {
  ok: boolean;
  error?: string;
  snapshot?: BillingSubscriptionSnapshot;
  payment?: BillingPaymentRecord;
}

export interface BillingQuotaAttemptResult {
  allowed: boolean;
  reason?: "preview_limit" | "plan_limit";
  message?: string;
  snapshot: BillingSubscriptionSnapshot;
}
