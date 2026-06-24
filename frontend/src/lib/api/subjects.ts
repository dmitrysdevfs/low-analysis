"use client";

import type { Subject, SubjectElements } from "@/types";
import { getJson } from "./_client";

export interface SubjectSearchResult {
  _id: string;
  name: string;
  count: number;
}

export async function getSubjects(options?: RequestInit): Promise<Subject[]> {
  return getJson<Subject[]>("/subjects", options);
}

/**
 * Autocomplete over the subjects collection (partial, case-insensitive,
 * alias-aware). Returns most relevant subjects with their mention counts.
 */
export async function searchSubjects(
  q: string,
  options?: RequestInit,
): Promise<SubjectSearchResult[]> {
  const query = q.trim();
  if (!query) return [];

  const params = new URLSearchParams({ q: query });
  const res = await getJson<{ data: SubjectSearchResult[] }>(
    `/subjects/search?${params}`,
    options,
  );
  return res?.data ?? [];
}

export async function getSubjectElements(
  id: string,
  options?: RequestInit,
): Promise<SubjectElements> {
  return getJson<SubjectElements>(`/subjects/${id}/elements`, options);
}
