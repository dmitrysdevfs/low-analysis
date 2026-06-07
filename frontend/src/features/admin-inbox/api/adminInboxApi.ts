"use client";

import { readStoredToken } from "@/lib/auth/authClient";
import type {
  AdminInboxStatus,
  AdminInboxThreadDetail,
  AdminInboxThreadSummary,
} from "../types";

async function inboxFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = readStoredToken();
  const res = await fetch(`/api/admin/inbox${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const data = await res
      .json()
      .catch(() => ({ message: `Inbox API error: ${res.status}` }));
    const err = Object.assign(new Error(data.message || "Inbox API error"), {
      status: res.status,
    });
    throw err;
  }

  return res.json() as Promise<T>;
}

export const adminInboxApi = {
  getStatus: () => inboxFetch<AdminInboxStatus>("/status"),

  startConnect: (returnTo: string) =>
    inboxFetch<{ authUrl: string }>("/connect/start", {
      method: "POST",
      body: JSON.stringify({ returnTo }),
    }),

  disconnect: () =>
    inboxFetch<{ ok: boolean }>("/disconnect", {
      method: "POST",
    }),

  sync: () =>
    inboxFetch<{ syncedThreads: number; lastSyncAt: string | null }>("/sync", {
      method: "POST",
    }),

  listThreads: (params?: { query?: string; unread?: boolean }) => {
    const search = new URLSearchParams();
    if (params?.query) search.set("query", params.query);
    if (params?.unread) search.set("unread", "1");
    const qs = search.toString();
    return inboxFetch<AdminInboxThreadSummary[]>(
      `/threads${qs ? `?${qs}` : ""}`,
    );
  },

  getThread: (id: string) =>
    inboxFetch<AdminInboxThreadDetail>(`/threads/${id}`),

  markRead: (id: string) =>
    inboxFetch<{ ok: boolean }>(`/threads/${id}/read`, {
      method: "POST",
    }),

  reply: (id: string, body: string) =>
    inboxFetch<{ ok: boolean }>(`/threads/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
};
