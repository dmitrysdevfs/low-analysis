import { LOCAL_MODE } from "../../config/adminConfig";
import { useStatsLocal } from "../local/useStatsLocal";
import type { Law } from "@/types";
// ⚠️ НЕ ВИДАЛЯТИ імпорт нижче — серверна реалізація, готова до активації
import { useStatsServer } from "../server/useStatsServer";

type AdminStatsResult = ReturnType<typeof useStatsLocal>;

export function useAdminStats(laws: Law[]): AdminStatsResult {
  const ids = laws.map((l) => l._id);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (LOCAL_MODE) return useStatsLocal(laws);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useStatsServer(ids) as unknown as AdminStatsResult;
}
