"use client";

import { readStoredToken } from "@/lib/auth/authClient";
import type {
  ClientWorkspacePreferences,
  SavedArticleItem,
  ClientFocusTopic,
} from "@/lib/auth/clientWorkspace";

async function meFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = readStoredToken();
  const res = await fetch(`/api/me${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = Object.assign(new Error(`Me API error: ${res.status}`), {
      status: res.status,
    });
    throw err;
  }
  return res.json() as Promise<T>;
}

// ── Preferences ───────────────────────────────────────────────────────────────

export const preferencesApi = {
  get: (): Promise<ClientWorkspacePreferences> =>
    meFetch<ClientWorkspacePreferences>("/preferences"),

  update: (
    patch: Partial<ClientWorkspacePreferences>,
  ): Promise<ClientWorkspacePreferences> =>
    meFetch<ClientWorkspacePreferences>("/preferences", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};

// ── Saved Articles ────────────────────────────────────────────────────────────

type RawSaved = {
  _id: string;
  lawId: string;
  title: string;
  code: string;
  note: string;
  tags?: string[];
  createdAt: string;
};

function mapSaved(raw: RawSaved): SavedArticleItem {
  return {
    id: raw._id,
    lawId: raw.lawId,
    title: raw.title,
    code: raw.code,
    note: raw.note ?? "",
    savedAt: raw.createdAt,
    tags: raw.tags ?? [],
  };
}

export const savedApi = {
  getAll: async (): Promise<SavedArticleItem[]> => {
    const raw = await meFetch<RawSaved[]>("/saved");
    return raw.map(mapSaved);
  },

  create: async (
    payload: Omit<SavedArticleItem, "id" | "savedAt">,
  ): Promise<SavedArticleItem> => {
    const raw = await meFetch<RawSaved>("/saved", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return mapSaved(raw);
  },

  delete: async (id: string): Promise<void> => {
    await meFetch<{ ok: boolean }>(`/saved/${id}`, { method: "DELETE" });
  },

  migrate: async (
    items: Omit<SavedArticleItem, "id" | "savedAt">[],
  ): Promise<{ imported: number }> => {
    return meFetch<{ imported: number }>("/saved/migrate", {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },
};

// ── Focus Topics ──────────────────────────────────────────────────────────────

type RawTopic = { _id: string; label: string; createdAt: string };

function mapTopic(raw: RawTopic): ClientFocusTopic {
  return { id: raw._id, label: raw.label, createdAt: raw.createdAt };
}

export const topicsApi = {
  getAll: async (): Promise<ClientFocusTopic[]> => {
    const raw = await meFetch<RawTopic[]>("/topics");
    return raw.map(mapTopic);
  },

  create: async (label: string): Promise<ClientFocusTopic> => {
    const raw = await meFetch<RawTopic>("/topics", {
      method: "POST",
      body: JSON.stringify({ label }),
    });
    return mapTopic(raw);
  },

  delete: async (id: string): Promise<void> => {
    await meFetch<{ ok: boolean }>(`/topics/${id}`, { method: "DELETE" });
  },

  migrate: async (
    topics: Pick<ClientFocusTopic, "label">[],
  ): Promise<{ imported: number }> => {
    return meFetch<{ imported: number }>("/topics/migrate", {
      method: "POST",
      body: JSON.stringify({ topics }),
    });
  },
};
