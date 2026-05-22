// ═══════════════════════════════════════════════════════════════════════
//  СЕРВЕРНА РЕАЛІЗАЦІЯ — НЕ ВИДАЛЯТИ
//  Активується: змінити LOCAL_MODE = false в adminConfig.ts
//
//  Потребує бекенд:
//    GET /api/admin/audit?page=1&limit=20
//    Відповідь: { events: AuditEvent[], total: number }
//
//  Потребує RBAC: requireRole("admin")
// ═══════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { STALE_AUDIT } from "../../config/adminConfig";

export function useAuditServer(opts?: { page?: number }) {
  return useQuery({
    queryKey: ["admin", "audit", opts?.page ?? 1],
    queryFn: async (): Promise<never> => {
      // TODO: замінити на реальний API-виклик
      // return getJson(`/admin/audit?page=${opts?.page ?? 1}&limit=20`);
      void opts;
      throw new Error(
        "Server mode not implemented — set LOCAL_MODE = true in adminConfig.ts",
      );
    },
    staleTime: STALE_AUDIT,
    enabled: false, // НЕ ВИДАЛЯТИ
  });
}
