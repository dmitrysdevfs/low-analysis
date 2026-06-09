"use client";

import type {
  Law,
  LawStats,
  LawTreeResponse,
  ArticleResponse,
  PaginatedLawsResponse,
  TreeNode,
} from "@/types";
import { getJson } from "./_client";
export { getJson } from "./_client";

export async function getLaws(
  q = "",
  options?: RequestInit,
  queryOptions?: { wordField?: "title" | "text" | "code" },
): Promise<Law[]> {
  const params = new URLSearchParams({ limit: "500" });
  if (q.trim()) params.set("q", q.trim());
  if (queryOptions?.wordField && queryOptions.wordField !== "title") {
    params.set("wordField", queryOptions.wordField);
  }
  const res = await getJson<{ data: Law[] } | Law[]>(
    `/laws?${params}`,
    options,
  );
  if (!res) return [];
  return Array.isArray(res) ? res : (res as { data: Law[] }).data || [];
}

export interface LawsQuery {
  q?: string;
  status?: string;
  documentType?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: "date" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export async function getLawsPaginated(
  query: LawsQuery = {},
  options?: RequestInit,
): Promise<PaginatedLawsResponse> {
  const params = new URLSearchParams();
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.status) params.set("status", query.status);
  if (query.documentType) params.set("documentType", query.documentType);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortOrder) params.set("sortOrder", query.sortOrder);
  if (query.page != null) params.set("page", String(query.page));
  if (query.limit != null) params.set("limit", String(query.limit));
  return getJson<PaginatedLawsResponse>(`/laws?${params}`, options);
}

export async function getLawHeatmap(
  id: string,
  options?: RequestInit,
): Promise<TreeNode[]> {
  return getJson<TreeNode[]>(`/laws/${id}/heatmap`, options);
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
