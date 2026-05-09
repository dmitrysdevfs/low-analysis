"use client";

import type {
  ArticleResponse,
  Law,
  Subject,
  SubjectElements,
  TreeNode,
} from "@/types";

const API_BASE = "/api";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getLaws(q = ""): Promise<Law[]> {
  const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
  return getJson<Law[]>(`/laws${qs}`);
}

export async function getLawTree(id: string): Promise<TreeNode[]> {
  const response = await getJson<{ law: Law; elements: TreeNode[] }>(
    `/laws/${id}/tree`,
  );
  return response.elements;
}

export async function getArticle(
  id: string,
  num: string,
): Promise<ArticleResponse> {
  return getJson<ArticleResponse>(`/laws/${id}/articles/${num}`);
}

export async function getSubjects(): Promise<Subject[]> {
  return getJson<Subject[]>("/subjects");
}

export async function getSubjectElements(id: string): Promise<SubjectElements> {
  return getJson<SubjectElements>(`/subjects/${id}/elements`);
}
