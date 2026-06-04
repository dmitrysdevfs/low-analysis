"use client";

import { getGuestLimitSnapshot } from "@/lib/guestLimits";
import type {
  AdminDashboardApiSnapshot,
  AdminUserRecord,
} from "@/lib/api/admin";
import type {
  AdminAccountSummary,
  AdminDashboardSnapshot,
} from "@/lib/auth/mockAuth";

const PLAN_LIMITS: Record<
  string,
  { search: number | null; view: number | null }
> = {
  preview: { search: 10, view: 10 },
  trial: { search: 50, view: 50 },
  user: { search: null, view: null },
  plus: { search: null, view: null },
  pro: { search: null, view: null },
};

export function mapUserToAccount(user: AdminUserRecord): AdminAccountSummary {
  return {
    id: user._id,
    displayName: user.fullName,
    email: user.email,
    accountType: user.role === "admin" ? "admin" : "client",
    status: (user.status as "active" | "inactive") ?? "active",
    roles:
      user.role === "admin"
        ? ["admin", "client"]
        : user.role === "legislator"
          ? ["client", "legislator"]
          : ["client"],
    createdAt: user.createdAt,
    lastLoginAt: user.updatedAt,
    superCodeProtected: user.role === "admin",
    source: "stored",
  };
}

export function buildBillingEntry(user: AdminUserRecord) {
  const isAdmin = user.role === "admin";
  const planId = isAdmin ? null : (user.billingPlan ?? "preview");
  const lim = planId
    ? (PLAN_LIMITS[planId] ?? PLAN_LIMITS.preview)
    : { search: null, view: null };

  return {
    id: user._id,
    displayName: user.fullName,
    email: user.email,
    accountType: (user.role === "admin" ? "admin" : "client") as
      | "admin"
      | "client",
    subscription: {
      planId,
      plan: planId ? { label: planId } : null,
      status: "active" as const,
      searchLimit: lim.search,
      viewLimit: lim.view,
      searchUsed: 0,
      viewUsed: 0,
      searchRemaining: lim.search,
      viewRemaining: lim.view,
      isUnlimited: lim.search === null,
      previewMode: planId === "preview",
      daysRemaining: null as number | null,
      endsAt: null as string | null,
    },
    payments: [] as unknown[],
  };
}

export function mapApiToSnapshot(
  api: AdminDashboardApiSnapshot,
): AdminDashboardSnapshot {
  const guest = getGuestLimitSnapshot();
  const registryAccounts = api.latestUsers.map(mapUserToAccount);

  return {
    totalAccounts: api.totalAccounts,
    clientAccounts: api.clientAccounts,
    adminAccounts: api.adminAccounts,
    protectedRoutes: api.protectedRoutes,
    activeSessionRole: api.activeSessionRole as "admin" | "client" | "guest",
    latestAccounts: registryAccounts.slice(0, 8),
    registryAccounts,
    accessMatrix: api.accessMatrix as AdminDashboardSnapshot["accessMatrix"],
    activeSuperCode: api.activeSuperCode,
    superCodeRotatedAt: api.superCodeHistory[0]?.rotatedAt,
    superCodeHistory: api.superCodeHistory,
    auditLog: api.auditLog.map((e) => ({
      id: e._id,
      action: e.action,
      detail: e.detail,
      actor: e.actor,
      severity: e.severity,
      createdAt: e.createdAt,
    })) as AdminDashboardSnapshot["auditLog"],
    guestPressure: {
      searchUsed: guest.search.used,
      searchRemaining: guest.search.remaining,
      searchLimit: guest.search.limit,
      searchCooldownActive: guest.search.isCoolingDown,
      viewUsed: guest.view.used,
      viewRemaining: guest.view.remaining,
      viewLimit: guest.view.limit,
      viewCooldownActive: guest.view.isCoolingDown,
    },
  };
}
