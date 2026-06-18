"use client";

import { readStoredToken } from "@/lib/auth/authClient";
import type {
  AdminSupportStatus,
  SupportConfig,
  SupportConversation,
  SupportConversationPayload,
  SupportConversationStatus,
  SupportSendPayload,
  SupportNote,
  SupportSyncResult,
} from "../types";

async function supportFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = readStoredToken();
  const res = await fetch(path, {
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
      .catch(() => ({ message: `Support API error: ${res.status}` }));
    throw Object.assign(new Error(data.message || "Support API error"), {
      status: res.status,
    });
  }

  return res.json() as Promise<T>;
}

export const supportApi = {
  getConfig: () => supportFetch<SupportConfig>("/api/support/config"),
  getCurrentConversation: () =>
    supportFetch<SupportConversationPayload>(
      "/api/support/conversations/current",
    ),
  sendMessage: (payload: SupportSendPayload) =>
    supportFetch<SupportConversationPayload>(
      "/api/support/conversations/message",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    ),
  markRead: (id: string) =>
    supportFetch<{ ok: boolean }>(`/api/support/conversations/${id}/read`, {
      method: "POST",
    }),
};

export const adminSupportApi = {
  getStatus: () =>
    supportFetch<AdminSupportStatus>("/api/admin/support/status"),
  listConversations: (params?: {
    query?: string;
    status?:
      | "all"
      | "open"
      | "waiting_support"
      | "waiting_user"
      | "closed"
      | "unread";
  }) => {
    const search = new URLSearchParams();
    if (params?.query) search.set("query", params.query);
    if (params?.status && params.status !== "all") {
      search.set("status", params.status);
    }
    const qs = search.toString();
    return supportFetch<SupportConversation[]>(
      `/api/admin/support/conversations${qs ? `?${qs}` : ""}`,
    );
  },
  getConversation: (id: string) =>
    supportFetch<SupportConversationPayload>(
      `/api/admin/support/conversations/${id}`,
    ),
  markRead: (id: string) =>
    supportFetch<{ ok: boolean }>(
      `/api/admin/support/conversations/${id}/read`,
      {
        method: "POST",
      },
    ),
  sendMessage: (id: string, text: string) =>
    supportFetch<SupportConversationPayload>(
      `/api/admin/support/conversations/${id}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      },
    ),
  updateStatus: (id: string, status: SupportConversationStatus) =>
    supportFetch<{ conversation: SupportConversation }>(
      `/api/admin/support/conversations/${id}/status`,
      { method: "POST", body: JSON.stringify({ status }) },
    ),

  assignConversation: (id: string, adminId: string | null) =>
    supportFetch<{ conversation: SupportConversation }>(
      `/api/admin/support/conversations/${id}/assign`,
      { method: "POST", body: JSON.stringify({ adminId }) },
    ),

  markAsSpam: (id: string) =>
    supportFetch<{ conversation: SupportConversation }>(
      `/api/admin/support/conversations/${id}/spam`,
      { method: "POST" },
    ),

  escalateConversation: (id: string) =>
    supportFetch<{ conversation: SupportConversation }>(
      `/api/admin/support/conversations/${id}/escalate`,
      { method: "POST" },
    ),

  listNotes: (id: string) =>
    supportFetch<SupportNote[]>(`/api/admin/support/conversations/${id}/notes`),

  addNote: (id: string, text: string) =>
    supportFetch<{ note: SupportNote }>(
      `/api/admin/support/conversations/${id}/notes`,
      { method: "POST", body: JSON.stringify({ text }) },
    ),

  syncCheck: () =>
    supportFetch<SupportSyncResult>("/api/admin/support/sync-check", {
      method: "POST",
    }),
};
