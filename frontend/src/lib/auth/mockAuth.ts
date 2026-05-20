"use client";

import { ROUTES } from "@/constants/routes";
import { getGuestLimitSnapshot } from "@/lib/guestLimits";
import type {
  AuthAccountType,
  AuthSession,
  LoginPayload,
  RegisterPayload,
  StoredAuthAccount,
} from "@/types";

export const AUTH_ACCOUNTS_STORAGE_KEY = "low-analysis.auth.accounts";
export const AUTH_SESSION_STORAGE_KEY = "low-analysis.auth.session";
export const AUTH_DEV_OVERRIDES_STORAGE_KEY = "low-analysis.auth.dev-overrides";
export const AUTH_ADMIN_SUPER_CODE_STORAGE_KEY =
  "low-analysis.auth.admin-super-code";
export const AUTH_ADMIN_SUPER_CODE_ROTATED_AT_STORAGE_KEY =
  "low-analysis.auth.admin-super-code-rotated-at";
export const AUTH_ADMIN_SUPER_CODE_HISTORY_STORAGE_KEY =
  "low-analysis.auth.admin-super-code-history";
export const AUTH_ADMIN_AUDIT_LOG_STORAGE_KEY =
  "low-analysis.auth.admin-audit-log";

type AuthActionResult = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
  session?: AuthSession;
};

type AccountSource = "stored" | "dev";

type AccountChangePayload = {
  userId: string;
  currentPassword: string;
  nextPassword: string;
};

type ProfileUpdatePayload = {
  userId: string;
  displayName: string;
};

type DevAccountOverride = Partial<
  Pick<StoredAuthAccount, "displayName" | "password" | "lastLoginAt">
>;

export type AdminAccessMatrixRow = {
  role: "Guest" | "Client" | "Admin";
  home: boolean;
  laws: boolean;
  subjects: boolean;
  search: boolean;
  adminPanel: boolean;
};

export type AdminAccountSummary = {
  id: string;
  displayName: string;
  email: string;
  accountType: AuthAccountType;
  roles: string[];
  createdAt: string;
  lastLoginAt?: string;
  superCodeProtected: boolean;
  source: AccountSource;
};

export type AdminDashboardSnapshot = {
  totalAccounts: number;
  clientAccounts: number;
  adminAccounts: number;
  protectedRoutes: number;
  activeSessionRole: AuthAccountType | "guest";
  latestAccounts: AdminAccountSummary[];
  registryAccounts: AdminAccountSummary[];
  accessMatrix: AdminAccessMatrixRow[];
  activeSuperCode: string;
  superCodeRotatedAt?: string;
  superCodeHistory: AdminSuperCodeHistoryEntry[];
  auditLog: AdminAuditLogEntry[];
  guestPressure: AdminGuestPressureSnapshot;
};

export type AdminSuperCodeHistoryEntry = {
  id: string;
  code: string;
  rotatedAt: string;
  rotatedBy: string;
  status: "active" | "retired" | "default";
};

export type AdminAuditLogEntry = {
  id: string;
  action: string;
  detail: string;
  actor: string;
  createdAt: string;
  severity: "info" | "warning" | "security";
};

export type AdminGuestPressureSnapshot = {
  searchUsed: number;
  searchRemaining: number;
  searchLimit: number;
  searchCooldownActive: boolean;
  viewUsed: number;
  viewRemaining: number;
  viewLimit: number;
  viewCooldownActive: boolean;
};

type DevAuthAccount = StoredAuthAccount & {
  login: string;
};

const DEFAULT_ADMIN_SUPER_CODE = "SUPER-001";

const DEV_ACCOUNTS: DevAuthAccount[] = [
  {
    id: "dev-client-account",
    login: "user",
    displayName: "Dev Client",
    email: "user@low-analysis.dev",
    password: "777",
    accountType: "client",
    roles: ["client"],
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "dev-admin-account",
    login: "admin",
    displayName: "Dev Admin",
    email: "admin@low-analysis.dev",
    password: "888",
    accountType: "admin",
    roles: ["admin", "client"],
    superCode: DEFAULT_ADMIN_SUPER_CODE,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

function isBrowser() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readStorageItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const value = window.localStorage.getItem(key);

  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeStorageItem(key: string, value: unknown) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readAuditLog() {
  return readStorageItem<AdminAuditLogEntry[]>(
    AUTH_ADMIN_AUDIT_LOG_STORAGE_KEY,
    [],
  );
}

function writeAuditLog(entries: AdminAuditLogEntry[]) {
  writeStorageItem(AUTH_ADMIN_AUDIT_LOG_STORAGE_KEY, entries);
}

function appendAuditLogEntry(
  payload: Pick<AdminAuditLogEntry, "action" | "detail" | "actor" | "severity">,
) {
  const nextEntry: AdminAuditLogEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    ...payload,
  };

  const nextEntries = [nextEntry, ...readAuditLog()].slice(0, 24);
  writeAuditLog(nextEntries);
  return nextEntries;
}

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

function createRoles(accountType: AuthAccountType) {
  return accountType === "admin" ? ["admin", "client"] : ["client"];
}

function createSession(account: StoredAuthAccount): AuthSession {
  return {
    id: account.id,
    displayName: account.displayName,
    email: account.email,
    roles: account.roles,
    accountType: account.accountType,
    lastLoginAt: account.lastLoginAt ?? new Date().toISOString(),
  };
}

function readDevOverrides() {
  return readStorageItem<Record<string, DevAccountOverride>>(
    AUTH_DEV_OVERRIDES_STORAGE_KEY,
    {},
  );
}

function writeDevOverrides(overrides: Record<string, DevAccountOverride>) {
  writeStorageItem(AUTH_DEV_OVERRIDES_STORAGE_KEY, overrides);
}

function readEffectiveDevAccounts() {
  const overrides = readDevOverrides();

  return DEV_ACCOUNTS.map((account) => ({
    ...account,
    ...overrides[account.id],
  }));
}

function matchesAccountIdentifier(
  identifier: string,
  account: StoredAuthAccount,
) {
  return normalizeIdentifier(account.email) === identifier;
}

function matchesDevIdentifier(identifier: string, account: DevAuthAccount) {
  return (
    normalizeIdentifier(account.login) === identifier ||
    matchesAccountIdentifier(identifier, account)
  );
}

function findAccountByUserId(userId: string) {
  const storedAccounts = readStoredAccounts();
  const storedAccount = storedAccounts.find((account) => account.id === userId);

  if (storedAccount) {
    return {
      source: "stored" as const,
      account: storedAccount,
      storedAccounts,
    };
  }

  const devAccounts = readEffectiveDevAccounts();
  const devAccount = devAccounts.find((account) => account.id === userId);

  if (devAccount) {
    return {
      source: "dev" as const,
      account: devAccount,
      storedAccounts,
    };
  }

  return null;
}

function updateStoredSession(session: AuthSession | null) {
  if (session) {
    writeStorageItem(AUTH_SESSION_STORAGE_KEY, session);
    return;
  }

  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

function persistDevOverride(accountId: string, override: DevAccountOverride) {
  const overrides = readDevOverrides();
  writeDevOverrides({
    ...overrides,
    [accountId]: {
      ...overrides[accountId],
      ...override,
    },
  });
}

function buildUpdatedSession(account: StoredAuthAccount) {
  const session = createSession(account);
  updateStoredSession(session);
  return session;
}

function createInviteCode() {
  return `LOW-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

export function readStoredAccounts() {
  return readStorageItem<StoredAuthAccount[]>(AUTH_ACCOUNTS_STORAGE_KEY, []);
}

export function readStoredSession() {
  return readStorageItem<AuthSession | null>(AUTH_SESSION_STORAGE_KEY, null);
}

export function clearStoredSession() {
  updateStoredSession(null);
}

export function readActiveAdminSuperCode() {
  return readStorageItem<string>(
    AUTH_ADMIN_SUPER_CODE_STORAGE_KEY,
    DEFAULT_ADMIN_SUPER_CODE,
  );
}

export function readAdminSuperCodeRotatedAt() {
  return readStorageItem<string | undefined>(
    AUTH_ADMIN_SUPER_CODE_ROTATED_AT_STORAGE_KEY,
    undefined,
  );
}

export function readAdminSuperCodeHistory() {
  const stored = readStorageItem<AdminSuperCodeHistoryEntry[]>(
    AUTH_ADMIN_SUPER_CODE_HISTORY_STORAGE_KEY,
    [],
  );

  if (stored.length > 0) {
    return stored;
  }

  const seededEntry: AdminSuperCodeHistoryEntry = {
    id: "super-code-default",
    code: readActiveAdminSuperCode(),
    rotatedAt: readAdminSuperCodeRotatedAt() ?? "2026-01-01T00:00:00.000Z",
    rotatedBy: "System bootstrap",
    status: "default",
  };

  writeStorageItem(AUTH_ADMIN_SUPER_CODE_HISTORY_STORAGE_KEY, [seededEntry]);
  return [seededEntry];
}

export function regenerateAdminSuperCode() {
  const nextCode = createInviteCode();
  const rotatedAt = new Date().toISOString();
  const rotatedBy = readStoredSession()?.displayName ?? "Administrator";
  const nextHistoryEntry: AdminSuperCodeHistoryEntry = {
    id: `super-code-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: nextCode,
    rotatedAt,
    rotatedBy,
    status: "active",
  };
  const nextHistory = [
    nextHistoryEntry,
    ...readAdminSuperCodeHistory().map((entry) => ({
      ...entry,
      status: "retired" as const,
    })),
  ].slice(0, 8);

  writeStorageItem(AUTH_ADMIN_SUPER_CODE_STORAGE_KEY, nextCode);
  writeStorageItem(AUTH_ADMIN_SUPER_CODE_ROTATED_AT_STORAGE_KEY, rotatedAt);
  writeStorageItem(AUTH_ADMIN_SUPER_CODE_HISTORY_STORAGE_KEY, nextHistory);
  appendAuditLogEntry({
    action: "Super code regenerated",
    detail: `A fresh administrator onboarding code was issued: ${nextCode}.`,
    actor: rotatedBy,
    severity: "security",
  });

  return {
    code: nextCode,
    rotatedAt,
  };
}

export function updateMockProfile(
  payload: ProfileUpdatePayload,
): AuthActionResult {
  const target = findAccountByUserId(payload.userId);

  if (!target) {
    return {
      ok: false,
      error: "Account profile could not be updated.",
    };
  }

  const nextDisplayName = payload.displayName.trim();

  if (nextDisplayName.length < 2) {
    return {
      ok: false,
      error: "Display name must contain at least two characters.",
    };
  }

  const updatedAccount: StoredAuthAccount = {
    ...target.account,
    displayName: nextDisplayName,
  };

  if (target.source === "stored") {
    const nextAccounts = target.storedAccounts.map((account) =>
      account.id === updatedAccount.id ? updatedAccount : account,
    );
    writeStorageItem(AUTH_ACCOUNTS_STORAGE_KEY, nextAccounts);
  } else {
    persistDevOverride(updatedAccount.id, {
      displayName: updatedAccount.displayName,
    });
  }

  appendAuditLogEntry({
    action: "Profile updated",
    detail: `Display name changed to ${updatedAccount.displayName}.`,
    actor: target.account.displayName,
    severity: "info",
  });

  return {
    ok: true,
    session: buildUpdatedSession(updatedAccount),
  };
}

export function changeMockPassword(
  payload: AccountChangePayload,
): AuthActionResult {
  const target = findAccountByUserId(payload.userId);

  if (!target) {
    return {
      ok: false,
      error: "Account password could not be updated.",
    };
  }

  if (target.account.password !== payload.currentPassword) {
    return {
      ok: false,
      error: "Current password is incorrect.",
    };
  }

  const updatedAccount: StoredAuthAccount = {
    ...target.account,
    password: payload.nextPassword,
  };

  if (target.source === "stored") {
    const nextAccounts = target.storedAccounts.map((account) =>
      account.id === updatedAccount.id ? updatedAccount : account,
    );
    writeStorageItem(AUTH_ACCOUNTS_STORAGE_KEY, nextAccounts);
  } else {
    persistDevOverride(updatedAccount.id, {
      password: updatedAccount.password,
    });
  }

  appendAuditLogEntry({
    action: "Password updated",
    detail: "The account password was changed in the frontend preview store.",
    actor: target.account.displayName,
    severity: "security",
  });

  return {
    ok: true,
    session: buildUpdatedSession(updatedAccount),
  };
}

export function registerMockAccount(
  payload: RegisterPayload,
): AuthActionResult {
  const storedAccounts = readStoredAccounts();
  const devAccounts = readEffectiveDevAccounts();
  const email = normalizeIdentifier(payload.email);

  if (payload.accountType === "admin" && !payload.superCode?.trim()) {
    return {
      ok: false,
      error: "Admin registration requires a super code.",
    };
  }

  if (
    payload.accountType === "admin" &&
    payload.superCode?.trim() !== readActiveAdminSuperCode()
  ) {
    return {
      ok: false,
      error: "Admin registration failed. The super code is no longer valid.",
    };
  }

  const existingAccount = [...storedAccounts, ...devAccounts].find(
    (account) => normalizeIdentifier(account.email) === email,
  );

  if (existingAccount) {
    return {
      ok: false,
      error: "Акаунт з таким email вже існує.",
    };
  }

  const account: StoredAuthAccount = {
    id: `${payload.accountType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    displayName: payload.displayName.trim(),
    email,
    password: payload.password,
    accountType: payload.accountType,
    roles: createRoles(payload.accountType),
    superCode:
      payload.accountType === "admin" ? payload.superCode?.trim() : undefined,
    createdAt: new Date().toISOString(),
  };

  writeStorageItem(AUTH_ACCOUNTS_STORAGE_KEY, [account, ...storedAccounts]);
  appendAuditLogEntry({
    action:
      payload.accountType === "admin"
        ? "Admin registered"
        : "Client registered",
    detail: `${account.displayName} (${account.email}) created a ${payload.accountType} account.`,
    actor: account.displayName,
    severity: payload.accountType === "admin" ? "security" : "info",
  });

  return {
    ok: true,
    redirectTo: ROUTES.authLogin,
  };
}

export function loginMockAccount(payload: LoginPayload): AuthActionResult {
  const storedAccounts = readStoredAccounts();
  const devAccounts = readEffectiveDevAccounts();
  const identifier = normalizeIdentifier(payload.email);
  const exactMatches = [
    ...storedAccounts
      .filter((account) => matchesAccountIdentifier(identifier, account))
      .filter((account) => account.password === payload.password)
      .map((account) => ({ account, source: "stored" as const })),
    ...devAccounts
      .filter((account) => matchesDevIdentifier(identifier, account))
      .filter((account) => account.password === payload.password)
      .map((account) => ({ account, source: "dev" as const })),
  ];

  if (exactMatches.length > 1 && !payload.accountType) {
    return {
      ok: false,
      error:
        "Multiple accounts matched this login. Use a dedicated email for each role.",
    };
  }

  const matchingAccount = exactMatches[0];

  if (!matchingAccount) {
    return {
      ok: false,
      error: "Помилка входу. Перевірте логін/email та пароль.",
    };
  }

  if (
    matchingAccount.account.status !== undefined &&
    matchingAccount.account.status !== "active"
  ) {
    return {
      ok: false,
      error: "Акаунт деактивовано",
    };
  }

  const lastLoginAt = new Date().toISOString();
  const sessionAccount: StoredAuthAccount = {
    ...matchingAccount.account,
    lastLoginAt,
  };

  if (matchingAccount.source === "stored") {
    const nextAccounts = storedAccounts.map((account) =>
      account.id === sessionAccount.id ? sessionAccount : account,
    );
    writeStorageItem(AUTH_ACCOUNTS_STORAGE_KEY, nextAccounts);
  } else {
    persistDevOverride(sessionAccount.id, {
      lastLoginAt,
    });
  }

  const session = buildUpdatedSession(sessionAccount);
  appendAuditLogEntry({
    action:
      session.accountType === "admin" ? "Administrator login" : "Client login",
    detail: `${session.displayName} authenticated successfully.`,
    actor: session.displayName,
    severity: session.accountType === "admin" ? "security" : "info",
  });

  return {
    ok: true,
    redirectTo: session.accountType === "admin" ? ROUTES.admin : ROUTES.home,
    session,
  };
}

export function appendAdminAuditLog(
  payload: Pick<AdminAuditLogEntry, "action" | "detail" | "actor" | "severity">,
) {
  return appendAuditLogEntry(payload);
}

export function deactivateMockAccount(userId: string): {
  ok: boolean;
  error?: string;
} {
  const storedAccounts = readStoredAccounts();
  const idx = storedAccounts.findIndex((a) => a.id === userId);
  if (idx === -1) {
    return {
      ok: false,
      error: "Акаунт є dev-акаунтом і не може бути змінений.",
    };
  }
  const account = storedAccounts[idx];
  const nextStatus: "active" | "inactive" =
    account?.status === "inactive" ? "active" : "inactive";
  const next = storedAccounts.map((a) =>
    a.id === userId ? { ...a, status: nextStatus } : a,
  );
  writeStorageItem(AUTH_ACCOUNTS_STORAGE_KEY, next);
  appendAuditLogEntry({
    action:
      nextStatus === "inactive" ? "Account deactivated" : "Account reactivated",
    detail: `Account ${userId} status set to ${nextStatus}.`,
    actor: "admin",
    severity: "warning",
  });
  return { ok: true };
}

export function promoteMockAccount(userId: string): {
  ok: boolean;
  error?: string;
} {
  const storedAccounts = readStoredAccounts();
  const idx = storedAccounts.findIndex((a) => a.id === userId);
  if (idx === -1) {
    return {
      ok: false,
      error: "Акаунт є dev-акаунтом і не може бути змінений.",
    };
  }
  const account = storedAccounts[idx];
  if (!account) return { ok: false, error: "Акаунт не знайдено." };
  const nextType: AuthAccountType =
    account.accountType === "admin" ? "client" : "admin";
  const nextRoles = nextType === "admin" ? ["admin", "client"] : ["client"];
  const next = storedAccounts.map((a) =>
    a.id === userId ? { ...a, accountType: nextType, roles: nextRoles } : a,
  );
  writeStorageItem(AUTH_ACCOUNTS_STORAGE_KEY, next);
  appendAuditLogEntry({
    action:
      nextType === "admin"
        ? "Account promoted to admin"
        : "Admin rights removed",
    detail: `Account ${userId} role changed to ${nextType}.`,
    actor: "admin",
    severity: "security",
  });
  return { ok: true };
}

export function forceLogoutMockAccount(userId: string): { ok: boolean } {
  const session = readStoredSession();
  if (session?.id === userId && isBrowser()) {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }
  appendAuditLogEntry({
    action: "Force logout executed",
    detail: `Force logout applied to account ${userId}.`,
    actor: "admin",
    severity: "warning",
  });
  return { ok: true };
}

export function getAdminDashboardSnapshot() {
  const storedAccounts = readStoredAccounts();
  const devAccounts = readEffectiveDevAccounts();
  const session = readStoredSession();
  const allAccounts = [...devAccounts, ...storedAccounts];
  const registryAccounts = [...allAccounts]
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map<AdminAccountSummary>((account) => ({
      id: account.id,
      displayName: account.displayName,
      email: account.email,
      accountType: account.accountType,
      roles: account.roles,
      createdAt: account.createdAt,
      lastLoginAt: account.lastLoginAt,
      superCodeProtected: Boolean(account.superCode),
      source: DEV_ACCOUNTS.some((devAccount) => devAccount.id === account.id)
        ? "dev"
        : "stored",
    }));
  const latestAccounts = registryAccounts.slice(0, 8);
  const guestSnapshot = getGuestLimitSnapshot();

  return {
    totalAccounts: allAccounts.length,
    clientAccounts: allAccounts.filter(
      (account) => account.accountType === "client",
    ).length,
    adminAccounts: allAccounts.filter(
      (account) => account.accountType === "admin",
    ).length,
    protectedRoutes: 5,
    activeSessionRole: session?.accountType ?? "guest",
    latestAccounts,
    registryAccounts,
    activeSuperCode: readActiveAdminSuperCode(),
    superCodeRotatedAt: readAdminSuperCodeRotatedAt(),
    superCodeHistory: readAdminSuperCodeHistory(),
    auditLog: readAuditLog(),
    guestPressure: {
      searchUsed: guestSnapshot.search.used,
      searchRemaining: guestSnapshot.search.remaining,
      searchLimit: guestSnapshot.search.limit,
      searchCooldownActive: guestSnapshot.search.isCoolingDown,
      viewUsed: guestSnapshot.view.used,
      viewRemaining: guestSnapshot.view.remaining,
      viewLimit: guestSnapshot.view.limit,
      viewCooldownActive: guestSnapshot.view.isCoolingDown,
    },
    accessMatrix: [
      {
        role: "Guest",
        home: true,
        laws: true,
        subjects: true,
        search: true,
        adminPanel: false,
      },
      {
        role: "Client",
        home: true,
        laws: true,
        subjects: true,
        search: true,
        adminPanel: false,
      },
      {
        role: "Admin",
        home: true,
        laws: true,
        subjects: true,
        search: true,
        adminPanel: true,
      },
    ],
  } satisfies AdminDashboardSnapshot;
}
