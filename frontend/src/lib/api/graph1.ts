"use client";

import { getJson, requestJson } from "./_client";
import type {
  ApiGraphResponse,
  ApiPathResponse,
  ApiGraphSubjectsResponse,
  GraphFork,
} from "@/features/graph1/types/graph1.types";

// --- Graph endpoints ---

export async function fetchGlobalGraph(): Promise<ApiGraphResponse> {
  return getJson<ApiGraphResponse>("/graph/global");
}

export async function fetchLawGraph(
  lawId: string,
  depth: 1 | 2 | 3 = 1,
): Promise<ApiGraphResponse> {
  return getJson<ApiGraphResponse>(`/graph/law/${lawId}?depth=${depth}`);
}

export async function fetchGraphPath(
  fromId: string,
  toId: string,
): Promise<ApiPathResponse> {
  return getJson<ApiPathResponse>(
    `/graph/path?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`,
  );
}

export async function fetchGraphSubjects(): Promise<ApiGraphSubjectsResponse> {
  return getJson<ApiGraphSubjectsResponse>("/graph/subjects");
}

// --- Fork endpoints ---

export async function fetchMyForks(): Promise<GraphFork[]> {
  return getJson<GraphFork[]>("/graph-forks/my");
}

export async function createGraphFork(data: {
  name: string;
  description?: string;
  viewState?: Partial<GraphFork["viewState"]>;
  filters?: Partial<GraphFork["filters"]>;
  pathState?: Partial<GraphFork["pathState"]>;
  isPublic?: boolean;
}): Promise<GraphFork> {
  return requestJson<GraphFork>("/graph-forks", "POST", data);
}

export async function updateGraphFork(
  id: string,
  data: Partial<Omit<GraphFork, "_id" | "userId" | "createdAt" | "updatedAt">>,
): Promise<GraphFork> {
  return requestJson<GraphFork>(`/graph-forks/${id}`, "PUT", data);
}

export async function deleteGraphFork(id: string): Promise<void> {
  await requestJson<void>(`/graph-forks/${id}`, "DELETE");
}
