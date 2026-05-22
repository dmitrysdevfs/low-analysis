// ═══════════════════════════════════════════════════════════════════════
//  СЕРВЕРНА РЕАЛІЗАЦІЯ — НЕ ВИДАЛЯТИ
//  Активується: змінити LOCAL_MODE = false в adminConfig.ts
//
//  Потребує бекенд:
//    GET /api/admin/users?page=1&limit=50&q=&sort=createdAt:desc
//    Відповідь: { users: Account[], total: number, page: number }
//
//  Потребує RBAC: requireRole("admin")
// ═══════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { STALE_USERS, ADMIN_PAGE_SIZE } from "../../config/adminConfig";

export function useUsersServer(opts?: { query?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin", "users", opts?.page ?? 1, opts?.query ?? ""],
    queryFn: async (): Promise<never> => {
      // TODO: замінити на реальний API-виклик
      // const params = new URLSearchParams({ page: String(opts?.page ?? 1), limit: String(ADMIN_PAGE_SIZE) });
      // if (opts?.query) params.set("q", opts.query);
      // return getJson(`/admin/users?${params}`);
      void ADMIN_PAGE_SIZE;
      throw new Error("Server mode not implemented — set LOCAL_MODE = true in adminConfig.ts");
    },
    staleTime: STALE_USERS,
    enabled: false, // НЕ ВИДАЛЯТИ
  });
}
