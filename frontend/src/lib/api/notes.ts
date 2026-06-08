"use client";

import { readStoredToken } from "@/lib/auth/authClient";
import type { Note, NoteDraft } from "@/lib/notes/types";

async function notesFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = readStoredToken();
  const res = await fetch(`/api/notes${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = Object.assign(new Error(`Notes API error: ${res.status}`), {
      status: res.status,
    });
    throw err;
  }
  return res.json() as Promise<T>;
}

export type ApiNote = Note & { _id: string };

function mapNote(raw: Record<string, unknown>): Note {
  return {
    id: (raw._id ?? raw.id) as string,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
    type: raw.type as Note["type"],
    color: raw.color as Note["color"],
    noteText: (raw.noteText ?? "") as string,
    pinned: (raw.pinned ?? false) as boolean,
    lawId: raw.lawId as string | undefined,
    lawTitle: raw.lawTitle as string | undefined,
    articleNum: raw.articleNum as string | undefined,
    articleTitle: raw.articleTitle as string | undefined,
    selectedText: raw.selectedText as string | undefined,
    pageUrl: raw.pageUrl as string | undefined,
    pageTitle: raw.pageTitle as string | undefined,
  };
}

export const notesApi = {
  getAll: async (params?: { type?: string }): Promise<Note[]> => {
    const q = params?.type ? `?type=${params.type}` : "";
    const raw = await notesFetch<Record<string, unknown>[]>(`/${q}`);
    return raw.map(mapNote);
  },

  create: async (draft: NoteDraft): Promise<Note> => {
    const raw = await notesFetch<Record<string, unknown>>("/", {
      method: "POST",
      body: JSON.stringify(draft),
    });
    return mapNote(raw);
  },

  update: async (
    id: string,
    patch: Partial<Pick<Note, "noteText" | "color">>,
  ): Promise<Note> => {
    const raw = await notesFetch<Record<string, unknown>>(`/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
    return mapNote(raw);
  },

  togglePin: async (id: string): Promise<Note> => {
    const raw = await notesFetch<Record<string, unknown>>(`/${id}/pin`, {
      method: "PATCH",
    });
    return mapNote(raw);
  },

  delete: async (id: string): Promise<void> => {
    await notesFetch<{ ok: boolean }>(`/${id}`, { method: "DELETE" });
  },

  migrate: async (notes: Note[]): Promise<{ imported: number }> => {
    return notesFetch<{ imported: number }>("/migrate", {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  },
};
