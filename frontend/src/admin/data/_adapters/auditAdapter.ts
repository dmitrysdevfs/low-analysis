import { LOCAL_MODE } from "../../config/adminConfig";
import { useAuditLocal } from "../local/useAuditLocal";
// ⚠️ НЕ ВИДАЛЯТИ імпорт нижче — серверна реалізація, готова до активації
import { useAuditServer } from "../server/useAuditServer";

type AdminAuditResult = ReturnType<typeof useAuditLocal>;

export function useAdminAudit(opts?: { page?: number }): AdminAuditResult {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (LOCAL_MODE) return useAuditLocal();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useAuditServer(opts) as unknown as AdminAuditResult;
}
