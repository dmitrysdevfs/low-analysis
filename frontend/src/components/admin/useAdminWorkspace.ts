"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useBilling } from "@/components/billing/BillingProvider";
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
      notify.success("Активний супер-код скопійовано.");
    } catch {
      notify.info(`Поточний супер-код: ${snapshot.activeSuperCode}`);
    }

    appendAdminAuditLog({
      action: "Супер-код скопійовано",
      detail: `Активний супер-код скопійовано адміністратором ${user?.email ?? "admin"}.`,
      actor: user?.email ?? "admin",
      severity: "info",
    });
    refreshSnapshot();
  }, [refreshSnapshot, snapshot, user?.email]);

  const handleRegenerateCode = useCallback(() => {
    const next = regenerateAdminSuperCode();
    refreshSnapshot();
    notify.success(`Новий супер-код створено: ${next.code}`);
  }, [refreshSnapshot]);

  const handleCopyGuestStatus = useCallback(async () => {
    if (!snapshot) {
      return;
    }

    const summary = [
      `Пошук гостей: ${snapshot.guestPressure.searchUsed}/${snapshot.guestPressure.searchLimit}`,
      `Перегляди гостей: ${snapshot.guestPressure.viewUsed}/${snapshot.guestPressure.viewLimit}`,
      `Кулдаун пошуку: ${snapshot.guestPressure.searchCooldownActive ? "активний" : "вимкнено"}`,
      `Кулдаун перегляду: ${snapshot.guestPressure.viewCooldownActive ? "активний" : "вимкнено"}`,
    ].join(" | ");

    try {
      await writeClipboard(summary);
      notify.success("Зведення про навантаження гостей скопійовано.");
    } catch {
      notify.info(summary);
    }
  }, [snapshot]);

  const handleAccountAction = useCallback(
    (action: AccountAction, accountId: string, accountName: string) => {
      if (action === "deactivate") {
        const result = deactivateMockAccount(accountId);
        if (!result.ok) {
          notify.warning(result.error ?? "Не вдалося змінити статус акаунта.");
          return;
        }
        notify.success("Статус акаунта оновлено.");
      } else if (action === "promote") {
        const result = promoteMockAccount(accountId);
        if (!result.ok) {
          notify.warning(result.error ?? "Не вдалося змінити роль акаунта.");
          return;
        }
        notify.success("Роль акаунта оновлено.");
      } else {
        forceLogoutMockAccount(accountId);
        appendAdminAuditLog({
          action: "Примусовий вихід",
          detail: `Для акаунта ${accountName} (${accountId}) виконано примусовий вихід.`,
          actor: user?.email ?? "admin",
          severity: "warning",
        });
        notify.success("Примусовий вихід виконано.");
      }

      refreshSnapshot();
    },
    [refreshSnapshot, user?.email],
  );

  const handleAssignPlan = useCallback(
    (accountId: string, accountName: string, planId: BillingPlanId) => {
      const result = assignPlan(accountId, planId, user?.email ?? "admin");

      if (!result.ok) {
        notify.warning(result.error ?? "Не вдалося оновити план.");
        return;
      }

      appendAdminAuditLog({
        action: "План білінгу оновлено",
        detail: `План ${planId} призначено для ${accountName} (${accountId}).`,
        actor: user?.email ?? "admin",
        severity: "security",
      });
      notify.success("План клієнта оновлено.");
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
