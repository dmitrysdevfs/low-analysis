"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { notify } from "@/lib/toast";
import {
  appendAdminAuditLog,
  deactivateMockAccount,
  forceLogoutMockAccount,
  getAdminDashboardSnapshot,
  promoteMockAccount,
  regenerateAdminSuperCode,
  type AdminDashboardSnapshot,
} from "@/lib/auth/mockAuth";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBilling } from "@/components/billing/BillingProvider";
import type { BillingPlanId } from "@/types";

const CLIENT_PLAN_IDS = ["trial", "user", "plus", "pro"] as const;

type AccountAction = "deactivate" | "promote" | "forceLogout";

async function writeClipboard(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard API unavailable");
  }

  await navigator.clipboard.writeText(value);
}

export function useAdminWorkspace() {
  const { user } = useAuth();
  const { getBillingRegistry, assignPlan } = useBilling();
  const [snapshot, setSnapshot] = useState<AdminDashboardSnapshot | null>(null);

  const refreshSnapshot = useCallback(() => {
    setSnapshot(getAdminDashboardSnapshot());
  }, []);

  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot, user]);

  const billingRegistry = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return getBillingRegistry(
      snapshot.registryAccounts.map((account) => ({
        id: account.id,
        displayName: account.displayName,
        email: account.email,
        accountType: account.accountType,
      })),
    );
  }, [getBillingRegistry, snapshot]);

  const billingCounts = useMemo(
    () =>
      billingRegistry.reduce(
        (acc, account) => {
          if (account.accountType === "admin") {
            acc.admin += 1;
            return acc;
          }

          if (!account.subscription.planId) {
            acc.preview += 1;
            return acc;
          }

          acc[account.subscription.planId] += 1;
          return acc;
        },
        { preview: 0, trial: 0, user: 0, plus: 0, pro: 0, admin: 0 },
      ),
    [billingRegistry],
  );

  const handleCopyCode = useCallback(async () => {
    if (!snapshot) {
      return;
    }

    try {
      await writeClipboard(snapshot.activeSuperCode);
      notify.success("ÐÐºÑ‚Ð¸Ð²Ð½Ð¸Ð¹ ÑÑƒÐ¿ÐµÑ€-ÐºÐ¾Ð´ ÑÐºÐ¾Ð¿Ñ–Ð¹Ð¾Ð²Ð°Ð½Ð¾.");
    } catch {
      notify.info(`ÐŸÐ¾Ñ‚Ð¾Ñ‡Ð½Ð¸Ð¹ ÑÑƒÐ¿ÐµÑ€-ÐºÐ¾Ð´: ${snapshot.activeSuperCode}`);
    }

    appendAdminAuditLog({
      action: "Super code copied",
      detail: `ÐÐºÑ‚Ð¸Ð²Ð½Ð¸Ð¹ ÑÑƒÐ¿ÐµÑ€-ÐºÐ¾Ð´ ÑÐºÐ¾Ð¿Ñ–Ð¹Ð¾Ð²Ð°Ð½Ð¾ Ð°Ð´Ð¼Ñ–Ð½Ð¾Ð¼ ${user?.email ?? "admin"}.`,
      actor: user?.email ?? "admin",
      severity: "info",
    });
    refreshSnapshot();
  }, [refreshSnapshot, snapshot, user?.email]);

  const handleRegenerateCode = useCallback(() => {
    const next = regenerateAdminSuperCode();
    refreshSnapshot();
    notify.success(`ÐÐ¾Ð²Ð¸Ð¹ ÑÑƒÐ¿ÐµÑ€-ÐºÐ¾Ð´ Ð²Ð¸Ð´Ð°Ð½Ð¾: ${next.code}`);
  }, [refreshSnapshot]);

  const handleCopyGuestStatus = useCallback(async () => {
    if (!snapshot) {
      return;
    }

    const summary = [
      `ÐŸÐ¾ÑˆÑƒÐº Ð³Ð¾ÑÑ‚ÐµÐ¹: ${snapshot.guestPressure.searchUsed}/${snapshot.guestPressure.searchLimit}`,
      `ÐŸÐµÑ€ÐµÐ³Ð»ÑÐ´Ð¸ Ð³Ð¾ÑÑ‚ÐµÐ¹: ${snapshot.guestPressure.viewUsed}/${snapshot.guestPressure.viewLimit}`,
      `ÐšÑƒÐ»Ð´Ð°ÑƒÐ½ Ð¿Ð¾ÑˆÑƒÐºÑƒ: ${snapshot.guestPressure.searchCooldownActive ? "Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸Ð¹" : "Ð²Ð¸Ð¼ÐºÐ½ÐµÐ½Ð¾"}`,
      `ÐšÑƒÐ»Ð´Ð°ÑƒÐ½ Ð¿ÐµÑ€ÐµÐ³Ð»ÑÐ´Ñƒ: ${snapshot.guestPressure.viewCooldownActive ? "Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸Ð¹" : "Ð²Ð¸Ð¼ÐºÐ½ÐµÐ½Ð¾"}`,
    ].join(" | ");

    try {
      await writeClipboard(summary);
      notify.success("Ð—Ð²ÐµÐ´ÐµÐ½Ð½Ñ Ð½Ð°Ð²Ð°Ð½Ñ‚Ð°Ð¶ÐµÐ½Ð½Ñ Ð³Ð¾ÑÑ‚ÐµÐ¹ ÑÐºÐ¾Ð¿Ñ–Ð¹Ð¾Ð²Ð°Ð½Ð¾.");
    } catch {
      notify.info(summary);
    }
  }, [snapshot]);

  const handleAccountAction = useCallback(
    (action: AccountAction, accountId: string, accountName: string) => {
      if (action === "deactivate") {
        const result = deactivateMockAccount(accountId);
        if (!result.ok) {
          notify.warning(result.error ?? "ÐÐµ Ð²Ð´Ð°Ð»Ð¾ÑÑ Ð·Ð¼Ñ–Ð½Ð¸Ñ‚Ð¸ ÑÑ‚Ð°Ñ‚ÑƒÑ.");
          return;
        }
        notify.success("Ð¡Ñ‚Ð°Ñ‚ÑƒÑ Ð°ÐºÐ°ÑƒÐ½Ñ‚Ñƒ Ð·Ð¼Ñ–Ð½ÐµÐ½Ð¾.");
      } else if (action === "promote") {
        const result = promoteMockAccount(accountId);
        if (!result.ok) {
          notify.warning(result.error ?? "ÐÐµ Ð²Ð´Ð°Ð»Ð¾ÑÑ Ð·Ð¼Ñ–Ð½Ð¸Ñ‚Ð¸ Ñ€Ð¾Ð»ÑŒ.");
          return;
        }
        notify.success("Ð Ð¾Ð»ÑŒ Ð°ÐºÐ°ÑƒÐ½Ñ‚Ñƒ Ð¾Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾.");
      } else {
        forceLogoutMockAccount(accountId);
        appendAdminAuditLog({
          action: "Force logout",
          detail: `ÐŸÑ€Ð¸Ð¼ÑƒÑÐ¾Ð²Ð¸Ð¹ Ð²Ð¸Ñ…Ñ–Ð´ Ð²Ð¸ÐºÐ¾Ð½Ð°Ð½Ð¾ Ð´Ð»Ñ ${accountName} (${accountId}).`,
          actor: user?.email ?? "admin",
          severity: "warning",
        });
        notify.success("ÐŸÑ€Ð¸Ð¼ÑƒÑÐ¾Ð²Ð¸Ð¹ Ð²Ð¸Ñ…Ñ–Ð´ Ð²Ð¸ÐºÐ¾Ð½Ð°Ð½Ð¾.");
      }

      refreshSnapshot();
    },
    [refreshSnapshot, user?.email],
  );

  const handleAssignPlan = useCallback(
    (accountId: string, accountName: string, planId: BillingPlanId) => {
      const result = assignPlan(accountId, planId, user?.email ?? "admin");

      if (!result.ok) {
        notify.warning(result.error ?? "ÐÐµ Ð²Ð´Ð°Ð»Ð¾ÑÑ Ð¾Ð½Ð¾Ð²Ð¸Ñ‚Ð¸ Ð¿Ð»Ð°Ð½.");
        return;
      }

      appendAdminAuditLog({
        action: "Billing plan reassigned",
        detail: `ÐŸÐ»Ð°Ð½ ${planId} Ð²ÑÑ‚Ð°Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾ Ð´Ð»Ñ ${accountName} (${accountId}).`,
        actor: user?.email ?? "admin",
        severity: "security",
      });
      notify.success("ÐŸÐ»Ð°Ð½ ÐºÐ»Ñ–Ñ”Ð½Ñ‚Ð° Ð¾Ð½Ð¾Ð²Ð»ÐµÐ½Ð¾.");
      refreshSnapshot();
    },
    [assignPlan, refreshSnapshot, user?.email],
  );

  return {
    snapshot,
    billingRegistry,
    billingCounts,
    clientPlanIds: CLIENT_PLAN_IDS,
    refreshSnapshot,
    handleCopyCode,
    handleRegenerateCode,
    handleCopyGuestStatus,
    handleAccountAction,
    handleAssignPlan,
  };
}
