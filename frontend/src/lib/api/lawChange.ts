"use client";

import { getJson } from "./laws";
import { fetchWithTimeout } from "@/lib/utils/fetchWithTimeout";
import { readStoredToken } from "@/lib/auth/authClient";
import type {
  LawChangeProposal,
  ApprovedChange,
  LawViewResponse,
  CreateProposalPayload,
  SubmitProposalPayload,
  VotePayload,
  VoteStats,
} from "@/types/law-change.types";

const API_BASE = "/api";

async function requestJson<T>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const token = readStoredToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (body) headers.set("Content-Type", "application/json");
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

// Law view (original + approved changes + active proposals)
export const getLawView = (lawId: string) =>
  getJson<LawViewResponse>(`/law-change/laws/${lawId}/view`);

// Proposals
export const createProposal = (data: CreateProposalPayload) =>
  requestJson<LawChangeProposal>("/law-change/proposals", "POST", data);

export const getMyProposals = () =>
  getJson<LawChangeProposal[]>("/law-change/proposals/my");

export const getProposalsForLaw = (lawId: string) =>
  getJson<LawChangeProposal[]>(`/law-change/proposals?law_id=${lawId}`);

export const getProposalsForElement = (elementId: string) =>
  getJson<LawChangeProposal[]>(`/law-change/proposals?element_id=${elementId}`);

export const submitProposal = (id: string, data: SubmitProposalPayload) =>
  requestJson<LawChangeProposal>(
    `/law-change/proposals/${id}/submit`,
    "POST",
    data,
  );

export const withdrawProposal = (id: string) =>
  requestJson<LawChangeProposal>(
    `/law-change/proposals/${id}/withdraw`,
    "POST",
  );

export const updateProposal = (
  id: string,
  data: Partial<CreateProposalPayload>,
) =>
  requestJson<LawChangeProposal>(`/law-change/proposals/${id}`, "PATCH", data);

// Voting
export const castVote = (proposalId: string, data: VotePayload) =>
  requestJson<VoteStats>(
    `/law-change/proposals/${proposalId}/vote`,
    "POST",
    data,
  );

export const removeVote = (proposalId: string) =>
  requestJson<VoteStats>(`/law-change/proposals/${proposalId}/vote`, "DELETE");

export const getVoteStats = (proposalId: string) =>
  getJson<VoteStats>(`/law-change/proposals/${proposalId}/votes`);

// Approved changes
export const getApprovedChanges = (lawId: string) =>
  getJson<ApprovedChange[]>(`/law-change/approved?law_id=${lawId}`);

export const getChangeFeed = (params?: { page?: number; limit?: number }) => {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  return getJson<ApprovedChange[]>(`/law-change/approved/feed?${q}`);
};

// Admin
export const rollbackChange = (changeId: string) =>
  requestJson<ApprovedChange>(
    `/law-change/approved/${changeId}/rollback`,
    "POST",
  );

export const archiveChange = (changeId: string) =>
  requestJson<ApprovedChange>(
    `/law-change/approved/${changeId}/archive`,
    "POST",
  );
