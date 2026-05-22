"use client";

import { useAdminWorkspace } from "@/components/admin/useAdminWorkspace";

export function useAuditLocal() {
  const { snapshot, refreshSnapshot } = useAdminWorkspace();
  return {
    events: snapshot?.auditLog ?? [],
    loading: !snapshot,
    error: null as string | null,
    refresh: refreshSnapshot,
  };
}
