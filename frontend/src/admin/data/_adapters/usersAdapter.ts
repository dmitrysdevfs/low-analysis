import { LOCAL_MODE } from "../../config/adminConfig";
import { useUsersLocal } from "../local/useUsersLocal";
// ⚠️ НЕ ВИДАЛЯТИ імпорт нижче — серверна реалізація, готова до активації
import { useUsersServer } from "../server/useUsersServer";

type AdminUsersResult = ReturnType<typeof useUsersLocal>;

export function useAdminUsers(opts?: { query?: string; page?: number }): AdminUsersResult {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (LOCAL_MODE) return useUsersLocal(opts);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useUsersServer(opts) as unknown as AdminUsersResult;
}
