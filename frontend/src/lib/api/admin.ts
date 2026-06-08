"use client";

import { readStoredToken } from "@/lib/auth/authClient";

async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = readStoredToken();
  const res = await fetch(`/api/admin${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = Object.assign(new Error(`Admin API error: ${res.status}`), {
      status: res.status,
    });
    throw err;
  }
  return res.json() as Promise<T>;
}

export type AdminUserRecord = {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  billingPlan: "preview" | "trial" | "user" | "plus" | "pro";
  createdAt: string;
  updatedAt: string;
  registrationSource?: {
    referrer: string | null;
    source: "direct" | "google" | "bing" | "social" | "link" | "unknown";
  };
};

export type UserActivityEntry = {
  _id: string;
  userId: string;
  type: "page_view" | "search" | "law_view";
  path?: string;
  query?: string;
  lawId?: string;
  createdAt: string;
};

export type UserActivityStats = {
  pageViews: number;
  searches: number;
  lawViews: number;
};

export type AdminAuditEntry = {
  _id: string;
  action: string;
  detail: string;
  actor: string;
  severity: "info" | "warning" | "security";
  createdAt: string;
};

export type AdminSuperCodeEntry = {
  id: string;
  code: string;
  rotatedAt: string;
  rotatedBy: string;
  status: "active" | "retired" | "default";
};

export type AdminDashboardApiSnapshot = {
  totalAccounts: number;
  clientAccounts: number;
  adminAccounts: number;
  protectedRoutes: number;
  activeSessionRole: string;
  billingCounts: Record<string, number>;
  latestUsers: AdminUserRecord[];
  recentLaws: Array<{
    _id: string;
    shortNumber: string;
    title: string;
    createdAt: string;
  }>;
  auditLog: AdminAuditEntry[];
  auditCount: number;
  activeSuperCode: string;
  superCodeHistory: AdminSuperCodeEntry[];
  accessMatrix: Array<{
    role: string;
    home: boolean;
    laws: boolean;
    subjects: boolean;
    search: boolean;
    account: boolean;
    adminPanel: boolean;
    legislatorCabinet: boolean;
  }>;
};

export const adminApi = {
  getDashboard: () => adminFetch<AdminDashboardApiSnapshot>("/dashboard"),

  getUsers: () => adminFetch<AdminUserRecord[]>("/users"),

  setUserStatus: (id: string, status: "active" | "inactive") =>
    adminFetch<AdminUserRecord>(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  setUserRole: (id: string, role: string) =>
    adminFetch<AdminUserRecord>(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),

  setUserBilling: (id: string, billingPlan: string) =>
    adminFetch<AdminUserRecord>(`/users/${id}/billing`, {
      method: "PATCH",
      body: JSON.stringify({ billingPlan }),
    }),

  forceLogout: (id: string) =>
    adminFetch<{ ok: boolean }>(`/users/${id}/force-logout`, {
      method: "POST",
    }),

  getUserById: (id: string) => adminFetch<AdminUserRecord>(`/users/${id}`),

  getUserActivity: (
    userId: string,
    params?: { limit?: number; type?: string },
  ) => {
    const q = new URLSearchParams();
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.type) q.set("type", params.type);
    const qs = q.toString();
    return adminFetch<{
      entries: UserActivityEntry[];
      stats: UserActivityStats;
    }>(`/activity/${userId}${qs ? `?${qs}` : ""}`);
  },

  getAuditLog: (limit = 50, skip = 0) =>
    adminFetch<AdminAuditEntry[]>(`/audit?limit=${limit}&skip=${skip}`),

  getAuditLogByTarget: (email: string, limit = 100) =>
    adminFetch<AdminAuditEntry[]>(
      `/audit?limit=${limit}&targetEmail=${encodeURIComponent(email)}`,
    ),

  appendAuditEntry: (payload: {
    action: string;
    detail: string;
    actor: string;
    severity?: string;
  }) =>
    adminFetch<AdminAuditEntry>("/audit", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getSuperCode: () =>
    adminFetch<{
      activeSuperCode: string;
      superCodeHistory: AdminSuperCodeEntry[];
    }>("/super-code"),

  rotateSuperCode: () =>
    adminFetch<{ code: string; rotatedAt: string }>("/super-code/rotate", {
      method: "POST",
    }),

  getDismissedNotifications: () =>
    adminFetch<{ dismissedIds: string[] }>("/notifications/dismissed"),

  dismissNotifications: (
    items: Array<{ sourceType: string; sourceId: string }>,
  ) =>
    adminFetch<{ ok: boolean; dismissed: number }>("/notifications/dismiss", {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
};
