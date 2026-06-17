"use client";

import { getJson, requestJson } from "./_client";
import type { BillingPlanId, BillingPaymentMethod } from "@/types";

export interface BillingSubscriptionServer {
  _id: string;
  userId: string;
  planId: BillingPlanId | null;
  status: "inactive" | "active" | "trialing" | "expired";
  usageSearch: number;
  usageView: number;
  startedAt: string | null;
  endsAt: string | null;
  lastPaymentMethod?: string;
  lastPaymentAt?: string;
}

export interface BillingTransactionServer {
  _id: string;
  userId: string;
  planId: BillingPlanId;
  amount: number;
  method: string;
  status: string;
  provider: string;
  createdAt: string;
}

export interface BillingOverviewFull {
  subscription: BillingSubscriptionServer;
  transactions: BillingTransactionServer[];
}

export async function getBillingPlans(): Promise<unknown[]> {
  return getJson<unknown[]>("/billing/plans");
}

export async function getMyBilling(): Promise<BillingOverviewFull> {
  return getJson<BillingOverviewFull>("/billing/me");
}

export async function demoPurchase(
  planId: string,
  method: string = "demo_checkout",
): Promise<{
  ok: boolean;
  subscription: BillingSubscriptionServer;
  transaction: BillingTransactionServer;
}> {
  return requestJson("/billing/checkout/demo", "POST", { planId, method });
}

export async function adminAssignPlan(
  userId: string,
  planId: string,
): Promise<{ ok: boolean; subscription: BillingSubscriptionServer }> {
  return requestJson(`/billing/admin/${userId}/assign`, "POST", { planId });
}
