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
import {
  BILLING_PAYMENTS_STORAGE_KEY,
  BILLING_PLAN_CATALOG,
  BILLING_SUBSCRIPTIONS_STORAGE_KEY,
  adminAssignDemoPlan,
  consumeBillingQuota,
  getBillingPaymentsForUser,
  getBillingRegistrySnapshot,
  getBillingSubscriptionSnapshot,
  purchaseDemoPlan,
} from "@/lib/billing/mockBilling";
import type {
  BillingActionResult,
  BillingPaymentMethod,
  BillingPlanId,
  BillingQuotaAttemptResult,
  BillingQuotaType,
  BillingSubscriptionSnapshot,
} from "@/types";

type BillingContextValue = {
  isHydrated: boolean;
  subscription: BillingSubscriptionSnapshot | null;
  payments: ReturnType<typeof getBillingPaymentsForUser>;
  planCatalog: typeof BILLING_PLAN_CATALOG;
  refreshBilling: () => void;
  purchasePlan: (
    planId: BillingPlanId,
    method: BillingPaymentMethod,
  ) => BillingActionResult;
  assignPlan: (
    userId: string,
    planId: BillingPlanId,
    actor?: string,
  ) => BillingActionResult;
  consumeQuota: (type: BillingQuotaType) => BillingQuotaAttemptResult;
  getPlanSnapshotForUser: (
    userId: string,
    accountType: "client" | "admin",
  ) => BillingSubscriptionSnapshot;
  getBillingRegistry: typeof getBillingRegistrySnapshot;
};

const EMPTY_BILLING_CONTEXT: BillingContextValue = {
  isHydrated: false,
  subscription: null,
  payments: [],
  planCatalog: BILLING_PLAN_CATALOG,
  refreshBilling: () => {},
  purchasePlan: () => ({ ok: false, error: "Billing is unavailable." }),
  assignPlan: () => ({ ok: false, error: "Billing is unavailable." }),
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

const BillingContext = createContext<BillingContextValue>(
  EMPTY_BILLING_CONTEXT,
);

export function BillingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] =
    useState<BillingSubscriptionSnapshot | null>(null);
  const [payments, setPayments] = useState<
    ReturnType<typeof getBillingPaymentsForUser>
  >([]);
  const [isHydrated, setIsHydrated] = useState(false);

  const refreshBilling = useCallback(() => {
    if (!user) {
      setSubscription(null);
      setPayments([]);
      setIsHydrated(true);
      return;
    }

    setSubscription(getBillingSubscriptionSnapshot(user.id, user.accountType));
    setPayments(getBillingPaymentsForUser(user.id));
    setIsHydrated(true);
  }, [user]);

  useEffect(() => {
    refreshBilling();
  }, [refreshBilling]);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (
        event.key === BILLING_SUBSCRIPTIONS_STORAGE_KEY ||
        event.key === BILLING_PAYMENTS_STORAGE_KEY
      ) {
        refreshBilling();
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshBilling]);

  const purchasePlan = useCallback(
    (planId: BillingPlanId, method: BillingPaymentMethod) => {
      if (!user) {
        return {
          ok: false,
          error: "You need an active client session before purchasing a plan.",
        };
      }

      const result = purchaseDemoPlan(
        user.id,
        planId,
        method,
        user.displayName,
      );
      refreshBilling();
      return result;
    },
    [refreshBilling, user],
  );

  const assignPlan = useCallback(
    (userId: string, planId: BillingPlanId, actor?: string) => {
      const result = adminAssignDemoPlan(
        userId,
        planId,
        actor ?? user?.displayName ?? "Administrator",
      );
      refreshBilling();
      return result;
    },
    [refreshBilling, user?.displayName],
  );

  const consumeQuota = useCallback(
    (type: BillingQuotaType) => {
      if (!user) {
        return EMPTY_BILLING_CONTEXT.consumeQuota(type);
      }

      const result = consumeBillingQuota(user.id, user.accountType, type);
      refreshBilling();
      return result;
    },
    [refreshBilling, user],
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
      getPlanSnapshotForUser: getBillingSubscriptionSnapshot,
      getBillingRegistry: getBillingRegistrySnapshot,
    }),
    [
      consumeQuota,
      isHydrated,
      payments,
      purchasePlan,
      refreshBilling,
      subscription,
      assignPlan,
    ],
  );

  return (
    <BillingContext.Provider value={contextValue}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  return useContext(BillingContext);
}
