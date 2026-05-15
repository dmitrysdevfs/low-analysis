"use client";

import type { Law, LawTreeResponse, ArticleResponse } from "@/types";

const API_BASE = "/api";

export async function getJson<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = options
    ? await fetch(`${API_BASE}${path}`, options)
    : await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getLaws(q = "", options?: RequestInit): Promise<Law[]> {
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return getJson<Law[]>(`/laws${qs}`, options);
}

export async function getLawTree(
  id: string,
  options?: RequestInit,
): Promise<LawTreeResponse> {
  return getJson<LawTreeResponse>(`/laws/${id}/tree`, options);
}

export async function getArticle(
  id: string,
  num: string,
  options?: RequestInit,
): Promise<ArticleResponse> {
  return getJson<ArticleResponse>(`/laws/${id}/articles/${num}`, options);
}
