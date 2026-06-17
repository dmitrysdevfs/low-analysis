"use client";

import { getJson, requestJson } from "./_client";

export interface LawFork {
  _id: string;
  lawId: { _id: string; title: string; code: string } | string;
  authorId: { _id: string; fullName: string; email: string } | string;
  title: string;
  description: string;
  status: "draft" | "review" | "approved" | "rejected";
  submittedAt: string | null;
  reviewNote: string;
  createdAt: string;
  updatedAt: string;
  changes?: LawChange[];
}

export interface LawChange {
  _id?: string;
  forkId?: string;
  elementId: string;
  elementCode: string;
  operation: "edit" | "add" | "delete";
  originalText: string;
  proposedText: string;
  rationale: string;
}

export interface ForkDiff {
  fork: {
    _id: string;
    title: string;
    status: string;
    law: { _id: string; title: string; code: string };
  };
  changes: LawChange[];
}

export async function getMyForks(): Promise<LawFork[]> {
  return getJson<LawFork[]>("/forks/me");
}

export async function getLawForks(lawId: string): Promise<LawFork[]> {
  return getJson<LawFork[]>(`/forks/law/${lawId}`);
}

export async function createFork(data: {
  lawId: string;
  title: string;
  description?: string;
}): Promise<LawFork> {
  return requestJson<LawFork>("/forks", "POST", data);
}

export async function getFork(id: string, mine = false): Promise<LawFork> {
  return getJson<LawFork>(`/forks/${id}${mine ? "?mine=1" : ""}`);
}

export async function addChange(
  forkId: string,
  change: Omit<LawChange, "_id" | "forkId">,
): Promise<LawChange> {
  return requestJson<LawChange>(`/forks/${forkId}/changes`, "POST", change);
}

export async function submitFork(forkId: string): Promise<LawFork> {
  return requestJson<LawFork>(`/forks/${forkId}/submit`, "POST", {});
}

export async function getForkDiff(forkId: string): Promise<ForkDiff> {
  return getJson<ForkDiff>(`/forks/${forkId}/diff`);
}
