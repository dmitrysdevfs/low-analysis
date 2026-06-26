import { useUsersServer } from "../server/useUsersServer";

export type AdminUsersResult = ReturnType<typeof useUsersServer>;

export function useAdminUsers(opts?: {
  query?: string;
  page?: number;
}): AdminUsersResult {
  return useUsersServer(opts);
}
