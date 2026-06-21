"use client";

import { ROUTES } from "@/constants/routes";
import type { AuthSession, LoginPayload, RegisterPayload } from "@/types";

export const AUTH_SESSION_STORAGE_KEY = "low-analysis.auth.session";
// Token key kept for backward compat — existing sessions still use it until re-login
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

/**
 * Returns the token from localStorage/sessionStorage if it exists (legacy sessions).
 * New sessions use httpOnly cookie — no token in JS context.
 * Used only as fallback Authorization header when cookie is not yet present.
 */
export function readStoredToken(): string | null {
  if (!isBrowser()) return null;
  return (
    window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ||
    window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY)
  );
}

function storeSession(session: AuthSession, rememberMe: boolean = true) {
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  storage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  // Token is NOT stored — auth is now via httpOnly cookie set by the server.
  // Legacy token (if present from a previous session) continues to work until logout.
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
      credentials: "include", // sends & receives cookie
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

    // Store session (UI data only) — no token stored, server sets httpOnly cookie
    storeSession(session, payload.rememberMe);

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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.message || "Помилка реєстрації" };
    }

    const session: AuthSession = {
      id: data._id,
      displayName: data.fullName,
      email: data.email,
      roles: [data.role],
      accountType: data.role === "admin" ? "admin" : "client",
      lastLoginAt: new Date().toISOString(),
    };
    storeSession(session, true);

    return {
      ok: true,
      redirectTo: session.accountType === "admin" ? ROUTES.admin : ROUTES.rolesDashboard,
      session,
    };
  } catch {
    return { ok: false, error: "Помилка з'єднання з сервером" };
  }
}

export async function getProfile(): Promise<AuthSession | null> {
  const token = readStoredToken(); // may be null for cookie-based sessions

  try {
    const res = await fetch(`${API_BASE}/me`, {
      credentials: "include", // sends cookie if present
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

  try {
    const res = await fetch(`${API_BASE}/password`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export async function loginWithGoogle(
  accessToken: string,
): Promise<AuthActionResult> {
  try {
    const res = await fetch(`${API_BASE}/google`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });
    const data = await res.json();
    if (!res.ok)
      return { ok: false, error: data.message || "Помилка Google авторизації" };

    const session: AuthSession = {
      id: data._id,
      displayName: data.fullName,
      email: data.email,
      roles: [data.role],
      accountType: data.role === "admin" ? "admin" : "client",
      lastLoginAt: new Date().toISOString(),
    };
    storeSession(session, true);

    const redirectTo =
      session.accountType === "admin"
        ? ROUTES.admin
        : data.isNewUser
          ? ROUTES.rolesDashboard
          : ROUTES.home;

    return { ok: true, redirectTo, session };
  } catch {
    return { ok: false, error: "Помилка з'єднання з сервером" };
  }
}

export async function logoutUserApi(): Promise<AuthActionResult> {
  const token = readStoredToken();

  try {
    await fetch(`${API_BASE}/logout`, {
      method: "POST",
      credentials: "include", // clears httpOnly cookie on server
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Помилка з'єднання з сервером під час виходу" };
  }
}
