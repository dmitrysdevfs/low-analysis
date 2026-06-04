"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { notify } from "@/lib/toast";
import { adminApi } from "@/lib/api/admin";
import type { AdminDashboardSnapshot } from "@/lib/auth/mockAuth";
import { buildBillingEntry, mapApiToSnapshot } from "./mapAdminData";

type AccountAction = "deactivate" | "promote" | "forceLogout";

async function writeClipboard(value: string) {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard API unavailable");
  }
  await navigator.clipboard.writeText(value);
}

export function useAdminWorkspace() {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<AdminDashboardSnapshot | null>(null);

  const refreshSnapshot = useCallback(async () => {
    try {
      const data = await adminApi.getDashboard();
      setSnapshot(mapApiToSnapshot(data));
    } catch {
      notify.warning("Не вдалося оновити дані панелі.");
    }
  }, []);

  useEffect(() => {
    refreshSnapshot();
  }, [refreshSnapshot, user]);

  const billingRegistry = useMemo(() => {
    if (!snapshot) return [];
    // Re-fetch users from snapshot accounts and build billing entries
    return snapshot.registryAccounts.map((account) =>
      buildBillingEntry({
        _id: account.id,
        fullName: account.displayName,
        email: account.email,
        role: account.accountType === "admin" ? "admin" : "user",
        status: account.status,
        billingPlan: "preview",
        createdAt: account.createdAt,
        updatedAt: account.lastLoginAt ?? account.createdAt,
      }),
    );
  }, [snapshot]);

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
          acc[account.subscription.planId as keyof typeof acc] =
            (acc[account.subscription.planId as keyof typeof acc] ?? 0) + 1;
          return acc;
        },
        { preview: 0, trial: 0, user: 0, plus: 0, pro: 0, admin: 0 },
      ),
    [billingRegistry],
  );

  const handleCopyCode = useCallback(async () => {
    if (!snapshot) return;
    try {
      await writeClipboard(snapshot.activeSuperCode);
      notify.success("Активний супер-код скопійовано.");
    } catch {
      notify.info(`Поточний супер-код: ${snapshot.activeSuperCode}`);
    }
    await adminApi.appendAuditEntry({
      action: "Супер-код скопійовано",
      detail: `Активний супер-код скопійовано адміністратором ${user?.email ?? "admin"}.`,
      actor: user?.email ?? "admin",
      severity: "info",
    });
    refreshSnapshot();
  }, [refreshSnapshot, snapshot, user?.email]);

  const handleRegenerateCode = useCallback(async () => {
    try {
      const next = await adminApi.rotateSuperCode();
      await refreshSnapshot();
      notify.success(`Новий супер-код створено: ${next.code}`);
    } catch {
      notify.warning("Не вдалося оновити супер-код.");
    }
  }, [refreshSnapshot]);

  const handleCopyGuestStatus = useCallback(async () => {
    if (!snapshot) return;
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
    async (action: AccountAction, accountId: string, accountName: string) => {
      try {
        if (action === "deactivate") {
          const curr = snapshot?.registryAccounts.find(
            (a) => a.id === accountId,
          );
          const nextStatus =
            curr?.status === "inactive" ? "active" : "inactive";
          await adminApi.setUserStatus(accountId, nextStatus);
          notify.success("Статус акаунта оновлено.");
        } else if (action === "promote") {
          const curr = snapshot?.registryAccounts.find(
            (a) => a.id === accountId,
          );
          const nextRole = curr?.accountType === "admin" ? "user" : "admin";
          await adminApi.setUserRole(accountId, nextRole);
          notify.success("Роль акаунта оновлено.");
        } else {
          await adminApi.forceLogout(accountId);
          await adminApi.appendAuditEntry({
            action: "Примусовий вихід",
            detail: `Для акаунта ${accountName} (${accountId}) виконано примусовий вихід.`,
            actor: user?.email ?? "admin",
            severity: "warning",
          });
          notify.success("Примусовий вихід виконано.");
        }
        await refreshSnapshot();
      } catch {
        notify.warning("Не вдалося виконати дію.");
      }
    },
    [refreshSnapshot, snapshot, user],
  );

  const handleAssignPlan = useCallback(
    async (accountId: string, accountName: string, planId: string) => {
      try {
        await adminApi.setUserBilling(accountId, planId);
        await adminApi.appendAuditEntry({
          action: "План білінгу оновлено",
          detail: `План ${planId} призначено для ${accountName} (${accountId}).`,
          actor: user?.email ?? "admin",
          severity: "security",
        });
        notify.success("План клієнта оновлено.");
        await refreshSnapshot();
      } catch {
        notify.warning("Не вдалося оновити план.");
      }
    },
    [refreshSnapshot, user],
  );

  return {
    snapshot,
    billingRegistry,
    billingCounts,
    clientPlanIds: ["trial", "user", "plus", "pro"] as const,
    refreshSnapshot,
    handleCopyCode,
    handleRegenerateCode,
    handleCopyGuestStatus,
    handleAccountAction,
    handleAssignPlan,
  };
}
