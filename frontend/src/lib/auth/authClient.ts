"use client";

import { ROUTES } from "@/constants/routes";
import type { AuthSession, LoginPayload, RegisterPayload } from "@/types";

export const AUTH_SESSION_STORAGE_KEY = "low-analysis.auth.session";
export const AUTH_TOKEN_STORAGE_KEY = "low-analysis.auth.token";

type AuthActionResult = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
  session?: AuthSession;
};

const API_BASE = "/api/auth";

function isBrowser() {
  return typeof window !== "undefined";
}

export function readStoredSession(): AuthSession | null {
  if (!isBrowser()) return null;
  const raw =
    window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) ||
    window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function readStoredToken(): string | null {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  );
}

function storeSession(
  session: AuthSession,
  token: string,
  rememberMe: boolean = true,
) {
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  storage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
}

export function clearStoredSession() {
  if (!isBrowser()) return;
  window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export async function loginUser(
  payload: LoginPayload,
): Promise<AuthActionResult> {
  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || "Помилка входу" };
    }

    const session: AuthSession = {
      id: data._id,
      displayName: data.fullName,
      email: data.email,
      roles: [data.role],
      accountType: data.role === "admin" ? "admin" : "client",
      lastLoginAt: new Date().toISOString(),
    };

    storeSession(session, data.token, payload.rememberMe);

    return {
      ok: true,
      redirectTo: session.accountType === "admin" ? ROUTES.admin : ROUTES.home,
      session,
    };
  } catch {
    return { ok: false, error: "Помилка з'єднання з сервером" };
  }
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<AuthActionResult> {
  try {
    const res = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || "Помилка реєстрації" };
    }

    return {
      ok: true,
      redirectTo: ROUTES.authLogin,
    };
  } catch {
    return { ok: false, error: "Помилка з'єднання з сервером" };
  }
}

export async function getProfile(): Promise<AuthSession | null> {
  const token = readStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      clearStoredSession();
      return null;
    }

    const data = await res.json();
    return {
      id: data._id,
      displayName: data.fullName,
      email: data.email,
      roles: [data.role],
      accountType: data.role === "admin" ? "admin" : "client",
      lastLoginAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function updateUserProfile(
  displayName: string,
): Promise<AuthActionResult> {
  const token = readStoredToken();
  if (!token) return { ok: false, error: "Користувач не авторизований" };

  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ displayName }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || "Помилка оновлення профілю" };
    }

    const currentSession = readStoredSession();
    if (currentSession) {
      const nextSession: AuthSession = {
        ...currentSession,
        displayName: data.fullName,
      };

      const isLocal = !!window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      const storage = isLocal ? window.localStorage : window.sessionStorage;
      storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(nextSession));

      return { ok: true, session: nextSession };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Помилка з'єднання з сервером" };
  }
}

export async function changeUserPassword(
  currentPassword: string,
  nextPassword: string,
): Promise<AuthActionResult> {
  const token = readStoredToken();
  if (!token) return { ok: false, error: "Користувач не авторизований" };

  try {
    const res = await fetch(`${API_BASE}/password`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, nextPassword }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || "Помилка зміни пароля" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "Помилка з'єднання з сервером" };
  }
}

export async function logoutUserApi(): Promise<AuthActionResult> {
  const token = readStoredToken();
  if (!token) return { ok: true };

  try {
    const res = await fetch(`${API_BASE}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.warn(`[auth] Logout backend error: HTTP ${res.status}`);
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Помилка з'єднання з сервером під час виходу" };
  }
}
