import { LOCAL_MODE } from "../../config/adminConfig";
import { useLawsLocal } from "../local/useLawsLocal";
// ⚠️ НЕ ВИДАЛЯТИ імпорт нижче — серверна реалізація, готова до активації
import { useLawsServer } from "../server/useLawsServer";

type AdminLawsResult = ReturnType<typeof useLawsLocal>;

export function useAdminLaws(opts?: { q?: string }): AdminLawsResult {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (LOCAL_MODE) return useLawsLocal(opts?.q);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useLawsServer(opts) as unknown as AdminLawsResult;
}
