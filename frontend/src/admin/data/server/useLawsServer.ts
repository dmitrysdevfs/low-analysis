// ═══════════════════════════════════════════════════════════════════════
//  СЕРВЕРНА РЕАЛІЗАЦІЯ — НЕ ВИДАЛЯТИ
//  Активується: змінити LOCAL_MODE = false в adminConfig.ts
//
//  Потребує бекенд:
//    GET /api/laws?q=&page=1&limit=50
//    Відповідь: Law[]   (або { laws: Law[], total: number } з пагінацією)
//
//  Потребує RBAC middleware на бекенді: requireRole("admin")
// ═══════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { STALE_LAWS } from "../../config/adminConfig";

export function useLawsServer(opts?: { q?: string }) {
  return useQuery({
    queryKey: ["admin", "laws", opts?.q ?? ""],
    queryFn: async (): Promise<never> => {
      // TODO: замінити на реальний API-виклик коли бекенд готовий
      // import { getLaws } from "@/lib/api";
      // return getLaws(opts?.q ?? "");
      throw new Error(
        "Server mode not implemented — set LOCAL_MODE = true in adminConfig.ts",
      );
    },
    staleTime: STALE_LAWS,
    enabled: false, // НЕ ВИДАЛЯТИ: вимкнено поки LOCAL_MODE = true
  });
}
