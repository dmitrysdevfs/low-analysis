"use client";

import { getJson } from "./laws";
import { fetchWithTimeout } from "@/lib/utils/fetchWithTimeout";
import { readStoredToken } from "@/lib/auth/authClient";
import type {
  Amendment,
  Proposal,
  Comment,
  VoteSummary,
  ProposalDocument,
  Vote,
} from "@/types/legislator";

const API_BASE = "/api";

async function requestJson<T>(
  path: string,
  method: string,
  body?: unknown,
  options?: RequestInit,
): Promise<T> {
  const token = readStoredToken();
  const headers = new Headers(options?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    ...options,
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// Proposals
export const createProposal = (data: Partial<Proposal>) =>
  requestJson<Proposal>("/proposals", "POST", data);

export const getProposals = (params: { lawId?: string; userId?: string } = {}) => {
  const q = new URLSearchParams();
  if (params.lawId) q.set("lawId", params.lawId);
  if (params.userId) q.set("userId", params.userId);
  return getJson<Proposal[]>(`/proposals?${q}`);
};

export const getProposalById = (id: string) =>
  getJson<Proposal>(`/proposals/${id}`);

export const updateProposal = (id: string, data: Partial<Proposal>) =>
  requestJson<Proposal>(`/proposals/${id}`, "PATCH", data);

export const submitProposal = (id: string) =>
  requestJson<Proposal>(`/proposals/${id}/submit`, "POST");

export const getProposalDocument = (id: string) =>
  getJson<ProposalDocument>(`/proposals/${id}/document`);

// Amendments
export const createAmendment = (data: Partial<Amendment>) =>
  requestJson<Amendment>("/amendments", "POST", data);

export const getAmendments = (params: {
  lawId?: string;
  proposalId?: string;
  userId?: string;
} = {}) => {
  const q = new URLSearchParams();
  if (params.lawId) q.set("lawId", params.lawId);
  if (params.proposalId) q.set("proposalId", params.proposalId);
  if (params.userId) q.set("userId", params.userId);
  return getJson<Amendment[]>(`/amendments?${q}`);
};

export const getAmendmentById = (id: string) =>
  getJson<Amendment>(`/amendments/${id}`);

export const updateAmendment = (id: string, data: Partial<Amendment>) =>
  requestJson<Amendment>(`/amendments/${id}`, "PATCH", data);

export const deleteAmendment = (id: string) =>
  requestJson<void>(`/amendments/${id}`, "DELETE");

// Comments
export const addComment = (data: {
  target_type: "amendment" | "proposal";
  target_id: string;
  text: string;
}) => requestJson<Comment>("/comments", "POST", data);

export const getComments = (target_type: string, target_id: string) =>
  getJson<Comment[]>(`/comments?target_type=${target_type}&target_id=${target_id}`);

export const deleteComment = (id: string) =>
  requestJson<void>(`/comments/${id}`, "DELETE");

// Votes
export const castVote = (data: { amendment_id: string; value: string }) =>
  requestJson<VoteSummary>("/votes", "POST", data);

export const getVoteSummary = (amendmentId: string) =>
  getJson<VoteSummary>(`/votes/summary/${amendmentId}`);

export const getMyVote = (amendmentId: string) =>
  getJson<Vote>(`/votes/my/${amendmentId}`);
