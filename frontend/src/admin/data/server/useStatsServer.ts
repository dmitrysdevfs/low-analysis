// ═══════════════════════════════════════════════════════════════════════
//  СЕРВЕРНА РЕАЛІЗАЦІЯ — НЕ ВИДАЛЯТИ
//  Активується: змінити LOCAL_MODE = false в adminConfig.ts
//
//  Потребує бекенд:
//    GET /api/laws/stats/batch  (або множинний GET /api/laws/:id/stats)
//    Відповідь: { [lawId: string]: LawStats }
//
//  Потребує RBAC: requireRole("admin")
// ═══════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { STALE_STATS } from "../../config/adminConfig";

export function useStatsServer(lawIds: string[]) {
  return useQuery({
    queryKey: ["admin", "stats", lawIds],
    queryFn: async (): Promise<never> => {
      // TODO: замінити на batch endpoint коли бекенд готовий
      // return getJson(`/laws/stats/batch?ids=${lawIds.join(",")}`);
      void lawIds;
      throw new Error("Server mode not implemented — set LOCAL_MODE = true in adminConfig.ts");
    },
    staleTime: STALE_STATS,
    enabled: false, // НЕ ВИДАЛЯТИ
  });
}
