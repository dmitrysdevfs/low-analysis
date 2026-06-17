"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { BILLING_PLAN_CATALOG } from "@/lib/billing/mockBilling";
import {
  getMyBilling,
  demoPurchase,
  adminAssignPlan,
  type BillingSubscriptionServer,
  type BillingTransactionServer,
} from "@/lib/api/billing";
import { requestJson } from "@/lib/api/_client";
import type {
  BillingActionResult,
  BillingPaymentMethod,
  BillingPlanId,
  BillingQuotaAttemptResult,
  BillingQuotaType,
  BillingSubscriptionSnapshot,
} from "@/types";

// ─── adapter ────────────────────────────────────────────────────────────────

function buildSnapshot(
  sub: BillingSubscriptionServer | null,
  localUsage: { search: number; view: number },
  userId: string,
  accountType: "client" | "admin",
): BillingSubscriptionSnapshot {
  if (!sub || sub.status === "inactive" || !sub.planId) {
    return {
      userId,
      accountType,
      planId: null,
      plan: null,
      status: "inactive",
      accessLabel: "Без підписки",
      description: "Оберіть план для отримання доступу",
      daysRemaining: null,
      isUnlimited: false,
      searchLimit: null,
      viewLimit: null,
      searchUsed: 0,
      viewUsed: 0,
      searchRemaining: null,
      viewRemaining: null,
      previewMode: false,
    };
  }

  const planDef = BILLING_PLAN_CATALOG.find((p) => p.id === sub.planId) ?? null;
  const searchUsed = (sub.usageSearch ?? 0) + localUsage.search;
  const viewUsed = (sub.usageView ?? 0) + localUsage.view;
  const searchLimit = planDef?.searchLimit ?? null;
  const viewLimit = planDef?.viewLimit ?? null;

  let daysRemaining: number | null = null;
  if (sub.endsAt) {
    const diff = new Date(sub.endsAt).getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / 86_400_000));
  }

  const statusLabels: Record<string, string> = {
    active: planDef?.label ?? "Active",
    trialing: "Пробний",
    expired: "Закінчився",
    inactive: "Без підписки",
  };

  return {
    userId,
    accountType,
    planId: sub.planId,
    plan: planDef ?? null,
    status: sub.status,
    accessLabel: statusLabels[sub.status] ?? sub.status,
    description: planDef?.description ?? "",
    startedAt: sub.startedAt ?? undefined,
    endsAt: sub.endsAt ?? undefined,
    daysRemaining,
    isUnlimited: planDef?.isUnlimited ?? false,
    searchLimit,
    viewLimit,
    searchUsed,
    viewUsed,
    searchRemaining: searchLimit !== null ? Math.max(0, searchLimit - searchUsed) : null,
    viewRemaining: viewLimit !== null ? Math.max(0, viewLimit - viewUsed) : null,
    previewMode: false,
  };
}

// ─── context type ────────────────────────────────────────────────────────────

type BillingContextValue = {
  isHydrated: boolean;
  subscription: BillingSubscriptionSnapshot | null;
  payments: BillingPaymentRecord[];
  planCatalog: typeof BILLING_PLAN_CATALOG;
  refreshBilling: () => Promise<void>;
  purchasePlan: (
    planId: BillingPlanId,
    method: BillingPaymentMethod,
  ) => Promise<BillingActionResult>;
  assignPlan: (
    userId: string,
    planId: BillingPlanId,
  ) => Promise<BillingActionResult>;
  consumeQuota: (type: BillingQuotaType) => BillingQuotaAttemptResult;
  getPlanSnapshotForUser: (
    userId: string,
    accountType: "client" | "admin",
  ) => BillingSubscriptionSnapshot;
  getBillingRegistry: () => never[];
};

interface BillingPaymentRecord {
  id: string;
  userId: string;
  planId: BillingPlanId;
  method: BillingPaymentMethod;
  amountUsd: number;
  paidAt: string;
  summary: string;
  actor: string;
}

const EMPTY_BILLING_CONTEXT: BillingContextValue = {
  isHydrated: false,
  subscription: null,
  payments: [],
  planCatalog: BILLING_PLAN_CATALOG,
  refreshBilling: async () => {},
  purchasePlan: async () => ({ ok: false, error: "Billing is unavailable." }),
  assignPlan: async () => ({ ok: false, error: "Billing is unavailable." }),
  consumeQuota: () => ({
    allowed: true,
    snapshot: {
      userId: "unknown",
      accountType: "client",
      planId: null,
      plan: null,
      status: "inactive",
      accessLabel: "Unavailable",
      description: "Billing provider is unavailable.",
      daysRemaining: null,
      isUnlimited: false,
      searchLimit: 0,
      viewLimit: 0,
      searchUsed: 0,
      viewUsed: 0,
      searchRemaining: 0,
      viewRemaining: 0,
      previewMode: true,
    },
  }),
  getPlanSnapshotForUser: (userId) => ({
    userId,
    accountType: "client",
    planId: null,
    plan: null,
    status: "inactive",
    accessLabel: "Unavailable",
    description: "Billing provider is unavailable.",
    daysRemaining: null,
    isUnlimited: false,
    searchLimit: 0,
    viewLimit: 0,
    searchUsed: 0,
    viewUsed: 0,
    searchRemaining: 0,
    viewRemaining: 0,
    previewMode: true,
  }),
  getBillingRegistry: () => [],
};

const BillingContext = createContext<BillingContextValue>(EMPTY_BILLING_CONTEXT);

// ─── provider ────────────────────────────────────────────────────────────────

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [serverSub, setServerSub] = useState<BillingSubscriptionServer | null>(null);
  const [transactions, setTransactions] = useState<BillingTransactionServer[]>([]);
  const [localUsage, setLocalUsage] = useState({ search: 0, view: 0 });
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshBilling = useCallback(async () => {
    if (!user) {
      setServerSub(null);
      setTransactions([]);
      setLocalUsage({ search: 0, view: 0 });
      setIsHydrated(true);
      return;
    }
    try {
      const overview = await getMyBilling();
      setServerSub(overview.subscription);
      setTransactions(overview.transactions ?? []);
      setLocalUsage({ search: 0, view: 0 }); // reset local delta after server sync
    } catch {
      // backend not yet deployed — graceful degradation
    }
    setIsHydrated(true);
  }, [user]);

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  const subscription = useMemo(
    () => buildSnapshot(serverSub, localUsage, user?.id ?? "", user?.accountType ?? "client"),
    [serverSub, localUsage, user],
  );

  const purchasePlan = useCallback(
    async (planId: BillingPlanId, method: BillingPaymentMethod): Promise<BillingActionResult> => {
      if (!user) return { ok: false, error: "Потрібна авторизація" };
      try {
        await demoPurchase(planId, method);
        await refreshBilling();
        return { ok: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Помилка покупки";
        return { ok: false, error: msg };
      }
    },
    [user, refreshBilling],
  );

  const assignPlan = useCallback(
    async (userId: string, planId: BillingPlanId): Promise<BillingActionResult> => {
      try {
        await adminAssignPlan(userId, planId);
        await refreshBilling();
        return { ok: true };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Помилка призначення";
        return { ok: false, error: msg };
      }
    },
    [refreshBilling],
  );

  const consumeQuota = useCallback(
    (type: BillingQuotaType): BillingQuotaAttemptResult => {
      if (!user) return EMPTY_BILLING_CONTEXT.consumeQuota(type);

      const planDef = BILLING_PLAN_CATALOG.find((p) => p.id === serverSub?.planId);
      const limit =
        type === "search" ? (planDef?.searchLimit ?? null) : (planDef?.viewLimit ?? null);
      const used =
        type === "search"
          ? (serverSub?.usageSearch ?? 0) + localUsage.search
          : (serverSub?.usageView ?? 0) + localUsage.view;

      if (limit !== null && used >= limit) {
        return {
          allowed: false,
          reason: "plan_limit",
          message: "Ліміт вичерпано. Оновіть план.",
          snapshot: subscription,
        };
      }

      // optimistic local increment
      setLocalUsage((prev) => ({ ...prev, [type]: prev[type] + 1 }));

      // fire-and-forget server sync
      requestJson("/billing/consume", "POST", { type }).catch(() => {});

      return { allowed: true, snapshot: subscription };
    },
    [user, serverSub, localUsage, subscription],
  );

  // payments adapter: convert server transactions to BillingPaymentRecord[]
  const payments = useMemo<BillingPaymentRecord[]>(
    () =>
      transactions.map((t) => ({
        id: t._id,
        userId: t.userId,
        planId: t.planId,
        method: t.method as BillingPaymentMethod,
        amountUsd: t.amount,
        paidAt: t.createdAt,
        summary: `${t.planId} — ${t.method}`,
        actor: t.method === "admin_override" ? "Адміністратор" : user?.displayName ?? "",
      })),
    [transactions, user?.displayName],
  );

  const contextValue = useMemo(
    () => ({
      isHydrated,
      subscription,
      payments,
      planCatalog: BILLING_PLAN_CATALOG,
      refreshBilling,
      purchasePlan,
      assignPlan,
      consumeQuota,
      getPlanSnapshotForUser: (userId: string, accountType: "client" | "admin") =>
        buildSnapshot(serverSub, { search: 0, view: 0 }, userId, accountType),
      getBillingRegistry: () => [] as never[],
    }),
    [isHydrated, subscription, payments, refreshBilling, purchasePlan, assignPlan, consumeQuota, serverSub],
  );

  return <BillingContext.Provider value={contextValue}>{children}</BillingContext.Provider>;
}

export function useBilling() {
  return useContext(BillingContext);
}
