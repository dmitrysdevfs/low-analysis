"use client";

import type { Law, LawStats, LawTreeResponse, ArticleResponse } from "@/types";
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
    headers,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getLaws(q = "", options?: RequestInit): Promise<Law[]> {
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  const res = await getJson<{ data: Law[] } | Law[]>(`/laws${qs}`, options);
  if (!res) return [];
  return Array.isArray(res) ? res : (res as { data: Law[] }).data || [];
}

export async function getLawTree(
  id: string,
  options?: RequestInit,
): Promise<LawTreeResponse> {
  return getJson<LawTreeResponse>(`/laws/${id}/tree`, options);
}

export async function getLawStats(
  id: string,
  options?: RequestInit,
): Promise<LawStats> {
  return getJson<LawStats>(`/laws/${id}/stats`, options);
}

export async function getArticle(
  id: string,
  num: string,
  options?: RequestInit,
): Promise<ArticleResponse> {
  return getJson<ArticleResponse>(`/laws/${id}/articles/${num}`, options);
}
