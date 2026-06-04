"use client";

const AUTH_TOKEN_STORAGE_KEY = "low-analysis.auth.token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api/admin${path}`, {
    ...options,
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
    adminPanel: boolean;
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

  getAuditLog: (limit = 50, skip = 0) =>
    adminFetch<AdminAuditEntry[]>(`/audit?limit=${limit}&skip=${skip}`),

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
};
