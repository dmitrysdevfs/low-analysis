"use client";

import { fetchWithTimeout } from "@/lib/utils/fetchWithTimeout";
import { readStoredToken } from "@/lib/auth/authClient";

const API_BASE = "/api";

export async function getJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = readStoredToken();
  const headers = new Headers(options?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function requestJson<T>(
  path: string,
  method: string,
  body?: unknown,
  options?: RequestInit,
): Promise<T> {
  const token = readStoredToken();
  const headers = new Headers(options?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetchWithTimeout(`/api${path}`, {
    ...options,
    method,
    credentials: "include",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(
      (e as { message?: string }).message || `HTTP ${res.status}`,
    );
  }

  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}
