import { LOCAL_MODE } from "../../config/adminConfig";
import { useUsersLocal } from "../local/useUsersLocal";
// ⚠️ НЕ ВИДАЛЯТИ — серверна реалізація, потребує /api/admin/users endpoint
import { useUsersServer } from "../server/useUsersServer";

void LOCAL_MODE; // зарезервовано — активувати коли /api/admin/users буде реалізовано
void useUsersServer; // зарезервовано

type AdminUsersResult = ReturnType<typeof useUsersLocal>;

// Дані вже є в snapshot через getDashboard() — окремий /api/admin/users ще не реалізований
export function useAdminUsers(opts?: {
  query?: string;
  page?: number;
}): AdminUsersResult {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useUsersLocal(opts);
}
