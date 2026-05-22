"use client";

import { useMemo } from "react";
import { useAdminWorkspace } from "@/components/admin/useAdminWorkspace";

export function useUsersLocal(opts?: { query?: string }) {
  const { snapshot, handleAccountAction, refreshSnapshot } = useAdminWorkspace();

  const users = useMemo(() => {
    if (!snapshot) return [];
    const q = opts?.query?.trim().toLowerCase() ?? "";
    if (!q) return snapshot.registryAccounts;
    return snapshot.registryAccounts.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q),
    );
  }, [snapshot, opts?.query]);

  return {
    users,
    total: snapshot?.registryAccounts.length ?? 0,
    loading: !snapshot,
    error: null as string | null,
    handleAccountAction,
    refreshSnapshot,
  };
}
