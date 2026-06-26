"use client";

import { useQuery } from "@tanstack/react-query";
import { STALE_USERS, ADMIN_PAGE_SIZE } from "../../config/adminConfig";
import { mapUserToAccount } from "@/components/admin/mapAdminData";
import { useAdminWorkspace } from "@/components/admin/useAdminWorkspace";
import { adminApi } from "@/lib/api/admin";

export function useUsersServer(opts?: { query?: string; page?: number }) {
  const { handleAccountAction, refreshSnapshot } = useAdminWorkspace();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "users", opts?.page ?? 1, opts?.query ?? ""],
    queryFn: () =>
      adminApi.listUsers({
        q: opts?.query ?? "",
        page: opts?.page ?? 1,
        limit: ADMIN_PAGE_SIZE,
      }),
    staleTime: STALE_USERS,
  });

  return {
    users: (data?.users ?? []).map(mapUserToAccount),
    total: data?.total ?? 0,
    loading: isLoading,
    error: error ? String(error) : null,
    handleAccountAction,
    refreshSnapshot,
  };
}
